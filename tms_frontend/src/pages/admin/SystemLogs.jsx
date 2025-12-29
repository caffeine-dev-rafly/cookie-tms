import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Search, RotateCw, Clock } from 'lucide-react';

const SystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchLogs = async () => {
    try {
      const response = await api.get('logs/');
      setLogs(response.data);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const getActionColor = (action) => {
    if (action.includes('DELETED')) return 'bg-red-100 text-red-800';
    if (action.includes('CREATED')) return 'bg-green-100 text-green-800';
    if (action.includes('UPDATED')) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">System Logs (Realtime)</h1>
        <div className="flex items-center gap-2 text-sm text-slate-500">
           <Clock size={16} />
           <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
           <button onClick={fetchLogs} className="p-2 hover:bg-slate-100 rounded-full" title="Refresh Now">
             <RotateCw size={16} />
           </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-semibold text-slate-600">Time</th>
                <th className="p-4 font-semibold text-slate-600">User</th>
                <th className="p-4 font-semibold text-slate-600">Action</th>
                <th className="p-4 font-semibold text-slate-600">IP Address</th>
                <th className="p-4 font-semibold text-slate-600">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400">
                    No logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 whitespace-nowrap text-slate-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 font-medium text-slate-900">
                      {log.user_name || 'System'}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 font-mono text-xs">
                      {log.ip_address || '-'}
                    </td>
                    <td className="p-4 text-slate-600 max-w-md truncate">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SystemLogs;
