import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Building2, Plus, CirclePlus, X, Search, Trash2, Trash, Edit, Edit2 } from 'lucide-react';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: '', address: '', phone: '', organization: 1 });
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

  const fetchCustomers = async () => {
    try {
      const response = await api.get('customers/');
      setCustomers(response.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.patch(`customers/${formData.id}/`, formData);
      } else {
        await api.post('customers/', formData);
      }
      setShowModal(false);
      fetchCustomers();
      resetForm();
    } catch (error) {
      console.error("Error saving customer:", error);
      alert("Failed to save customer.");
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this customer?')) {
      try {
        await api.delete(`customers/${id}/`);
        fetchCustomers();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const openEdit = (customer) => {
    setFormData({ ...customer });
    setIsEditing(true);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ id: null, name: '', address: '', phone: '', organization: 1 });
    setIsEditing(false);
  };

  const filtered = customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 h-full flex flex-col">
       <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Customer Management</h1>
          <HoverButton 
            icon={Plus} 
            hoverIcon={CirclePlus} 
            onClick={() => { resetForm(); setShowModal(true); }} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all"
          >
            Add Customer
          </HoverButton>
       </header>

       <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
             <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="Search customers..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 outline-none text-sm"
                  value={search} onChange={e => setSearch(e.target.value)} />
             </div>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Name</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Address</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Phone</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="p-4 font-medium text-slate-800 flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                          <Building2 size={16} />
                       </div>
                       {c.name}
                    </td>
                    <td className="p-4 text-slate-600 max-w-xs truncate">{c.address}</td>
                    <td className="p-4 text-slate-600">{c.phone}</td>
                    <td className="p-4 text-right space-x-2 flex justify-end">
                       <HoverButton onClick={() => openEdit(c)} icon={Edit} hoverIcon={Edit2} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded transition-colors" />
                       <HoverButton onClick={() => handleDelete(c.id)} icon={Trash2} hoverIcon={Trash} className="text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
       </div>

       {showModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">{isEditing ? 'Edit Customer' : 'New Customer'}</h3>
                  <button onClick={() => setShowModal(false)}><X size={20} className="text-slate-400"/></button>
               </div>
               <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                     <label className="block text-sm font-medium mb-1">Company Name</label>
                     <input required type="text" className="w-full px-3 py-2 border rounded-lg"
                        value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div>
                     <label className="block text-sm font-medium mb-1">Address</label>
                     <textarea className="w-full px-3 py-2 border rounded-lg" rows="3"
                        value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                  </div>
                  <div>
                     <label className="block text-sm font-medium mb-1">Phone</label>
                     <input type="text" className="w-full px-3 py-2 border rounded-lg"
                        value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                  <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium">Save</button>
               </form>
            </div>
         </div>
       )}
    </div>
  );
};

export default Customers;
