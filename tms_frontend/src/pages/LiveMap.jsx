import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import L from 'leaflet';
import axios from 'axios';
import { Search, MapPin, Truck } from 'lucide-react';

// Fix Icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Helper: Get Status Color
const getStatusColor = (vehicle) => {
    // 1. Check Offline (No signal > 1 hour)
    const lastUpdate = new Date(vehicle.last_updated).getTime();
    const now = new Date().getTime();
    const oneHour = 3600 * 1000;
    
    if (now - lastUpdate > oneHour) return 'gray'; // Offline (Grey)

    // 2. Use API computed status or fallback logic
    const status = vehicle.computed_status || 'STOPPED';
    
    switch (status) {
        case 'MOVING': return '#22c55e'; // Green
        case 'IDLE': return '#eab308';   // Yellow
        case 'STOPPED': return '#ef4444'; // Red
        default: return 'gray';
    }
};

// Component to handle map flying
const MapController = ({ selectedPosition }) => {
    const map = useMap();
    useEffect(() => {
        if (selectedPosition) {
            map.flyTo(selectedPosition, 16, {
                animate: true,
                duration: 1.5
            });
        }
    }, [selectedPosition, map]);
    return null;
};

const LiveMap = () => {
  const [vehicles, setVehicles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [mapCenter, setMapCenter] = useState([-6.9175, 107.6191]); // Default Bandung
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const fetchVehicles = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/vehicles/');
      setVehicles(res.data);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    }
  };

  useEffect(() => {
    fetchVehicles();
    const interval = setInterval(fetchVehicles, 5000); 
    return () => clearInterval(interval);
  }, []);

  // Filter vehicles
  const filteredVehicles = vehicles.filter(v => 
    v.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.vehicle_type && v.vehicle_type.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleVehicleClick = (vehicle) => {
    if (vehicle.last_latitude && vehicle.last_longitude) {
        setSelectedVehicleId(vehicle.id);
        setMapCenter([vehicle.last_latitude, vehicle.last_longitude]);
    } else {
        alert("This vehicle has no GPS data.");
    }
  };

  return (
    <div className="flex h-full w-full relative overflow-hidden">
      
      {/* Sidebar List */}
      <div className={`
        absolute lg:static z-20 h-full bg-white shadow-lg transition-all duration-300 flex flex-col
        ${isSidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full lg:w-0 lg:-translate-x-full'}
      `}>
         <div className="p-4 bg-gray-900 text-white flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2"><Truck size={18}/> Fleet List</h3>
            <span className="text-xs bg-gray-700 px-2 py-1 rounded-full">{filteredVehicles.length} Units</span>
         </div>

         <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Search Plate or Type..." 
                    className="w-full pl-9 pr-3 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
         </div>

         <div className="flex-1 overflow-y-auto">
            {filteredVehicles.map(vehicle => {
                const color = getStatusColor(vehicle);
                const isOffline = color === 'gray';
                
                return (
                    <div 
                        key={vehicle.id}
                        onClick={() => handleVehicleClick(vehicle)}
                        className={`
                            p-3 border-b border-gray-100 cursor-pointer transition-colors flex items-center gap-3
                            ${selectedVehicleId === vehicle.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50 border-l-4 border-l-transparent'}
                        `}
                    >
                        <div 
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color }}
                            title={isOffline ? "Offline" : vehicle.computed_status}
                        />
                        
                        <div className="flex-1">
                            <h4 className="font-semibold text-gray-800 text-sm">{vehicle.license_plate}</h4>
                            <p className="text-xs text-gray-500">{vehicle.vehicle_type}</p>
                        </div>

                        <div className="text-xs text-right text-gray-400">
                            {isOffline ? 'Offline' : `${vehicle.last_speed?.toFixed(0) || 0} km/h`}
                        </div>
                    </div>
                );
            })}
            
            {filteredVehicles.length === 0 && (
                <div className="p-6 text-center text-gray-500 text-sm">
                    No vehicles found.
                </div>
            )}
         </div>
         
         {/* Legend */}
         <div className="p-2 border-t text-xs flex justify-around bg-gray-50 text-gray-600">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Moving</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500"></div> Idle</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Stop</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-gray-500"></div> Offline</span>
         </div>
      </div>

      {/* Toggle Button for Mobile/Desktop */}
      <button 
        onClick={() => setSidebarOpen(!isSidebarOpen)}
        className="absolute top-4 left-4 z-30 bg-white p-2 rounded-md shadow-md text-gray-600 hover:text-gray-900 lg:hidden"
      >
        <Search size={20} />
      </button>

      {/* Map Area */}
      <div className="flex-1 h-full relative z-10">
        <MapContainer center={[-6.9175, 107.6191]} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapController selectedPosition={selectedVehicleId ? mapCenter : null} />

            {vehicles.map(vehicle => {
                if (!vehicle.last_latitude) return null;
                const color = getStatusColor(vehicle);
                
                const truckIcon = divIcon({
                    className: 'custom-truck-icon',
                    html: `<div style="
                            transform: rotate(${vehicle.last_heading || 0}deg); 
                            width: 40px; height: 40px;
                            background-image: url('https://cdn-icons-png.flaticon.com/512/2555/2555013.png');
                            background-size: cover;
                            border: 3px solid ${color};
                            border-radius: 50%;
                            background-color: white;
                            box-shadow: 0 0 5px rgba(0,0,0,0.5);
                            "></div>`,
                    iconSize: [40, 40],
                    iconAnchor: [20, 20]
                });
            
                return (
                    <Marker 
                        key={vehicle.id} 
                        position={[vehicle.last_latitude, vehicle.last_longitude]} 
                        icon={truckIcon}
                        eventHandlers={{
                            click: () => {
                                setSelectedVehicleId(vehicle.id);
                                setSidebarOpen(true); // Open sidebar to see details if closed
                            },
                        }}
                    >
                        <Popup>
                            <div className="text-center">
                                <strong className="text-lg">{vehicle.license_plate}</strong>
                                <hr className="my-1"/>
                                <div className="text-sm text-gray-600">
                                    Status: <span style={{color, fontWeight:'bold'}}>{vehicle.computed_status}</span><br/>
                                    Speed: {vehicle.last_speed?.toFixed(0) || 0} km/h<br/>
                                    Engine: {vehicle.last_ignition ? 'ON' : 'OFF'}<br/>
                                    <span className="text-xs text-gray-400">
                                        Last Update: {new Date(vehicle.last_updated).toLocaleTimeString()}
                                    </span>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>

        {/* Floating Toggle for Desktop (if we want to hide sidebar) */}
        <button 
             onClick={() => setSidebarOpen(!isSidebarOpen)}
             className={`
                absolute top-4 left-4 z-[400] bg-white p-2 rounded shadow-md text-gray-600 hover:text-blue-600 transition-all
                ${isSidebarOpen ? 'hidden' : 'hidden lg:block'} 
             `}
             title="Show List"
        >
            <Truck size={20} />
        </button>

      </div>
    </div>
  );
};

export default LiveMap;