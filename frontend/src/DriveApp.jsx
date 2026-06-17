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
const DEFAULT_ORIGIN = [-83.93, 35.51]; // Tail of the Dragon - a great demo if location is denied
const MAP_STYLES = {
  streets: "mapbox://styles/mapbox/streets-v12",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
};

export default function DriveApp() {
  const { user, signOut } = useAuth();

  const mapContainer = useRef(null);
  const map = useRef(null);
  const userMarker = useRef(null);
  const geoWatch = useRef(null);
  const routesRef = useRef([]);
  const discoveredRef = useRef(new Set());
  const originResolved = useRef(false);
  const currentOrigin = useRef(DEFAULT_ORIGIN);
  const mapModeReady = useRef(false);

  const [backendStatus, setBackendStatus] = useState("Checking...");
  const [routes, setRoutes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
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

        m.flyTo({ center: origin, zoom: 11, duration: 1600, essential: true });
        fetch(`${API}/api/routes/nearby?lat=${origin[1]}&lng=${origin[0]}`)
          .then((r) => r.json())
          .then((geojson) => {
            const features = geojson.features ?? [];
            routesRef.current = features;
            setRoutes(features);
            const src = m.getSource("scenic-routes");
            if (src) src.setData(geojson);
            if (features[0]) setSelectedId(features[0].properties.id);
          })
          .catch((err) => console.error("Failed to load scenic routes:", err))
          .finally(() => setLocating(false));
      };
      if (m.isStyleLoaded()) run();
      else m.once("load", run);
    },
    [selectRoute]
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
        (pos) => resolve([pos.coords.longitude, pos.coords.latitude]),
        () => resolve(DEFAULT_ORIGIN),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
      // Live tracking for speed + "you are here" marker.
      geoWatch.current = navigator.geolocation.watchPosition(
        (pos) => {
          setHasGps(true);
          const { longitude, latitude, speed: mps } = pos.coords;
          setSpeed(mps != null && mps > 0 ? mps * MS_TO_MPH : 0);
          resolve([longitude, latitude]);
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

  // Backend health check.
  useEffect(() => {
    fetch(`${API}/api/health`)
      .then((r) => r.json())
      .then((d) => setBackendStatus(d.message))
      .catch(() => setBackendStatus("offline"));
  }, []);

  const selectedRoute = routes.find((f) => f.properties.id === selectedId)?.properties;

  return (
    <>
      <div ref={mapContainer} className="map-root" />

      <Hud
        route={selectedRoute}
        routes={routes}
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
