import React, { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, CircleMarker, Rectangle, Tooltip, useMap } from 'react-leaflet';
import api from '../api/axios';
import L from 'leaflet';
import { Navigation, Search, Truck } from 'lucide-react';
import { startTraccarSocket } from '../utils/traccarSocket';

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

const normalizeGeofenceType = (value) => {
  if (!value) return 'CIRCLE';
  return value.toString().toUpperCase();
};

const normalizeBounds = (bounds) => {
  if (!bounds || typeof bounds !== 'object') return null;
  const north = Number(bounds.north);
  const south = Number(bounds.south);
  const east = Number(bounds.east);
  const west = Number(bounds.west);
  if (![north, south, east, west].every(Number.isFinite)) return null;
  if (north === south || east === west) return null;
  return {
    north: Math.max(north, south),
    south: Math.min(north, south),
    east: Math.max(east, west),
    west: Math.min(east, west),
  };
};

const boundsToLatLng = (bounds) => {
  if (!bounds) return null;
  return [
    [bounds.south, bounds.west],
    [bounds.north, bounds.east],
  ];
};

const getBoundsCenter = (bounds) => {
  if (!bounds) return null;
  return {
    latitude: (bounds.north + bounds.south) / 2,
    longitude: (bounds.east + bounds.west) / 2,
  };
};

