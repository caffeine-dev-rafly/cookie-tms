import { useState } from "react";
import type { Invoice } from "../types";

interface BillingViewProps {
  invoices: Invoice[];
  currency: string;
  currencyOptions: { code: string; symbol: string; locale: string }[];
  onCreate: (invoice: Omit<Invoice, "id" | "status">) => void;
  onStatusChange: (id: string, status: Invoice["status"]) => void;
  onDelete: (id: string) => void;
}

export default function BillingView({
  invoices,
  currency,
  currencyOptions,
  onCreate,
  onStatusChange,
  onDelete,
}: BillingViewProps) {
  const [orderId, setOrderId] = useState("");
  const [shipmentId, setShipmentId] = useState("");
  const [amount, setAmount] = useState("0");
  const [due, setDue] = useState("");
  const [localCurrency, setLocalCurrency] = useState(currency);

  const formatMoney = (value: number) => {
    const meta = currencyOptions.find((c) => c.code === localCurrency) ?? currencyOptions[0];
    return new Intl.NumberFormat(meta.locale, {
      style: "currency",
      currency: meta.code,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleCreate = () => {
    if (!orderId && !shipmentId) return;
    onCreate({
      orderId: orderId || undefined,
      shipmentId: shipmentId || undefined,
      currency: localCurrency,
      amount: Number(amount) || 0,
      dueDate: due || undefined,
    });
    setOrderId("");
    setShipmentId("");
    setAmount("0");
    setDue("");
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-card border border-matcha-50 p-4">
        <h3 className="font-bold text-base text-matcha-900 mb-3">Create Invoice</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <input
            className="px-3 py-2 bg-gray-50 border rounded-lg text-sm"
            placeholder="Order ID"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
          />
          <input
            className="px-3 py-2 bg-gray-50 border rounded-lg text-sm"
            placeholder="Shipment ID"
            value={shipmentId}
            onChange={(e) => setShipmentId(e.target.value)}
          />
          <input
            className="px-3 py-2 bg-gray-50 border rounded-lg text-sm"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
          />
          <input
            className="px-3 py-2 bg-gray-50 border rounded-lg text-sm"
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
          />
          <select
            className="px-3 py-2 bg-gray-50 border rounded-lg text-sm"
            value={localCurrency}
            onChange={(e) => setLocalCurrency(e.target.value)}
          >
            {currencyOptions.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} ({c.symbol})
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleCreate}
          className="mt-3 bg-matcha-600 text-white font-bold px-4 py-2 rounded-lg text-sm"
        >
          Save Invoice
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-matcha-50 overflow-hidden">
        <div className="p-4 border-b border-matcha-100 flex justify-between items-center">
          <h3 className="font-bold text-base text-matcha-900">Invoices & Payments</h3>
          <span className="text-xs text-gray-500">{invoices.length} records</span>
        </div>
        <table className="w-full text-left text-xs">
        <thead className="bg-matcha-50 text-matcha-600 uppercase">
          <tr>
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3">Order/Shipment</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Due</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-matcha-50 text-matcha-800">
          {invoices.map((inv) => (
            <tr key={inv.id}>
                <td className="px-4 py-3 font-bold">{inv.id}</td>
                <td className="px-4 py-3">
                  {inv.orderId ? `Order ${inv.orderId}` : ""} {inv.shipmentId ? `Ship ${inv.shipmentId}` : ""}
                </td>
                <td className="px-4 py-3">
                  {formatMoney(inv.amount)} {inv.currency}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={inv.status}
                    onChange={(e) => onStatusChange(inv.id, e.target.value as Invoice["status"])}
                    className="text-xs bg-matcha-50 border border-matcha-200 rounded px-2 py-1 font-bold"
                >
                  <option>Draft</option>
                  <option>Sent</option>
                  <option>Approved</option>
                  <option>Paid</option>
                </select>
              </td>
              <td className="px-4 py-3">{inv.dueDate ?? "-"}</td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onDelete(inv.id)}
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
