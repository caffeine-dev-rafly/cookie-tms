import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Truck, CarFront, Plus, CirclePlus, X, Search, Filter, Edit, Edit2, Trash2, Trash } from 'lucide-react';

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    license_plate: '',
    vehicle_type: '',
    gps_device_id: '',
    organization: 1 // Default
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.patch(`vehicles/${formData.id}/`, formData);
      } else {
        await api.post('vehicles/', formData);
      }
      setShowModal(false);
      fetchVehicles();
      resetForm();
    } catch (error) {
      console.error("Error saving vehicle:", error);
      alert("Failed to save vehicle. Check inputs.");
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this vehicle?')) {
      try {
        await api.delete(`vehicles/${id}/`);
        fetchVehicles();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const openEdit = (vehicle) => {
    setFormData({
        id: vehicle.id,
        license_plate: vehicle.license_plate,
        vehicle_type: vehicle.vehicle_type,
        gps_device_id: vehicle.gps_device_id || '',
        organization: vehicle.organization
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ id: null, license_plate: '', vehicle_type: '', gps_device_id: '', organization: 1 });
    setIsEditing(false);
  };

  return (
    <div className="p-6 h-full flex flex-col">
       <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Fleet Management</h1>
            <p className="text-slate-500 text-sm">Manage your vehicle inventory and devices.</p>
          </div>
          <HoverButton 
            icon={Plus} 
            hoverIcon={CirclePlus} 
            onClick={() => { resetForm(); setShowModal(true); }} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            Add Vehicle
          </HoverButton>
       </header>

       {/* Content */}
       <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-100 flex gap-4 bg-slate-50/50">
             <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search by plate..." 
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
             </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vehicle</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">GPS Device</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Odometer</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Update</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="7" className="p-8 text-center text-slate-500">Loading...</td></tr>
                ) : (
                  vehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                               <Truck size={20} />
                            </div>
                            <span className="font-semibold text-slate-800">{v.license_plate}</span>
                         </div>
                      </td>
                      <td className="p-4 text-sm text-slate-600">{v.vehicle_type}</td>
                      <td className="p-4 text-sm text-slate-500 font-mono">{v.gps_device_id || '-'}</td>
                      <td className="p-4">
                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              v.computed_status === 'MOVING' ? 'bg-green-100 text-green-800' : 
                              v.computed_status === 'IDLE' ? 'bg-yellow-100 text-yellow-800' : 'bg-slate-100 text-slate-800'
                         }`}>
                           {v.computed_status}
                         </span>
                      </td>
                      <td className="p-4 text-sm text-slate-600">{v.current_odometer.toLocaleString()} km</td>
                      <td className="p-4 text-sm text-slate-500">
                         {v.last_updated ? new Date(v.last_updated).toLocaleString() : 'Never'}
                      </td>
                      <td className="p-4 text-right space-x-2 flex justify-end">
                         <HoverButton onClick={() => openEdit(v)} icon={Edit} hoverIcon={Edit2} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded transition-colors" />
                         <HoverButton onClick={() => handleDelete(v.id)} icon={Trash2} hoverIcon={Trash} className="text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
       </div>

       {/* Add/Edit Modal */}
       {showModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
               <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold text-lg text-slate-800">{isEditing ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                     <X size={20} />
                  </button>
               </div>
               <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">License Plate</label>
                     <input 
                        required 
                        type="text" 
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.license_plate}
                        onChange={e => setFormData({...formData, license_plate: e.target.value})}
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Type</label>
                     <select 
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.vehicle_type}
                        onChange={e => setFormData({...formData, vehicle_type: e.target.value})}
                     >
                        <option value="">Select Type...</option>
                        <option value="Wingbox">Wingbox</option>
                        <option value="CDD Box">CDD Box</option>
                        <option value="Trailer">Trailer</option>
                        <option value="Blindvan">Blindvan</option>
                     </select>
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">GPS Device ID (Traccar)</label>
                     <input 
                        type="text" 
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Optional"
                        value={formData.gps_device_id}
                        onChange={e => setFormData({...formData, gps_device_id: e.target.value})}
                     />
                  </div>
                  
                  <div className="pt-4 flex gap-3">
                     <button 
                       type="button" 
                       onClick={() => setShowModal(false)}
                       className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
                     >
                        Cancel
                     </button>
                     <button 
                       type="submit" 
                       className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm"
                     >
                        {isEditing ? 'Save Changes' : 'Create Vehicle'}
                     </button>
                  </div>
               </form>
            </div>
         </div>
       )}
    </div>
  );
};

export default Vehicles;
