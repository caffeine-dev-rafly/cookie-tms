import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, WifiOff, Loader2, RefreshCcw } from 'lucide-react';
import api from '../api/axios';

const alertMeta = {
  STOPPED: {
    label: 'Stopped vehicles',
    icon: AlertTriangle,
    badgeClass: 'bg-amber-100 text-amber-700',
    accent: 'text-amber-600',
  },
  OFFLINE: {
    label: 'GPS offline',
    icon: WifiOff,
    badgeClass: 'bg-rose-100 text-rose-700',
    accent: 'text-rose-600',
  },
};

const VehicleAlertsPanel = ({ vehicles = [] }) => {
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setAlertsLoading(true);
      setError(null);
      const response = await api.get('vehicles/alerts/');
      setAlerts(response.data || []);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to load alerts', err);
      setError('Unable to load alerts. Retrying...');
    } finally {
      setAlertsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const groupedAlerts = useMemo(() => ({
    STOPPED: (alerts || []).filter((a) => a.type === 'STOPPED').sort((a, b) => b.duration_minutes - a.duration_minutes),
  }), [alerts]);

  const isOffline = useCallback((vehicle) => {
    const direct = (vehicle?.device_status || '').toUpperCase();
    if (direct === 'OFFLINE') return true;
    if (direct === 'ONLINE') return false;
    const computed = (vehicle?.computed_status || '').toUpperCase();
    return computed === 'OFFLINE';
  }, []);

  const offlineVehicles = useMemo(() => {
    if (!Array.isArray(vehicles)) return [];
    const filtered = vehicles.filter((vehicle) => vehicle?.gps_device_id && isOffline(vehicle));
    return filtered.sort((a, b) => {
      const aTime = a?.last_gps_sync ? new Date(a.last_gps_sync).getTime() : 0;
      const bTime = b?.last_gps_sync ? new Date(b.last_gps_sync).getTime() : 0;
      return aTime - bTime;
    });
  }, [vehicles, isOffline]);

  const formatLastPing = (timestamp) => {
    if (!timestamp) return 'No GPS ping yet';
    const parsed = new Date(timestamp);
    if (Number.isNaN(parsed.getTime())) return 'No GPS ping yet';
    return parsed.toLocaleTimeString();
  };

  const getOfflineMinutes = (timestamp) => {
    if (!timestamp) return null;
    const parsed = new Date(timestamp).getTime();
    if (!Number.isFinite(parsed)) return null;
    return Math.max(0, Math.round((Date.now() - parsed) / 60000));
  };

  const renderStoppedItems = (items) => {
    if (alertsLoading) {
      return (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 size={16} className="animate-spin" />
          Loading alerts...
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <p className="text-sm text-slate-400">
          No stopped vehicle alerts in the last check.
        </p>
      );
    }

    return (
      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {items.map((alert) => (
          <div key={`stopped-${alert.vehicle_id}`} className="flex items-start justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm bg-slate-50">
            <div>
              <p className="font-semibold text-slate-800">{alert.license_plate}</p>
              <p className="text-xs text-slate-500">
                Since {new Date(alert.since).toLocaleTimeString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900">{Math.round(alert.duration_minutes)} min</p>
              <p className="text-xs text-slate-500">Stopped</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderOfflineItems = (items) => {
    if (items.length === 0) {
      return (
        <p className="text-sm text-slate-400">
          No offline GPS right now.
        </p>
      );
    }

    return (
      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {items.map((vehicle) => {
          const minutes = getOfflineMinutes(vehicle.last_gps_sync);
          const durationLabel = minutes === null ? 'Unknown' : `${minutes} min`;
          return (
            <div key={`offline-${vehicle.id}`} className="flex items-start justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm bg-slate-50">
              <div>
                <p className="font-semibold text-slate-800">{vehicle.license_plate}</p>
                <p className="text-xs text-slate-500">
                  Last ping {formatLastPing(vehicle.last_gps_sync)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">{durationLabel}</p>
                <p className="text-xs text-slate-500">Offline</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Real-time Alerts</p>
          <h2 className="text-lg font-bold text-slate-800">Fleet health monitor</h2>
          {lastRefreshed && (
            <p className="text-xs text-slate-400">Updated {lastRefreshed.toLocaleTimeString()}</p>
          )}
        </div>
        <button
          onClick={fetchAlerts}
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          title="Refresh alerts"
        >
          <RefreshCcw size={16} />
          Refresh
        </button>
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(alertMeta).map(([type, meta]) => {
          const items = type === 'OFFLINE' ? offlineVehicles : groupedAlerts[type];
          const Icon = meta.icon;
          return (
            <div key={type} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon size={18} className={meta.accent} />
                  <span className="font-semibold text-slate-800">{meta.label}</span>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${meta.badgeClass}`}>
                  {items.length} active
                </span>
              </div>
              <div className="mt-3">
                {type === 'OFFLINE' ? renderOfflineItems(items) : renderStoppedItems(items)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VehicleAlertsPanel;
