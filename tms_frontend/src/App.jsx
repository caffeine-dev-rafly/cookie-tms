import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Icon
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function App() {
  const [vehicles, setVehicles] = useState([]);

  // Function to fetch data from Django
  const fetchVehicles = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/vehicles/');
      const data = await response.json();
      console.log("Updated Data:", data); // Check console to see it working
      setVehicles(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // Run on load, and then every 2 seconds
  useEffect(() => {
    fetchVehicles(); // Initial fetch
    const interval = setInterval(fetchVehicles, 2000); // Poll every 2s
    return () => clearInterval(interval); // Cleanup
  }, []);

  // Default Center (Bandung)
  const defaultPosition = [-6.9175, 107.6191];

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <MapContainer center={defaultPosition} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Loop through all trucks from Database */}
        {vehicles.map(vehicle => (
           // Only show marker if it has valid GPS data (not 0.0)
           vehicle.last_latitude !== 0 && (
            <Marker 
              key={vehicle.id} 
              position={[vehicle.last_latitude, vehicle.last_longitude]}
            >
              <Popup>
                <b>{vehicle.license_plate}</b> <br />
                Type: {vehicle.vehicle_type} <br />
                Last Update: {new Date(vehicle.last_updated).toLocaleTimeString()}
              </Popup>
            </Marker>
          )
        ))}

      </MapContainer>
    </div>
  );
}

export default App;