import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { User, Lock, Save, AlertCircle, CheckCircle } from 'lucide-react';

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        username: user.username || ''
      }));
      // Fetch fresh data
      fetchUserData();
    }
  }, [user?.id]);

  const fetchUserData = async () => {
    try {
      const response = await api.get(`users/${user.id}/`);
      setFormData(prev => ({
        ...prev,
        first_name: response.data.first_name || '',
        last_name: response.data.last_name || '',
        username: response.data.username || ''
      }));
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    
    if (formData.password && formData.password !== formData.confirm_password) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      const response = await api.patch(`users/${user.id}/`, payload);
      
      // Update context: Map backend 'computed_role' to frontend 'role'
      const updatedUser = {
        ...response.data,
        role: response.data.computed_role || response.data.role 
      };
      
      updateUser(updatedUser);
      
      setMessage({ type: 'success', text: 'Profile updated successfully' });
      setFormData(prev => ({ ...prev, password: '', confirm_password: '' }));
      
    } catch (error) {
      console.error("Update failed:", error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to update profile. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Profile Settings</h1>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-2xl font-bold text-white">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">{user?.username}</h2>
              <p className="text-slate-500 text-sm capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="text-red-600 hover:text-red-700 font-medium text-sm px-4 py-2 hover:bg-red-50 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {message.text && (
            <div className={`p-4 rounded-lg flex items-center gap-2 ${
              message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
            }`}>
              {message.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full rounded-lg border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full rounded-lg border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <h3 className="text-md font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Lock size={18} className="text-slate-400" />
              Change Password
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full rounded-lg border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Leave blank to keep current password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  className="w-full rounded-lg border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Confirm new password"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
