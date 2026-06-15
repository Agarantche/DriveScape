// Dynamic scenic-route generation from real OpenStreetMap road data (via Overpass API).
//
// Given a coordinate, we pull nearby drivable roads from OSM, stitch split segments back
// into continuous routes, score each for "scenic driving" (curviness + road class + a
// length sweet-spot), and return the best handful as a GeoJSON FeatureCollection shaped
// exactly like the old mock (scenicRoutes.js) so the frontend/HUD needs no changes.
//
// GeoJSON coordinates are [longitude, latitude]. Overpass returns {lat, lon} — we flip them.
// Overpass needs no API key. If it fails, server.js falls back to the static mock.

// Several public mirrors — they rate-limit (HTTP 429) independently, so we rotate and retry.
const OVERPASS_ENDPOINTS = [
  "https://overpass.private.coffee/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min — Overpass is slow + rate-limited
const cache = new Map(); // key -> { t, fc }

const EARTH_M = 6371000;
const toRad = (d) => (d * Math.PI) / 180;

function haversine([lon1, lat1], [lon2, lat2]) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_M * Math.asin(Math.sqrt(a));
}

function bearing([lon1, lat1], [lon2, lat2]) {
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  return Math.atan2(y, x);
}

function angleDiff(a, b) {
  let d = Math.abs(a - b);
  if (d > Math.PI) d = 2 * Math.PI - d;
  return d; // 0..PI
}

// Length (m), total turning (radians), and a human "curve" count for a polyline.
function routeMetrics(coords) {
  let lengthM = 0;
  let turnSum = 0;
  const bearings = [];
  for (let i = 1; i < coords.length; i++) {
    lengthM += haversine(coords[i - 1], coords[i]);
    bearings.push(bearing(coords[i - 1], coords[i]));
  }
  for (let i = 1; i < bearings.length; i++) {
    turnSum += angleDiff(bearings[i], bearings[i - 1]);
  }
  // Count one "curve" per ~45 deg of accumulated heading change — robust to how densely
  // OSM sampled the road, and consistent with the difficulty grade (both derive from turnSum).
  const curves = Math.round(turnSum / (Math.PI / 4));
  return { lengthM, turnSum, curves };
}

const ptKey = (p) => `${p[0].toFixed(6)},${p[1].toFixed(6)}`;

// Greedily chain connected same-name segments (OSM splits roads into many ways) into the
// single longest continuous polyline.
function stitch(segments) {
  if (segments.length === 1) return segments[0];
  const remaining = segments.slice().sort((a, b) => b.length - a.length);
  let chain = remaining.shift();
  let extended = true;
  while (extended) {
    extended = false;
    for (let i = 0; i < remaining.length; i++) {
      const seg = remaining[i];
      const head = chain[0];
      const tail = chain[chain.length - 1];
      const s0 = seg[0];
      const s1 = seg[seg.length - 1];
      if (ptKey(tail) === ptKey(s0)) chain = chain.concat(seg.slice(1));
      else if (ptKey(tail) === ptKey(s1)) chain = chain.concat(seg.slice().reverse().slice(1));
      else if (ptKey(head) === ptKey(s1)) chain = seg.concat(chain.slice(1));
      else if (ptKey(head) === ptKey(s0)) chain = seg.slice().reverse().concat(chain.slice(1));
      else continue;
      remaining.splice(i, 1);
      extended = true;
      break;
    }
  }
  return chain;
}

const CLASS_WEIGHT = { primary: 0.7, secondary: 1.0, tertiary: 1.0, unclassified: 0.85 };
const CLASS_LABEL = {
  primary: "highway",
  secondary: "country highway",
  tertiary: "backroad",
  unclassified: "country lane",
};
const GRADE = (c) => (c < 1.2 ? "easy" : c < 2.4 ? "moderate" : c < 3.6 ? "hard" : "expert");
const VIBE = {
  easy: "Backwoods ramble",
  moderate: "Scenic cruise",
  hard: "Spirited run",
  expert: "Twisty & technical",
};
const BLURB = {
  easy: "Low traffic, easy rhythm, and plenty of room to take it all in.",
  moderate: "Sweeping curves and steady scenery — a proper cruise.",
  hard: "A spirited, rhythmic run with corners that keep you honest.",
  expert: "Relentless, technical, and almost no straights. Earn it.",
};
const GENERATED_NAMES = [
  "Ridge Run", "Hidden Hollow", "Creekside Lane", "Hilltop Loop", "Forest Byway",
  "Valley Cruise", "Switchback Trail", "Meadow Mile", "Backcountry Bend", "Pioneer Pass",
];

