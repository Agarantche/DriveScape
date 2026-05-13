import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);

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

  return (
    <div
      ref={mapContainer}
      style={{width: "100vw", height: "100vh"}}
    />  
  )
}

export default App;