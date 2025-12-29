import React, { useState } from 'react';
import { MapPin, Phone, Navigation, Package, Camera, X, CheckCircle, Circle, DollarSign, Gauge } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const TripDetails = ({ trip, onClose, onUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [showSettle, setShowSettle] = useState(false);
  const { user } = useAuth();

  const handleNavigate = (dest) => {
    const query = encodeURIComponent(dest || trip.destination);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const handleCall = () => {
    if (trip.customer_phone) {
      window.open(`tel:${trip.customer_phone}`);
    } else {
      alert("No phone number available");
    }
  };

  const handleVerifyDrop = async (destination) => {
      if (confirm(`Confirm drop at ${destination}?`)) {
          try {
              await api.post(`trips/${trip.id}/arrive/`, { destination });
              onUpdate(); // Refresh parent to get updated completed_destinations
          } catch (error) {
              console.error("Failed to verify drop", error);
              alert("Failed to verify drop. Please try again.");
          }
      }
  };

  // Ensure destinations list is robust
  const destinations = trip.destinations && trip.destinations.length > 0 
      ? trip.destinations 
      : [trip.destination];

  const completed = trip.completed_destinations || [];
  const canSettle = ['owner', 'finance', 'super_admin'].includes(user?.role) && trip.status === 'COMPLETED';

  const [settleData, setSettleData] = useState({
    actual_expenses: '',
    cash_returned: '',
    final_odometer: '',
    driver_commission: '',
  });

  const allowance = Number(trip.allowance_given || 0);
  const cashReturned = Number(settleData.cash_returned || 0);
  const totalUsed = allowance - cashReturned;
  const customerLabel = Array.isArray(trip.customer_names) && trip.customer_names.length
    ? trip.customer_names.join(', ')
    : (trip.customer_name || 'Walk-in Customer');

  const handleSettleSubmit = async () => {
    const receiptsNum = Number(settleData.actual_expenses);
    const cashNum = Number(settleData.cash_returned || 0);
    const odoNum = settleData.final_odometer ? Number(settleData.final_odometer) : '';
    const commissionNum = settleData.driver_commission === '' ? 0 : Number(settleData.driver_commission);

    if (Number.isNaN(receiptsNum) || receiptsNum < 0) {
      alert('Total receipts must be a non-negative number.');
      return;
    }
    if (Number.isNaN(cashNum) || cashNum < 0) {
      alert('Cash returned must be a non-negative number.');
      return;
    }
    if (Number.isNaN(commissionNum) || commissionNum < 0) {
      alert('Driver commission must be a non-negative number.');
      return;
    }

    try {
      await api.post(`trips/${trip.id}/settle/`, {
        actual_expenses: receiptsNum,
        cash_returned: cashNum,
        driver_commission: commissionNum,
        final_odometer: odoNum === '' ? null : odoNum,
      });
      setShowSettle(false);
      onUpdate?.();
    } catch (err) {
      console.error('Failed to settle trip', err);
      alert('Settlement failed. Please check values and try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between shadow-sm z-10">
        <h2 className="font-bold text-lg text-slate-800">Trip Details</h2>
        <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-600">
          <X size={20} />
        </button>
      </div>

      <div className="p-5 space-y-6 pb-20">
        {/* Surat Jalan Header */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Surat Jalan Number</p>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xl font-mono font-bold text-slate-800">{trip.surat_jalan_number || 'PENDING'}</p>
            {canSettle && (
              <button
                onClick={() => setShowSettle(true)}
                className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
              >
                Settle Trip
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Route Info */}
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="mt-1">
              <div className="w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-100"></div>
              <div className="w-0.5 h-full bg-slate-200 mx-auto my-1 min-h-[20px]"></div>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">Origin</p>
              <p className="text-slate-800 font-medium">{trip.origin}</p>
            </div>
          </div>

          {destinations.map((dest, idx) => {
              const isCompleted = completed.includes(dest);
              const isLast = idx === destinations.length - 1;
              
              return (
                <div key={idx} className="flex gap-3">
                    <div className="mt-1 flex flex-col items-center">
                        {isCompleted ? (
                            <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-white">
                                <CheckCircle size={12} className="fill-current"/>
                            </div>
                        ) : (
                            <div className={`w-3 h-3 rounded-full ${isLast ? 'bg-red-500 ring-4 ring-red-100' : 'bg-slate-300 ring-4 ring-slate-100'}`}></div>
                        )}
                        {!isLast && <div className="w-0.5 h-full bg-slate-200 my-1 min-h-[40px]"></div>}
                    </div>
                    <div className="flex-1 pb-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase">
                                    {isLast ? 'Final Destination' : `Drop #${idx + 1}`}
                                </p>
                                <p className={`font-medium ${isCompleted ? 'text-green-700 line-through' : 'text-slate-800'}`}>
                                    {dest}
                                </p>
                            </div>
                            <button 
                                onClick={() => handleNavigate(dest)}
                                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                            >
                                <Navigation size={16} />
                            </button>
                        </div>
                        
                        {/* Verify Action */}
                        {!isCompleted && ['OTW', 'PLANNED', 'ARRIVED'].includes(trip.status) && (
                            <button 
                                onClick={() => handleVerifyDrop(dest)}
                                className="mt-3 w-full py-2 border-2 border-dashed border-blue-200 text-blue-600 rounded-lg font-bold text-sm hover:bg-blue-50 flex items-center justify-center gap-2"
                            >
                                <CheckCircle size={16} /> Verify Drop
                            </button>
                        )}
                        {isCompleted && (
                            <div className="mt-1 text-xs text-green-600 font-medium flex items-center gap-1">
                                <CheckCircle size={12}/> Verified
                            </div>
                        )}
                    </div>
                </div>
              );
          })}
        </div>

        <hr className="border-slate-100" />

        {/* Customer Info */}
        <div>
          <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
            <MapPin size={18} className="text-slate-400"/> Customer
          </h3>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="font-medium text-slate-800 mb-1">{customerLabel}</p>
            <button 
              onClick={handleCall}
              disabled={!trip.customer_phone}
              className="mt-2 w-full py-2 border border-slate-200 rounded-lg flex items-center justify-center gap-2 text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              <Phone size={18} /> Call Customer
            </button>
          </div>
        </div>

        {/* Cargo Info */}
        <div>
          <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
            <Package size={18} className="text-slate-400"/> Cargo Details
          </h3>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500">Type</p>
                <p className="font-medium text-slate-800">{trip.cargo_type || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Quantity</p>
                <p className="font-medium text-slate-800">-</p> {/* Add qty field later if needed */}
              </div>
            </div>
          </div>
        </div>

      {/* Proof of Delivery (Only visible if finalizing) */}
      {trip.status === 'ARRIVED' && (
         <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
              <Camera size={18}/> Proof of Delivery
              </h4>
              <p className="text-sm text-blue-600 mb-3">Upload photo of signed Surat Jalan to finish.</p>
              <input type="file" accept="image/*" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"/>
           </div>
        )}

      </div>

      {showSettle && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-slate-500 font-semibold">Trip Settlement</p>
                <h3 className="text-lg font-bold text-slate-800">{trip.surat_jalan_number || 'Trip'}</h3>
              </div>
              <button onClick={() => setShowSettle(false)} className="text-slate-500 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="text-xs uppercase text-slate-500 font-semibold">Uang Jalan Given</div>
                <div className="text-lg font-bold text-slate-800">Rp {allowance.toLocaleString()}</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="text-xs uppercase text-slate-500 font-semibold">Total Used (Calc)</div>
                <div className="text-lg font-bold text-amber-700">Rp {totalUsed.toLocaleString()}</div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700">Total Receipts (Toll/BBM)</label>
              <div className="flex items-center gap-2 px-3 py-2 border rounded-lg">
                <DollarSign size={16} className="text-slate-400" />
                <input
                  type="number"
                  className="flex-1 outline-none"
                  value={settleData.actual_expenses}
                  onChange={(e) => setSettleData({ ...settleData, actual_expenses: e.target.value })}
                  placeholder="e.g. 150000"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700">Cash Returned</label>
              <div className="flex items-center gap-2 px-3 py-2 border rounded-lg">
                <DollarSign size={16} className="text-slate-400" />
                <input
                  type="number"
                  className="flex-1 outline-none"
                  value={settleData.cash_returned}
                  onChange={(e) => setSettleData({ ...settleData, cash_returned: e.target.value })}
                  placeholder="e.g. 50000"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700">Driver Commission / Wage</label>
              <div className="flex items-center gap-2 px-3 py-2 border rounded-lg">
                <DollarSign size={16} className="text-slate-400" />
                <input
                  type="number"
                  className="flex-1 outline-none"
                  value={settleData.driver_commission}
                  onChange={(e) => setSettleData({ ...settleData, driver_commission: e.target.value })}
                  placeholder="e.g. 75000"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700">Return Odometer (Optional)</label>
              <div className="flex items-center gap-2 px-3 py-2 border rounded-lg">
                <Gauge size={16} className="text-slate-400" />
                <input
                  type="number"
                  className="flex-1 outline-none"
                  value={settleData.final_odometer}
                  onChange={(e) => setSettleData({ ...settleData, final_odometer: e.target.value })}
                  placeholder="e.g. 120340"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                onClick={() => setShowSettle(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
                onClick={handleSettleSubmit}
              >
                Submit Settlement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripDetails;
