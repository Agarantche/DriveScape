import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [backendStatus, setBackendStatus] = useState("Checking...")

  useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [-81.85, 39.5],  // SR-78 area
      zoom: 9,
    });
    new mapboxgl.Marker({ color: "#ff6b35" })
      .setLngLat([-81.85, 39.5])
      .setPopup(
        new mapboxgl.Popup().setHTML("<strong>State Route 78</strong><br>The Wayne - twisty Appalachian foothills")
      )
    .addTo(map.current);
  }, []);

  useEffect(() => {
    fetch("http://localhost:3000/api/health")
      .then((res) => res.json())
      .then((data) => setBackendStatus(data.message))
      .catch((err) => {
        console.error("Backend connection failed:", err);
        setBackendStatus("offline")
      });
  }, []);


  return (
  <>
    <div
      ref={mapContainer}
      style={{ width: "100vw", height: "100vh" }}
    />
    <div
      style={{
        position: "absolute",
        top: 12,
        left: 12,
        background: "rgba(0, 0, 0, 0.7)",
        color: "white",
        padding: "8px 12px",
        borderRadius: 4,
        fontSize: 14,
        zIndex: 1,
      }}
    >
      Backend Status: {backendStatus}
    </div>
  </>
);
}

export default App;