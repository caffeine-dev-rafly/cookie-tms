import { Activity, Check, Clock, Lock, MoreHorizontal, Server } from "lucide-react";

const userRows = [
  { name: "Admin User", email: "admin@gl.com", badge: "Admin", tone: "red" },
  { name: "Sarah Ops", email: "sarah@gl.com", badge: "Ops", tone: "blue" },
  { name: "John D.", email: "john@gl.com", badge: "Driver", tone: "yellow" },
] as const;

const badgeTone: Record<string, string> = {
  red: "bg-red-100 text-red-600",
  blue: "bg-blue-100 text-blue-600",
  yellow: "bg-yellow-100 text-yellow-600",
};

interface AdminViewProps {
  currency: string;
  currencyOptions: { code: string; symbol: string }[];
  onCurrencyChange: (code: string) => void;
  logs: { id: string; entity: string; action: string; refId?: string; timestamp: string; user?: string; detail?: string }[];
}

export default function AdminView({ currency, currencyOptions, onCurrencyChange, logs }: AdminViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-matcha-900">System Administration</h3>
        <p className="text-xs text-gray-500">
          Configure system-wide settings, scenarios, and integrations
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-1 md:col-span-2 bg-white p-5 rounded-2xl shadow-card border border-matcha-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                <Activity className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-matcha-900">Scenario Simulator (What-If)</h4>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">
                  Fuel Price Impact
                </label>
                <select className="w-full p-2 bg-gray-50 rounded-lg border text-xs mt-1">
                  <option>Current</option>
                  <option>+10% Increase</option>
                  <option>+20% Increase</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">
                  Volume Surge
                </label>
                <select className="w-full p-2 bg-gray-50 rounded-lg border text-xs mt-1">
                  <option>Normal</option>
                  <option>Peak Season (+30%)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">
                  Driver Availability
                </label>
                <select className="w-full p-2 bg-gray-50 rounded-lg border text-xs mt-1">
                  <option>100%</option>
                  <option>Shortage (80%)</option>
                </select>
              </div>
            </div>
            <div className="mt-4 p-3 bg-indigo-50 rounded-xl flex justify-between items-center">
              <div>
                <p className="text-xs text-indigo-800 font-bold">Projected Margin Impact:</p>
                <p className="text-lg font-bold text-indigo-600">-2.4%</p>
              </div>
              <div>
                <p className="text-xs text-indigo-800 font-bold">Projected OTP:</p>
                <p className="text-lg font-bold text-indigo-600">96.1%</p>
              </div>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold">
                Run Simulation
              </button>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-card border border-matcha-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                <Clock className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-matcha-900">On-Time Delivery Targets</h4>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-600">Trip Type 1 (Long Haul)</span>
                <input
                  type="text"
                  className="w-16 p-1 bg-gray-50 rounded border text-center text-xs font-bold"
                  defaultValue="95%"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-600">Trip Type 2 (Last Mile)</span>
                <input
                  type="text"
                  className="w-16 p-1 bg-gray-50 rounded border text-center text-xs font-bold"
                  defaultValue="98%"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-600">Trip Type 3 (Express)</span>
                <input
                  type="text"
                  className="w-16 p-1 bg-gray-50 rounded border text-center text-xs font-bold"
                  defaultValue="99.5%"
                />
              </div>
              <button className="w-full mt-2 text-xs bg-matcha-600 text-white px-3 py-1.5 rounded font-bold">
                Update SLAs
              </button>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-card border border-matcha-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                <Server className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-matcha-900">ERP Integration</h4>
            </div>
            <form className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">API Endpoint</label>
                <input
                  type="text"
                  className="w-full p-2 bg-gray-50 rounded-lg border text-xs font-mono"
                  defaultValue="https://api.sap.com/v1/tms"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">API Key</label>
                <input
                  type="password"
                  className="w-full p-2 bg-gray-50 rounded-lg border text-xs font-mono"
                  defaultValue="sk_live_9928349"
                />
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-green-600 font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Active
                </span>
                <button type="button" className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded font-bold">
                  Test
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-card border border-matcha-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                <Lock className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-matcha-900">OAuth2 / SSO</h4>
            </div>
            <form className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">Client ID</label>
                <input
                  type="text"
                  className="w-full p-2 bg-gray-50 rounded-lg border text-xs font-mono"
                  defaultValue="client_882910"
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-bold text-gray-600">Enable SSO</span>
                </div>
                <button className="text-xs bg-matcha-600 text-white px-3 py-1.5 rounded font-bold">
                  Save
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-card border border-matcha-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600">
                <span className="text-xs font-bold">$</span>
              </div>
              <h4 className="font-bold text-matcha-900">Finance Defaults</h4>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Currency</label>
              <select
                value={currency}
                onChange={(e) => onCurrencyChange(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 rounded-lg border text-sm"
              >
                {currencyOptions.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-500">
                This currency will be used in Finance calculations and revenue displays.
              </p>
            </div>
          </div>
        </div>

        <div className="xl:col-span-1 bg-white rounded-2xl shadow-card border border-matcha-50 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-matcha-100 flex justify-between items-center bg-matcha-50/30">
            <h3 className="font-bold text-sm text-matcha-900">User Accounts</h3>
            <button className="bg-matcha-600 text-white px-3 py-1 rounded text-xs font-bold">Add</button>
          </div>
          <div className="overflow-y-auto flex-1 p-0">
            <table className="w-full text-left text-xs">
              <thead className="bg-matcha-50 text-matcha-600 uppercase">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3 text-right">Act</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-matcha-50 text-matcha-800">
                {userRows.map((user) => (
                  <tr key={user.email}>
                    <td className="px-4 py-3 font-bold">
                      {user.name}
                      <br />
                      <span className="text-[10px] font-normal text-gray-500">{user.email}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-1.5 rounded text-[10px] font-bold ${badgeTone[user.tone]}`}>
                        {user.badge}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <MoreHorizontal className="w-4 h-4 text-gray-400 inline" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="xl:col-span-3 bg-white rounded-2xl shadow-card border border-matcha-50 overflow-hidden">
          <div className="p-4 border-b border-matcha-100 flex justify-between items-center bg-matcha-50/30">
            <h3 className="font-bold text-sm text-matcha-900">Activity Logs</h3>
            <span className="text-[10px] text-gray-500">{logs.length} entries</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-matcha-50 text-matcha-600 uppercase">
                <tr>
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Entity</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Ref</th>
                  <th className="px-3 py-2">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-matcha-50 text-matcha-800">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-3 py-2 font-mono text-[11px]">{log.timestamp}</td>
                    <td className="px-3 py-2">{log.entity}</td>
                    <td className="px-3 py-2">{log.action}</td>
                    <td className="px-3 py-2">{log.refId ?? "-"}</td>
                    <td className="px-3 py-2">{log.user ?? "System"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
