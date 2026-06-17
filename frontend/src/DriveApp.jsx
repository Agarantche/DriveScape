import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "./App.css";
import Hud from "./Hud.jsx";
import { useAuth } from "./AuthContext.jsx";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";
const POINTS_PER_DISCOVERY = 250;
const MS_TO_MPH = 2.2369363;
const CHECK_IN_RADIUS_MI = 20;
const EARTH_RADIUS_MI = 3958.8;
const DEFAULT_ORIGIN = [-83.93, 35.51]; // Tail of the Dragon - a great demo if location is denied
const MAP_STYLES = {
  streets: "mapbox://styles/mapbox/streets-v12",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
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

function getLandmarkDistanceMi(feature, userLngLat) {
  const [landmarkLng, landmarkLat] = feature?.geometry?.coordinates ?? [];
  if (userLngLat && Number.isFinite(landmarkLng) && Number.isFinite(landmarkLat)) {
    return distanceMi(userLngLat[1], userLngLat[0], landmarkLat, landmarkLng);
  }
  return Number(feature?.properties?.distanceMi);
}

export default function DriveApp() {
  const { user, signOut } = useAuth();

  const mapContainer = useRef(null);
  const map = useRef(null);
  const userMarker = useRef(null);
  const geoWatch = useRef(null);
  const routesRef = useRef([]);
  const landmarksRef = useRef([]);
  const discoveredRef = useRef(new Set());
  const visitedLandmarksRef = useRef(new Set());
  const originResolved = useRef(false);
  const currentOrigin = useRef(DEFAULT_ORIGIN);
  const mapModeReady = useRef(false);

  const [backendStatus, setBackendStatus] = useState("Checking...");
  const [routes, setRoutes] = useState([]);
  const [landmarks, setLandmarks] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedLandmarkId, setSelectedLandmarkId] = useState(null);
  const [visitedLandmarkIds, setVisitedLandmarkIds] = useState([]);
  const [userLngLat, setUserLngLat] = useState(null);
  const [speed, setSpeed] = useState(0);
  const [hasGps, setHasGps] = useState(false);
  const [score, setScore] = useState(0);
  const [scoreDelta, setScoreDelta] = useState(0);
  const [discoveredCount, setDiscoveredCount] = useState(0);
  const [locating, setLocating] = useState(true);
  const [mapMode, setMapMode] = useState("streets");

  // Select a route: highlight it, fly to it, and award points the first time it's seen.
  const selectRoute = useCallback((id) => {
    if (!id) return;
    setSelectedId(id);
    if (!discoveredRef.current.has(id)) {
      discoveredRef.current.add(id);
      setDiscoveredCount(discoveredRef.current.size);
      setScore((s) => s + POINTS_PER_DISCOVERY);
      setScoreDelta(POINTS_PER_DISCOVERY);
    }
    const feature = routesRef.current.find((f) => f.properties.id === id);
    const coords = feature?.geometry?.coordinates;
    if (coords?.length && map.current) {
      const lons = coords.map((c) => c[0]);
      const lats = coords.map((c) => c[1]);
      map.current.fitBounds(
        [
          [Math.min(...lons), Math.min(...lats)],
          [Math.max(...lons), Math.max(...lats)],
        ],
        { padding: { top: 130, bottom: 170, left: 340, right: 250 }, duration: 1200, maxZoom: 13 }
      );
    }
  }, []);

  const selectLandmark = useCallback((id) => {
    if (!id) return;
    setSelectedLandmarkId(id);
    const feature = landmarksRef.current.find((f) => f.properties.id === id);
    const coords = feature?.geometry?.coordinates;
    if (coords?.length === 2 && map.current) {
      map.current.easeTo({
        center: coords,
        zoom: Math.max(map.current.getZoom(), 12),
        duration: 700,
        padding: { top: 130, bottom: 170, left: 340, right: 360 },
      });
    }
  }, []);

  const checkInLandmark = useCallback(
    (id) => {
      if (!id || visitedLandmarksRef.current.has(id)) return;
      const feature = landmarksRef.current.find((f) => f.properties.id === id);
      if (!feature) return;

      const milesAway = getLandmarkDistanceMi(feature, userLngLat);
      if (!Number.isFinite(milesAway) || milesAway > CHECK_IN_RADIUS_MI) return;

      visitedLandmarksRef.current.add(id);
      setVisitedLandmarkIds([...visitedLandmarksRef.current]);

      const points = Number(feature.properties.points) || 0;
      setScore((s) => s + points);
      setScoreDelta(points);
    },
    [userLngLat]
  );

  // Create the route layers (once), then push fresh route data + recenter for an origin.
  const loadAt = useCallback(
    (origin) => {
      const m = map.current;
      if (!m) return;
      const run = () => {
        if (!m.getSource("scenic-routes")) {
          m.addSource("scenic-routes", {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
          });
          m.addLayer({
            id: "scenic-routes-glow",
            type: "line",
            source: "scenic-routes",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: { "line-color": "#ff6b35", "line-width": 12, "line-blur": 8, "line-opacity": 0.4 },
          });
          m.addLayer({
            id: "scenic-routes-line",
            type: "line",
            source: "scenic-routes",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: { "line-color": "#ff6b35", "line-width": 4 },
          });
          m.addLayer({
            id: "scenic-routes-selected",
            type: "line",
            source: "scenic-routes",
            filter: ["==", ["get", "id"], ""],
            layout: { "line-join": "round", "line-cap": "round" },
            paint: { "line-color": "#fff1e8", "line-width": 5, "line-blur": 0.3 },
          });
          const pick = (e) => {
            if (e.features?.[0]) selectRoute(e.features[0].properties.id);
          };
          m.on("click", "scenic-routes-line", pick);
          m.on("click", "scenic-routes-glow", pick);
          m.on("mouseenter", "scenic-routes-line", () => {
            m.getCanvas().style.cursor = "pointer";
          });
          m.on("mouseleave", "scenic-routes-line", () => {
            m.getCanvas().style.cursor = "";
          });
        }

        if (!m.getSource("landmarks")) {
          m.addSource("landmarks", {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
          });
          m.addLayer({
            id: "landmarks-hit",
            type: "circle",
            source: "landmarks",
            paint: { "circle-radius": 22, "circle-color": "#ffffff", "circle-opacity": 0 },
          });
          m.addLayer({
            id: "landmarks-pulse",
            type: "circle",
            source: "landmarks",
            paint: {
              "circle-radius": 18,
              "circle-color": "#ff6b35",
              "circle-opacity": 0.18,
              "circle-blur": 0.35,
            },
          });
          m.addLayer({
            id: "landmarks-pin",
            type: "circle",
            source: "landmarks",
            paint: {
              "circle-radius": 9,
              "circle-color": "#ff6b35",
              "circle-stroke-color": "#fff4ed",
              "circle-stroke-width": 3,
            },
          });
          const visitedIds = [...visitedLandmarksRef.current];
          m.addLayer({
            id: "landmarks-visited",
            type: "circle",
            source: "landmarks",
            filter: visitedIds.length ? ["in", ["get", "id"], ["literal", visitedIds]] : ["==", ["get", "id"], ""],
            paint: {
              "circle-radius": 8,
              "circle-color": "#34d399",
              "circle-stroke-color": "#ecfdf5",
              "circle-stroke-width": 3,
            },
          });
          m.addLayer({
            id: "landmarks-selected",
            type: "circle",
            source: "landmarks",
            filter: ["==", ["get", "id"], ""],
            paint: {
              "circle-radius": 16,
              "circle-color": "rgba(255, 107, 53, 0)",
              "circle-stroke-color": "#fff4ed",
              "circle-stroke-width": 4,
            },
          });
          const pickLandmark = (e) => {
            if (e.features?.[0]) selectLandmark(e.features[0].properties.id);
          };
          m.on("click", "landmarks-hit", pickLandmark);
          m.on("click", "landmarks-pin", pickLandmark);
          m.on("mouseenter", "landmarks-hit", () => {
            m.getCanvas().style.cursor = "pointer";
          });
          m.on("mouseleave", "landmarks-hit", () => {
            m.getCanvas().style.cursor = "";
          });
        }

        m.flyTo({ center: origin, zoom: 11, duration: 1600, essential: true });
        const routesRequest = fetch(`${API}/api/routes/nearby?lat=${origin[1]}&lng=${origin[0]}`)
          .then((r) => r.json())
          .then((geojson) => {
            const features = geojson.features ?? [];
            routesRef.current = features;
            setRoutes(features);
            const src = m.getSource("scenic-routes");
            if (src) src.setData(geojson);
            if (features[0]) setSelectedId(features[0].properties.id);
          })
          .catch((err) => console.error("Failed to load scenic routes:", err));

        const landmarksRequest = fetch(`${API}/api/landmarks/nearby?lat=${origin[1]}&lng=${origin[0]}`)
          .then((r) => r.json())
          .then((geojson) => {
            const features = geojson.features ?? [];
            landmarksRef.current = features;
            setLandmarks(features);
            const src = m.getSource("landmarks");
            if (src) src.setData(geojson);
            if (features[0]) setSelectedLandmarkId(features[0].properties.id);
          })
          .catch((err) => console.error("Failed to load landmarks:", err));

        Promise.allSettled([routesRequest, landmarksRequest])
          .finally(() => setLocating(false));
      };
      if (m.isStyleLoaded()) run();
      else m.once("load", run);
    },
    [selectRoute, selectLandmark]
  );

  // Initialize the map once.
  useEffect(() => {
    if (map.current) return;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_STYLES.streets,
      center: DEFAULT_ORIGIN,
      zoom: 9,
    });
  }, []);

  // Resolve the user's location (or fall back), then load routes centered there.
  useEffect(() => {
    const resolve = (origin) => {
      if (originResolved.current) return;
      originResolved.current = true;
      currentOrigin.current = origin;
      loadAt(origin);
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const origin = [pos.coords.longitude, pos.coords.latitude];
          setUserLngLat(origin);
          resolve(origin);
        },
        () => resolve(DEFAULT_ORIGIN),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
      // Live tracking for speed + "you are here" marker.
      geoWatch.current = navigator.geolocation.watchPosition(
        (pos) => {
          setHasGps(true);
          const { longitude, latitude, speed: mps } = pos.coords;
          const origin = [longitude, latitude];
          setUserLngLat(origin);
          setSpeed(mps != null && mps > 0 ? mps * MS_TO_MPH : 0);
          resolve(origin);
          if (map.current) {
            if (!userMarker.current) {
              const el = document.createElement("div");
              el.className = "user-loc";
              userMarker.current = new mapboxgl.Marker({ element: el });
            }
            userMarker.current.setLngLat([longitude, latitude]).addTo(map.current);
          }
        },
        () => setHasGps(false),
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 12000 }
      );
    } else {
      resolve(DEFAULT_ORIGIN);
    }

    // Safety net: if no fix (e.g. prompt ignored), fall back so the app still loads.
    const fallback = setTimeout(() => resolve(DEFAULT_ORIGIN), 9000);

    return () => {
      clearTimeout(fallback);
      if (geoWatch.current != null) {
        navigator.geolocation.clearWatch(geoWatch.current);
        geoWatch.current = null;
      }
    };
  }, [loadAt]);

  // Mapbox removes custom sources/layers whenever the base style changes, so reload routes afterward.
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (!mapModeReady.current) {
      mapModeReady.current = true;
      return;
    }
    m.setStyle(MAP_STYLES[mapMode]);
    m.once("style.load", () => loadAt(currentOrigin.current));
  }, [mapMode, loadAt]);

  // Keep the highlight layer in sync with the selected route.
  useEffect(() => {
    const m = map.current;
    if (!m || !selectedId) return;
    const apply = () => {
      if (m.getLayer("scenic-routes-selected")) {
        m.setFilter("scenic-routes-selected", ["==", ["get", "id"], selectedId]);
      }
    };
    if (m.isStyleLoaded()) apply();
    else m.once("idle", apply);
  }, [selectedId]);

  // Keep the selected landmark ring in sync.
  useEffect(() => {
    const m = map.current;
    if (!m || !selectedLandmarkId) return;
    const apply = () => {
      if (m.getLayer("landmarks-selected")) {
        m.setFilter("landmarks-selected", ["==", ["get", "id"], selectedLandmarkId]);
      }
    };
    if (m.isStyleLoaded()) apply();
    else m.once("idle", apply);
  }, [selectedLandmarkId]);

  // Keep visited landmark pins in sync with check-ins.
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const apply = () => {
      if (m.getLayer("landmarks-visited")) {
        m.setFilter(
          "landmarks-visited",
          visitedLandmarkIds.length
            ? ["in", ["get", "id"], ["literal", visitedLandmarkIds]]
            : ["==", ["get", "id"], ""]
        );
      }
    };
    if (m.isStyleLoaded()) apply();
    else m.once("idle", apply);
  }, [visitedLandmarkIds]);

  // Backend health check.
  useEffect(() => {
    fetch(`${API}/api/health`)
      .then((r) => r.json())
      .then((d) => setBackendStatus(d.message))
      .catch(() => setBackendStatus("offline"));
  }, []);

  const selectedRoute = routes.find((f) => f.properties.id === selectedId)?.properties;
  const selectedLandmarkFeature = landmarks.find((f) => f.properties.id === selectedLandmarkId);
  const selectedLandmarkDistanceMi = selectedLandmarkFeature
    ? getLandmarkDistanceMi(selectedLandmarkFeature, userLngLat)
    : undefined;
  const selectedLandmarkVisited = selectedLandmarkId ? visitedLandmarkIds.includes(selectedLandmarkId) : false;
  const selectedLandmark =
    selectedLandmarkFeature && Number.isFinite(selectedLandmarkDistanceMi)
      ? {
          ...selectedLandmarkFeature.properties,
          distanceMi: Number(selectedLandmarkDistanceMi.toFixed(1)),
          isVisited: selectedLandmarkVisited,
          canCheckIn: !selectedLandmarkVisited && selectedLandmarkDistanceMi <= CHECK_IN_RADIUS_MI,
        }
      : selectedLandmarkFeature?.properties;

  return (
    <>
      <div ref={mapContainer} className="map-root" />

      <Hud
        route={selectedRoute}
        routes={routes}
        landmark={selectedLandmark}
        landmarkCount={landmarks.length}
        visitedLandmarkCount={visitedLandmarkIds.length}
        checkInRadiusMi={CHECK_IN_RADIUS_MI}
        onCheckInLandmark={checkInLandmark}
        selectedId={selectedId}
        onSelectRoute={selectRoute}
        backendStatus={backendStatus}
        user={user}
        onSignOut={signOut}
        mapMode={mapMode}
        onToggleMapMode={() => setMapMode((mode) => (mode === "streets" ? "satellite" : "streets"))}
        locating={locating}
        speed={speed}
        hasGps={hasGps}
        score={score}
        scoreDelta={scoreDelta}
        discovered={discoveredCount}
      />
    </>
  );
}
