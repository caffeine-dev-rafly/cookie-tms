import { useState } from "react";
import type { Part } from "../types";

interface PartsViewProps {
  parts: Part[];
  onCreate: (part: Omit<Part, "id">) => void;
  onDelete: (id: string) => void;
}

export default function PartsView({ parts, onCreate, onDelete }: PartsViewProps) {
  const [name, setName] = useState("");
  const [stock, setStock] = useState("0");

  const handleCreate = () => {
    if (!name) return;
    onCreate({ name, stock: Number(stock) || 0 });
    setName("");
    setStock("0");
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div className="bg-white p-4 rounded-2xl shadow-card border border-matcha-50">
        <h3 className="font-bold text-sm text-matcha-900 mb-3">Add Part</h3>
        <div className="space-y-2">
          <input
            type="text"
            className="w-full px-3 py-2 bg-gray-50 rounded-lg border text-xs"
            placeholder="Part name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="number"
            className="w-full px-3 py-2 bg-gray-50 rounded-lg border text-xs"
            placeholder="Stock"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
          <button
            onClick={handleCreate}
            className="w-full bg-matcha-600 text-white font-bold py-2 rounded-lg text-xs mt-2"
          >
            Save Part
          </button>
        </div>
      </div>
      <div className="xl:col-span-2 bg-white rounded-2xl shadow-card border border-matcha-50 overflow-hidden">
        <div className="p-4 border-b border-matcha-100">
          <h3 className="font-bold text-sm text-matcha-900">Parts Inventory</h3>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-matcha-50 text-matcha-600 uppercase">
            <tr>
              <th className="px-4 py-3">Part</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {parts.map((part) => (
              <tr key={part.id}>
                <td className="px-4 py-3 font-bold">{part.name}</td>
                <td className="px-4 py-3">{part.stock}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onDelete(part.id)}
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
    </div>
  );
}
