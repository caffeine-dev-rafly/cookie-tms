import { useState } from "react";
import type { ContainerType } from "../types";

interface ContainerTypesViewProps {
  containerTypes: ContainerType[];
  onCreate: (ct: Omit<ContainerType, "id">) => void;
  onDelete: (id: string) => void;
  onAdjustStock: (id: string, delta: number) => void;
}

export default function ContainerTypesView({ containerTypes, onCreate, onDelete, onAdjustStock }: ContainerTypesViewProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isRollCage, setIsRollCage] = useState(false);
  const [isReturnable, setIsReturnable] = useState(true);
  const [lengthM, setLengthM] = useState("0");
  const [widthM, setWidthM] = useState("0");
  const [heightM, setHeightM] = useState("0");
  const [capacityM2, setCapacityM2] = useState("0");
  const [weightKg, setWeightKg] = useState("0");
  const [stockQty, setStockQty] = useState("0");
  const [stockAdjustments, setStockAdjustments] = useState<Record<string, string>>({});

  const handleCreate = () => {
    if (!name) return;
    onCreate({
      name,
      description,
      isRollCage,
      isReturnable,
      lengthM: Number(lengthM) || undefined,
      widthM: Number(widthM) || undefined,
      heightM: Number(heightM) || undefined,
      capacityM2: Number(capacityM2) || undefined,
      weightKg: Number(weightKg) || undefined,
      stockQty: Number(stockQty) || 0,
    });
    setName("");
    setDescription("");
    setIsRollCage(false);
    setIsReturnable(true);
    setLengthM("0");
    setWidthM("0");
    setHeightM("0");
    setCapacityM2("0");
    setWeightKg("0");
    setStockQty("0");
  };

  const applyAdjustment = (id: string) => {
    const delta = Number(stockAdjustments[id]);
    if (!delta) return;
    onAdjustStock(id, delta);
    setStockAdjustments((prev) => ({ ...prev, [id]: "" }));
  };

  return (
    <div className="bg-white rounded-2xl shadow-card border border-matcha-50 p-5 space-y-4">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <h3 className="font-bold text-base text-matcha-900">Containers</h3>
          <p className="text-xs text-gray-500">Manage container/empties/roll cages master data.</p>
        </div>

        <div className="space-y-3 w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-gray-600 uppercase">Name</label>
              <input
                className="px-3 py-2 bg-gray-50 border rounded-lg text-sm"
                placeholder="Name (e.g., Roll Cage)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-[11px] font-semibold text-gray-600 uppercase">Description</label>
              <input
                className="px-3 py-2 bg-gray-50 border rounded-lg text-sm"
                placeholder="Description or notes"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-gray-600 uppercase">Length (m)</label>
              <input
                className="px-3 py-2 bg-gray-50 border rounded-lg text-sm"
                placeholder="0"
                type="number"
                value={lengthM}
                onChange={(e) => setLengthM(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-gray-600 uppercase">Width (m)</label>
              <input
                className="px-3 py-2 bg-gray-50 border rounded-lg text-sm"
                placeholder="0"
                type="number"
                value={widthM}
                onChange={(e) => setWidthM(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-gray-600 uppercase">Height (m)</label>
              <input
                className="px-3 py-2 bg-gray-50 border rounded-lg text-sm"
                placeholder="0"
                type="number"
                value={heightM}
                onChange={(e) => setHeightM(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-gray-600 uppercase">Capacity (m2)</label>
              <input
                className="px-3 py-2 bg-gray-50 border rounded-lg text-sm"
                placeholder="0"
                type="number"
                value={capacityM2}
                onChange={(e) => setCapacityM2(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-gray-600 uppercase">Weight (kg)</label>
              <input
                className="px-3 py-2 bg-gray-50 border rounded-lg text-sm"
                placeholder="0"
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-gray-600 uppercase">On hand qty</label>
              <input
                className="px-3 py-2 bg-gray-50 border rounded-lg text-sm"
                placeholder="0"
                type="number"
                value={stockQty}
                onChange={(e) => setStockQty(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-600">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isRollCage}
                  onChange={(e) => setIsRollCage(e.target.checked)}
                  className="w-4 h-4"
                />
                Roll Cage
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isReturnable}
                  onChange={(e) => setIsReturnable(e.target.checked)}
                  className="w-4 h-4"
                />
                Returnable
              </label>
            </div>
            <button
              onClick={handleCreate}
              className="bg-matcha-600 text-white font-bold px-4 py-2 rounded-lg text-sm md:self-end"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="bg-matcha-50/60 border border-matcha-100 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <p className="text-sm font-bold text-matcha-900">Inventory management</p>
            <p className="text-[11px] text-gray-600">Adjust on-hand quantity quickly without editing the master.</p>
          </div>
          <p className="text-[11px] text-gray-500">
            Total on hand:{" "}
            <span className="font-bold text-matcha-800">
              {containerTypes.reduce((acc, ct) => acc + (ct.stockQty ?? 0), 0)}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {containerTypes.map((ct) => (
            <div key={ct.id} className="p-3 bg-white rounded-lg border border-matcha-100 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-matcha-900">{ct.name}</p>
                <span className="text-[10px] bg-matcha-50 text-matcha-800 px-2 py-0.5 rounded-full font-bold">
                  On hand: {ct.stockQty ?? 0}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px]">
                <button
                  className="px-2 py-1 rounded bg-gray-100 text-gray-700 font-bold disabled:opacity-50"
                  onClick={() => onAdjustStock(ct.id, -1)}
                  disabled={(ct.stockQty ?? 0) <= 0}
                >
                  -1
                </button>
                <button
                  className="px-2 py-1 rounded bg-gray-100 text-gray-700 font-bold"
                  onClick={() => onAdjustStock(ct.id, 1)}
                >
                  +1
                </button>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    className="w-20 px-2 py-1 bg-gray-50 border rounded"
                    placeholder="+/-"
                    value={stockAdjustments[ct.id] ?? ""}
                    onChange={(e) =>
                      setStockAdjustments((prev) => ({
                        ...prev,
                        [ct.id]: e.target.value,
                      }))
                    }
                  />
                  <button
                    className="px-2 py-1 rounded bg-matcha-600 text-white font-bold"
                    onClick={() => applyAdjustment(ct.id)}
                    disabled={!stockAdjustments[ct.id]}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          ))}
          {containerTypes.length === 0 && <p className="text-xs text-gray-500">No containers yet.</p>}
        </div>
      </div>

      <table className="w-full text-left text-xs">
        <thead className="bg-matcha-50 text-matcha-600 uppercase">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Description</th>
            <th className="px-4 py-3">Roll Cage</th>
            <th className="px-4 py-3">Returnable</th>
            <th className="px-4 py-3">Dims (m)</th>
            <th className="px-4 py-3">Cap (m2)</th>
            <th className="px-4 py-3">Weight (kg)</th>
            <th className="px-4 py-3">On Hand</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-matcha-50 text-matcha-800">
          {containerTypes.map((ct) => (
            <tr key={ct.id}>
              <td className="px-4 py-3 font-bold">{ct.name}</td>
              <td className="px-4 py-3">{ct.description ?? "-"}</td>
              <td className="px-4 py-3">{ct.isRollCage ? "Yes" : "No"}</td>
              <td className="px-4 py-3">{ct.isReturnable ? "Yes" : "No"}</td>
              <td className="px-4 py-3">
                {ct.lengthM ?? "-"} x {ct.widthM ?? "-"} x {ct.heightM ?? "-"}
              </td>
              <td className="px-4 py-3">{ct.capacityM2 ?? "-"}</td>
              <td className="px-4 py-3">{ct.weightKg ?? "-"}</td>
              <td className="px-4 py-3 font-bold">{ct.stockQty ?? 0}</td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onDelete(ct.id)}
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
