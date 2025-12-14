import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Truck, MapPin, DollarSign, Users, Activity } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';
import DriverDashboard from './DriverDashboard';

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

const Dashboard = () => {
  const { user } = useAuth();
  
  // DRIVER REDIRECT
  if (user?.role === 'DRIVER') {
      return <DriverDashboard />;
  }

  const [stats, setStats] = useState({ 
    totalVehicles: 0, 
    activeTrips: 0, 
    availableDrivers: 0,
    totalRevenue: '0' 
  });
  const [vehicles, setVehicles] = useState([]);
  const [recentTrips, setRecentTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vehRes, tripRes, driverRes] = await Promise.all([
           api.get('vehicles/'),
           api.get('trips/'),
           api.get('drivers/')
        ]);
        
        const activeTripsCount = tripRes.data.filter(t => t.status === 'OTW').length;
        const availableDriversCount = driverRes.data.length; // Simplified logic
        
        // Revenue logic would typically come from backend
        // For now using mock
        
        setStats({
          totalVehicles: vehRes.data.length || 0,
          activeTrips: activeTripsCount,
          availableDrivers: availableDriversCount,
          totalRevenue: '1.2B', 
        });

        setVehicles(vehRes.data);
        // Get last 5 trips
        setRecentTrips(tripRes.data.slice(0, 5));
        
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const defaultCenter = [-6.2088, 106.8456];

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard Overview</h1>
        <p className="text-slate-500">Executive summary of operations.</p>
      </header>

      {/* 1. Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Vehicles" value={stats.totalVehicles} icon={<Truck size={24} />} color="bg-blue-500" />
        <StatCard title="Active Trips" value={stats.activeTrips} icon={<Activity size={24} />} color="bg-amber-500" />
        <StatCard title="Available Drivers" value={stats.availableDrivers} icon={<Users size={24} />} color="bg-emerald-500" />
        <StatCard title="Total Revenue (Month)" value={stats.totalRevenue} icon={<DollarSign size={24} />} color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. Mini Map */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-96 flex flex-col">
            <div className="p-4 border-b border-slate-100 font-bold text-slate-800 flex items-center gap-2">
               <MapPin size={18} className="text-blue-500"/> Fleet Preview
            </div>
            <div className="flex-1">
               <MapContainer center={defaultCenter} zoom={10} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {vehicles.map(v => (
                      v.last_latitude && v.last_longitude ? 
                      <Marker key={v.id} position={[v.last_latitude, v.last_longitude]} /> : null
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
                              <p className="text-xs text-slate-500">{t.origin} → {t.destination}</p>
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