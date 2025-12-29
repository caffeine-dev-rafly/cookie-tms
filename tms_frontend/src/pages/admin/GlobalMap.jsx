import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import api from '../../api/axios';
import L from 'leaflet';
import { Truck, Navigation, Search } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

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

// Color generator for organizations
const getOrgColor = (orgId) => {
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];
    return colors[(orgId || 0) % colors.length];
};

const GlobalMap = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const fetchAllVehicles = async () => {
    try {
      // Assuming 'vehicles/' returns all vehicles for super_admin
      // In a real scenario, we might need a specific endpoint like 'vehicles/all/'
      // or check if the backend automatically returns all for superuser.
      // Based on previous context, standard list viewset usually filters by user org,
      // but for superuser it often returns all. Let's assume standard behavior for now.
      const response = await api.get('vehicles/'); 
      setVehicles(response.data);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllVehicles();
    const interval = setInterval(fetchAllVehicles, 10000); // 10s refresh
    return () => clearInterval(interval);
  }, []);

  const filteredVehicles = vehicles.filter(v => 
    v.license_plate.toLowerCase().includes(search.toLowerCase()) ||
    (v.organization_name && v.organization_name.toLowerCase().includes(search.toLowerCase()))
  );

  const defaultCenter = [-6.2088, 106.8456]; // Jakarta

  // Custom marker icon generator
  const createCustomIcon = (color) => {
      return L.divIcon({
          className: 'custom-marker',
          html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
                    <div style="width: 8px; height: 8px; background-color: white; border-radius: 50%;"></div>
                 </div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
      });
  };

  return (
    <div className="flex h-full relative overflow-hidden">
       {/* Sidebar List */}
       <div className="w-80 bg-white border-r border-slate-200 flex flex-col z-10 shadow-xl">
          <div className="p-4 border-b border-slate-100 bg-slate-950 text-white">
             <h2 className="font-bold text-lg flex items-center gap-2 mb-1">
                <Navigation size={20} className="text-red-500"/>
                Global Eye
             </h2>
             <p className="text-xs text-slate-400">Monitoring all organization assets.</p>
          </div>
          <div className="p-4 border-b border-slate-100">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search plate or org..." 
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
             </div>
          </div>
          <div className="flex-1 overflow-y-auto">
             {filteredVehicles.map(v => (
                <div key={v.id} className="p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors flex items-center gap-3">
                   <div 
                        className="w-2 h-10 rounded-full"
                        style={{ backgroundColor: getOrgColor(v.organization) }}
                   />
                   <div>
                      <p className="font-semibold text-sm text-slate-800">{v.license_plate}</p>
                      <p className="text-xs text-slate-500">Org ID: {v.organization}</p>
                      <p className="text-xs text-slate-400">{v.computed_status}</p>
                   </div>
                </div>
             ))}
          </div>
       </div>

       {/* Map */}
       <div className="flex-1 relative z-0">
          <MapContainer center={defaultCenter} zoom={6} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {vehicles.map((v) => (
              v.last_latitude && v.last_longitude ? (
                <Marker 
                  key={v.id} 
                  position={[v.last_latitude, v.last_longitude]}
                  icon={createCustomIcon(getOrgColor(v.organization))}
                >
                  <Popup>
                    <div className="p-1 min-w-[150px]">
                      <h3 className="font-bold text-slate-800">{v.license_plate}</h3>
                      <p className="text-sm font-semibold text-blue-600 mb-1">Org ID: {v.organization}</p>
                      <div className="text-xs text-slate-600 space-y-1">
                        <p>Type: {v.vehicle_type}</p>
                        <p>Speed: {v.last_speed?.toFixed(1)} km/h</p>
                        <p>Status: {v.computed_status}</p>
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

export default GlobalMap;