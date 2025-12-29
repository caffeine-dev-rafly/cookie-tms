import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Server, Search, Truck } from 'lucide-react';

const Infrastructure = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchVehicles = async () => {
    try {
      const response = await api.get('vehicles/');
      setVehicles(response.data);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const filtered = vehicles.filter(v => 
    v.license_plate.toLowerCase().includes(search.toLowerCase()) ||
    v.vehicle_type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 h-full flex flex-col">
       <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Infrastructure (Read Only)</h1>
       </header>

       <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
             <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="Search vehicles..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 outline-none text-sm"
                  value={search} onChange={e => setSearch(e.target.value)} />
             </div>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">License Plate</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Type</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Organization</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Odometer</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="p-4 font-medium text-slate-800 flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                          <Truck size={16} />
                       </div>
                       {v.license_plate}
                    </td>
                    <td className="p-4 text-slate-600">{v.vehicle_type}</td>
                    <td className="p-4 text-slate-600">{v.organization}</td>
                    <td className="p-4 text-slate-600">{v.current_odometer} km</td>
                    <td className="p-4 text-slate-600 text-sm">
                        {v.last_updated ? new Date(v.last_updated).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
       </div>
    </div>
  );
};

export default Infrastructure;