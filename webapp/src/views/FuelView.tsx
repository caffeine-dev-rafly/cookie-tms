import { useState } from "react";
import type { FuelLog, Vehicle } from "../types";

interface FuelViewProps {
  fuelLogs: FuelLog[];
  vehicles: Vehicle[];
  onCreate: (log: Omit<FuelLog, "id">) => void;
  onDelete: (id: string) => void;
}

export default function FuelView({ fuelLogs, vehicles, onCreate, onDelete }: FuelViewProps) {
  const [date, setDate] = useState("");
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? "");
  const [cost, setCost] = useState("0");

  const handleCreate = () => {
    if (!date || !vehicleId) return;
    onCreate({ date, vehicleId, cost: Number(cost) || 0 });
    setCost("0");
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-card border border-matcha-50 space-y-3">
      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-gray-500">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 bg-gray-50 rounded-lg border text-xs"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-gray-500">Vehicle</label>
          <select
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            className="px-3 py-2 bg-gray-50 rounded-lg border text-xs"
          >
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.id}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-gray-500">Cost</label>
          <input
            type="number"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            className="px-3 py-2 bg-gray-50 rounded-lg border text-xs"
          />
        </div>
        <button
          onClick={handleCreate}
          className="bg-matcha-600 text-white font-bold px-4 py-2 rounded-lg text-xs"
        >
          Add Log
        </button>
      </div>
      <table className="w-full text-left text-xs">
        <thead className="bg-matcha-50 text-matcha-600 uppercase">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Vehicle</th>
            <th className="px-4 py-3">Cost</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {fuelLogs.map((log) => (
            <tr key={log.id}>
              <td className="px-4 py-3">{log.date}</td>
              <td className="px-4 py-3">{log.vehicleId}</td>
              <td className="px-4 py-3">${log.cost.toFixed(2)}</td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onDelete(log.id)}
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
