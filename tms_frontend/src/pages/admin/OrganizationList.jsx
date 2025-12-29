import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Building, Plus, CirclePlus, X, Search, Trash2, Trash, Edit, Edit2, ShieldAlert, LogIn, CalendarClock } from 'lucide-react';
import RenewModal from './components/RenewModal';
import VehicleLimitModal from './components/VehicleLimitModal';

const OrganizationList = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: '', address: '', driver_limit: 0, vehicle_limit: 0 });
  const [search, setSearch] = useState('');
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [showVehicleLimitModal, setShowVehicleLimitModal] = useState(false);
  const navigate = useNavigate();
  const { impersonate } = useAuth();
  const statusColors = {
    Active: 'bg-green-100 text-green-700',
    'Expiring Soon': 'bg-amber-100 text-amber-700',
    Expired: 'bg-red-100 text-red-700',
    Suspended: 'bg-slate-200 text-slate-700',
  };

  // Helper for Hover Buttons
  const HoverButton = ({ icon: Icon, hoverIcon: HoverIcon, onClick, className, children, title }) => {
    const [isHovered, setIsHovered] = useState(false);
    const CurrentIcon = isHovered ? HoverIcon : Icon;
    return (
      <button 
        onClick={onClick} 
        onMouseEnter={() => setIsHovered(true)} 
        onMouseLeave={() => setIsHovered(false)}
        className={className}
        title={title}
      >
        <CurrentIcon size={18} className="transition-transform" />
        {children}
      </button>
    );
  };

  const getDaysRemaining = (endDate) => {
    if (!endDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(`${endDate}T00:00:00`);
    return Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
  };

  const getStatus = (org) => {
    const daysRemaining = getDaysRemaining(org.subscription_end_date);
    if (daysRemaining !== null && daysRemaining < 0) return 'Expired';
    if (org.is_active === false) return 'Suspended';
    if (daysRemaining !== null && daysRemaining <= 3) return 'Expiring Soon';
    return 'Active';
  };

  const formatExpiry = (dateStr) => {
    if (!dateStr) return 'Not set';
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', { dateStyle: 'medium' });
  };

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const response = await api.get('organizations/');
      const orgsWithStats = response.data.map(org => {
        const daysRemaining = getDaysRemaining(org.subscription_end_date);
        return {
          ...org,
          daysRemaining,
          status: getStatus(org),
          total_vehicles: org.total_vehicles ?? 0,
          owner_name: org.owner_name ?? 'Owner',
          driver_limit: org.driver_limit ?? 0,
          vehicle_limit: org.vehicle_limit ?? 0,
        };
      });
      setOrganizations(orgsWithStats);
    } catch (error) {
      console.error("Error fetching organizations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        driver_limit: Number(formData.driver_limit) || 0,
        vehicle_limit: Number(formData.vehicle_limit) || 0,
      };
      if (isEditing) {
        await api.patch(`organizations/${formData.id}/`, payload);
      } else {
        await api.post('organizations/', payload);
      }
      setShowModal(false);
      fetchOrganizations();
      resetForm();
    } catch (error) {
      console.error("Error saving organization:", error);
      alert("Failed to save organization.");
    }
  };

  const handleSuspend = async (org) => {
      const action = org.is_active === false ? 'activate' : 'suspend';
      if (!confirm(`Are you sure you want to ${action} ${org.name}?`)) return;
      const nextState = !org.is_active;
      try {
        await api.patch(`organizations/${org.id}/`, { is_active: nextState });
        fetchOrganizations();
      } catch (error) {
        console.error("Error updating organization status:", error);
        alert("Failed to update organization status.");
      }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this organization? This might affect users and data associated with it.')) {
      try {
        await api.delete(`organizations/${id}/`);
        fetchOrganizations();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const openEdit = (org) => {
    setFormData({ 
      id: org.id, 
      name: org.name || '', 
      address: org.address || '', 
      driver_limit: org.driver_limit ?? 0,
      vehicle_limit: org.vehicle_limit ?? 0,
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleImpersonate = async (org) => {
    if (!confirm(`Impersonate ${org.name}? This will switch your session.`)) return;
    try {
      await impersonate(org.id);
      navigate('/');
    } catch (error) {
      console.error("Error impersonating organization:", error);
      alert("Failed to impersonate this organization.");
    }
  };

  const openRenew = (org) => {
    setSelectedOrg(org);
    setShowRenewModal(true);
  };

  const resetForm = () => {
    setFormData({ id: null, name: '', address: '', driver_limit: 0, vehicle_limit: 0 });
    setIsEditing(false);
  };

  const filtered = organizations.filter(o => o.name.toLowerCase().includes(search.toLowerCase()));
  const formatDriverLimit = (val) => {
    if (!val || val <= 0) return 'Unlimited';
    return `${val} drivers`;
  };
  const formatVehicleLimit = (val) => {
    if (!val || val <= 0) return 'Unlimited';
    return `${val} vehicles`;
  };

  return (
    <div className="p-6 h-full flex flex-col">
       <header className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Organization Manager</h1>
            <p className="text-slate-500 text-sm">Manage SaaS Tenants and Subscriptions.</p>
          </div>
          <HoverButton 
            icon={Plus} 
            hoverIcon={CirclePlus} 
            onClick={() => { resetForm(); setShowModal(true); }} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all"
          >
            Create Tenant
          </HoverButton>
       </header>

       <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
             <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="Search tenants..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 outline-none text-sm"
                  value={search} onChange={e => setSearch(e.target.value)} />
             </div>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Company Name</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Owner</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Vehicles</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Vehicle Limit</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Driver Limit</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Subscription</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="p-6 text-center text-slate-500">Loading tenants...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-6 text-center text-slate-500">No organizations found.</td>
                  </tr>
                ) : (
                  filtered.map((org) => (
                    <tr key={org.id} className={`hover:bg-slate-50 ${org.status === 'Suspended' ? 'bg-red-50/50' : ''}`}>
                      <td className="p-4 font-medium text-slate-800 flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                            <Building size={16} />
                         </div>
                         {org.name}
                      </td>
                      <td className="p-4 text-slate-600">{org.owner_name}</td>
                      <td className="p-4 text-slate-600">{org.total_vehicles} Units</td>
                      <td className="p-4 text-slate-600">{formatVehicleLimit(org.vehicle_limit)}</td>
                      <td className="p-4 text-slate-600">{formatDriverLimit(org.driver_limit)}</td>
                      <td className="p-4">
                        <div className="font-medium text-slate-800">{formatExpiry(org.subscription_end_date)}</div>
                        <div className={`text-xs ${org.daysRemaining !== null && org.daysRemaining < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                          {org.daysRemaining === null 
                            ? 'No expiry set' 
                            : org.daysRemaining < 0 
                              ? `${Math.abs(org.daysRemaining)} day(s) past due` 
                              : `${org.daysRemaining} day(s) remaining`}
                        </div>
                      </td>
                      <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusColors[org.status] || 'bg-slate-100 text-slate-700'}`}>
                              {org.status}
                          </span>
                      </td>
                      <td className="p-4 text-right space-x-2 flex justify-end">
                         <HoverButton 
                              title="Impersonate (View Dashboard)"
                              icon={LogIn} 
                              hoverIcon={LogIn} 
                              onClick={() => handleImpersonate(org)}
                              className="text-slate-400 hover:text-slate-600 p-1.5" 
                         />
                         <HoverButton 
                              title="Renew subscription"
                              icon={CalendarClock} 
                              hoverIcon={CalendarClock} 
                              onClick={() => openRenew(org)}
                              className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded transition-colors" 
                         />
                         <HoverButton 
                              title="Increase Vehicle Limit"
                              icon={Plus}
                              hoverIcon={CirclePlus}
                              onClick={() => { setSelectedOrg(org); setShowVehicleLimitModal(true); }}
                              className="text-blue-500 hover:bg-blue-50 p-1.5 rounded transition-colors"
                         />
                         <HoverButton 
                              title={org.is_active === false ? 'Activate' : 'Suspend'}
                              icon={ShieldAlert} 
                              hoverIcon={ShieldAlert} 
                              onClick={() => handleSuspend(org)}
                              className={`${org.is_active === false ? 'text-green-500 hover:text-green-600' : 'text-amber-500 hover:text-amber-600'} p-1.5`} 
                         />
                         <HoverButton onClick={() => openEdit(org)} icon={Edit} hoverIcon={Edit2} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded transition-colors" />
                         <HoverButton onClick={() => handleDelete(org.id)} icon={Trash2} hoverIcon={Trash} className="text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
       </div>

       {showModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">{isEditing ? 'Edit Tenant' : 'New Tenant'}</h3>
                  <button onClick={() => setShowModal(false)}><X size={20} className="text-slate-400"/></button>
               </div>
               <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                     <label className="block text-sm font-medium mb-1">Company Name</label>
                     <input required type="text" className="w-full px-3 py-2 border rounded-lg"
                        value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div>
                     <label className="block text-sm font-medium mb-1">Owner Name (Admin)</label>
                     <input type="text" className="w-full px-3 py-2 border rounded-lg" placeholder="e.g., John Doe" />
                  </div>
                  <div>
                     <label className="block text-sm font-medium mb-1">Address</label>
                     <textarea className="w-full px-3 py-2 border rounded-lg" rows="3"
                        value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                  </div>
                  <div>
                     <label className="block text-sm font-medium mb-1">Driver Limit (0 = Unlimited)</label>
                     <input type="number" min="0" className="w-full px-3 py-2 border rounded-lg"
                        value={formData.driver_limit}
                        onChange={e => setFormData({...formData, driver_limit: e.target.value})} />
                  </div>
                  <div>
                     <label className="block text-sm font-medium mb-1">Vehicle Limit (0 = Unlimited)</label>
                     <input type="number" min="0" className="w-full px-3 py-2 border rounded-lg"
                        value={formData.vehicle_limit}
                        onChange={e => setFormData({...formData, vehicle_limit: e.target.value})} />
                  </div>
                  <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium">Save Tenant</button>
               </form>
            </div>
         </div>
       )}
       {showRenewModal && (
         <RenewModal 
            isOpen={showRenewModal} 
            onClose={() => { setShowRenewModal(false); setSelectedOrg(null); }} 
            organization={selectedOrg} 
            onRenew={fetchOrganizations} 
         />
       )}
       {showVehicleLimitModal && selectedOrg && (
         <VehicleLimitModal
            isOpen={showVehicleLimitModal}
            onClose={() => { setShowVehicleLimitModal(false); setSelectedOrg(null); }}
            organization={selectedOrg}
            onSaved={fetchOrganizations}
         />
       )}
    </div>
  );
};

export default OrganizationList;
