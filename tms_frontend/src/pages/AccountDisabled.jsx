import React from 'react';
import { ShieldAlert, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AccountDisabled = () => {
  const navigate = useNavigate();
  const reason = sessionStorage.getItem('accountDisabledReason');

  const handleBack = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-lg w-full p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert size={32} />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Account Disabled</h1>
        <p className="text-slate-600 mb-6">
          {reason || 'Your account is currently disabled. Please contact support for assistance.'}
        </p>
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
        >
          <LogIn size={18} />
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default AccountDisabled;
