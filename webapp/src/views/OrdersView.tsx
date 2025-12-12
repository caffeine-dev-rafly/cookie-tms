import { useMemo, useRef, useState } from "react";
import type { Customer, Destination, ItemType, Order, OrderStatus } from "../types";

interface OrdersViewProps {
  orders: Order[];
  onCreate: (order: Omit<Order, "id" | "status"> & { status?: OrderStatus }) => void;
  onStatusChange: (id: string, status: OrderStatus) => void;
  onDelete: (id: string) => void;
  onWave: (ids: string[]) => void;
  itemTypes: ItemType[];
  destinations: Destination[];
  customers: Customer[];
}

export default function OrdersView({
  orders,
  onCreate,
  onStatusChange,
  onDelete,
  onWave,
  itemTypes,
  destinations,
  customers,
}: OrdersViewProps) {
  const [customer, setCustomer] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [item, setItem] = useState("");
  const [itemCode, setItemCode] = useState("");
  const [uom, setUom] = useState("");
  const [itemTypeId, setItemTypeId] = useState("");
  const [due, setDue] = useState("");
  const [notes, setNotes] = useState("");
  const [itemsDraft, setItemsDraft] = useState<
    { id: string; name: string; code?: string; uom: string; lengthM: number; widthM: number; heightM: number; weightKg: number }[]
  >([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterDueDate, setFilterDueDate] = useState("");
  const [filterCreatedDate, setFilterCreatedDate] = useState("");
  const allSelected = selectedIds.length === orders.length && orders.length > 0;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const [exportType, setExportType] = useState<"json" | "csv" | "xml">("json");
  const downloadFile = (content: string, mime: string, filename: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const summary = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === "Pending" || o.status === "New").length;
    const delivered = orders.filter((o) => o.status === "Delivered").length;
    return { total, pending, delivered };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesDue = filterDueDate ? o.due === filterDueDate : true;
      const createdDate = (o as any).createdAt as string | undefined;
      const matchesCreated = filterCreatedDate
        ? createdDate
          ? createdDate.startsWith(filterCreatedDate)
          : false
        : true;
      return matchesDue && matchesCreated;
    });
  }, [orders, filterDueDate, filterCreatedDate]);

  const uomOptions = useMemo(() => {
    const set = new Set(itemTypes.map((i) => i.uom));
    return Array.from(set);
  }, [itemTypes]);

  const handleSelectItemType = (id: string) => {
    const found = itemTypes.find((i) => i.id === id);
    if (found) {
      setItem(found.name);
      setItemCode(found.code);
      setUom(found.uom);
      setItemTypeId(found.id);
    }
  };

  const handleItemNameChange = (value: string) => {
    setItem(value);
    const found = itemTypes.find((i) => i.name.toLowerCase() === value.toLowerCase());
    if (found) handleSelectItemType(found.id);
    else setItemTypeId("");
  };

  const handleItemCodeChange = (value: string) => {
    setItemCode(value);
    const found = itemTypes.find((i) => i.code.toLowerCase() === value.toLowerCase());
    if (found) handleSelectItemType(found.id);
    else setItemTypeId("");
  };

  const addDraftItem = () => {
    if (!item) return;
    const meta = itemTypes.find((i) => i.id === itemTypeId);
    const resolvedUom = uom || meta?.uom || uomOptions[0] || "";
    if (!resolvedUom) return;
    const id = `IT-${itemsDraft.length + 1}`;
    setItemsDraft((prev) => [
      ...prev,
      {
        id,
        name: item,
        code: itemCode,
        uom: resolvedUom,
        lengthM: meta?.lengthM ?? 0,
        widthM: meta?.widthM ?? 0,
        heightM: meta?.heightM ?? 0,
        weightKg: meta?.weightKg ?? 0,
      },
    ]);
    setItem("");
    setItemCode("");
    setUom("");
    setItemTypeId("");
  };

  const removeDraftItem = (id: string) => {
    setItemsDraft((prev) => prev.filter((i) => i.id !== id));
  };

  const handleSubmit = () => {
    if (!customer || !destination || !due || itemsDraft.length === 0) return;
    const totalWeightTons = itemsDraft.reduce((acc, i) => acc + (i.weightKg || 0), 0) / 1000;
    onCreate({
      customer,
      origin,
      destination,
      items: itemsDraft,
      weightTons: totalWeightTons,
      due,
      notes,
    });
    setCustomer("");
    setOrigin("");
    setDestination("");
    setItemsDraft([]);
    setDue("");
    setNotes("");
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(orders.map((o) => o.id));
    }
  };

  const processWave = () => {
    if (selectedIds.length === 0) return;
    onWave(selectedIds);
    setSelectedIds([]);
  };

  const exportByType = () => {
    if (exportType === "json") {
      const payload = JSON.stringify(orders, null, 2);
      downloadFile(payload, "application/json", "orders.json");
    } else if (exportType === "csv") {
      const header = ["OrderID", "Customer", "Destination", "Due", "Status", "Items", "WeightTons"];
      const rows = orders.map((o) =>
        [
          o.id,
          o.customer,
          o.destination,
          o.due,
          o.status,
          o.items.map((i) => i.name).join("|"),
          o.weightTons.toFixed(2),
        ].join(",")
      );
      downloadFile([header.join(","), ...rows].join("\n"), "text/csv", "orders.csv");
    } else if (exportType === "xml") {
      const body = orders
        .map(
          (o) =>
            `<order id="${o.id}"><customer>${o.customer}</customer><destination>${o.destination}</destination><due>${o.due}</due><status>${o.status}</status>${o.items
              .map(
                (i) =>
                  `<item><name>${i.name}</name><code>${i.code ?? ""}</code><uom>${i.uom}</uom><length>${i.lengthM}</length><width>${i.widthM}</width><height>${i.heightM}</height><weightKg>${i.weightKg}</weightKg></item>`
              )
              .join("")}</order>`
        )
        .join("");
      const xml = `<?xml version="1.0" encoding="UTF-8"?><orders>${body}</orders>`;
      downloadFile(xml, "application/xml", "orders.xml");
    }
  };

  const parseAndImport = (content: string, type: string) => {
    try {
      let records: any[] = [];
      if (type === "json") {
        const parsed = JSON.parse(content);
        records = Array.isArray(parsed) ? parsed : [parsed];
      } else if (type === "csv") {
        const lines = content.split(/\r?\n/).filter(Boolean);
        if (lines.length > 1) {
          const [, ...rows] = lines;
          records = rows.map((row) => {
            const [customer, destination, due, itemName, uom] = row.split(",");
            return { customer, destination, due, items: [{ name: itemName, uom }] };
          });
        }
      } else if (type === "xml") {
        const parser = new DOMParser();
        const xml = parser.parseFromString(content, "application/xml");
        const orderNodes = Array.from(xml.getElementsByTagName("order"));
        records = orderNodes.map((node) => ({
          customer: node.getElementsByTagName("customer")[0]?.textContent ?? "",
          destination: node.getElementsByTagName("destination")[0]?.textContent ?? "",
          due: node.getElementsByTagName("due")[0]?.textContent ?? "",
          items: Array.from(node.getElementsByTagName("item")).map((it) => ({
            name: it.getElementsByTagName("name")[0]?.textContent ?? "Imported Item",
            uom: it.getElementsByTagName("uom")[0]?.textContent ?? "Unit",
          })),
        }));
      }

      records.forEach((rec, idx) => {
        const items =
          rec.items?.map((i: any, itemIdx: number) => ({
            id: `IMP-${Date.now()}-${idx}-${itemIdx}`,
            name: i.name ?? "Imported Item",
            code: i.code ?? "",
            uom: i.uom ?? uomOptions[0] ?? "Unit",
            lengthM: Number(i.lengthM) || 0,
            widthM: Number(i.widthM) || 0,
            heightM: Number(i.heightM) || 0,
            weightKg: Number(i.weightKg) || 0,
          })) ?? [
            {
              id: `IMP-${Date.now()}-${idx}-0`,
              name: "Imported Item",
              code: "",
              uom: uomOptions[0] ?? "Unit",
              lengthM: 0,
              widthM: 0,
              heightM: 0,
              weightKg: 0,
            },
          ];

        onCreate({
          customer: rec.customer || "Imported Customer",
          origin: rec.origin || "",
          destination: rec.destination || "",
          items,
          weightTons: items.reduce((acc: number, i: any) => acc + (i.weightKg || 0), 0) / 1000,
          due: rec.due || "",
          notes: rec.notes || "",
        });
      });
    } catch (err) {
      console.error("Import failed", err);
    }
  };

  const handleImport = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result);
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "csv") parseAndImport(content, "csv");
      else if (ext === "xml") parseAndImport(content, "xml");
      else parseAndImport(content, "json");
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl shadow-card border border-matcha-50">
          <p className="text-xs text-gray-500">Total Orders</p>
          <p className="text-2xl font-bold text-matcha-900">{summary.total}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-card border border-matcha-50">
          <p className="text-xs text-gray-500">Pending / New</p>
          <p className="text-2xl font-bold text-orange-500">{summary.pending}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-card border border-matcha-50">
          <p className="text-xs text-gray-500">Delivered</p>
          <p className="text-2xl font-bold text-green-600">{summary.delivered}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-matcha-50 overflow-hidden">
        <div className="p-5 border-b border-matcha-100 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-matcha-900">Order Management</h3>
              <p className="text-xs text-gray-500">Capture customer orders using masters and bulk actions.</p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex gap-2 bg-gray-50 border border-gray-200 rounded-lg p-2 items-center">
                <select
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value as typeof exportType)}
                  className="px-2 py-1 bg-white border border-gray-200 rounded text-[11px] font-bold text-matcha-700"
                >
                  <option value="json">JSON</option>
                  <option value="csv">CSV</option>
                  <option value="xml">XML</option>
                </select>
                <button
                  onClick={exportByType}
                  className="bg-white text-matcha-700 px-3 py-1.5 rounded-md text-[11px] font-bold shadow-sm"
                >
                  Export
                </button>
              </div>
              <div className="flex items-center gap-2 bg-matcha-50 border border-matcha-200 rounded-lg px-3 py-1.5">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-matcha-600 text-white px-3 py-1 rounded-md text-[11px] font-bold shadow-sm"
                  title="Import orders from JSON, CSV, or XML"
                >
                  Import
                </button>
                <span className="text-[11px] text-matcha-700">JSON / CSV / XML</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.csv,.xml"
                  onChange={(e) => handleImport(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gray-600">Customer</span>
              <input
                type="text"
                placeholder="Customer"
                value={customer}
                list="customer-options"
                onChange={(e) => setCustomer(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
              />
              <datalist id="customer-options">
                {customers.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gray-600">Destination</span>
              <input
                type="text"
                placeholder="Destination"
                list="destination-options"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
              />
              <datalist id="destination-options">
                {destinations.map((d) => (
                  <option key={d.id} value={d.name} />
                ))}
              </datalist>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gray-600">Requested Date</span>
              <input
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gray-600">Notes</span>
              <input
                type="text"
                placeholder="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="rounded-xl border border-matcha-100 bg-matcha-50/50 p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-matcha-800">Items</span>
              <button
                onClick={addDraftItem}
                className="bg-matcha-600 hover:bg-matcha-700 text-white px-3 py-1 rounded-lg text-[11px] font-bold"
              >
                + Add Item
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
              <div className="flex flex-col">
                <input
                  type="text"
                  placeholder="Item Name"
                  list="item-name-options"
                  value={item}
                  onChange={(e) => handleItemNameChange(e.target.value)}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"
                />
                <datalist id="item-name-options">
                  {itemTypes.map((it) => (
                    <option key={it.id} value={it.name} />
                  ))}
                </datalist>
              </div>
              <div className="flex flex-col">
                <input
                  type="text"
                  placeholder="Item Code"
                  list="item-code-options"
                  value={itemCode}
                  onChange={(e) => handleItemCodeChange(e.target.value)}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"
                />
                <datalist id="item-code-options">
                  {itemTypes.map((it) => (
                    <option key={it.id} value={it.code} />
                  ))}
                </datalist>
              </div>
              <div className="flex flex-col">
                <select
                  value={uom}
                  onChange={(e) => setUom(e.target.value)}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"
                >
                  <option value="">Select UoM</option>
                  {uomOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col md:col-span-3">
                <p className="text-[11px] text-gray-500">
                  Item details and dimensions pulled from Item Master.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSubmit}
              className="bg-green-700 hover:bg-green-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2"
            >
              Save Order
            </button>
            <button
              onClick={processWave}
              disabled={selectedIds.length === 0}
              className="bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2"
              title="Select orders (Ctrl+A selects all rows in the table when focused) and click to wave"
            >
              Process Wave ({selectedIds.length})
            </button>
          
          </div>
        </div>
        <div className="p-4 space-y-3">
          <h4 className="font-bold text-sm text-matcha-900 mb-2">Draft Items</h4>
          <div className="flex flex-wrap gap-2 mb-4">
            {itemsDraft.map((it) => (
              <span
                key={it.id}
                className="bg-matcha-50 border border-matcha-100 rounded-full px-3 py-1 text-[11px] flex items-center gap-2"
              >
                {it.name} {it.code ? `(${it.code})` : ""} [{it.uom}]
                <button
                  onClick={() => removeDraftItem(it.id)}
                  className="text-red-600 font-bold"
                >
                  ×
                </button>
              </span>
            ))}
            {itemsDraft.length === 0 && <span className="text-xs text-gray-500">No draft items yet.</span>}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-600">
            <div className="flex items-center gap-2">
              <span className="font-bold text-matcha-800">Filter by Due Date:</span>
              <input
                type="date"
                value={filterDueDate}
                onChange={(e) => setFilterDueDate(e.target.value)}
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
              />
              {filterDueDate && (
                <button
                  onClick={() => setFilterDueDate("")}
                  className="text-matcha-700 font-bold px-2 py-1 bg-matcha-50 rounded"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-matcha-800">Filter by Created Date:</span>
              <input
                type="date"
                value={filterCreatedDate}
                onChange={(e) => setFilterCreatedDate(e.target.value)}
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
              />
              {filterCreatedDate && (
                <button
                  onClick={() => setFilterCreatedDate("")}
                  className="text-matcha-700 font-bold px-2 py-1 bg-matcha-50 rounded"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-matcha-50 text-matcha-600 uppercase">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    title="Select all orders"
                  />
                </th>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Destination</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Weight (T)</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-matcha-50 text-matcha-800">
              {filteredOrders.map((order) => (
                <tr className="hover:bg-matcha-50/50" key={order.id}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(order.id)}
                      onChange={() => toggleSelect(order.id)}
                    />
                  </td>
                  <td className="px-4 py-3 font-bold">{order.id}</td>
                  <td className="px-4 py-3">{order.customer}</td>
                  <td className="px-4 py-3">{order.destination}</td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {order.items.map((it) => (
                        <div key={it.id} className="text-[11px] text-gray-700">
                          {it.name} {it.code ? `(${it.code})` : ""} [{it.uom}] {it.lengthM}x
                          {it.widthM}x{it.heightM}m {it.weightKg}kg
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">{order.weightTons.toFixed(2)}</td>
                  <td className="px-4 py-3">{order.due}</td>
                  <td className="px-4 py-3">
                    <select
                      value={order.status}
                      onChange={(e) => onStatusChange(order.id, e.target.value as OrderStatus)}
                      className="text-xs bg-matcha-50 border border-matcha-200 rounded px-2 py-1 font-bold"
                    >
                      <option>New</option>
                      <option>Pending</option>
                      <option>Planned</option>
                      <option>In Transit</option>
                      <option>Delivered</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onDelete(order.id)}
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
    </div>
  );
}
