import { useEffect, useRef } from "react";
import L from "leaflet";
import type { Alert, Destination, Shipment } from "../types";

interface TrackingViewProps {
  shipments: Shipment[];
  destinations: Destination[];
  alerts: Alert[];
}

export default function TrackingView({ shipments, destinations, alerts }: TrackingViewProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerLayer = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstance.current) {
      const map = L.map(mapRef.current, {
        zoomControl: true,
        worldCopyJump: true,
      }).setView([35.5, 137.5], 6);
      mapInstance.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);
    }

    const map = mapInstance.current;
    if (!map) return;

    if (markerLayer.current) {
      markerLayer.current.clearLayers();
    } else {
      markerLayer.current = L.layerGroup().addTo(map);
    }

    const truckIcon = L.divIcon({
      className: "custom-div-icon",
      html:
        '<div class="w-8 h-8 bg-matcha-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
        '<rect width="16" height="13" x="2" y="5" rx="2"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>' +
        "</div>",
      iconSize: [32, 32],
    });

    const markers: L.Marker[] = [];

    const addMarker = (lat: number, lng: number, label: string) => {
      const marker = L.marker([lat, lng], { icon: truckIcon });
      marker.bindPopup(label);
      marker.addTo(markerLayer.current as L.LayerGroup);
      markers.push(marker);
    };

    shipments.forEach((s) => {
      if (s.originCoord) {
        addMarker(s.originCoord[0], s.originCoord[1], `${s.id}: ${s.route}`);
      } else if (s.destCoord) {
        addMarker(s.destCoord[0], s.destCoord[1], `${s.id}: ${s.route}`);
      }
    });

    if (markers.length === 0) {
      destinations.slice(0, 3).forEach((d) => addMarker(d.lat, d.lng, d.name));
    }

    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.2));
    }

    // Make sure the map sizes correctly once visible
    setTimeout(() => map.invalidateSize(), 50);

    const resizeObserver = new ResizeObserver(() => map.invalidateSize());
    resizeObserver.observe(mapRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [shipments, destinations]);

  useEffect(() => {
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markerLayer.current = null;
      }
    };
  }, []);

  return (
    <div className="space-y-3">
      <div
        ref={mapRef}
        className="w-full h-[400px] rounded-xl border border-matcha-100 bg-white"
      />
      <div className="bg-white rounded-2xl shadow-card border border-matcha-50 p-4">
        <h4 className="font-bold text-sm text-matcha-900 mb-2">Recent Alerts</h4>
        <div className="divide-y divide-matcha-50">
          {alerts.map((alert) => (
            <div key={alert.id} className="py-2 text-xs">
              <div className="flex justify-between">
                <span className="font-bold text-matcha-900">{alert.message}</span>
                <span className="text-[10px] bg-orange-50 text-orange-700 px-2 py-1 rounded">
                  {alert.type}
                </span>
              </div>
              <p className="text-[11px] text-gray-500">
                {alert.shipmentId ? `Shipment ${alert.shipmentId}` : "General"} • {alert.createdAt}
              </p>
            </div>
          ))}
          {alerts.length === 0 && <p className="text-xs text-gray-500">No alerts.</p>}
        </div>
      </div>
    </div>
  );
}
