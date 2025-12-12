import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for missing marker icons in React Leaflet
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function App() {
  // Default Position: Bandung
  const position = [-6.9175, 107.6191];

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
        
        {/* The Map Tiles (OpenStreetMap - Free) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* A Dummy Truck */}
        <Marker position={position}>
          <Popup>
            Unit D 1234 TEST <br /> Status: Parkir
          </Popup>
        </Marker>

      </MapContainer>
    </div>
  );
}

export default App;