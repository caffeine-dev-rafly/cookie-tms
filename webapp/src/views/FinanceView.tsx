import { useMemo, useState } from "react";
import type { Order, Shipment } from "../types";

interface FinanceViewProps {
  orders: Order[];
  shipments: Shipment[];
  currency: string;
  currencyOptions: { code: string; symbol: string; locale: string }[];
  onCurrencyChange: (code: string) => void;
}

export default function FinanceView({
  orders,
  shipments,
  currency,
  currencyOptions,
  onCurrencyChange,
}: FinanceViewProps) {
  const [ratePerTon, setRatePerTon] = useState("1200");
  const [deliveredOnly, setDeliveredOnly] = useState(false);

  const formatMoney = (value: number) => {
    const meta = currencyOptions.find((c) => c.code === currency) ?? currencyOptions[0];
    return new Intl.NumberFormat(meta.locale, {
      style: "currency",
      currency: meta.code,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const summary = useMemo(() => {
    const effectiveRate = Number(ratePerTon) || 0;
    const scopedOrders = deliveredOnly
      ? orders.filter((o) => o.status === "Delivered")
      : orders;
    const tonnage = scopedOrders.reduce((acc, o) => acc + o.weightTons, 0);
    const delivered = orders.filter((o) => o.status === "Delivered").length;
    const revenueEstimate = tonnage * effectiveRate;
    const inTransit = shipments.filter((s) => s.status === "In Transit").length;
    return { tonnage, delivered, revenueEstimate, inTransit };
  }, [orders, shipments, ratePerTon, deliveredOnly]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-gray-500">
            Rate per Ton ({currency})
          </label>
          <input
            type="number"
            value={ratePerTon}
            onChange={(e) => setRatePerTon(e.target.value)}
            className="px-3 py-2 bg-gray-50 rounded-lg border text-xs"
            min="0"
            step="50"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-gray-500">Currency</label>
          <select
            value={currency}
            onChange={(e) => onCurrencyChange(e.target.value)}
            className="px-3 py-2 bg-gray-50 rounded-lg border text-xs"
          >
            {currencyOptions.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} ({c.symbol})
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-xs font-bold text-gray-600">
          <input
            type="checkbox"
            checked={deliveredOnly}
            onChange={(e) => setDeliveredOnly(e.target.checked)}
            className="w-4 h-4"
          />
          Calculate on delivered only
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-card border border-matcha-50">
          <p className="text-xs font-bold text-teal-600">Revenue (est.)</p>
          <h3 className="text-2xl font-bold text-matcha-900">
            {formatMoney(summary.revenueEstimate)}
          </h3>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-card border border-matcha-50">
          <p className="text-xs font-bold text-gray-500">Total Tonnage</p>
          <h3 className="text-2xl font-bold text-matcha-900">{summary.tonnage.toFixed(1)} T</h3>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-card border border-matcha-50">
          <p className="text-xs font-bold text-green-600">Delivered Orders</p>
          <h3 className="text-2xl font-bold text-green-700">{summary.delivered}</h3>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-card border border-matcha-50">
          <p className="text-xs font-bold text-orange-600">In Transit</p>
          <h3 className="text-2xl font-bold text-orange-700">{summary.inTransit}</h3>
        </div>
      </div>
    </div>
  );
}
