import { useState } from "react";
import type { VehicleType } from "../types";

interface VehicleTypesViewProps {
  vehicleTypes: VehicleType[];
  onCreate: (vt: Omit<VehicleType, "id">) => void;
  onDelete: (id: string) => void;
}

export default function VehicleTypesView({ vehicleTypes, onCreate, onDelete }: VehicleTypesViewProps) {
  const [name, setName] = useState("");
  const [lengthM, setLengthM] = useState("0");
  const [widthM, setWidthM] = useState("0");
  const [heightM, setHeightM] = useState("0");
  const [capacityM2, setCapacityM2] = useState("0");

  const handleCreate = () => {
    if (!name) return;
    const computedCapacity = Number(capacityM2) || Number(lengthM) * Number(widthM) || 0;
    onCreate({
      name,
      lengthM: Number(lengthM) || 0,
      widthM: Number(widthM) || 0,
      heightM: Number(heightM) || undefined,
      capacityM2: computedCapacity,
    });
    setName("");
    setLengthM("0");
    setWidthM("0");
    setHeightM("0");
    setCapacityM2("0");
  };

  return (
    <div className="bg-white rounded-2xl shadow-card border border-matcha-50 p-5 space-y-4">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h3 className="font-bold text-base text-matcha-900">Vehicle Types</h3>
          <p className="text-xs text-gray-500">Define master dimensions/capacity for planning/waving.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          <input
            className="px-3 py-2 bg-gray-50 border rounded-lg text-sm"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="px-3 py-2 bg-gray-50 border rounded-lg text-sm"
            placeholder="Length (m)"
            type="number"
            value={lengthM}
            onChange={(e) => setLengthM(e.target.value)}
          />
          <input
            className="px-3 py-2 bg-gray-50 border rounded-lg text-sm"
            placeholder="Width (m)"
            type="number"
            value={widthM}
            onChange={(e) => setWidthM(e.target.value)}
          />
          <input
            className="px-3 py-2 bg-gray-50 border rounded-lg text-sm"
            placeholder="Height (m)"
            type="number"
            value={heightM}
            onChange={(e) => setHeightM(e.target.value)}
          />
          <input
            className="px-3 py-2 bg-gray-50 border rounded-lg text-sm"
            placeholder="Capacity (m²)"
            type="number"
            value={capacityM2}
            onChange={(e) => setCapacityM2(e.target.value)}
          />
          <button
            onClick={handleCreate}
            className="bg-matcha-600 text-white font-bold px-3 py-2 rounded-lg text-sm"
          >
            Add
          </button>
        </div>
      </div>

      <table className="w-full text-left text-xs">
        <thead className="bg-matcha-50 text-matcha-600 uppercase">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Length (m)</th>
            <th className="px-4 py-3">Width (m)</th>
            <th className="px-4 py-3">Height (m)</th>
            <th className="px-4 py-3">Capacity (m²)</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-matcha-50 text-matcha-800">
          {vehicleTypes.map((vt) => (
            <tr key={vt.id}>
              <td className="px-4 py-3 font-bold">{vt.name}</td>
              <td className="px-4 py-3">{vt.lengthM}</td>
              <td className="px-4 py-3">{vt.widthM}</td>
              <td className="px-4 py-3">{vt.heightM ?? "-"}</td>
              <td className="px-4 py-3">{vt.capacityM2}</td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onDelete(vt.id)}
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
