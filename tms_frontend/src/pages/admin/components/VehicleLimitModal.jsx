import React, { useEffect, useState } from 'react';
import { X, Gauge, Loader2 } from 'lucide-react';
import api from '../../../api/axios';

const VehicleLimitModal = ({ isOpen, onClose, organization, onSaved }) => {
  const [limit, setLimit] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && organization) {
      setLimit(organization.vehicle_limit ?? 0);
      setError('');
      setSaving(false);
    }
  }, [isOpen, organization]);

  if (!isOpen || !organization) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.patch(`organizations/${organization.id}/`, {
        vehicle_limit: Number(limit) || 0,
      });
      onSaved?.();
      onClose?.();
    } catch (err) {
      console.error('Failed to update vehicle limit', err);
      setError('Failed to update vehicle limit. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatLimit = (value) => {
    if (!value || value <= 0) return 'Unlimited';
    return `${value} vehicles`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-xs uppercase text-slate-400 tracking-wide">Vehicle Allocation</p>
            <h3 className="text-xl font-bold text-slate-800">{organization.name}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
            <Gauge size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-blue-700 uppercase">Current limit</p>
            <p className="text-lg font-semibold text-slate-800">{formatLimit(organization.vehicle_limit)}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">New vehicle limit (0 = Unlimited)</label>
            <input
              type="number"
              min="0"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
            >
              {saving && <Loader2 size={18} className="animate-spin" />}
              Save Limit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VehicleLimitModal;
