import { useState } from "react";
import type { Destination } from "../types";

interface DestinationsViewProps {
  destinations: Destination[];
  onCreate: (destination: Omit<Destination, "id" | "status">) => void;
  onDelete: (id: string) => void;
}

export default function DestinationsView({ destinations, onCreate, onDelete }: DestinationsViewProps) {
  const [name, setName] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  const handleSubmit = () => {
    if (!name || !lat || !lng) return;
    onCreate({ name, lat: Number(lat), lng: Number(lng) });
    setName("");
    setLat("");
    setLng("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white p-5 rounded-2xl shadow-card border border-matcha-50">
        <h3 className="font-bold text-base text-matcha-900 mb-4">Add Destination</h3>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold text-gray-500">Location Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-gray-50 rounded-lg border text-xs"
              placeholder="e.g. Tokyo Central Hub"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-gray-500">Latitude</label>
              <input
                type="number"
                className="w-full px-3 py-2 bg-gray-50 rounded-lg border text-xs"
                placeholder="35.6895"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500">Longitude</label>
              <input
                type="number"
                className="w-full px-3 py-2 bg-gray-50 rounded-lg border text-xs"
                placeholder="139.6917"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
              />
            </div>
          </div>
          <button
            onClick={handleSubmit}
            className="w-full bg-matcha-600 text-white font-bold py-2.5 rounded-xl text-xs mt-2"
          >
            Save Location
          </button>
        </div>
      </div>
      <div className="lg:col-span-2 bg-white rounded-2xl shadow-card border border-matcha-50 overflow-hidden">
        <div className="p-5 border-b border-matcha-100">
          <h3 className="font-bold text-base text-matcha-900">Registered Locations</h3>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-matcha-50 text-matcha-600 uppercase">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Coords</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-matcha-50 text-matcha-800">
            {destinations.map((d) => (
              <tr key={d.id}>
                <td className="px-4 py-3 font-bold">{d.name}</td>
                <td className="px-4 py-3 font-mono text-[10px]">
                  {d.lat.toFixed(4)}, {d.lng.toFixed(4)}
                </td>
                <td className="px-4 py-3 text-green-600 font-bold">{d.status}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onDelete(d.id)}
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
