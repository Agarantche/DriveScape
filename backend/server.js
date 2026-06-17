import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { getNearbyRoutes } from "./scenicRoutes.js";
import { getScenicRoutesNear } from "./overpassRoutes.js";
import { getNearbyLandmarks } from "./landmarks.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "DriveScape backend is running",
    timestamp: new Date().toISOString(),
  });
});

// Scenic routes near a coordinate, as a GeoJSON FeatureCollection.
// Generated live from OpenStreetMap road data; falls back to the static mock set if
// Overpass is unreachable or finds nothing in range.
// Example: GET /api/routes/nearby?lat=39.5&lng=-81.85
app.get("/api/routes/nearby", async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({
      error: "Query params 'lat' and 'lng' are required and must be numbers.",
    });
  }

  try {
    const fc = await getScenicRoutesNear(lat, lng);
    if (fc.features.length > 0) return res.json(fc);
    console.warn("No OSM routes found near", lat, lng, "— serving mock set.");
    return res.json(getNearbyRoutes(lat, lng));
  } catch (err) {
    console.error("Overpass lookup failed, serving mock set:", err.message);
    return res.json(getNearbyRoutes(lat, lng));
  }
});

// Landmark discoveries near a coordinate, as a GeoJSON FeatureCollection.
// Example: GET /api/landmarks/nearby?lat=39.5&lng=-81.85
app.get("/api/landmarks/nearby", (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const radiusMi = req.query.radiusMi == null ? undefined : Number(req.query.radiusMi);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({
      error: "Query params 'lat' and 'lng' are required and must be numbers.",
    });
  }

  if (radiusMi !== undefined && (!Number.isFinite(radiusMi) || radiusMi <= 0)) {
    return res.status(400).json({
      error: "Optional query param 'radiusMi' must be a positive number.",
    });
  }

  return res.json(getNearbyLandmarks(lat, lng, radiusMi));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
