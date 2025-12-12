import { useMemo, useState } from "react";
import type { Shipment, ShipmentStatus, StatusEvent, Tender } from "../types";

interface ShipmentsViewProps {
  shipments: Shipment[];
  onCreate: (shipment: Omit<Shipment, "id">) => void;
  onStatusChange: (id: string, status: ShipmentStatus) => void;
  statusEvents: StatusEvent[];
  onAddEvent: (event: Omit<StatusEvent, "id">) => void;
  tenders: Tender[];
  onTenderStatus: (id: string, status: Tender["status"], quote?: number) => void;
  onDelete: (id: string) => void;
}

export default function ShipmentsView({
  shipments,
  onCreate,
  onStatusChange,
  statusEvents,
  onAddEvent,
  tenders,
  onTenderStatus,
  onDelete,
}: ShipmentsViewProps) {
  const [route, setRoute] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [driver, setDriver] = useState("");
  const [status, setStatus] = useState<ShipmentStatus>("Pending");
  const [eventNote, setEventNote] = useState("");
  const [eventStatus, setEventStatus] = useState<StatusEvent["status"]>("Dispatched");
  const [selectedShip, setSelectedShip] = useState("");

  const handleCreate = () => {
    if (!route) return;
    onCreate({ route, status, vehicleId, driver });
    setRoute("");
    setVehicleId("");
    setDriver("");
    setStatus("Pending");
  };

  const eventsByShipment = useMemo(
    () =>
      statusEvents.reduce<Record<string, StatusEvent[]>>((acc, evt) => {
        acc[evt.shipmentId] = acc[evt.shipmentId] ? [...acc[evt.shipmentId], evt] : [evt];
        return acc;
      }, {}),
    [statusEvents]
  );

  const tendersByShipment = useMemo(
    () =>
      tenders.reduce<Record<string, Tender[]>>((acc, t) => {
        acc[t.shipmentId] = acc[t.shipmentId] ? [...acc[t.shipmentId], t] : [t];
        return acc;
      }, {}),
    [tenders]
  );

  const addEvent = () => {
    if (!selectedShip) return;
    onAddEvent({
      shipmentId: selectedShip,
      status: eventStatus,
      timestamp: new Date().toISOString(),
      note: eventNote,
    });
    setEventNote("");
  };

  return (
    <div className="bg-white rounded-2xl shadow-card border border-matcha-50 overflow-hidden">
      <div className="p-5 border-b border-matcha-100 flex flex-col gap-3">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <h3 className="font-bold text-base text-matcha-900">Active Shipments</h3>
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              placeholder="Route (e.g., Osaka > Kyoto)"
              value={route}
              onChange={(e) => setRoute(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
            />
            <input
              type="text"
              placeholder="Vehicle"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
            />
            <input
              type="text"
              placeholder="Driver"
              value={driver}
              onChange={(e) => setDriver(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ShipmentStatus)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
            >
              <option>Pending</option>
              <option>In Transit</option>
              <option>Delivered</option>
            </select>
            <button
              onClick={handleCreate}
              className="bg-matcha-600 hover:bg-matcha-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
            >
              + Add
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <select
            className="px-3 py-1.5 bg-gray-50 border rounded-lg text-xs"
            value={selectedShip}
            onChange={(e) => setSelectedShip(e.target.value)}
          >
            <option value="">Select shipment to log event</option>
            {shipments.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id} — {s.route}
              </option>
            ))}
          </select>
          <select
            className="px-3 py-1.5 bg-gray-50 border rounded-lg text-xs"
            value={eventStatus}
            onChange={(e) => setEventStatus(e.target.value as StatusEvent["status"])}
          >
            <option value="Dispatched">Dispatched</option>
            <option value="In Transit">In Transit</option>
            <option value="Arrived">Arrived</option>
            <option value="Loaded">Loaded</option>
            <option value="Delivered">Delivered</option>
          </select>
          <div className="flex gap-2">
            <input
              className="px-3 py-1.5 bg-gray-50 border rounded-lg text-xs flex-1"
              placeholder="Note"
              value={eventNote}
              onChange={(e) => setEventNote(e.target.value)}
            />
            <button
              onClick={addEvent}
              className="bg-matcha-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
            >
              Log
            </button>
          </div>
        </div>
      </div>
      <table className="w-full text-left text-xs">
        <thead className="bg-matcha-50 text-matcha-600 uppercase">
          <tr>
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3">Route</th>
            <th className="px-4 py-3">Vehicle</th>
            <th className="px-4 py-3">Driver</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Events</th>
            <th className="px-4 py-3">Tenders</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-matcha-50 text-matcha-800">
          {shipments.map((shipment) => (
            <tr key={shipment.id} className="align-top">
              <td className="px-4 py-3">{shipment.id}</td>
              <td className="px-4 py-3">{shipment.route}</td>
              <td className="px-4 py-3">{shipment.vehicleId || "—"}</td>
              <td className="px-4 py-3">{shipment.driver || "—"}</td>
              <td className="px-4 py-3">
                <select
                  value={shipment.status}
                  onChange={(e) => onStatusChange(shipment.id, e.target.value as ShipmentStatus)}
                  className="text-xs bg-matcha-50 border border-matcha-200 rounded px-2 py-1 font-bold"
                >
                  <option>Pending</option>
                  <option>In Transit</option>
                  <option>Delivered</option>
                </select>
              </td>
              <td className="px-4 py-3">
                <div className="space-y-1">
                  {(eventsByShipment[shipment.id] ?? []).map((evt) => (
                    <div key={evt.id} className="text-[10px] text-gray-600">
                      {evt.status} @ {evt.timestamp}
                    </div>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="space-y-1">
                  {(tendersByShipment[shipment.id] ?? []).map((t) => (
                    <div key={t.id} className="text-[10px] flex items-center gap-1">
                      <span className="font-bold">{t.carrierId}</span>
                      <select
                        value={t.status}
                        onChange={(e) => onTenderStatus(t.id, e.target.value as Tender["status"], t.quote)}
                        className="bg-matcha-50 border border-matcha-200 rounded px-1 py-0.5"
                      >
                        <option>Draft</option>
                        <option>Sent</option>
                        <option>Accepted</option>
                        <option>Rejected</option>
                      </select>
                    </div>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onDelete(shipment.id)}
                  className="text-[11px] text-red-600 font-bold"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
