import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Search, Truck, MapPin } from 'lucide-react';

const HISTORY_STATUSES = new Set(['COMPLETED', 'SETTLED', 'CANCELLED']);

const TripHistory = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const toId = (value) => (value && typeof value === 'object' ? value.id : value);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const response = await api.get('trips/');
      const allTrips = Array.isArray(response.data) ? response.data : response.data?.results || [];

      const myTrips = allTrips.filter((t) => {
        const driverId = user?.id;
        const tripDriverId = toId(t.driver);
        if (driverId) return tripDriverId === driverId;
        return t.driver_name === user?.username || t.driverName === user?.username;
      });

      const historyTrips = myTrips
        .filter((t) => HISTORY_STATUSES.has(t.status))
        .sort((a, b) => {
          const aDate = new Date(a.completed_at || a.created_at || 0).getTime();
          const bDate = new Date(b.completed_at || b.created_at || 0).getTime();
          return bDate - aDate;
        });

      setTrips(historyTrips);
    } catch (error) {
      console.error('Error fetching trip history:', error);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [user]);

  const filteredTrips = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return trips;
    return trips.filter((t) => {
      const sj = (t.surat_jalan_number || '').toLowerCase();
      const origin = (t.origin || '').toLowerCase();
      const destination = (t.destination || '').toLowerCase();
      return sj.includes(q) || origin.includes(q) || destination.includes(q);
    });
  }, [trips, search]);

  const formatCustomerLabel = (trip) => (
    Array.isArray(trip.customer_names) && trip.customer_names.length
      ? trip.customer_names.join(', ')
      : (trip.customer_name || 'Walk-in customer')
  );

  if (loading) return <div className="p-6 text-center text-slate-500">Loading trip history...</div>;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">History</h1>
          <p className="text-slate-500 text-sm">Completed and past trips</p>
        </div>
        <div className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium">
          {trips.length} trip(s)
        </div>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search SJ number, origin, destination..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 outline-none text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredTrips.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <Truck className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <h3 className="text-lg font-medium text-slate-600">No history yet</h3>
            <p className="text-slate-400 text-sm">Completed trips will appear here.</p>
          </div>
        ) : (
          filteredTrips.map((trip) => (
            <div key={trip.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-slate-700">{trip.surat_jalan_number || 'PENDING'}</span>
                  <StatusBadge status={trip.status} />
                </div>
                <div className="text-sm text-slate-500 flex items-center gap-1">
                  <Calendar size={14} />
                  {new Date(trip.completed_at || trip.created_at || Date.now()).toLocaleDateString()}
                </div>
              </div>

              <div className="p-6 space-y-3">
                <div className="text-sm text-slate-700">
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="text-slate-400 mt-0.5" />
                    <div>
                      <div className="font-semibold text-slate-800">
                        {trip.origin || '-'} <span className="text-slate-400">→</span> {trip.destination || '-'}
                      </div>
                      {trip.vehicle_plate && (
                        <div className="text-xs text-slate-500 mt-1">Vehicle: {trip.vehicle_plate}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-500 flex items-center justify-between pt-3 border-t border-slate-100">
                  <div>
                    Drops: {trip.completed_destinations?.length || 0} / {trip.destinations?.length || 1}
                  </div>
                  <div className="capitalize">{formatCustomerLabel(trip)}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    PLANNED: 'bg-slate-100 text-slate-600',
    OTW: 'bg-blue-100 text-blue-700',
    ARRIVED: 'bg-amber-100 text-amber-700',
    COMPLETED: 'bg-green-100 text-green-700',
    SETTLED: 'bg-emerald-100 text-emerald-800',
    CANCELLED: 'bg-red-100 text-red-700',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${styles[status] || styles.PLANNED}`}>
      {status}
    </span>
  );
};

export default TripHistory;
