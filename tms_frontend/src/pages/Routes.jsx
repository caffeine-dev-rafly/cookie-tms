import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Route as RouteIcon, Plus, CirclePlus, X, Search, Trash2, Trash, Edit, Edit2 } from 'lucide-react';

const Routes = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ 
    id: null, 
    origin: '', 
    destination: '', 
    standard_distance_km: 0, 
    standard_fuel_liters: 0, 
    standard_revenue: 0,
    organization: 1 
  });
  const [search, setSearch] = useState('');

  // Helper for Hover Buttons
  const HoverButton = ({ icon: Icon, hoverIcon: HoverIcon, onClick, className, children }) => {
    const [isHovered, setIsHovered] = useState(false);
    const CurrentIcon = isHovered ? HoverIcon : Icon;
    return (
      <button 
        onClick={onClick} 
        onMouseEnter={() => setIsHovered(true)} 
        onMouseLeave={() => setIsHovered(false)}
        className={className}
      >
        <CurrentIcon size={18} className="transition-transform" />
        {children}
      </button>
    );
  };

  const fetchRoutes = async () => {
    try {
      const response = await api.get('routes/');
      setRoutes(response.data);
    } catch (error) {
      console.error("Error fetching routes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.patch(`routes/${formData.id}/`, formData);
      } else {
        await api.post('routes/', formData);
      }
      setShowModal(false);
      fetchRoutes();
      resetForm();
    } catch (error) {
      console.error("Error saving route:", error);
      alert("Failed to save route.");
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this route?')) {
      try {
        await api.delete(`routes/${id}/`);
        fetchRoutes();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const openEdit = (route) => {
    setFormData({ ...route });
    setIsEditing(true);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ 
      id: null, origin: '', destination: '', 
      standard_distance_km: 0, standard_fuel_liters: 0, standard_revenue: 0,
      organization: 1 
    });
    setIsEditing(false);
  };

  const filtered = routes.filter(r => 
    r.origin.toLowerCase().includes(search.toLowerCase()) || 
    r.destination.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 h-full flex flex-col">
       <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Route Management</h1>
          <HoverButton 
            icon={Plus} 
            hoverIcon={CirclePlus} 
            onClick={() => { resetForm(); setShowModal(true); }} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm group transition-all"
          >
            Add Route
          </HoverButton>
       </header>

       <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
             <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="Search routes..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 outline-none text-sm"
                  value={search} onChange={e => setSearch(e.target.value)} />
             </div>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Origin</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Destination</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Distance (KM)</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Fuel (L)</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Std. Revenue</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="p-4 font-medium text-slate-800">{r.origin}</td>
                    <td className="p-4 font-medium text-slate-800">{r.destination}</td>
                    <td className="p-4 text-slate-600">{r.standard_distance_km}</td>
                    <td className="p-4 text-slate-600">{r.standard_fuel_liters}</td>
                    <td className="p-4 font-mono text-slate-800 font-medium">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(r.standard_revenue || 0)}
                    </td>
                    <td className="p-4 text-right space-x-2 flex justify-end">
                       <HoverButton onClick={() => openEdit(r)} icon={Edit} hoverIcon={Edit2} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded transition-colors" />
                       <HoverButton onClick={() => handleDelete(r.id)} icon={Trash2} hoverIcon={Trash} className="text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
       </div>

       {showModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">{isEditing ? 'Edit Route' : 'New Route'}</h3>
                  <button onClick={() => setShowModal(false)}><X size={20} className="text-slate-400 hover:text-red-500 transition-colors"/></button>
               </div>
               <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium mb-1">Origin</label>
                        <input required type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.origin} onChange={e => setFormData({...formData, origin: e.target.value})} />
                     </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">Destination</label>
                        <input required type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value})} />
                     </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                     <div>
                        <label className="block text-sm font-medium mb-1">Dist (KM)</label>
                        <input required type="number" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.standard_distance_km} onChange={e => setFormData({...formData, standard_distance_km: e.target.value})} />
                     </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">Fuel (L)</label>
                        <input required type="number" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.standard_fuel_liters} onChange={e => setFormData({...formData, standard_fuel_liters: e.target.value})} />
                     </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">Price (IDR)</label>
                        <input required type="number" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.standard_revenue} onChange={e => setFormData({...formData, standard_revenue: e.target.value})} />
                     </div>
                  </div>
                  <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md">
                      Save Route
                  </button>
               </form>
            </div>
         </div>
       )}
    </div>
  );
};

export default Routes;