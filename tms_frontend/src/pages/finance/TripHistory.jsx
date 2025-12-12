import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Clock, History as HistoryIcon, MapPin, RefreshCw, Search, Truck, User, FileText } from 'lucide-react';

const TripHistory = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:8000/api/trips/');
      setTrips(res.data);
    } catch (error) {
      console.error('Error fetching trips history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const filteredTrips = useMemo(() => {
    return trips.filter(t => {
      const text = `${t.vehicle_plate || ''} ${t.driver_name || ''} ${t.origin || ''} ${t.destination || ''} ${t.surat_jalan_number || ''}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' ? true : t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [trips, search, statusFilter]);

  const statusPill = (status) => {
    const map = {
      PLANNED: 'bg-blue-100 text-blue-700',
      OTW: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-700',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  };

  const formatRoute = (trip) => {
    if (trip.destinations && trip.destinations.length) {
      return `${trip.origin} -> ${trip.destinations.join(' -> ')}`;
    }
    return `${trip.origin} -> ${trip.destination}`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 text-white p-3 rounded-full">
            <HistoryIcon size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">History Trip Departure</h1>
            <p className="text-gray-500">All trip departures with Surat Jalan and status.</p>
          </div>
        </div>
        <button
          onClick={fetchTrips}
          className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-3 items-center">
        <div className="relative w-full md:w-1/2">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by plate, driver, route, or surat jalan..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Status:</span>
          {['ALL', 'PLANNED', 'OTW', 'COMPLETED', 'CANCELLED'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`text-xs px-3 py-1 rounded-full border ${statusFilter === st ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'}`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-6 bg-gray-50 text-xs font-semibold uppercase text-gray-500 px-4 py-3">
          <div className="col-span-2">Route</div>
          <div>Vehicle / Driver</div>
          <div>Status</div>
          <div>Surat Jalan</div>
          <div className="text-right">Allowance</div>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-500 text-sm">Loading trips...</div>
        ) : filteredTrips.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">No trips found.</div>
        ) : (
          filteredTrips.map(trip => (
            <div key={trip.id} className="grid grid-cols-6 px-4 py-3 border-t border-gray-100 text-sm items-center">
              <div className="col-span-2">
                <div className="flex items-center gap-2 text-gray-800 font-medium">
                  <MapPin size={14} className="text-gray-400" />
                  {formatRoute(trip)}
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <Clock size={12} /> {trip.created_at ? new Date(trip.created_at).toLocaleString() : '—'}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-gray-800 font-semibold">
                  <Truck size={14} className="text-gray-400" />
                  {trip.vehicle_plate || '—'}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                  <User size={12} className="text-gray-400" />
                  {trip.driver_name || '—'}
                </div>
              </div>
              <div>
                <span className={`text-xs px-2 py-1 rounded-full ${statusPill(trip.status)}`}>
                  {trip.status}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-800">
                <FileText size={14} className="text-gray-400" />
                <span className="font-mono text-sm">{trip.surat_jalan_number || '—'}</span>
              </div>
              <div className="text-right font-mono text-gray-800">
                Rp {parseInt(trip.allowance_given || 0, 10).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TripHistory;