// Component to handle map movements and Auto-Fit
const MapController = ({ selectedVehicle, vehicles, geofences }) => {
  const map = useMap();
  const [hasFitBounds, setHasFitBounds] = useState(false);

  // Auto-fit bounds on load
  useEffect(() => {
    if (!hasFitBounds) {
      const vehicleMarkers = vehicles
        .filter(v => v.last_latitude && v.last_longitude)
        .map(v => [v.last_latitude, v.last_longitude]);
      const geofenceMarkers = geofences.flatMap(geofence => {
        const geofenceType = normalizeGeofenceType(geofence.geofence_type);
        if (geofenceType === 'RECTANGLE') {
          const bounds = normalizeBounds(geofence.geofence_bounds);
          if (!bounds) return [];
          return [
            [bounds.south, bounds.west],
            [bounds.north, bounds.east],
          ];
        }
        const lat = Number(geofence.latitude);
        const lng = Number(geofence.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];
        return [[lat, lng]];
      });
      const markers = [...vehicleMarkers, ...geofenceMarkers];

      if (markers.length > 0) {
        const bounds = L.latLngBounds(markers);
        map.fitBounds(bounds, { padding: [50, 50] });
        setHasFitBounds(true);
      }
    }
  }, [vehicles, geofences, map, hasFitBounds]);

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
  const [origins, setOrigins] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [search, setSearch] = useState('');
  const [socketStatus, setSocketStatus] = useState('connecting');
  const deviceIdLookupRef = useRef({});
  
  const fetchVehicles = useCallback(async () => {
    try {
      const response = await api.get('vehicles/');
      setVehicles(response.data);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    }
  }, []);

  const fetchOrigins = useCallback(async () => {
    try {
      const response = await api.get('origins/');
      setOrigins(response.data || []);
    } catch (error) {
      console.error("Error fetching origins:", error);
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await api.get('customers/');
      setCustomers(response.data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  }, []);

  const mapTraccarStatus = useCallback((rawStatus) => {
    if (!rawStatus) return 'UNKNOWN';
    const normalized = rawStatus.toString().toLowerCase();
    if (normalized === 'online') return 'ONLINE';
    if (normalized === 'offline') return 'OFFLINE';
    return 'UNKNOWN';
  }, []);

  const deriveComputedStatus = useCallback((deviceStatus, speedKmh, ignition) => {
    const normalized = (deviceStatus || '').toUpperCase();
    if (normalized === 'OFFLINE') return 'OFFLINE';
    if (speedKmh > 10) return 'MOVING';
    if (ignition) return 'IDLE';
    return 'STOPPED';
  }, []);

  const applyDeviceUpdates = useCallback((devicesPayload) => {
    if (!devicesPayload || !Array.isArray(devicesPayload)) return;
    setVehicles(prev => {
      const updated = [...prev];
      devicesPayload.forEach(dev => {
        if (dev.id && dev.uniqueId) {
          deviceIdLookupRef.current[dev.id] = dev.uniqueId;
        }
        if (!dev.uniqueId) return;
        const idx = updated.findIndex(v => String(v.gps_device_id) === String(dev.uniqueId));
        if (idx !== -1) {
          const mappedStatus = mapTraccarStatus(dev.status);
          updated[idx] = {
            ...updated[idx],
            device_status: mappedStatus,
            computed_status: mappedStatus === 'OFFLINE' ? 'OFFLINE' : updated[idx].computed_status,
            last_gps_sync: dev.lastUpdate || updated[idx].last_gps_sync,
          };
        }
      });
      return updated;
    });
  }, [mapTraccarStatus]);

  const applyPositionUpdates = useCallback((positionsPayload) => {
    if (!positionsPayload || !Array.isArray(positionsPayload)) return;
    setVehicles(prev => {
      const updated = [...prev];
      positionsPayload.forEach(pos => {
        const uniqueId = deviceIdLookupRef.current[pos.deviceId] || pos.uniqueId;
        if (!uniqueId) return;
        const idx = updated.findIndex(v => String(v.gps_device_id) === String(uniqueId));
        if (idx === -1) return;
        const kmh = (pos.speed || 0) * 1.852;
        const ignition = pos.attributes?.ignition ?? updated[idx].last_ignition;
        updated[idx] = {
          ...updated[idx],
          last_latitude: pos.latitude ?? updated[idx].last_latitude,
          last_longitude: pos.longitude ?? updated[idx].last_longitude,
          last_speed: kmh,
          last_heading: pos.course ?? updated[idx].last_heading,
          last_ignition: ignition,
          last_gps_sync: pos.serverTime || pos.deviceTime || updated[idx].last_gps_sync,
          computed_status: deriveComputedStatus(updated[idx].device_status, kmh, ignition),
        };
      });
      return updated;
    });
  }, [deriveComputedStatus]);

  useEffect(() => {
    fetchVehicles();
    fetchOrigins();
    fetchCustomers();
    
    // Initial Sync
    const syncWithTraccar = async () => {
        try { await api.post('vehicles/sync/'); } 
        catch (e) { console.warn("Sync failed:", e); }
    };
    syncWithTraccar();

    const stopSocket = startTraccarSocket({
      onStatus: setSocketStatus,
      onPayload: (data) => {
        if (data?.devices) applyDeviceUpdates(data.devices);
        if (data?.positions) applyPositionUpdates(data.positions);
      },
      onError: () => {
        fetchVehicles();
        syncWithTraccar();
      }
    });

    return () => {
      if (typeof stopSocket === 'function') {
        stopSocket();
      }
    };
  }, [applyDeviceUpdates, applyPositionUpdates, fetchVehicles, fetchOrigins, fetchCustomers]);

  const filteredVehicles = vehicles.filter(v => 
    v.license_plate.toLowerCase().includes(search.toLowerCase())
  );

  const defaultCenter = [-6.2088, 106.8456];
  const geofences = [...origins, ...customers];

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
                        v.computed_status === 'IDLE' ? 'bg-amber-100 text-amber-600' : 
                        v.computed_status === 'OFFLINE' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}
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
             Live Updates (Socket: {socketStatus})
          </div>
       </div>

       {/* Map */}
       <div className="flex-1 relative z-0">
          <MapContainer center={defaultCenter} zoom={5} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapController selectedVehicle={selectedVehicle} vehicles={vehicles} geofences={geofences} />

            {origins.map((origin) => {
              const lat = Number(origin.latitude);
              const lng = Number(origin.longitude);
              if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
              const radius = Number(origin.radius) || 200;
              const isOrigin = origin.is_origin !== false;
              const color = isOrigin ? '#16a34a' : '#f97316';
              const label = isOrigin ? 'Origin' : 'Drop';
              return (
                <React.Fragment key={`origin-${origin.id}`}>
                  <Circle
                    center={[lat, lng]}
                    radius={radius}
                    pathOptions={{ color, fillColor: color, fillOpacity: 0.12 }}
                  >
                    <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                      {label}: {origin.name || label} ({radius}m)
                    </Tooltip>
                  </Circle>
                  <CircleMarker
                    center={[lat, lng]}
                    radius={4}
                    pathOptions={{ color, fillColor: color, fillOpacity: 1 }}
                  />
                </React.Fragment>
              );
            })}

            {customers.map((customer) => {
              const geofenceType = normalizeGeofenceType(customer.geofence_type);
              if (geofenceType === 'RECTANGLE') {
                const bounds = normalizeBounds(customer.geofence_bounds);
                if (!bounds) return null;
                const center = getBoundsCenter(bounds);
                const latLngBounds = boundsToLatLng(bounds);
                return (
                  <React.Fragment key={`customer-${customer.id}`}>
                    <Rectangle
                      bounds={latLngBounds}
                      pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 0.12 }}
                    >
                      <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                        Customer: {customer.name || 'Customer'} (Rectangle)
                      </Tooltip>
                    </Rectangle>
                    {center && Number.isFinite(center.latitude) && Number.isFinite(center.longitude) && (
                      <CircleMarker
                        center={[center.latitude, center.longitude]}
                        radius={4}
                        pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 1 }}
                      />
                    )}
                  </React.Fragment>
                );
              }
              const lat = Number(customer.latitude);
              const lng = Number(customer.longitude);
              if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
              const radius = Number(customer.radius) || 200;
              return (
                <React.Fragment key={`customer-${customer.id}`}>
                  <Circle
                    center={[lat, lng]}
                    radius={radius}
                    pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 0.12 }}
                  >
                    <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                      Customer: {customer.name || 'Customer'} ({radius}m)
                    </Tooltip>
                  </Circle>
                  <CircleMarker
                    center={[lat, lng]}
                    radius={4}
                    pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 1 }}
                  />
                </React.Fragment>
              );
            })}
            
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
                              v.computed_status === 'MOVING' ? 'text-green-600' : 
                              v.computed_status === 'IDLE' ? 'text-amber-600' :
                              v.computed_status === 'OFFLINE' ? 'text-red-600' : 'text-slate-600'
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
