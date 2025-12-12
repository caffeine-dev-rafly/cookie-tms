import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { ClipboardCheck, MapPin, Truck, User, FileText, CheckCircle, RefreshCw } from 'lucide-react';
import SearchableSelect from '../components/SearchableSelect';

const DriverTasks = () => {
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dRes, tRes] = await Promise.all([
        axios.get('http://localhost:8000/api/drivers/'),
        axios.get('http://localhost:8000/api/trips/')
      ]);
      setDrivers(dRes.data);
      setTrips(tRes.data);
      if (!selectedDriver && dRes.data.length > 0) {
        setSelectedDriver(dRes.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching driver tasks data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const driverOptions = drivers.map(d => ({
    value: d.id,
    label: d.username,
  }));

  const filteredTrips = useMemo(() => {
    if (!selectedDriver) return [];
    return trips.filter(t => t.driver === Number(selectedDriver) && t.status !== 'CANCELLED');
  }, [trips, selectedDriver]);

  const updateTripInState = (updatedTrip) => {
    setTrips(prev => prev.map(t => t.id === updatedTrip.id ? updatedTrip : t));
  };

  const startTrip = async (trip) => {
    setActionLoading(`start-${trip.id}`);
    try {
      const res = await axios.patch(`http://localhost:8000/api/trips/${trip.id}/`, { status: 'OTW' });
      updateTripInState(res.data);
    } catch (error) {
      console.error('Failed to start trip', error);
      alert('Failed to start trip. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const markArrival = async (trip, destination) => {
    setActionLoading(`arrive-${trip.id}-${destination}`);
    try {
      const res = await axios.post(`http://localhost:8000/api/trips/${trip.id}/arrive/`, { destination });
      updateTripInState(res.data);
    } catch (error) {
      console.error('Failed to mark arrival', error);
      alert(error.response?.data?.error || 'Failed to mark arrival.');
    } finally {
      setActionLoading(null);
    }
  };

  const completeTrip = async (trip) => {
    const allDest = trip.destinations?.length ? trip.destinations : [trip.destination].filter(Boolean);
    setActionLoading(`complete-${trip.id}`);
    try {
      const res = await axios.patch(`http://localhost:8000/api/trips/${trip.id}/`, { 
        status: 'COMPLETED',
        completed_destinations: allDest,
      });
      updateTripInState(res.data);
    } catch (error) {
      console.error('Failed to complete trip', error);
      alert('Failed to complete trip.');
    } finally {
      setActionLoading(null);
    }
  };

  const renderDestinations = (trip) => {
    const list = trip.destinations?.length ? trip.destinations : [trip.destination].filter(Boolean);
    const completed = new Set(trip.completed_destinations || []);
    return (
      <div className="space-y-2">
        {list.map(dest => (
          <div key={dest} className="flex items-center justify-between border rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-gray-400" />
              <div>
                <p className="text-sm font-semibold text-gray-800">{dest}</p>
                <p className="text-xs text-gray-500">{completed.has(dest) ? 'Arrived' : 'Pending'}</p>
              </div>
            </div>
            {completed.has(dest) ? (
              <span className="text-green-600 text-xs font-semibold flex items-center gap-1">
                <CheckCircle size={14}/> Done
              </span>
            ) : (
              <button
                onClick={() => markArrival(trip, dest)}
                disabled={!!actionLoading}
                className="text-xs px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Mark Arrived
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-600 text-white p-3 rounded-full">
          <ClipboardCheck size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Driver Tasks</h1>
          <p className="text-gray-500 text-sm">View Surat Jalan, tasks, and confirm drop points.</p>
        </div>
        <button
          onClick={fetchData}
          className="ml-auto inline-flex items-center gap-2 text-sm px-3 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''}/>
          Refresh
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Driver</label>
        <div className="max-w-md">
          <SearchableSelect 
            options={driverOptions}
            value={selectedDriver}
            onChange={setSelectedDriver}
            placeholder="Pick driver"
            icon={User}
          />
        </div>
      </div>

      {selectedDriver && filteredTrips.length === 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm text-center text-gray-500">
          No active trips for this driver.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTrips.map(trip => {
          const allDest = trip.destinations?.length ? trip.destinations : [trip.destination].filter(Boolean);
          const completed = trip.completed_destinations || [];
          const allDone = allDest.length > 0 && completed.length >= allDest.length;
          return (
            <div key={trip.id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase text-gray-400">Surat Jalan</p>
                  <p className="font-mono font-bold text-lg">{trip.surat_jalan_number || '—'}</p>
                  <p className="text-sm text-gray-600 mt-1">{trip.origin} → {allDest.join(' → ')}</p>
                  <p className="text-xs text-gray-500 mt-1">Cargo: {trip.cargo_type || '—'}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">{trip.status}</span>
                  <div className="text-xs text-gray-500 mt-1">
                    Allowance: Rp {parseInt(trip.allowance_given || 0, 10).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Truck size={14} className="text-gray-400"/> {trip.vehicle_plate}
                </div>
                <div className="flex items-center gap-1">
                  <User size={14} className="text-gray-400"/> {trip.driver_name}
                </div>
              </div>

              <div>
                <p className="font-semibold text-sm mb-2">Drop Points</p>
                {renderDestinations(trip)}
              </div>

              <div className="flex gap-2 justify-end">
                {trip.status === 'PLANNED' && (
                  <button
                    onClick={() => startTrip(trip)}
                    disabled={!!actionLoading}
                    className="px-3 py-2 text-sm bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:opacity-50"
                  >
                    Start Trip
                  </button>
                )}
                <button
                  onClick={() => completeTrip(trip)}
                  disabled={!!actionLoading || (trip.status === 'COMPLETED')}
                  className="px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {allDone || trip.status === 'COMPLETED' ? 'Mark Completed' : 'Complete Trip'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DriverTasks;
