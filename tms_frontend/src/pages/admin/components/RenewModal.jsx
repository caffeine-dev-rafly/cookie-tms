import React, { useEffect, useState } from 'react';
import { X, CalendarClock, Loader2 } from 'lucide-react';
import api from '../../../api/axios';

const options = [
  { label: '1 Month', value: 1 },
  { label: '3 Months', value: 3 },
  { label: '6 Months', value: 6 },
  { label: '1 Year', value: 12 },
];

const RenewModal = ({ isOpen, onClose, organization, onRenew }) => {
  const [months, setMonths] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMonths(1);
    setError('');
  }, [isOpen, organization]);

  if (!isOpen || !organization) return null;

  const formattedDate = organization.subscription_end_date
    ? new Date(`${organization.subscription_end_date}T00:00:00`).toLocaleDateString('en-US', { dateStyle: 'medium' })
    : 'Not set';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const chosenOption = options.find((o) => o.value === months);
      const label = chosenOption ? chosenOption.label : `${months} Month(s)`;
      if (!confirm(`Renew ${organization.name} for ${label}?`)) {
        setSubmitting(false);
        return;
      }
      await api.post(`admin/organizations/${organization.id}/renew/`, { months });
      onRenew?.();
      onClose();
    } catch (err) {
      console.error('Failed to renew subscription', err);
      setError('Failed to renew subscription. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-xs uppercase text-slate-400 tracking-wide">Renew Subscription</p>
            <h3 className="text-xl font-bold text-slate-800">{organization.name}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
            <CalendarClock size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Current Expiry</p>
            <p className="text-lg font-semibold text-slate-800">{formattedDate}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setMonths(option.value)}
                className={`border rounded-lg px-4 py-3 text-left transition-all ${
                  months === option.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="text-sm font-semibold">{option.label}</div>
                <div className="text-xs text-slate-500">Add {option.value} month(s)</div>
              </button>
            ))}
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
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
            >
              {submitting && <Loader2 size={18} className="animate-spin" />}
              Confirm Renewal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RenewModal;
