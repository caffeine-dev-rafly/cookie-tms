import { useState } from "react";
import type { Carrier, Vehicle } from "../types";

interface FleetViewProps {
  vehicles: Vehicle[];
  carriers: Carrier[];
  onAddVehicle: (vehicle: Omit<Vehicle, "status" | "fuelLevel" | "distanceLeftKm">) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

export default function FleetView({ vehicles, carriers, onAddVehicle, onDelete, onToggleStatus }: FleetViewProps) {
  const [vehicleId, setVehicleId] = useState("");
  const [carrier, setCarrier] = useState(carriers[0]?.name ?? "");
  const [vehicleType, setVehicleType] = useState("Truck");
  const [capacity, setCapacity] = useState("0");

  const handleAdd = () => {
    if (!vehicleId) return;
    onAddVehicle({ id: vehicleId, carrier, vehicleType, capacityM2: Number(capacity) || 0 });
    setVehicleId("");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white p-5 rounded-2xl shadow-card border border-matcha-50">
        <h3 className="font-bold text-sm text-matcha-900 mb-3">Add Vehicle / Asset</h3>
        <div className="space-y-2">
          <input
            type="text"
            className="w-full px-3 py-2 bg-gray-50 rounded-lg border text-xs"
            placeholder="Vehicle ID (e.g., A-105)"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
          />
          <select
            className="w-full px-3 py-2 bg-gray-50 rounded-lg border text-xs text-gray-600"
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
          >
            {carriers.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
            <option value="External Partner">External Partner</option>
          </select>
          <input
            type="text"
            className="w-full px-3 py-2 bg-gray-50 rounded-lg border text-xs"
            placeholder="Vehicle Type (e.g., Truck, Van)"
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
          />
          <input
            type="number"
            className="w-full px-3 py-2 bg-gray-50 rounded-lg border text-xs"
            placeholder="Capacity (m²)"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
          <button
            onClick={handleAdd}
            className="w-full bg-matcha-600 text-white font-bold py-2 rounded-lg text-xs mt-2"
          >
            Register Vehicle
          </button>
        </div>
      </div>

      {vehicles.map((vehicle) => (
        <div key={vehicle.id} className="bg-white p-5 rounded-2xl shadow-card border border-matcha-50">
          <div className="flex justify-between mb-3">
            <h3 className="font-bold text-base text-matcha-900">Truck {vehicle.id}</h3>
            <span
              className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                vehicle.status === "Active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {vehicle.status}
            </span>
          </div>
          <div className="flex justify-between text-[10px] text-matcha-600">
            <span>Fuel: {vehicle.fuelLevel}%</span>
            <span>{vehicle.distanceLeftKm} km</span>
          </div>
          <div className="mt-2 pt-2 border-t border-matcha-50 text-[10px] text-gray-600">
            Type: {vehicle.vehicleType} • Capacity: {vehicle.capacityM2} m²
          </div>
          <div className="text-[10px] text-gray-400">Carrier: {vehicle.carrier}</div>
          <div className="mt-3 flex gap-4 items-center text-[11px] font-bold">
            <button
              onClick={() => onToggleStatus(vehicle.id)}
              className="text-matcha-700"
            >
              {vehicle.status === "Active" ? "Set In Service" : "Set Active"}
            </button>
            <button
              onClick={() => onDelete(vehicle.id)}
              className="text-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
