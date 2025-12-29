import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import { FilePlus2, History, Printer, BadgeCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const STATUS_STYLES = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  sent: 'bg-blue-50 text-blue-700 border-blue-100',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  overdue: 'bg-rose-50 text-rose-700 border-rose-100',
};

const Invoices = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('create'); // create | history
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });

  const [unbilledTrips, setUnbilledTrips] = useState([]);
  const [selectedTripIds, setSelectedTripIds] = useState([]);
  const [invoices, setInvoices] = useState([]);

  const [loadingTrips, setLoadingTrips] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const formatAmount = (val) => Number(val || 0).toLocaleString();

  const fetchCustomers = async () => {
    try {
      const res = await api.get('customers/');
      setCustomers(res.data);
    } catch (err) {
      console.error('Error fetching customers', err);
    }
  };

  const fetchInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const res = await api.get('finance/invoices/');
      setInvoices(res.data);
    } catch (err) {
      console.error('Error fetching invoices', err);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const fetchUnbilledTrips = async (customerId) => {
    if (!customerId) return;
    setLoadingTrips(true);
    try {
      const res = await api.get('finance/unbilled/', {
        params: { customer_id: customerId },
      });
      setUnbilledTrips(res.data);
    } catch (err) {
      console.error('Error fetching unbilled trips', err);
      setUnbilledTrips([]);
    } finally {
      setLoadingTrips(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchInvoices();
  }, []);

  useEffect(() => {
    setError('');
    setSuccess('');
    setSelectedTripIds([]);
    if (!selectedCustomer) {
      setUnbilledTrips([]);
      return;
    }
    fetchUnbilledTrips(selectedCustomer);
  }, [selectedCustomer]);

  const allSelected = useMemo(() => {
    return unbilledTrips.length > 0 && selectedTripIds.length === unbilledTrips.length;
  }, [unbilledTrips, selectedTripIds]);

  const selectedTotal = useMemo(() => {
    const priceById = new Map(unbilledTrips.map((t) => [t.id, Number(t.price || 0)]));
    return selectedTripIds.reduce((sum, id) => sum + (priceById.get(id) || 0), 0);
  }, [unbilledTrips, selectedTripIds]);

  const toggleTrip = (tripId) => {
    setSelectedTripIds((prev) =>
      prev.includes(tripId) ? prev.filter((id) => id !== tripId) : [...prev, tripId]
    );
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedTripIds([]);
      return;
    }
    setSelectedTripIds(unbilledTrips.map((t) => t.id));
  };

  const handleCreateInvoice = async () => {
    if (!selectedCustomer) {
      setError('Select a customer first.');
      return;
    }
    if (!dueDate) {
      setError('Set a due date.');
      return;
    }
    if (selectedTripIds.length === 0) {
      setError('Select at least one trip.');
      return;
    }

    setError('');
    setSuccess('');
    setCreating(true);
    try {
      const res = await api.post('finance/invoices/create/', {
        customer_id: Number(selectedCustomer),
        trip_ids: selectedTripIds,
        due_date: dueDate,
      });
      setSuccess(`Invoice ${res.data.invoice_number} created.`);
      setSelectedTripIds([]);
      await Promise.all([fetchInvoices(), fetchUnbilledTrips(selectedCustomer)]);
      setActiveTab('history');
    } catch (err) {
      console.error('Error creating invoice', err);
      const msg = err?.response?.data?.error || 'Failed to create invoice. Please try again.';
      setError(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleMarkPaid = async (invoiceId) => {
    setError('');
    setSuccess('');
    try {
      await api.post(`finance/invoices/${invoiceId}/mark-paid/`);
      setSuccess('Invoice marked as paid.');
      fetchInvoices();
    } catch (err) {
      console.error('Error marking paid', err);
      setError('Failed to mark invoice as paid.');
    }
  };

  const handleDownloadPdf = () => {
    alert('Downloading PDF...');
  };

  const statusBadgeClass = (status) => {
    const cls = STATUS_STYLES[status] || STATUS_STYLES.draft;
    return `inline-flex items-center px-2 py-1 rounded-full text-xs font-bold border ${cls}`;
  };

  if (user && !['owner', 'finance', 'super_admin'].includes(user.role)) {
    return (
      <div className="p-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="text-slate-700 font-semibold">Access restricted to finance or owner roles.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Invoice Manager</h1>
          <p className="text-slate-500 text-sm">Group completed trips into invoices and track payment status.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 px-4 py-3 text-sm font-semibold flex items-center justify-center gap-2 ${
              activeTab === 'create' ? 'bg-slate-50 text-slate-800' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <FilePlus2 size={16} />
            Create Invoice
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 px-4 py-3 text-sm font-semibold flex items-center justify-center gap-2 ${
              activeTab === 'history' ? 'bg-slate-50 text-slate-800' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <History size={16} />
            Invoice History
          </button>
        </div>

        {(error || success) && (
          <div className="p-4">
            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            {success && (
              <div className="mt-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                {success}
              </div>
            )}
          </div>
        )}

        {activeTab === 'create' ? (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select
                className="px-3 py-2 border rounded-lg"
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
              >
                <option value="">Select Customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <input
                type="date"
                className="px-3 py-2 border rounded-lg"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />

              <button
                disabled={creating || selectedTripIds.length === 0 || !selectedCustomer}
                onClick={handleCreateInvoice}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-60"
              >
                {creating ? 'Generating...' : 'Generate Invoice'}
              </button>
            </div>

            <div className="flex items-center justify-between text-sm text-slate-600">
              <div>
                Selected: <span className="font-semibold text-slate-800">{selectedTripIds.length}</span> trip(s)
              </div>
              <div>
                Total: <span className="font-semibold text-slate-800">Rp {formatAmount(selectedTotal)}</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                Unbilled Completed Trips
              </div>
              <div className="max-h-80 overflow-auto">
                {loadingTrips ? (
                  <div className="p-4 text-sm text-slate-500">Loading trips...</div>
                ) : !selectedCustomer ? (
                  <div className="p-4 text-sm text-slate-500">Select a customer to fetch unbilled trips.</div>
                ) : unbilledTrips.length === 0 ? (
                  <div className="p-4 text-sm text-slate-500">No unbilled completed trips for this customer.</div>
                ) : (
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="p-3 text-xs font-semibold text-slate-500">
                          <label className="inline-flex items-center gap-2">
                            <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
                            Select All
                          </label>
                        </th>
                        <th className="p-3 text-xs font-semibold text-slate-500">Date</th>
                        <th className="p-3 text-xs font-semibold text-slate-500">Route</th>
                        <th className="p-3 text-xs font-semibold text-slate-500">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {unbilledTrips.map((trip) => (
                        <tr key={trip.id} className="hover:bg-slate-50">
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={selectedTripIds.includes(trip.id)}
                              onChange={() => toggleTrip(trip.id)}
                            />
                          </td>
                          <td className="p-3 text-slate-700">{trip.date || '-'}</td>
                          <td className="p-3 text-slate-700">{trip.route || '-'}</td>
                          <td className="p-3 text-slate-700">Rp {formatAmount(trip.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5">
            <div className="overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="p-3 text-xs font-semibold text-slate-500 uppercase">Invoice #</th>
                    <th className="p-3 text-xs font-semibold text-slate-500 uppercase">Customer</th>
                    <th className="p-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                    <th className="p-3 text-xs font-semibold text-slate-500 uppercase">Total</th>
                    <th className="p-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                    <th className="p-3 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingInvoices ? (
                    <tr>
                      <td colSpan="6" className="p-4 text-sm text-slate-500">
                        Loading invoices...
                      </td>
                    </tr>
                  ) : invoices.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-4 text-sm text-slate-500">
                        No invoices yet.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="p-3 font-semibold text-slate-800">{inv.invoice_number || `#${inv.id}`}</td>
                        <td className="p-3 text-slate-700">{inv.customer_name}</td>
                        <td className="p-3 text-slate-600">{(inv.created_at || '').slice(0, 10) || '-'}</td>
                        <td className="p-3 text-slate-700">Rp {formatAmount(inv.total_amount)}</td>
                        <td className="p-3">
                          <span className={statusBadgeClass(inv.status)}>
                            {String(inv.status || 'draft').toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            disabled={inv.status === 'paid'}
                            onClick={() => handleMarkPaid(inv.id)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm disabled:opacity-50"
                          >
                            <BadgeCheck size={16} />
                            Mark as Paid
                          </button>
                          <button
                            onClick={handleDownloadPdf}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm"
                          >
                            <Printer size={16} />
                            Download PDF
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Invoices;
