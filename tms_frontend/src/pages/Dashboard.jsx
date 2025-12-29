import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import api from '../api/axios';
import { Truck, MapPin, DollarSign, Users, Activity } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle, CircleMarker, Rectangle, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';
import DriverDashboard from './DriverDashboard';
import VehicleAlertsPanel from '../components/VehicleAlertsPanel';
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

const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
    </div>
    <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center text-white shadow-sm`}>
      {icon}
    </div>
  </div>
);

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

const Dashboard = () => {
  const { user } = useAuth();
  const normalizedRole = (user?.role || '').toLowerCase();
  const offlineThresholdMinutes = Math.max(1, parseInt(user?.offline_alert_minutes, 10) || 10);
  
  // DRIVER REDIRECT
  if (normalizedRole === 'driver') {
      return <DriverDashboard />;
  }

  // SUPER ADMIN DASHBOARD
  if (user?.is_superuser || normalizedRole === 'super_admin') {
      return (
        <div className="p-6 space-y-6">
            <header>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold mb-2">
                    GOD MODE
                </div>
                <h1 className="text-2xl font-bold text-slate-800">System Administration</h1>
                <p className="text-slate-500">Global oversight of all tenants and infrastructure.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Tenants" value="12" icon={<Users size={24} />} color="bg-blue-600" />
                <StatCard title="Global Revenue" value="$45,200" icon={<DollarSign size={24} />} color="bg-emerald-600" />
                <StatCard title="System Load (GPS)" value="1,240 Conn" icon={<Activity size={24} />} color="bg-amber-600" />
            </div>

            <div className="bg-slate-900 rounded-xl p-8 text-center text-slate-400">
                <p>Global Map Preview Placeholder (Use sidebar to access full map)</p>
            </div>
        </div>
      );
  }

  const [stats, setStats] = useState({ 
    totalVehicles: 0, 
    activeTrips: 0, 
    availableDrivers: 0,
    totalRevenue: '0' 
  });
  const [vehicles, setVehicles] = useState([]);
  const [origins, setOrigins] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [recentTrips, setRecentTrips] = useState([]);
  const [vehicleUpdatedAt, setVehicleUpdatedAt] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [socketStatus, setSocketStatus] = useState('connecting');
  const deviceIdLookupRef = useRef({});

  const loadVehicles = useCallback(async () => {
    try {
      const vehRes = await api.get('vehicles/');
      const vehicleData = vehRes.data || [];
      setVehicles(vehicleData);
      setVehicleUpdatedAt(new Date());
      setStats(prev => ({
        ...prev,
        totalVehicles: vehicleData.length || 0,
      }));
    } catch (error) {
      console.error("Failed to fetch vehicles", error);
    }
  }, []);

  const syncWithTraccar = useCallback(async () => {
    try {
      await api.post('vehicles/sync/');
    } catch (error) {
      console.warn('Traccar sync failed', error);
    }
  }, []);

  const loadOrigins = useCallback(async () => {
    try {
      const originRes = await api.get('origins/');
      setOrigins(originRes.data || []);
    } catch (error) {
      console.error("Failed to fetch geofences", error);
    }
  }, []);

  const loadCustomers = useCallback(async () => {
    try {
      const customerRes = await api.get('customers/');
      setCustomers(customerRes.data || []);
    } catch (error) {
      console.error("Failed to fetch customer geofences", error);
    }
  }, []);

  useEffect(() => {
    loadVehicles();
    syncWithTraccar();
    loadOrigins();
    loadCustomers();
  }, [loadVehicles, syncWithTraccar, loadOrigins, loadCustomers]);

  const mapTraccarStatus = useCallback((rawStatus) => {
    if (!rawStatus) return 'UNKNOWN';
    const normalized = rawStatus.toString().toLowerCase();
    if (normalized === 'online') return 'ONLINE';
    if (normalized === 'offline') return 'OFFLINE';
    return 'UNKNOWN';
  }, []);

  const deriveGpsStatus = useCallback((vehicle) => {
    const direct = (vehicle.device_status || '').toUpperCase();
    if (direct === 'ONLINE' || direct === 'OFFLINE') return direct;

    const lastSync = vehicle.last_gps_sync ? new Date(vehicle.last_gps_sync).getTime() : null;
    if (lastSync) {
      const elapsedMs = Date.now() - lastSync;
      if (elapsedMs > offlineThresholdMinutes * 60 * 1000) {
        return 'OFFLINE';
      }
    }

    return (vehicle.computed_status || direct || 'UNKNOWN').toUpperCase();
  }, [offlineThresholdMinutes]);

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
    setVehicleUpdatedAt(new Date());
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
        updated[idx] = {
          ...updated[idx],
          last_latitude: pos.latitude ?? updated[idx].last_latitude,
          last_longitude: pos.longitude ?? updated[idx].last_longitude,
          last_speed: kmh,
          last_heading: pos.course ?? updated[idx].last_heading,
          last_ignition: pos.attributes?.ignition ?? updated[idx].last_ignition,
          last_gps_sync: pos.serverTime || pos.deviceTime || updated[idx].last_gps_sync,
        };
      });
      return updated;
    });
    setVehicleUpdatedAt(new Date());
  }, []);

  useEffect(() => {
    const stopSocket = startTraccarSocket({
      onStatus: setSocketStatus,
      onPayload: (data) => {
        if (data?.devices) applyDeviceUpdates(data.devices);
        if (data?.positions) applyPositionUpdates(data.positions);
      },
      onError: () => {
        // Refresh vehicles once when the socket fails so the UI stays current.
        loadVehicles();
        syncWithTraccar();
      }
    });

    return () => {
      if (typeof stopSocket === 'function') {
        stopSocket();
      }
    };
  }, [applyDeviceUpdates, applyPositionUpdates, loadVehicles, syncWithTraccar]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tripRes, driverRes] = await Promise.all([
           api.get('trips/'),
           api.get('drivers/')
        ]);
        
        const activeTripsCount = tripRes.data.filter(t => ['OTW', 'ARRIVED'].includes(t.status)).length;
        const availableDriversCount = driverRes.data.length; // Simplified logic
        
        setStats(prev => ({
          ...prev,
          activeTrips: activeTripsCount,
          availableDrivers: availableDriversCount,
          totalRevenue: '1.2B', 
        }));

        setRecentTrips(tripRes.data.slice(0, 5));
        
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      }
    };
    fetchData();
  }, []);

  const defaultCenter = useMemo(() => [-6.9175, 107.6191], []);

  const gpsStats = useMemo(() => {
    const online = [];
    const offline = [];
    const unknown = [];
    vehicles.forEach(vehicle => {
      if (!vehicle.gps_device_id) return;
      const status = deriveGpsStatus(vehicle);
      if (status === 'ONLINE') {
        online.push(vehicle);
      } else if (status === 'OFFLINE') {
        offline.push(vehicle);
      } else {
        unknown.push(vehicle);
      }
    });
    return { online, offline, unknown };
  }, [vehicles, deriveGpsStatus]);

  const activeGpsVehicles = gpsStats.online;
  const inactiveGpsVehicles = gpsStats.offline;
  const unknownGpsVehicles = gpsStats.unknown;
  const gpsTrackedTotal = activeGpsVehicles.length + inactiveGpsVehicles.length + unknownGpsVehicles.length;

  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    return status
      .toLowerCase()
      .split('_')
      .map(chunk => chunk.charAt(0).toUpperCase() + chunk.slice(1))
      .join(' ');
  };

  const formatLastSync = (timestamp) => {
    if (!timestamp) return 'No GPS ping yet';
    return new Date(timestamp).toLocaleString();
  };
  const lastGpsRefreshLabel = vehicleUpdatedAt ? vehicleUpdatedAt.toLocaleTimeString() : 'Waiting for GPS...';

  const dropGeofences = useMemo(() => {
    return (origins || [])
      .filter(origin => origin && origin.is_origin === false)
      .map(origin => ({
        id: `origin-${origin.id}`,
        name: origin.name || 'Drop',
        latitude: Number(origin.latitude),
        longitude: Number(origin.longitude),
        radius: Number(origin.radius) || 200,
        type: 'drop',
        shape: 'circle'
      }))
      .filter(origin => Number.isFinite(origin.latitude) && Number.isFinite(origin.longitude));
  }, [origins]);

  const customerGeofences = useMemo(() => {
    return (customers || [])
      .map(customer => {
        if (!customer) return null;
        const geofenceType = normalizeGeofenceType(customer.geofence_type);
        if (geofenceType === 'RECTANGLE') {
          const bounds = normalizeBounds(customer.geofence_bounds);
          if (!bounds) return null;
          const center = getBoundsCenter(bounds);
          return {
            id: `customer-${customer.id}`,
            name: customer.name || 'Customer',
            type: 'customer',
            shape: 'rectangle',
            bounds,
            latitude: center ? center.latitude : null,
            longitude: center ? center.longitude : null,
          };
        }
        const latitude = Number(customer.latitude);
        const longitude = Number(customer.longitude);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
        return {
          id: `customer-${customer.id}`,
          name: customer.name || 'Customer',
          latitude,
          longitude,
          radius: Number(customer.radius) || 200,
          type: 'customer',
          shape: 'circle',
        };
      })
      .filter(Boolean);
  }, [customers]);

  const geofences = useMemo(() => {
    return [...dropGeofences, ...customerGeofences];
  }, [dropGeofences, customerGeofences]);

  const mapBounds = useMemo(() => {
    const coords = vehicles
      .filter(v => v.last_latitude && v.last_longitude)
      .map(v => [v.last_latitude, v.last_longitude]);
    geofences.forEach(geofence => {
      if (geofence.shape === 'rectangle' && geofence.bounds) {
        coords.push([geofence.bounds.south, geofence.bounds.west]);
        coords.push([geofence.bounds.north, geofence.bounds.east]);
      } else if (Number.isFinite(geofence.latitude) && Number.isFinite(geofence.longitude)) {
        coords.push([geofence.latitude, geofence.longitude]);
      }
    });
    if (!coords.length) return null;
    let minLat = coords[0][0];
    let maxLat = coords[0][0];
    let minLng = coords[0][1];
    let maxLng = coords[0][1];
    coords.forEach(([lat, lng]) => {
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    });
    if (minLat === maxLat && minLng === maxLng) {
      const delta = 0.01;
      minLat -= delta;
      maxLat += delta;
      minLng -= delta;
      maxLng += delta;
    }
    return [
      [minLat, minLng],
      [maxLat, maxLng],
    ];
  }, [vehicles, geofences]);

  useEffect(() => {
    if (!mapInstance) return;
    if (mapBounds) {
      mapInstance.fitBounds(mapBounds, { padding: [40, 40], animate: true });
    } else {
      mapInstance.setView(defaultCenter, 10);
    }
  }, [mapInstance, mapBounds, defaultCenter]);

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard Overview</h1>
        <p className="text-slate-500">Executive summary of operations.</p>
      </header>

      {['owner', 'staff'].includes(normalizedRole) && (
        <VehicleAlertsPanel vehicles={vehicles} />
      )}

      {/* 1. Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Vehicles" value={stats.totalVehicles} icon={<Truck size={24} />} color="bg-blue-500" />
        <StatCard title="Active Trips" value={stats.activeTrips} icon={<Activity size={24} />} color="bg-amber-500" />
        <StatCard title="Available Drivers" value={stats.availableDrivers} icon={<Users size={24} />} color="bg-emerald-500" />
        <StatCard title="Total Revenue (Month)" value={stats.totalRevenue} icon={<DollarSign size={24} />} color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-3 gap-6">
        {/* 2. Mini Map */}
        <div className="lg:col-span-2 2xl:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-[32rem] flex flex-col">
            <div className="p-4 border-b border-slate-100 font-bold text-slate-800 flex items-center gap-2">
               <MapPin size={18} className="text-blue-500"/> Fleet Preview
            </div>
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 text-sm text-slate-600 flex flex-wrap gap-4 justify-between">
                <div>
                    <p className="text-xs uppercase text-slate-400">Active GPS</p>
                    <p className="text-lg font-semibold text-slate-800">{activeGpsVehicles.length}</p>
                </div>
                <div>
                    <p className="text-xs uppercase text-slate-400">Offline GPS</p>
                    <p className="text-lg font-semibold text-rose-600">{inactiveGpsVehicles.length}</p>
                </div>
                <div>
                    <p className="text-xs uppercase text-slate-400">Unknown GPS</p>
                    <p className="text-lg font-semibold text-slate-800">{unknownGpsVehicles.length}</p>
                </div>
                <div>
                     <p className="text-xs uppercase text-slate-400">Tracked Vehicles</p>
                     <p className="text-lg font-semibold text-slate-800">{gpsTrackedTotal} / {vehicles.length}</p>
                </div>
                <div>
                    <p className="text-xs uppercase text-slate-400">Socket</p>
                    <p className={`text-sm font-medium ${
                        socketStatus === 'connected' ? 'text-emerald-600' :
                        socketStatus === 'error' ? 'text-rose-600' : 'text-slate-700'
                    }`}>{socketStatus}</p>
                </div>
                <div className="ml-auto text-right">
                    <p className="text-xs uppercase text-slate-400">Last GPS refresh</p>
                    <p className="text-sm font-medium text-slate-700">{lastGpsRefreshLabel}</p>
                </div>
            </div>
            <div className="flex-1">
               <MapContainer
                 center={defaultCenter}
                 zoom={10}
                 whenCreated={setMapInstance}
                 style={{ height: '100%', width: '100%' }}
                 zoomControl={false}
               >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {geofences.map(geofence => {
                    const label = geofence.type === 'customer' ? 'Customer' : 'Drop';
                    if (geofence.shape === 'rectangle' && geofence.bounds) {
                      const bounds = boundsToLatLng(geofence.bounds);
                      return (
                        <React.Fragment key={geofence.id}>
                          <Rectangle
                            bounds={bounds}
                            pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 0.12 }}
                          >
                            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                              {label}: {geofence.name} (Rectangle)
                            </Tooltip>
                          </Rectangle>
                          {Number.isFinite(geofence.latitude) && Number.isFinite(geofence.longitude) && (
                            <CircleMarker
                              center={[geofence.latitude, geofence.longitude]}
                              radius={4}
                              pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 1 }}
                            />
                          )}
                        </React.Fragment>
                      );
                    }
                    return (
                      <React.Fragment key={geofence.id}>
                        <Circle
                          center={[geofence.latitude, geofence.longitude]}
                          radius={geofence.radius}
                          pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 0.12 }}
                        >
                          <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                            {label}: {geofence.name} ({geofence.radius}m)
                          </Tooltip>
                        </Circle>
                        <CircleMarker
                          center={[geofence.latitude, geofence.longitude]}
                          radius={4}
                          pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 1 }}
                        />
                      </React.Fragment>
                    );
                  })}
                  {vehicles.map(v => (
                      v.last_latitude && v.last_longitude ? 
                      <Marker key={v.id} position={[v.last_latitude, v.last_longitude]}>
                        <Popup>
                          <div className="text-sm space-y-1">
                            <p className="font-semibold text-slate-800">{v.license_plate}</p>
                            <p className="text-slate-600 text-xs">Status: {formatStatus(deriveGpsStatus(v))}</p>
                            <p className="text-slate-600 text-xs">Speed: {Math.round(v.last_speed || 0)} km/h</p>
                            <p className="text-slate-600 text-xs">GPS: {formatStatus(deriveGpsStatus(v))}</p>
                            <p className="text-slate-500 text-xs">Last ping: {formatLastSync(v.last_gps_sync)}</p>
                          </div>
                        </Popup>
                      </Marker> : null
                  ))}
               </MapContainer>
            </div>
        </div>

        {/* 3. Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-96 flex flex-col">
             <div className="p-4 border-b border-slate-100 font-bold text-slate-800 flex items-center gap-2">
               <Activity size={18} className="text-emerald-500"/> Recent Activity
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {recentTrips.length === 0 ? (
                    <p className="text-slate-400 text-center text-sm">No recent activity.</p>
                ) : (
                    recentTrips.map(t => (
                        <div key={t.id} className="flex items-start gap-3 pb-3 border-b border-slate-50 last:border-0">
                           <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                               t.status === 'COMPLETED' ? 'bg-green-500' : 'bg-blue-500'
                           }`} />
                           <div>
                              <p className="text-sm font-medium text-slate-800">Trip {t.surat_jalan_number}</p>
                              <p className="text-xs text-slate-500">{t.origin} - {t.destination}</p>
                              <p className="text-xs text-slate-400 mt-1">{new Date(t.created_at).toLocaleDateString()}</p>
                           </div>
                        </div>
                    ))
                )}
             </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
