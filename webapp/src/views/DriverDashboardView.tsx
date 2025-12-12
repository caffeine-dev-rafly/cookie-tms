import type { Alert, Shipment } from "../types";

interface DriverDashboardViewProps {
  shipments: Shipment[];
  alerts: Alert[];
}

export default function DriverDashboardView({ shipments, alerts }: DriverDashboardViewProps) {
  const active = shipments.filter((s) => s.status === "In Transit");

  return (
    <div className="space-y-4">
      <div className="bg-matcha-900 text-white p-5 rounded-2xl shadow-lg">
        <h3 className="text-2xl font-bold">{active[0]?.eta ?? "On schedule"}</h3>
        <p className="text-sm text-matcha-100">
          Next stop ETA {active[0]?.route ?? "—"}
        </p>
      </div>
      <div className="bg-white rounded-2xl shadow-card border border-matcha-50">
        <div className="p-4 border-b border-matcha-100">
          <h3 className="font-bold text-sm text-matcha-900">Assigned Loads</h3>
        </div>
        <div className="divide-y divide-matcha-50">
          {active.map((s) => (
            <div key={s.id} className="p-4 text-sm flex justify-between items-center">
              <div>
                <p className="font-bold text-matcha-900">{s.route}</p>
                <p className="text-xs text-gray-500">{s.driver ?? "Assigned"}</p>
              </div>
              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded font-bold">
                {s.status}
              </span>
            </div>
          ))}
          {active.length === 0 && (
            <p className="p-4 text-xs text-gray-500">No active loads.</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-matcha-50">
        <div className="p-4 border-b border-matcha-100">
          <h3 className="font-bold text-sm text-matcha-900">Driver Alerts</h3>
        </div>
        <div className="divide-y divide-matcha-50">
          {alerts.map((a) => (
            <div key={a.id} className="p-4 text-xs">
              <p className="font-bold text-matcha-900">{a.message}</p>
              <p className="text-[11px] text-gray-500">{a.createdAt}</p>
            </div>
          ))}
          {alerts.length === 0 && <p className="p-4 text-xs text-gray-500">No alerts.</p>}
        </div>
      </div>
    </div>
  );
}
