import { useState } from "react";
import type { Shipment } from "../types";

interface DeliveryViewProps {
  shipments: Shipment[];
  onConfirm: (shipmentId: string) => void;
}

export default function DeliveryView({ shipments, onConfirm }: DeliveryViewProps) {
  const openShipments = shipments.filter((s) => s.status !== "Delivered");
  const [selected, setSelected] = useState(openShipments[0]?.id ?? "");
  const [notes, setNotes] = useState("");

  const handleConfirm = () => {
    if (!selected) return;
    onConfirm(selected);
    setNotes("");
  };

  return (
    <div className="max-w-md mx-auto bg-white p-5 rounded-2xl shadow-card border border-matcha-50">
      <h3 className="font-bold text-base text-matcha-900 mb-4">Proof of Delivery</h3>
      <div className="space-y-3">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm"
        >
          <option value="">Select shipment</option>
          {openShipments.map((s) => (
            <option key={s.id} value={s.id}>
              {s.id} — {s.route}
            </option>
          ))}
        </select>
        <textarea
          rows={3}
          placeholder="Notes / POD details"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm"
        />
        <button
          onClick={handleConfirm}
          className="w-full py-3 rounded-xl bg-matcha-600 text-white font-bold text-sm disabled:opacity-60"
          disabled={!selected}
        >
          Confirm Delivered
        </button>
      </div>
    </div>
  );
}
