import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import api from '../api/axios';
import L from 'leaflet';
import { RefreshCw, Navigation, Search, Truck } from 'lucide-react';

// Fix icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Component to handle map movements and Auto-Fit
const MapController = ({ selectedVehicle, vehicles }) => {
  const map = useMap();
  const [hasFitBounds, setHasFitBounds] = useState(false);

  // Auto-fit bounds on load
  useEffect(() => {
    if (!hasFitBounds && vehicles.length > 0) {
      const markers = vehicles
        .filter(v => v.last_latitude && v.last_longitude)
        .map(v => [v.last_latitude, v.last_longitude]);
      
      if (markers.length > 0) {
        const bounds = L.latLngBounds(markers);
        map.fitBounds(bounds, { padding: [50, 50] });
        setHasFitBounds(true);
      }
    }
  }, [vehicles, map, hasFitBounds]);

  // Fly to selected vehicle
  useEffect(() => {
    if (selectedVehicle && selectedVehicle.last_latitude) {
      map.flyTo([selectedVehicle.last_latitude, selectedVehicle.last_longitude], 15, {
        animate: true,
        duration: 1.5
      });
    }
  }, [selectedVehicle, map]);

  return null;
};

const LiveMap = () => {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [search, setSearch] = useState('');
  
  const fetchVehicles = async () => {
    try {
      const response = await api.get('vehicles/');
      setVehicles(response.data);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    }
  };

  useEffect(() => {
    fetchVehicles();
    const interval = setInterval(fetchVehicles, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredVehicles = vehicles.filter(v => 
    v.license_plate.toLowerCase().includes(search.toLowerCase())
  );

  const defaultCenter = [-6.2088, 106.8456];

  return (
    <div className="flex h-full relative overflow-hidden">
       
       {/* Sidebar List */}
       <div className="w-80 bg-white border-r border-slate-200 flex flex-col z-10 shadow-xl">
          <div className="p-4 border-b border-slate-100">
             <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
                <Navigation size={20} className="text-blue-600"/>
                Fleet List
             </h2>
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search plate..." 
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
             </div>
          </div>
          <div className="flex-1 overflow-y-auto">
             {filteredVehicles.map(v => (
                <button 
                  key={v.id}
                  onClick={() => setSelectedVehicle(v)}
                  className={`w-full text-left p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors flex items-center gap-3
                    ${selectedVehicle?.id === v.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'}
                  `}
                >
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center
                      ${v.computed_status === 'MOVING' ? 'bg-green-100 text-green-600' : 
                        v.computed_status === 'IDLE' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}
                   `}>
                      <Truck size={16} />
                   </div>
                   <div>
                      <p className="font-semibold text-sm text-slate-800">{v.license_plate}</p>
                      <p className="text-xs text-slate-500">{v.vehicle_type} • {v.computed_status}</p>
                   </div>
                </button>
             ))}
          </div>
          <div className="p-3 border-t border-slate-100 text-xs text-slate-400 text-center">
             Auto-refreshing every 5s
          </div>
       </div>

       {/* Map */}
       <div className="flex-1 relative z-0">
          <MapContainer center={defaultCenter} zoom={5} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapController selectedVehicle={selectedVehicle} vehicles={vehicles} />
            
            {vehicles.map((v) => (
              v.last_latitude && v.last_longitude ? (
                <Marker 
                  key={v.id} 
                  position={[v.last_latitude, v.last_longitude]}
                  eventHandlers={{
                    click: () => setSelectedVehicle(v),
                  }}
                >
                  <Popup>
                    <div className="p-1 min-w-[150px]">
                      <h3 className="font-bold text-slate-800 text-lg">{v.license_plate}</h3>
                      <div className="text-sm text-slate-600 mt-2 space-y-1">
                        <p><span className="font-semibold">Type:</span> {v.vehicle_type}</p>
                        <p><span className="font-semibold">Status:</span> 
                            <span className={`ml-1 font-bold ${
                              v.computed_status === 'MOVING' ? 'text-green-600' : 'text-amber-600'
                            }`}>{v.computed_status}</span>
                        </p>
                        <p><span className="font-semibold">Speed:</span> {v.last_speed.toFixed(1)} km/h</p>
                        <p className="pt-2 border-t border-slate-100 mt-2 text-xs text-slate-400">
                          Last Updated: {new Date(v.last_updated).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ) : null
            ))}
          </MapContainer>
       </div>
    </div>
  );
};

export default LiveMap;
