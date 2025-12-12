import type { Carrier } from "../types";

interface CarriersViewProps {
  carriers: Carrier[];
}

export default function CarriersView({ carriers }: CarriersViewProps) {
  return (
    <div className="bg-white rounded-2xl shadow-card border border-matcha-50 overflow-hidden">
      <div className="p-5 border-b border-matcha-100 flex justify-between items-center">
        <h3 className="font-bold text-base text-matcha-900">Carriers</h3>
        <span className="text-xs text-gray-500">{carriers.length} total</span>
      </div>
      <table className="w-full text-left text-xs">
        <thead className="bg-matcha-50 text-matcha-600 uppercase">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Score</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-matcha-50 text-matcha-800">
          {carriers.map((carrier) => (
            <tr key={carrier.id}>
              <td className="px-4 py-3 font-bold">{carrier.name}</td>
              <td className="px-4 py-3">{carrier.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
