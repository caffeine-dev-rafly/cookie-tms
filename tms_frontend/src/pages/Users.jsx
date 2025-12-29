import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Users as UsersIcon, Search, User, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [form, setForm] = useState({ username: '', password: '', role: 'ADMIN', organization: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { user: authUser } = useAuth();

  const isSuperAdmin = authUser?.role === 'super_admin';
  const isOwner = authUser?.role === 'owner';

  const fetchUsers = async () => {
    try {
      const response = await api.get('users/');
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (isSuperAdmin) {
      api.get('organizations/').then(res => setOrganizations(res.data)).catch(err => console.error('Error fetching orgs', err));
    } else if (isOwner) {
      setForm((prev) => ({ ...prev, organization: authUser?.organization_id || '' }));
    }
  }, [isSuperAdmin, isOwner, authUser?.organization_id]);

  const resetForm = () => {
    setForm({ username: '', password: '', role: 'ADMIN', organization: authUser?.organization_id || '' });
    setError('');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const payload = {
      username: form.username,
      password: form.password,
      role: form.role,
      organization: isSuperAdmin ? form.organization : authUser?.organization_id,
    };

    if (!payload.username || !payload.password) {
      setError('Username and password are required.');
      setSubmitting(false);
      return;
    }

    if (isSuperAdmin && !payload.organization) {
      setError('Select an organization for the new user.');
      setSubmitting(false);
      return;
    }

    try {
      await api.post('users/', payload);
      resetForm();
      fetchUsers();
    } catch (err) {
      console.error('Error creating user:', err);
      const detail = err.response?.data;
      setError(typeof detail === 'string' ? detail : 'Failed to create user.');
    } finally {
      setSubmitting(false);
    }
  };

  const roleLabel = (role) => {
    switch (role) {
      case 'OWNER': return 'Owner';
      case 'ADMIN': return 'Staff';
      case 'FINANCE': return 'Finance';
      case 'DRIVER': return 'Driver';
      default: return role;
    }
  };

  const filtered = users.filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    (u.email && u.email.toLowerCase().includes(search.toLowerCase()))
  );

  if (!isSuperAdmin && !isOwner) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="text-slate-700 font-semibold">Access restricted to owners and super admins.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col">
       <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
       </header>

       {(isSuperAdmin || isOwner) && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Plus size={18} />
            </div>
            <div>
              <div className="font-semibold text-slate-800">Add User</div>
              <div className="text-sm text-slate-500">Owners can add staff/finance/driver for their organization.</div>
            </div>
          </div>

          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Username"
              className="px-3 py-2 border rounded-lg"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="px-3 py-2 border rounded-lg"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <select
              className="px-3 py-2 border rounded-lg"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              {!isOwner && <option value="OWNER">Owner</option>}
              <option value="ADMIN">Staff</option>
              <option value="FINANCE">Finance</option>
              <option value="DRIVER">Driver</option>
            </select>
            {isSuperAdmin ? (
              <select
                className="px-3 py-2 border rounded-lg"
                value={form.organization}
                onChange={(e) => setForm({ ...form, organization: e.target.value })}
              >
                <option value="">Select Organization</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            ) : (
              <div className="px-3 py-2 border rounded-lg bg-slate-50 text-slate-700">
                Org ID: {authUser?.organization_id || '-'}
              </div>
            )}

            {error && (
              <div className="md:col-span-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div className="md:col-span-4 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
              >
                {submitting ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
       )}

       <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
             <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="Search users..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 outline-none text-sm"
                  value={search} onChange={e => setSearch(e.target.value)} />
             </div>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Username</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Role</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Organization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="p-4 font-medium text-slate-800 flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                          <User size={16} />
                       </div>
                       {u.username}
                    </td>
                    <td className="p-4 text-slate-600 capitalize">{roleLabel(u.role)}</td>
                    <td className="p-4 text-slate-600">{u.organization}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
       </div>
    </div>
  );
};

export default Users;
