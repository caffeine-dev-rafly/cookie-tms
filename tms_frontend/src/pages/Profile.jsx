import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Shield, Truck, AlertCircle } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();

  // Mock data for compliance since backend might not have it all yet
  const licenseExpiry = "2025-12-01"; 
  const isExpiringSoon = false;

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">My Profile</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="bg-blue-600 p-6 flex flex-col items-center text-white">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold mb-3 backdrop-blur-sm">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-xl font-bold">{user.username}</h2>
          <p className="text-blue-100">Professional Driver</p>
        </div>
        
        <div className="p-6 space-y-6">
          {/* License Info */}
          <div className="flex items-start gap-4">
            <div className="p-3 bg-slate-100 rounded-xl text-slate-600">
              <Shield size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-bold uppercase mb-1">Driving License (SIM)</p>
              <p className="font-mono text-lg font-medium text-slate-800">B2-94829102</p>
              <div className={`mt-2 inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${isExpiringSoon ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {isExpiringSoon && <AlertCircle size={12}/>}
                Expires: {licenseExpiry}
              </div>
            </div>
          </div>

          <hr className="border-slate-100"/>

          {/* Vehicle Info */}
          <div className="flex items-start gap-4">
            <div className="p-3 bg-slate-100 rounded-xl text-slate-600">
              <Truck size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-bold uppercase mb-1">Assigned Vehicle</p>
              <p className="font-medium text-slate-800">Hino Dutro 300</p>
              <p className="text-slate-500">B 9283 XT</p>
            </div>
          </div>
        </div>
      </div>

      <button className="w-full py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-bold transition-colors">
        Log Out
      </button>
    </div>
  );
};

export default Profile;