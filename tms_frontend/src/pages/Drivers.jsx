import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { User, Plus, CirclePlus, X, Search, Trash2, Trash, Edit, Edit2, MapPin, Eye } from 'lucide-react';

const Drivers = () => {
  const { user } = useAuth();
  const isReadOnly = user?.is_superuser;

  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ id: null, username: '', phone: '', role: 'DRIVER', password: '' });
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

  const fetchData = async () => {
    try {
      const [driversRes, tripsRes] = await Promise.all([
          api.get('drivers/'),
          api.get('trips/')
      ]);
      setDrivers(driversRes.data);
      setTrips(tripsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        // For editing, we don't send password if it's empty
        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        await api.patch(`drivers/${formData.id}/`, payload);
      } else {
        await api.post('drivers/', formData);
      }
      setShowModal(false);
      fetchData();
      resetForm();
    } catch (error) {
      console.error("Error saving driver:", error);
      alert("Failed to save driver.");
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this driver?')) {
      try {
        await api.delete(`drivers/${id}/`);
        fetchData();
      } catch (error) {
        console.error(error);
        alert('Failed to delete.');
      }
    }
  };

  const openEdit = (driver) => {
    setFormData({ 
       id: driver.id, 
       username: driver.username, 
       phone: driver.phone, 
       role: 'DRIVER', 
       password: '' 
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ id: null, username: '', phone: '', role: 'DRIVER', password: '' });
    setIsEditing(false);
  };

  const filtered = drivers.filter(d => d.username.toLowerCase().includes(search.toLowerCase()));

  // Map drivers to active trips
  const driverTripMap = {};
  trips.forEach(t => {
      if (['PLANNED', 'OTW', 'ARRIVED'].includes(t.status) && t.driver) {
          driverTripMap[t.driver] = t;
      }
  });

  return (
    <div className="p-6 h-full flex flex-col">
       <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Driver Management</h1>
          {isReadOnly ? (
             <div className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold border border-amber-200">
                Read-Only View
             </div>
          ) : (
            <HoverButton 
                icon={Plus} 
                hoverIcon={CirclePlus} 
                onClick={() => { resetForm(); setShowModal(true); }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all"
            >
                Add Driver
            </HoverButton>
          )}
       </header>

       <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
             <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search drivers..." 
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
             </div>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Name</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Phone</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Current Status</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((d) => {
                  const activeTrip = driverTripMap[d.id];
                  return (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="p-4 font-medium text-slate-800 flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                            <User size={16} />
                         </div>
                         {d.username}
                      </td>
                      <td className="p-4 text-slate-600">{d.phone || '-'}</td>
                      <td className="p-4">
                          {activeTrip ? (
                              <div className="flex flex-col gap-1">
                                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold w-fit ${
                                      activeTrip.status === 'OTW' ? 'bg-blue-100 text-blue-700' :
                                      activeTrip.status === 'ARRIVED' ? 'bg-amber-100 text-amber-700' :
                                      'bg-slate-100 text-slate-700'
                                  }`}>
                                      {activeTrip.status}
                                  </span>
                                  <div className="text-xs text-slate-500 flex items-center gap-1">
                                      <MapPin size={10} />
                                      {activeTrip.origin} → {activeTrip.destination}
                                  </div>
                              </div>
                          ) : (
                              <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">Available</span>
                          )}
                      </td>
                      <td className="p-4 text-right space-x-2 flex justify-end">
                         {isReadOnly ? (
                             <button className="text-slate-400 hover:text-blue-600 p-1.5" title="View Details">
                                <Eye size={18} />
                             </button>
                         ) : (
                             <>
                                <HoverButton onClick={() => openEdit(d)} icon={Edit} hoverIcon={Edit2} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded transition-colors" />
                                <HoverButton onClick={() => handleDelete(d.id)} icon={Trash2} hoverIcon={Trash} className="text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors" />
                             </>
                         )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
       </div>

       {showModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">{isEditing ? 'Edit Driver' : 'New Driver'}</h3>
                  <button onClick={() => setShowModal(false)}><X size={20} className="text-slate-400"/></button>
               </div>
               <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                     <label className="block text-sm font-medium mb-1">Username (Name)</label>
                     <input required type="text" className="w-full px-3 py-2 border rounded-lg"
                        value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                  </div>
                  <div>
                     <label className="block text-sm font-medium mb-1">Phone</label>
                     <input type="text" className="w-full px-3 py-2 border rounded-lg"
                        value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                  {!isEditing && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <input required type="password" className="w-full px-3 py-2 border rounded-lg"
                            value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                      </div>
                  )}
                  <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium">Save</button>
               </form>
            </div>
         </div>
       )}
    </div>
  );
};

export default Drivers;