// A length "sweet spot": short stubs and very long slogs score lower than a 6–18 km run.
function lengthSweet(km) {
  if (km < 2) return (km / 2) * 0.6;
  if (km <= 18) return 1;
  return Math.max(0.3, 1 - (km - 18) / 40);
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function fetchOverpassWays(query) {
  let lastErr;
  // Two passes over the mirrors with a cooldown between, since 429s often clear quickly.
  for (let attempt = 0; attempt < 2; attempt++) {
    for (const url of OVERPASS_ENDPOINTS) {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 20000);
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain",
            "User-Agent": "DriveScape/0.1 (scenic route finder; https://github.com/Agarantche/DriveScape)",
          },
          body: query,
          signal: ctrl.signal,
        });
        clearTimeout(timer);
        if (!res.ok) {
          lastErr = new Error(`${url} -> HTTP ${res.status}`);
          continue;
        }
        const json = await res.json();
        return (json.elements || []).filter((e) => e.type === "way" && e.geometry);
      } catch (err) {
        lastErr = err;
      }
    }
    if (attempt === 0) await sleep(2500); // brief cooldown before a second pass
  }
  throw lastErr ?? new Error("All Overpass endpoints failed");
}

/**
 * Return scenic driving routes near a coordinate as a GeoJSON FeatureCollection.
 * @param {number} lat
 * @param {number} lng
 * @param {number} radiusMeters search radius around the point
 */
export async function getScenicRoutesNear(lat, lng, radiusMeters = 12000) {
  const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)},${radiusMeters}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.t < CACHE_TTL_MS) return hit.fc;

  // Drivable, scenery-friendly classes only — skip motorways/trunks (boring/fast),
  // residential/service (dense + dull), and tracks (often unpaved).
  const query = `[out:json][timeout:25];
way(around:${radiusMeters},${lat},${lng})["highway"~"^(primary|secondary|tertiary|unclassified)$"];
out geom;`;

  const ways = await fetchOverpassWays(query);

  // Group segments by road name/ref so split ways stitch into one route; unnamed ways stand alone.
  const groups = new Map();
  let anon = 0;
  for (const w of ways) {
    if (!w.geometry || w.geometry.length < 2) continue;
    const coords = w.geometry.map((g) => [g.lon, g.lat]);
    const tags = w.tags || {};
    const key = tags.name || tags.ref || `__anon_${anon++}`;
    if (!groups.has(key)) groups.set(key, { tags, segs: [] });
    groups.get(key).segs.push(coords);
  }

  const candidates = [];
  for (const [key, { tags, segs }] of groups) {
    const coords = stitch(segs);
    if (coords.length < 3) continue;
    const m = routeMetrics(coords);
    if (m.lengthM < 1500) continue; // skip tiny stubs
    const lengthKm = m.lengthM / 1000;
    const curviness = m.turnSum / Math.max(lengthKm, 0.1); // radians of turning per km
    const cls = tags.highway || "unclassified";
    const curveScore = Math.min(curviness / 4, 1);
    const scenic = (CLASS_WEIGHT[cls] ?? 0.6) * (0.35 + 0.65 * curveScore) * lengthSweet(lengthKm);
    candidates.push({
      named: !key.startsWith("__anon_"),
      name: tags.name || tags.ref || null,
      cls,
      coords,
      lengthKm,
      curviness,
      curves: m.curves,
      scenic,
    });
  }

  candidates.sort((a, b) => b.scenic - a.scenic);

  const features = [];
  const seenNames = new Set();
  for (const c of candidates) {
    if (features.length >= 6) break;
    let name = c.name;
    if (!name) name = GENERATED_NAMES[features.length % GENERATED_NAMES.length];
    if (seenNames.has(name)) continue;
    seenNames.add(name);

    const difficulty = GRADE(c.curviness);
    const miles = +(c.lengthKm * 0.621371).toFixed(1);
    features.push({
      type: "Feature",
      properties: {
        id: `${slug(name)}-${features.length}`,
        name,
        description: `${c.curves} curves across ${miles} mi of ${CLASS_LABEL[c.cls] ?? "road"}. ${BLURB[difficulty]}`,
        difficulty,
        vibe: VIBE[difficulty],
        lengthMi: miles,
        curves: c.curves,
        elevationFt: null, // OSM has no elevation; needs a DEM/elevation API later.
        source: "osm",
      },
      geometry: { type: "LineString", coordinates: c.coords },
    });
  }

  const fc = { type: "FeatureCollection", features };
  cache.set(cacheKey, { t: Date.now(), fc });
  return fc;
}
