import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { DollarSign, TrendingUp, Wallet, AlertTriangle } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const StatCard = ({ icon: Icon, label, value, accent }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
    <div className={`w-10 h-10 rounded-lg ${accent.bg} ${accent.text} flex items-center justify-center`}>
      <Icon size={20} />
    </div>
    <div>
      <div className="text-sm text-slate-500">{label}</div>
      <div className="text-xl font-bold text-slate-800">Rp {value.toLocaleString()}</div>
    </div>
  </div>
);

const FinanceDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total_revenue: 0,
    total_expense: 0,
    profit: 0,
    unpaid_invoices: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await api.get('finance/stats/');
      setStats(res.data);
    } catch (err) {
      console.error('Error fetching finance stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const chartData = [
    { name: 'Revenue', amount: stats.total_revenue },
    { name: 'Expense', amount: stats.total_expense },
  ];

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
          <h1 className="text-2xl font-bold text-slate-800">Finance Overview</h1>
          <p className="text-slate-500 text-sm">Track revenue, expenses, and invoice exposure.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          label="Total Revenue"
          value={stats.total_revenue || 0}
          accent={{ bg: 'bg-green-50', text: 'text-green-600' }}
        />
        <StatCard
          icon={Wallet}
          label="Total Expense"
          value={stats.total_expense || 0}
          accent={{ bg: 'bg-amber-50', text: 'text-amber-600' }}
        />
        <StatCard
          icon={DollarSign}
          label="Profit"
          value={stats.profit || 0}
          accent={{ bg: 'bg-blue-50', text: 'text-blue-600' }}
        />
        <StatCard
          icon={AlertTriangle}
          label="Unpaid Invoices"
          value={stats.unpaid_invoices || 0}
          accent={{ bg: 'bg-red-50', text: 'text-red-600' }}
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex-1">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="text-sm font-semibold text-slate-500 uppercase">Revenue vs Expense</div>
            <div className="text-slate-800 font-bold">Cashflow Snapshot</div>
          </div>
        </div>
        {loading ? (
          <div className="text-slate-500 text-sm">Loading chart...</div>
        ) : (
          <div className="w-full h-80">
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`Rp ${Number(value).toLocaleString()}`, 'Amount']} />
                <Bar dataKey="amount" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinanceDashboard;
