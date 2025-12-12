import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Truck, Users, DollarSign, Activity, Clock, BarChart3, Target } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4">
    <div className={`p-3 rounded-full ${color}`}>
      <Icon className="text-white w-6 h-6" />
    </div>
    <div>
      <p className="text-gray-500 text-sm">{title}</p>
      <h3 className="text-2xl font-bold">{value}</h3>
    </div>
  </div>
);

const Dashboard = () => {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [vRes, dRes, tRes] = await Promise.all([
          axios.get('http://localhost:8000/api/vehicles/'),
          axios.get('http://localhost:8000/api/drivers/'),
          axios.get('http://localhost:8000/api/trips/')
        ]);
        setVehicles(vRes.data);
        setDrivers(dRes.data);
        setTrips(tRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const now = Date.now();
  const activeVehicles = useMemo(
    () => vehicles.filter(v => {
      if (!v.last_updated) return false;
      const diff = now - new Date(v.last_updated).getTime();
      return diff < 60 * 60 * 1000; // 1 hour
    }),
    [vehicles, now]
  );

  const otwTrips = trips.filter(t => t.status === 'OTW');
  const pendingTrips = trips.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED');
  const pendingAllowance = pendingTrips.reduce((sum, t) => sum + Number(t.allowance_given || 0), 0);
  const fleetHealthPct = vehicles.length === 0 ? 0 : Math.round((activeVehicles.length / vehicles.length) * 100);
  const driversOnDuty = new Set(otwTrips.map(t => t.driver)).size || drivers.length;

  const statusCounts = useMemo(() => {
    const base = { PLANNED: 0, OTW: 0, COMPLETED: 0, CANCELLED: 0 };
    trips.forEach(t => { base[t.status] = (base[t.status] || 0) + 1; });
    return base;
  }, [trips]);

  const recentTrips = [...trips]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const last7DaysData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayKey = date.toISOString().slice(0, 10);
      const count = trips.filter(t => t.created_at && t.created_at.startsWith(dayKey)).length;
      days.push({ label: date.toLocaleDateString(undefined, { weekday: 'short' }), count });
    }
    const max = Math.max(...days.map(d => d.count), 1);
    return { days, max };
  }, [trips]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 text-white p-3 rounded-full">
          <BarChart3 size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
          <p className="text-gray-500 text-sm">Live snapshot from vehicles, trips, and drivers.</p>
        </div>
        {loading && <span className="ml-auto text-xs text-gray-500 flex items-center gap-1"><Clock size={14}/> Refreshing...</span>}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Active Vehicles" value={activeVehicles.length} icon={Truck} color="bg-blue-500" />
        <StatCard title="Drivers on Duty" value={driversOnDuty} icon={Users} color="bg-green-500" />
        <StatCard title="Pending Allowance" value={`Rp ${pendingAllowance.toLocaleString()}`} icon={DollarSign} color="bg-yellow-500" />
        <StatCard title="Fleet Health" value={`${fleetHealthPct}%`} icon={Activity} color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Recent Trips</h3>
            <span className="text-xs text-gray-500">Latest 5</span>
          </div>
          {recentTrips.length === 0 ? (
            <p className="text-gray-400">No trips recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {recentTrips.map(trip => (
                <div key={trip.id} className="flex items-center justify-between border rounded-lg px-3 py-2">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{trip.vehicle_plate} • {trip.driver_name}</p>
                    <p className="text-xs text-gray-500">{trip.origin} → {trip.destinations?.length ? trip.destinations.join(' → ') : trip.destination}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">{trip.status}</span>
                    <p className="text-xs text-gray-500 mt-1">{trip.created_at ? new Date(trip.created_at).toLocaleString() : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2"><Target size={18}/> Trip Status</h3>
            <span className="text-xs text-gray-400">All trips</span>
          </div>
          <div className="space-y-3">
            {['PLANNED','OTW','COMPLETED','CANCELLED'].map(key => {
              const count = statusCounts[key] || 0;
              const pct = trips.length ? Math.round((count / trips.length) * 100) : 0;
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>{key}</span>
                    <span>{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded">
                    <div className="h-2 rounded bg-blue-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2"><Activity size={18}/> Trips Last 7 Days</h3>
          <span className="text-xs text-gray-500">Created per day</span>
        </div>
        <div className="flex items-end gap-3 h-48">
          {last7DaysData.days.map(day => {
            const heightPct = (day.count / last7DaysData.max) * 100;
            return (
              <div key={day.label} className="flex-1 flex flex-col items-center justify-end">
                <div className="w-full bg-blue-100 rounded-t">
                  <div
                    className="bg-blue-600 rounded-t"
                    style={{ height: `${heightPct}%`, minHeight: day.count > 0 ? '12%' : '4%' }}
                    title={`${day.count} trips`}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-2">{day.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
