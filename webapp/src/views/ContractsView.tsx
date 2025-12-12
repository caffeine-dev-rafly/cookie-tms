import { useState } from "react";
import type { Carrier, RateContract, Tender } from "../types";

interface ContractsViewProps {
  contracts: RateContract[];
  tenders: Tender[];
  carriers: Carrier[];
  onCreateContract: (contract: Omit<RateContract, "id">) => void;
  onCreateTender: (tender: Omit<Tender, "id" | "status">) => void;
  onDeleteContract: (id: string) => void;
  onDeleteTender: (id: string) => void;
}

export default function ContractsView({
  contracts,
  tenders,
  carriers,
  onCreateContract,
  onCreateTender,
  onDeleteContract,
  onDeleteTender,
}: ContractsViewProps) {
  const [name, setName] = useState("");
  const [lane, setLane] = useState("");
  const [rate, setRate] = useState("1200");
  const [currency, setCurrency] = useState("USD");
  const [fuel, setFuel] = useState("12");
  const [carrierId, setCarrierId] = useState(carriers[0]?.id ?? "");
  const [accessorials, setAccessorials] = useState("");
  const [tenderShipment, setTenderShipment] = useState("");
  const [tenderCarrier, setTenderCarrier] = useState(carriers[0]?.id ?? "");
  const [tenderQuote, setTenderQuote] = useState("0");

  const handleContract = () => {
    if (!name || !lane) return;
    onCreateContract({
      name,
      lane,
      ratePerTon: Number(rate) || 0,
      currency,
      fuelSurchargePct: Number(fuel) || 0,
      accessorials,
      validFrom: new Date().toISOString().slice(0, 10),
      carrierId,
    });
    setName("");
    setLane("");
    setRate("1200");
    setFuel("12");
    setAccessorials("");
  };

  const handleTender = () => {
    if (!tenderShipment) return;
    onCreateTender({
      shipmentId: tenderShipment,
      carrierId: tenderCarrier,
      quote: Number(tenderQuote) || undefined,
      currency,
    });
    setTenderShipment("");
    setTenderQuote("0");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white rounded-2xl shadow-card border border-matcha-50 p-5 space-y-3">
        <h3 className="font-bold text-base text-matcha-900">Rate Contracts</h3>
        <div className="grid grid-cols-2 gap-2">
          <input
            className="px-3 py-2 bg-gray-50 border rounded-lg text-sm"
            placeholder="Contract name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="px-3 py-2 bg-gray-50 border rounded-lg text-sm"
            placeholder="Lane (e.g., Tokyo > Osaka)"
            value={lane}
            onChange={(e) => setLane(e.target.value)}
          />
          <input
            className="px-3 py-2 bg-gray-50 border rounded-lg text-sm"
            placeholder="Rate per ton"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            type="number"
          />
          <div className="flex gap-2">
            <input
              className="px-3 py-2 bg-gray-50 border rounded-lg text-sm w-full"
              placeholder="Fuel %"
              value={fuel}
              onChange={(e) => setFuel(e.target.value)}
              type="number"
            />
            <select
              className="px-3 py-2 bg-gray-50 border rounded-lg text-sm"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option>USD</option>
              <option>IDR</option>
              <option>EUR</option>
            </select>
          </div>
          <select
            className="px-3 py-2 bg-gray-50 border rounded-lg text-sm col-span-2"
            value={carrierId}
            onChange={(e) => setCarrierId(e.target.value)}
          >
            {carriers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            className="px-3 py-2 bg-gray-50 border rounded-lg text-sm col-span-2"
            placeholder="Accessorials"
            value={accessorials}
            onChange={(e) => setAccessorials(e.target.value)}
          />
          <button
            onClick={handleContract}
            className="bg-matcha-600 text-white font-bold py-2 rounded-lg text-sm col-span-2"
          >
            Add Contract
          </button>
        </div>
        <div className="divide-y divide-matcha-50">
          {contracts.map((c) => (
            <div key={c.id} className="py-2 text-sm flex justify-between items-start">
              <div>
                <p className="font-bold text-matcha-900">{c.name}</p>
                <p className="text-xs text-gray-500">
                  {c.lane} — {c.currency} {c.ratePerTon}/T, Fuel {c.fuelSurchargePct}%
                </p>
                <p className="text-[11px] text-gray-400">Valid: {c.validFrom}</p>
              </div>
              <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded">
                {c.carrierId}
              </span>
              <button
                onClick={() => onDeleteContract(c.id)}
                className="text-[11px] text-red-600 font-bold ml-2"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-matcha-50 p-5 space-y-3">
        <h3 className="font-bold text-base text-matcha-900">Carrier Tenders</h3>
        <div className="grid grid-cols-2 gap-2">
          <input
            className="px-3 py-2 bg-gray-50 border rounded-lg text-sm"
            placeholder="Shipment ID"
            value={tenderShipment}
            onChange={(e) => setTenderShipment(e.target.value)}
          />
          <select
            className="px-3 py-2 bg-gray-50 border rounded-lg text-sm"
            value={tenderCarrier}
            onChange={(e) => setTenderCarrier(e.target.value)}
          >
            {carriers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            className="px-3 py-2 bg-gray-50 border rounded-lg text-sm"
            placeholder="Quote"
            type="number"
            value={tenderQuote}
            onChange={(e) => setTenderQuote(e.target.value)}
          />
          <button
            onClick={handleTender}
            className="bg-matcha-600 text-white font-bold py-2 rounded-lg text-sm"
          >
            Create Tender
          </button>
        </div>
        <div className="divide-y divide-matcha-50">
          {tenders.map((t) => (
            <div key={t.id} className="py-2 text-sm flex justify-between items-center">
              <div>
                <p className="font-bold text-matcha-900">
                  {t.id} — {t.carrierId}
                </p>
                <p className="text-xs text-gray-500">
                  Shipment {t.shipmentId} | Quote: {t.currency ?? "USD"} {t.quote ?? "-"}
                </p>
              </div>
              <span className="text-[10px] bg-matcha-50 text-matcha-700 px-2 py-1 rounded">{t.status}</span>
              <button
                onClick={() => onDeleteTender(t.id)}
                className="text-[11px] text-red-600 font-bold ml-2"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
