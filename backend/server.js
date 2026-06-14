import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { getNearbyRoutes } from "./scenicRoutes.js";

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
// Example: GET /api/routes/nearby?lat=39.5&lng=-81.85
app.get("/api/routes/nearby", (req, res) => {
  const { lat: latRaw, lng: lngRaw } = req.query;
  const lat = Number(latRaw);
  const lng = Number(lngRaw);

  if (!latRaw || !lngRaw || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({
      error: "Query params 'lat' and 'lng' are required and must be numbers.",
    });
  }

  res.json(getNearbyRoutes(lat, lng));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});