import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SubscriptionBanner = () => {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(false);
  }, [user?.warning]);

  if (!user?.warning || dismissed) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-800 px-4 py-3 flex items-start gap-3">
      <div className="mt-0.5 text-amber-500">
        <AlertTriangle size={18} />
      </div>
      <div className="flex-1 text-sm leading-relaxed">
        <div className="font-semibold text-amber-800">Subscription Notice</div>
        <div>{user.warning}</div>
      </div>
      <button
        className="text-amber-500 hover:text-amber-700"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss subscription warning"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default SubscriptionBanner;
