import { useState } from "react";
import type { Order, OrderStatus, OrderItem } from "../types";

interface CustomerViewProps {
  onCreateOrder: (order: Omit<Order, "id" | "status" | "items" | "weightTons"> & { status?: OrderStatus; items?: OrderItem[]; weightTons?: number }) => void;
}

export default function CustomerView({ onCreateOrder }: CustomerViewProps) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [weight, setWeight] = useState("1.0");
  const [due, setDue] = useState("");
  const [company, setCompany] = useState("Guest");
  const [itemName, setItemName] = useState("Customer Item");

  const handleSubmit = () => {
    if (!origin || !destination || !due) return;
    const item: OrderItem = {
      id: "IT-CUST",
      name: itemName,
      uom: "Unit",
      lengthM: 1,
      widthM: 1,
      heightM: 1,
      weightKg: Number(weight) * 1000 || 0,
    };
    onCreateOrder({
      customer: company,
      origin,
      destination,
      items: [item],
      weightTons: Number(weight) || 0,
      due,
      status: "Pending",
    });
    setOrigin("");
    setDestination("");
    setWeight("1.0");
    setDue("");
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-card border border-pink-100 space-y-3">
      <h3 className="font-bold text-lg text-pink-700 mb-2">Book Shipment</h3>
      <input
        type="text"
        placeholder="Company"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        className="w-full px-3 py-2 bg-pink-50 rounded-lg border text-sm"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input
          type="text"
          placeholder="Origin"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          className="w-full px-3 py-2 bg-pink-50 rounded-lg border text-sm"
        />
        <input
          type="text"
          placeholder="Destination"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="w-full px-3 py-2 bg-pink-50 rounded-lg border text-sm"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input
          type="number"
          step="0.1"
          placeholder="Weight (T)"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="w-full px-3 py-2 bg-pink-50 rounded-lg border text-sm"
        />
        <input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          className="w-full px-3 py-2 bg-pink-50 rounded-lg border text-sm"
        />
      </div>
      <button
        onClick={handleSubmit}
        className="w-full bg-pink-600 text-white font-bold py-3 rounded-xl disabled:opacity-60"
        disabled={!origin || !destination}
      >
        Book
      </button>
    </div>
  );
}
