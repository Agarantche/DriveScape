import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Hud from "./Hud.jsx";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [backendStatus, setBackendStatus] = useState("Checking...");
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [-81.85, 39.5], // SR-78 area
      zoom: 9,
    });

    // Once the base style is ready, fetch nearby scenic routes and draw them as glowing orange lines.
    map.current.on("load", () => {
      fetch("http://localhost:3000/api/routes/nearby?lat=39.5&lng=-81.85")
        .then((res) => res.json())
        .then((geojson) => {
          setRoutes(geojson.features ?? []); // feed the HUD
          if (map.current.getSource("scenic-routes")) return; // avoid duplicate on hot-reload
          map.current.addSource("scenic-routes", {
            type: "geojson",
            data: geojson,
          });
          // Wide, blurred underlay = the cinematic glow beneath the route.
          map.current.addLayer({
            id: "scenic-routes-glow",
            type: "line",
            source: "scenic-routes",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": "#ff6b35",
              "line-width": 12,
              "line-blur": 8,
              "line-opacity": 0.4,
            },
          });
          // Crisp core line on top.
          map.current.addLayer({
            id: "scenic-routes-line",
            type: "line",
            source: "scenic-routes",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: { "line-color": "#ff6b35", "line-width": 4 },
          });
        })
        .catch((err) => console.error("Failed to load scenic routes:", err));
    });
  }, []);

  useEffect(() => {
    fetch("http://localhost:3000/api/health")
      .then((res) => res.json())
      .then((data) => setBackendStatus(data.message))
      .catch((err) => {
        console.error("Backend connection failed:", err);
        setBackendStatus("offline");
      });
  }, []);

  return (
    <>
      <div ref={mapContainer} style={{ width: "100vw", height: "100vh" }} />
      <Hud route={routes[0]?.properties} backendStatus={backendStatus} />
    </>
  );
}

export default App;
