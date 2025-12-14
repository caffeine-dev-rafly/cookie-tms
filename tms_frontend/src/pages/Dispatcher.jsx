import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Send, CheckSquare, Square, Truck, MapPin, Calendar, Search } from 'lucide-react';

const Dispatcher = () => {
  const [plannedTrips, setPlannedTrips] = useState([]);
  const [selectedTrips, setSelectedTrips] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);

  const fetchPlannedTrips = async () => {
    setLoading(true);
    try {
      const response = await api.get('trips/');
      // Filter only PLANNED trips
      const planned = response.data.filter(t => t.status === 'PLANNED');
      setPlannedTrips(planned);
      setSelectedTrips(new Set()); // Reset selection on refresh
    } catch (error) {
      console.error("Error fetching trips:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlannedTrips();
  }, []);

  const toggleSelect = (id) => {
    const newSelected = new Set(selectedTrips);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTrips(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedTrips.size === filteredTrips.length) {
      setSelectedTrips(new Set());
    } else {
      setSelectedTrips(new Set(filteredTrips.map(t => t.id)));
    }
  };

  const handleDispatch = async () => {
    if (selectedTrips.size === 0) return;
    
    if (!confirm(`Are you sure you want to dispatch ${selectedTrips.size} trips? Drivers will be notified.`)) {
      return;
    }

    setIsDispatching(true);
    try {
      // Process requests in parallel
      const updatePromises = Array.from(selectedTrips).map(id => 
        api.patch(`trips/${id}/`, { status: 'OTW' })
      );
      
      await Promise.all(updatePromises);
      
      // Refresh list
      await fetchPlannedTrips();
      alert('Trips dispatched successfully!');
    } catch (error) {
      console.error("Error dispatching trips:", error);
      alert("Failed to dispatch some trips. Please try again.");
    } finally {
      setIsDispatching(false);
    }
  };

  const filteredTrips = plannedTrips.filter(t => 
    t.surat_jalan_number?.toLowerCase().includes(search.toLowerCase()) ||
    t.driver_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.origin?.toLowerCase().includes(search.toLowerCase())
  );

  const isAllSelected = filteredTrips.length > 0 && selectedTrips.size === filteredTrips.length;

  return (
    <div className="p-6 h-full flex flex-col">
      <header className="flex justify-between items-center mb-6">
        <div>
           <h1 className="text-2xl font-bold text-slate-800">Dispatcher Control</h1>
           <p className="text-slate-500 text-sm">Review and dispatch planned trips to drivers</p>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="text-sm font-medium text-slate-600">
                {selectedTrips.size} selected
            </div>
            <button 
                onClick={handleDispatch}
                disabled={selectedTrips.size === 0 || isDispatching}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all font-bold"
            >
                {isDispatching ? 'Dispatching...' : 'Dispatch Selected'}
                <Send size={18} />
            </button>
        </div>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search by SJ Number, Driver, or Origin..." 
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 outline-none text-sm focus:border-blue-500 transition-colors"
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                />
            </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
             <div className="flex items-center justify-center h-full text-slate-400">Loading trips...</div>
          ) : filteredTrips.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-slate-400">
                 <Truck size={48} className="mb-4 opacity-20" />
                 <p>No planned trips found ready for dispatch.</p>
             </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="p-4 w-12 text-center">
                    <button onClick={toggleSelectAll} className="text-slate-500 hover:text-blue-600">
                        {isAllSelected ? <CheckSquare size={20} className="text-blue-600" /> : <Square size={20} />}
                    </button>
                  </th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">SJ Number</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Driver / Vehicle</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Route Details</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Date Planned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTrips.map((t) => {
                  const isSelected = selectedTrips.has(t.id);
                  return (
                    <tr 
                        key={t.id} 
                        className={`hover:bg-slate-50 transition-colors cursor-pointer ${isSelected ? 'bg-blue-50/60' : ''}`}
                        onClick={() => toggleSelect(t.id)}
                    >
                      <td className="p-4 text-center">
                        <button className="text-slate-400">
                            {isSelected ? <CheckSquare size={20} className="text-blue-600" /> : <Square size={20} />}
                        </button>
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-700">
                        {t.surat_jalan_number || 'Pending'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                <Truck size={14} />
                            </div>
                            <div>
                                <div className="font-medium text-slate-800">{t.driver_name || 'No Driver'}</div>
                                <div className="text-xs text-slate-500">{t.vehicle_plate || 'No Vehicle'}</div>
                            </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col text-sm">
                            <div className="flex items-center gap-2 text-slate-600">
                                <span className="w-16 text-xs font-bold text-slate-400 uppercase">From</span>
                                <span>{t.origin}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-800 font-medium">
                                <span className="w-16 text-xs font-bold text-slate-400 uppercase">To</span>
                                <span>{t.destination}</span>
                            </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-500">
                         <div className="flex items-center gap-2">
                             <Calendar size={14} />
                             {new Date(t.created_at).toLocaleDateString()}
                         </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dispatcher;
