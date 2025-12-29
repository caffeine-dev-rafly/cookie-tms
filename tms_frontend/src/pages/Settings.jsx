import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Building2, Save, User, Plus, X, Trash2, Edit, Edit2, Shield, CirclePlus, Trash, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { user, updateUser } = useAuth(); // Logged in user info
  const [org, setOrg] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Organization Form State
  const [orgForm, setOrgForm] = useState({ name: '', address: '' });
  const [alertForm, setAlertForm] = useState({
      stop_alert_minutes: user?.stop_alert_minutes ? String(user.stop_alert_minutes) : '5',
      offline_alert_minutes: user?.offline_alert_minutes ? String(user.offline_alert_minutes) : '10'
  });
  const [savingAlert, setSavingAlert] = useState(false);
  
  // User Modal State
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(false);
  const [userForm, setUserForm] = useState({
      id: null,
      username: '',
      phone: '',
      role: 'ADMIN',
      password: '',
      organization: 1
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

  const fetchData = async () => {
    try {
      const orgId = user?.organization_id || 1;
      if (!orgId) {
        setLoading(false);
        return;
      }

      const [orgRes, usersRes] = await Promise.all([
          api.get(`organizations/${orgId}/`),
          api.get('users/')
      ]);
      setOrg(orgRes.data);
      setOrgForm({ name: orgRes.data.name, address: orgRes.data.address });
      setUsers(usersRes.data);

      if (user?.id) {
        const meRes = await api.get(`users/${user.id}/`);
        setAlertForm({
          stop_alert_minutes: String(meRes.data?.stop_alert_minutes || 5),
          offline_alert_minutes: String(meRes.data?.offline_alert_minutes || 10)
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.id, user?.organization_id]);

  const handleOrgSave = async (e) => {
      e.preventDefault();
      try {
          await api.patch(`organizations/${org.id}/`, orgForm);
          alert('Organization updated!');
          fetchData();
      } catch (error) {
          console.error(error);
          alert('Failed to update organization.');
      }
  };

  const handleAlertSave = async (e) => {
      e.preventDefault();
      if (!user?.id) return;
      setSavingAlert(true);
      try {
          const payload = {
              stop_alert_minutes: Math.max(1, parseInt(alertForm.stop_alert_minutes, 10) || 1),
              offline_alert_minutes: Math.max(1, parseInt(alertForm.offline_alert_minutes, 10) || 1)
          };
          await api.patch(`users/${user.id}/`, payload);
          updateUser(payload);
          setAlertForm({
              stop_alert_minutes: String(payload.stop_alert_minutes),
              offline_alert_minutes: String(payload.offline_alert_minutes)
          });
          alert('Alert thresholds updated!');
      } catch (error) {
          console.error('Failed to update alert thresholds:', error);
          alert('Failed to update alert thresholds.');
      } finally {
          setSavingAlert(false);
      }
  };

  const handleUserSubmit = async (e) => {
      e.preventDefault();
      try {
          const payload = { ...userForm };
          if (editingUser && !payload.password) delete payload.password;
          
          if (editingUser) {
              await api.patch(`users/${userForm.id}/`, payload);
          } else {
              await api.post('users/', payload);
          }
          setShowUserModal(false);
          fetchData();
          resetUserForm();
      } catch (error) {
          console.error(error);
          alert('Failed to save user.');
      }
  };

  const handleDeleteUser = async (id) => {
      if (confirm('Delete this user?')) {
          try {
              await api.delete(`users/${id}/`);
              fetchData();
          } catch (error) {
              console.error(error);
          }
      }
  };

  const openEditUser = (u) => {
      setUserForm({
          id: u.id,
          username: u.username,
          phone: u.phone || '',
          role: u.role,
          password: '',
          organization: u.organization || 1
      });
      setEditingUser(true);
      setShowUserModal(true);
  };

  const resetUserForm = () => {
      setUserForm({ id: null, username: '', phone: '', role: 'ADMIN', password: '', organization: 1 });
      setEditingUser(false);
  };

  if (loading) return <div className="p-6">Loading settings...</div>;

  return (
    <div className="p-6 h-full overflow-y-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Settings & Administration</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 1. Organization Details */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                        <Building2 size={24} />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg text-slate-800">Organization Profile</h2>
                        <p className="text-sm text-slate-500">Manage your company details.</p>
                    </div>
                </div>
                
                <form onSubmit={handleOrgSave} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Company Name</label>
                        <input type="text" className="w-full px-3 py-2 border rounded-lg"
                            value={orgForm.name} onChange={e => setOrgForm({...orgForm, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Address</label>
                        <textarea rows="3" className="w-full px-3 py-2 border rounded-lg"
                            value={orgForm.address} onChange={e => setOrgForm({...orgForm, address: e.target.value})} />
                    </div>
                    <button type="submit" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                        <Save size={18} /> Save Changes
                    </button>
                </form>
            </div>

            {/* 2. User Management */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-[500px]">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Shield size={24} />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg text-slate-800">User Management</h2>
                            <p className="text-sm text-slate-500">Manage access and roles.</p>
                        </div>
                    </div>
                    <HoverButton 
                        icon={Plus} 
                        hoverIcon={CirclePlus} 
                        onClick={() => { resetUserForm(); setShowUserModal(true); }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all"
                    >
                        Add User
                    </HoverButton>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-100 sticky top-0">
                            <tr>
                                <th className="p-3 text-xs font-semibold text-slate-500 uppercase">User</th>
                                <th className="p-3 text-xs font-semibold text-slate-500 uppercase">Role</th>
                                <th className="p-3 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50 group">
                                    <td className="p-3 font-medium text-slate-800 flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-600">
                                            {u.username.charAt(0).toUpperCase()}
                                        </div>
                                        {u.username}
                                    </td>
                                    <td className="p-3">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                            u.role === 'OWNER' ? 'bg-purple-100 text-purple-700' :
                                            u.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' :
                                            'bg-slate-100 text-slate-600'
                                        }`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right space-x-1">
                                        <button onClick={() => openEditUser(u)} className="text-blue-600 hover:bg-blue-100 p-1 rounded"><Edit2 size={14}/></button>
                                        <button onClick={() => handleDeleteUser(u.id)} className="text-red-600 hover:bg-red-100 p-1 rounded"><Trash size={14}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
        </div>
        </div>

        <div className="mt-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-3xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg text-slate-800">Alert thresholds</h2>
                        <p className="text-sm text-slate-500">Choose how long a vehicle can stay idle or offline before you are notified.</p>
                    </div>
                </div>
                <form onSubmit={handleAlertSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Stopped vehicle (minutes)</label>
                        <input
                            type="number"
                            min="1"
                            className="w-full px-3 py-2 border rounded-lg"
                            value={alertForm.stop_alert_minutes}
                            onChange={e => setAlertForm(prev => ({ ...prev, stop_alert_minutes: e.target.value }))}
                        />
                        <p className="text-xs text-slate-400 mt-1">Alert when assigned trucks stop longer than this window.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">GPS offline (minutes)</label>
                        <input
                            type="number"
                            min="1"
                            className="w-full px-3 py-2 border rounded-lg"
                            value={alertForm.offline_alert_minutes}
                            onChange={e => setAlertForm(prev => ({ ...prev, offline_alert_minutes: e.target.value }))}
                        />
                        <p className="text-xs text-slate-400 mt-1">Alert when we stop receiving data from the device.</p>
                    </div>
                    <div className="md:col-span-2 flex justify-end">
                        <button
                            type="submit"
                            disabled={savingAlert}
                            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            <Save size={18} />
                            {savingAlert ? 'Saving...' : 'Save thresholds'}
                        </button>
                    </div>
                </form>
            </div>
        </div>

        {/* User Modal */}
        {showUserModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg">{editingUser ? 'Edit User' : 'Add New User'}</h3>
                        <button onClick={() => setShowUserModal(false)}><X size={20} className="text-slate-400"/></button>
                    </div>
                    <form onSubmit={handleUserSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Username</label>
                            <input required type="text" className="w-full px-3 py-2 border rounded-lg"
                                value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Phone</label>
                            <input type="text" className="w-full px-3 py-2 border rounded-lg"
                                value={userForm.phone} onChange={e => setUserForm({...userForm, phone: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Role</label>
                            <select className="w-full px-3 py-2 border rounded-lg bg-white"
                                value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}>
                                <option value="ADMIN">Admin</option>
                                <option value="OWNER">Owner</option>
                                <option value="DRIVER">Driver</option>
                            </select>
                        </div>
                        {!editingUser && (
                            <div>
                                <label className="block text-sm font-medium mb-1">Password</label>
                                <input required type="password" className="w-full px-3 py-2 border rounded-lg"
                                    value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} />
                            </div>
                        )}
                        <button type="submit" className="w-full py-2 bg-indigo-600 text-white rounded-lg font-medium">Save User</button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default Settings;
