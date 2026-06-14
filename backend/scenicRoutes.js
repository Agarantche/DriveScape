// Mock scenic-route data for the SR-78 / Wayne National Forest area (SE Ohio).
//
// IMPORTANT: GeoJSON coordinates are [longitude, latitude] — NOT [lat, lng].
// (Mapbox, PostGIS, and the GeoJSON spec all use lng-first. Humans say "lat/lng".
//  Mixing these up is the classic reason lines render in the wrong place / ocean.)
//
// These are hand-drawn near real roads — good enough to render while we have no
// database. Later this whole file gets replaced by a PostGIS query (see getNearbyRoutes).

const SCENIC_ROUTES = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        id: "sr555-triple-nickel",
        name: "SR-555 — The Triple Nickel",
        description:
          "Legendary motorcycle road through the ridges and hollows north of Chesterhill. Tight, relentless curves with almost no straights.",
        difficulty: "expert",
        vibe: "Twisty & technical",
        lengthMi: 11.4,
        curves: 47,
        elevationFt: 820,
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [-81.78, 39.58],
          [-81.79, 39.55],
          [-81.77, 39.52],
          [-81.8, 39.49],
          [-81.78, 39.46],
          [-81.81, 39.43],
          [-81.79, 39.4],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "sr78-wayne-ridge-run",
        name: "SR-78 — The Wayne Ridge Run",
        description:
          "The signature ridge-top run through Wayne National Forest. Sweeping curves with big tree-canopy views on both sides.",
        difficulty: "moderate",
        vibe: "Scenic cruise",
        lengthMi: 18.2,
        curves: 31,
        elevationFt: 540,
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [-81.95, 39.52],
          [-81.92, 39.5],
          [-81.88, 39.51],
          [-81.85, 39.49],
          [-81.82, 39.5],
          [-81.78, 39.48],
          [-81.74, 39.49],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "sr377-hollow-hopper",
        name: "SR-377 — Hollow Hopper",
        description:
          "Quiet backcountry connector that dips through creek hollows and farm valleys. Low traffic, easy rhythm.",
        difficulty: "easy",
        vibe: "Backwoods ramble",
        lengthMi: 8.7,
        curves: 19,
        elevationFt: 360,
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [-81.92, 39.42],
          [-81.9, 39.44],
          [-81.88, 39.43],
          [-81.86, 39.45],
          [-81.84, 39.44],
          [-81.82, 39.46],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "sr26-covered-bridge-byway",
        name: "SR-26 — Covered Bridge Byway",
        description:
          "Follows the Little Muskingum River past historic covered bridges. Gentle riverside meander, great for photo stops.",
        difficulty: "moderate",
        vibe: "Riverside meander",
        lengthMi: 22.5,
        curves: 24,
        elevationFt: 410,
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [-81.7, 39.55],
          [-81.66, 39.56],
          [-81.62, 39.54],
          [-81.58, 39.57],
          [-81.54, 39.55],
          [-81.5, 39.58],
        ],
      },
    },
  ],
};

/**
 * Return scenic routes near a coordinate, as a GeoJSON FeatureCollection.
 *
 * For now this IGNORES lat/lng and always returns the hardcoded SR-78-area set,
 * because all our mock data lives in that one region. This is the seam where a
 * real spatial query will go once PostGIS is in, e.g.:
 *
 *   SELECT ... FROM routes
 *   WHERE ST_DWithin(geom::geography, ST_MakePoint($lng, $lat)::geography, $radiusMeters);
 *
 * Until then, treat "nearby" as "everything we have."
 */
export function getNearbyRoutes(lat, lng) {
  return SCENIC_ROUTES;
}
