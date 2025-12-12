import { useState } from "react";
import type { ItemType } from "../types";

interface ItemTypesViewProps {
  itemTypes: ItemType[];
  onCreate: (it: Omit<ItemType, "id">) => void;
  onDelete: (id: string) => void;
}

export default function ItemTypesView({ itemTypes, onCreate, onDelete }: ItemTypesViewProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [uom, setUom] = useState("");
  const [lengthM, setLengthM] = useState("0");
  const [widthM, setWidthM] = useState("0");
  const [heightM, setHeightM] = useState("0");
  const [weightKg, setWeightKg] = useState("0");
  const uomOptions = ["PC", "PCK", "IPCK", "PLT"];

  const handleCreate = () => {
    if (!name || !code || !uom) return;
    onCreate({
      name,
      code,
      uom,
      lengthM: Number(lengthM) || 0,
      widthM: Number(widthM) || 0,
      heightM: Number(heightM) || 0,
      weightKg: Number(weightKg) || undefined,
    });
    setName("");
    setCode("");
    setUom("");
    setLengthM("0");
    setWidthM("0");
    setHeightM("0");
    setWeightKg("0");
  };

  return (
    <div className="bg-white rounded-2xl shadow-card border border-matcha-50 p-5 space-y-4">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h3 className="font-bold text-base text-matcha-900">Item Types</h3>
          <p className="text-xs text-gray-500">Master items with UoM and dimensions.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2 w-full">
          <input
            className="px-3 py-2 bg-gray-50 border rounded-lg text-sm"
            placeholder="Item name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="px-3 py-2 bg-gray-50 border rounded-lg text-sm"
            placeholder="Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <select
            className="px-3 py-2 bg-gray-50 border rounded-lg text-sm"
            value={uom}
            onChange={(e) => setUom(e.target.value)}
          >
            <option value="">Select UoM</option>
            {uomOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
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
            placeholder="Weight (kg)"
            type="number"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
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
            <th className="px-4 py-3">Code</th>
            <th className="px-4 py-3">UoM</th>
            <th className="px-4 py-3">Dims (m)</th>
            <th className="px-4 py-3">Weight (kg)</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-matcha-50 text-matcha-800">
          {itemTypes.map((it) => (
            <tr key={it.id}>
              <td className="px-4 py-3 font-bold">{it.name}</td>
              <td className="px-4 py-3">{it.code}</td>
              <td className="px-4 py-3">{it.uom}</td>
              <td className="px-4 py-3">
                {it.lengthM} x {it.widthM} x {it.heightM}
              </td>
              <td className="px-4 py-3">{it.weightKg ?? "-"}</td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onDelete(it.id)}
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
