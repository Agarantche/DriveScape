// Mock landmark data for DriveScape's discovery-game layer.
//
// GeoJSON Point coordinates are [longitude, latitude]. The facts here are short
// demo blurbs so the frontend can render a "travel discovery" card before a
// real landmark database exists.

const DEFAULT_RADIUS_MI = 75;
const EARTH_RADIUS_MI = 3958.8;

const LANDMARKS = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        id: "burr-oak-state-park",
        name: "Burr Oak State Park",
        category: "Nature",
        fact: "A quiet lake-and-forest stop tucked into the Appalachian foothills, good for overlooks, trails, and a slower scenic loop.",
        points: 160,
        rarity: "regional",
        vibe: "Forest escape",
        region: "Ohio",
        country: "United States",
      },
      geometry: {
        type: "Point",
        coordinates: [-82.045, 39.538],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "miners-memorial-park",
        name: "Miners' Memorial Park",
        category: "Roadside",
        fact: "Home of the huge Big Muskie bucket, a roadside monument to the giant mining machine that once worked southeastern Ohio.",
        points: 220,
        rarity: "unusual",
        vibe: "Road-trip oddity",
        region: "Ohio",
        country: "United States",
      },
      geometry: {
        type: "Point",
        coordinates: [-81.735, 39.602],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "chesterhill-produce-auction",
        name: "Chesterhill Produce Auction",
        category: "Local Culture",
        fact: "A rural community market known for local produce, Amish farms, and a good snapshot of Morgan County backroad life.",
        points: 90,
        rarity: "local",
        vibe: "Small-town stop",
        region: "Ohio",
        country: "United States",
      },
      geometry: {
        type: "Point",
        coordinates: [-81.865, 39.488],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "stockport-mill",
        name: "Stockport Mill",
        category: "Historic",
        fact: "A historic mill stop near the Muskingum River, useful as an anchor for a slower riverside discovery route.",
        points: 140,
        rarity: "regional",
        vibe: "Historic river town",
        region: "Ohio",
        country: "United States",
      },
      geometry: {
        type: "Point",
        coordinates: [-81.793, 39.549],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "wayne-national-forest-athens-unit",
        name: "Wayne National Forest",
        category: "Nature",
        fact: "Ohio's national forest spreads across rugged hills, quiet forest roads, trailheads, and shaded ridge drives.",
        points: 180,
        rarity: "regional",
        vibe: "Woodland drive",
        region: "Ohio",
        country: "United States",
      },
      geometry: {
        type: "Point",
        coordinates: [-82.116, 39.366],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "hocking-hills-old-mans-cave",
        name: "Old Man's Cave",
        category: "Nature",
        fact: "A landmark Hocking Hills gorge with cliffs, waterfalls, stone stairs, and one of Ohio's best-known hiking scenes.",
        points: 260,
        rarity: "iconic",
        vibe: "Canyon hike",
        region: "Ohio",
        country: "United States",
      },
      geometry: {
        type: "Point",
        coordinates: [-82.542, 39.435],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "the-wilds",
        name: "The Wilds",
        category: "Wildlife",
        fact: "A large open-range conservation center built on reclaimed mining land, with safari-style wildlife tours.",
        points: 300,
        rarity: "iconic",
        vibe: "Safari detour",
        region: "Ohio",
        country: "United States",
      },
      geometry: {
        type: "Point",
        coordinates: [-81.742, 39.829],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "muskingum-river-locks",
        name: "Muskingum River Parkway",
        category: "Historic",
        fact: "A chain of old river locks and dams that turns the Muskingum into a historic byway for slow exploration.",
        points: 190,
        rarity: "regional",
        vibe: "River history",
        region: "Ohio",
        country: "United States",
      },
      geometry: {
        type: "Point",
        coordinates: [-81.864, 39.648],
      },
    },
  ],
};

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function distanceMi(latA, lngA, latB, lngB) {
  const dLat = toRadians(latB - latA);
  const dLng = toRadians(lngB - lngA);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(latA)) * Math.cos(toRadians(latB)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MI * Math.asin(Math.sqrt(a));
}

export function getNearbyLandmarks(lat, lng, radiusMi = DEFAULT_RADIUS_MI) {
  const features = LANDMARKS.features
    .map((feature) => {
      const [featureLng, featureLat] = feature.geometry.coordinates;
      const milesAway = distanceMi(lat, lng, featureLat, featureLng);
      return {
        ...feature,
        properties: {
          ...feature.properties,
          distanceMi: Number(milesAway.toFixed(1)),
        },
      };
    })
    .filter((feature) => feature.properties.distanceMi <= radiusMi)
    .sort((a, b) => a.properties.distanceMi - b.properties.distanceMi);

  return {
    type: "FeatureCollection",
    features,
  };
}
