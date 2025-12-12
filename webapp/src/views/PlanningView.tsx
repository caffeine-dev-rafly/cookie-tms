import { useMemo, useState } from "react";
import type { Destination, Order, Vehicle } from "../types";

interface PlanningViewProps {
  orders: Order[];
  vehicles: Vehicle[];
  destinations: Destination[];
  onPlan: (payload: {
    orderId: string;
    vehicleId?: string;
    driver?: string;
    vehicleType?: string;
    driverTime?: string;
    drops?: string[];
    tripNumber?: string;
  }) => void;
}

export default function PlanningView({ orders, vehicles, destinations, onPlan }: PlanningViewProps) {
  const [selectedOrder, setSelectedOrder] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [driver, setDriver] = useState("");
  const [driverTime, setDriverTime] = useState("");
  const [drops, setDrops] = useState<string[]>([""]);
  const [scheduleName, setScheduleName] = useState("");
  const [scheduleDay, setScheduleDay] = useState("Monday");
  const [scheduleTime, setScheduleTime] = useState("08:00");
  const [scheduleVehicleType, setScheduleVehicleType] = useState("");
  const [scheduleDriver, setScheduleDriver] = useState("");
  const [scheduleNote, setScheduleNote] = useState("");
  const [scheduleDrops, setScheduleDrops] = useState<string[]>([""]);
  const [schedules, setSchedules] = useState<
    {
      id: string;
      name: string;
      day: string;
      time: string;
      vehicleType?: string;
      driver?: string;
      note?: string;
      drops?: string[];
    }[]
  >([
    { id: "SCH-1", name: "Morning Retail Milk Run", day: "Monday", time: "08:00", vehicleType: "Van", driver: "John D." },
    { id: "SCH-2", name: "Warehouse Transfer", day: "Wednesday", time: "13:00", vehicleType: "Truck", driver: "Sarah Ops" },
  ]);
  const nextTripNumber = useMemo(
    () => `TRIP-${String(Date.now()).slice(-4)}`,
    [selectedOrder, vehicleType, vehicleId, driver, driverTime, drops.length]
  );

  const unplanned = useMemo(
    () => orders.filter((o) => o.status === "New" || o.status === "Pending"),
    [orders]
  );
  const planned = useMemo(() => orders.filter((o) => o.status === "Planned"), [orders]);

  const vehicleTypes = useMemo(() => Array.from(new Set(vehicles.map((v) => v.vehicleType))), [vehicles]);
  const filteredVehicles = useMemo(
    () => (vehicleType ? vehicles.filter((v) => v.vehicleType === vehicleType) : vehicles),
    [vehicleType, vehicles]
  );
  const destinationNames = useMemo(() => destinations.map((d) => d.name), [destinations]);

  const handlePlan = () => {
    if (!selectedOrder) return;
    onPlan({
      orderId: selectedOrder,
      vehicleId: vehicleId || undefined,
      driver: driver || undefined,
      vehicleType: vehicleType || undefined,
      driverTime: driverTime || undefined,
      drops: drops.map((d) => d.trim()).filter(Boolean),
      tripNumber: nextTripNumber,
    });
    setSelectedOrder("");
    setVehicleType("");
    setVehicleId("");
    setDriver("");
    setDriverTime("");
    setDrops([""]);
  };

  const updateDrop = (idx: number, value: string) => {
    setDrops((prev) => prev.map((d, i) => (i === idx ? value : d)));
  };

  const addDrop = () => setDrops((prev) => [...prev, ""]);
  const removeDrop = (idx: number) => setDrops((prev) => prev.filter((_, i) => i !== idx));
  const updateScheduleDrop = (idx: number, value: string) => {
    setScheduleDrops((prev) => prev.map((d, i) => (i === idx ? value : d)));
  };
  const addScheduleDrop = () => setScheduleDrops((prev) => [...prev, ""]);
  const removeScheduleDrop = (idx: number) =>
    setScheduleDrops((prev) => prev.filter((_, i) => i !== idx));

  const addSchedule = () => {
    if (!scheduleName) return;
    const id = `SCH-${schedules.length + 1}`;
    setSchedules((prev) => [
      ...prev,
      {
        id,
        name: scheduleName,
        day: scheduleDay,
        time: scheduleTime,
        vehicleType: scheduleVehicleType || undefined,
        driver: scheduleDriver || undefined,
        note: scheduleNote || undefined,
        drops: scheduleDrops.map((d) => d.trim()).filter(Boolean),
      },
    ]);
    setScheduleName("");
    setScheduleVehicleType("");
    setScheduleDriver("");
    setScheduleNote("");
    setScheduleDrops([""]);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 h-[calc(100vh-120px)]">
      <div className="bg-white rounded-2xl shadow-card border border-matcha-50 flex flex-col overflow-hidden">
        <div className="p-3 bg-matcha-100 border-b border-matcha-200">
          <h3 className="font-bold text-sm text-matcha-900">Unplanned Orders</h3>
        </div>
        <div className="flex-1 p-3 space-y-2">
          {unplanned.length === 0 && <p className="text-xs text-gray-500">All orders planned.</p>}
          {unplanned.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-dashed border-matcha-300 p-3 rounded-xl shadow-sm"
            >
              <span className="text-xs font-bold text-matcha-500">{order.id}</span>
              <p className="text-xs text-matcha-800">
                {order.customer}: {order.origin}  {order.destination}
              </p>
              <p className="text-[10px] text-gray-500">Due: {order.due}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-card border border-matcha-50 flex flex-col overflow-hidden xl:col-span-2">
        <div className="p-3 bg-white border-b border-matcha-100 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-sm text-matcha-900">Load Builder</h3>
            <p className="text-[10px] text-gray-500">
              Turn orders into trips with vehicle type, assignment, drops, and timing.
            </p>
          </div>
          <div className="flex gap-2 items-center text-[11px] text-gray-600">
            <span>Trip: {nextTripNumber}</span>
            <button
              className="bg-matcha-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
              onClick={handlePlan}
            >
              Create Trip
            </button>
          </div>
        </div>
        <div className="p-4 flex flex-col gap-3">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
            <select
              value={selectedOrder}
              onChange={(e) => setSelectedOrder(e.target.value)}
              className="px-3 py-2 bg-gray-50 border rounded-lg text-sm"
            >
              <option value="">Select order</option>
              {unplanned.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.id} - {order.origin}  {order.destination}
                </option>
              ))}
            </select>
            <select
              value={vehicleType}
              onChange={(e) => {
                setVehicleType(e.target.value);
                setVehicleId("");
              }}
              className="px-3 py-2 bg-gray-50 border rounded-lg text-sm"
            >
              <option value="">Vehicle type</option>
              {vehicleTypes.map((vt) => (
                <option key={vt} value={vt}>
                  {vt}
                </option>
              ))}
            </select>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="px-3 py-2 bg-gray-50 border rounded-lg text-sm"
            >
              <option value="">Vehicle (optional)</option>
              {filteredVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.id} - {v.vehicleType} - {v.carrier}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Driver name"
              value={driver}
              onChange={(e) => setDriver(e.target.value)}
              className="px-3 py-2 bg-gray-50 border rounded-lg text-sm"
            />
            <input
              type="time"
              placeholder="Driver time"
              value={driverTime}
              onChange={(e) => setDriverTime(e.target.value)}
              className="px-3 py-2 bg-gray-50 border rounded-lg text-sm"
            />
            <button
              onClick={handlePlan}
              className="bg-matcha-600 text-white px-3 py-2 rounded-lg text-sm font-bold"
            >
              Plan Order
            </button>
          </div>

          <div className="rounded-xl border border-matcha-100 bg-matcha-50/50 p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-matcha-800">Drop stops</span>
              <button onClick={addDrop} className="text-[11px] font-bold text-matcha-700">
                + Add stop
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {drops.map((drop, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Drop ${idx + 1}`}
                    value={drop}
                    onChange={(e) => updateDrop(idx, e.target.value)}
                    list="dest-options"
                    className="flex-1 px-3 py-2 bg-white border rounded-lg text-sm"
                  />
                  {drops.length > 1 && (
                    <button
                      onClick={() => removeDrop(idx)}
                      className="text-[11px] text-red-600 font-bold px-2"
                    >
                      x
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-500">Route uses origin + these stops + destination.</p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {planned.map((order) => (
              <div
                key={order.id}
                className="bg-matcha-50 border border-matcha-100 p-3 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center md:justify-between text-xs text-matcha-800"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="font-bold">{order.id}</span>
                  <span>
                    {order.origin} - {order.destination}
                  </span>
                </div>
                <span className="text-[10px] text-gray-500">Status: {order.status}</span>
              </div>
            ))}
          </div>

          <div className="bg-matcha-50/60 border border-matcha-100 rounded-xl p-3 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-sm font-bold text-matcha-900">Planning Master – Fixed Schedules</h4>
                <p className="text-[11px] text-gray-600">Define recurring trips by day/time, vehicle type, and driver.</p>
              </div>
              <button
                onClick={addSchedule}
                className="bg-matcha-600 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold"
              >
                Add Schedule
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              <input
                type="text"
                placeholder="Schedule name"
                value={scheduleName}
                onChange={(e) => setScheduleName(e.target.value)}
                className="px-3 py-2 bg-white border rounded-lg text-sm"
              />
              <select
                value={scheduleDay}
                onChange={(e) => setScheduleDay(e.target.value)}
                className="px-3 py-2 bg-white border rounded-lg text-sm"
              >
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="px-3 py-2 bg-white border rounded-lg text-sm"
              />
              <select
                value={scheduleVehicleType}
                onChange={(e) => setScheduleVehicleType(e.target.value)}
                className="px-3 py-2 bg-white border rounded-lg text-sm"
              >
                <option value="">Vehicle type</option>
                {vehicleTypes.map((vt) => (
                  <option key={vt} value={vt}>
                    {vt}
                  </option>
                ))}
            </select>
            <input
              type="text"
              placeholder="Driver"
              value={scheduleDriver}
              onChange={(e) => setScheduleDriver(e.target.value)}
              className="px-3 py-2 bg-white border rounded-lg text-sm"
            />
          </div>
          <div className="rounded-lg border border-matcha-100 bg-white p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-matcha-800">Fixed drop stops</span>
              <button onClick={addScheduleDrop} className="text-[11px] font-bold text-matcha-700">
                + Add stop
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {scheduleDrops.map((drop, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Drop ${idx + 1}`}
                    value={drop}
                    onChange={(e) => updateScheduleDrop(idx, e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-50 border rounded-lg text-sm"
                  />
                  {scheduleDrops.length > 1 && (
                    <button
                      onClick={() => removeScheduleDrop(idx)}
                      className="text-[11px] text-red-600 font-bold px-2"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <textarea
            placeholder="Notes (lane, cargo, constraints)"
            value={scheduleNote}
            onChange={(e) => setScheduleNote(e.target.value)}
            className="w-full px-3 py-2 bg-white border rounded-lg text-sm"
              rows={2}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
              {schedules.map((sch) => (
                <div key={sch.id} className="border border-matcha-100 rounded-lg p-3 bg-white shadow-sm text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-matcha-900">{sch.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-matcha-50 text-matcha-800 font-bold text-[10px]">
                      {sch.day} @ {sch.time}
                    </span>
                  </div>
                  <div className="text-gray-700">
                    {sch.vehicleType ? `Vehicle: ${sch.vehicleType}` : "Vehicle: Any"}
                  </div>
                  <div className="text-gray-700">Driver: {sch.driver ?? "Unassigned"}</div>
                  {sch.drops?.length ? (
                    <div className="text-[10px] text-gray-500 mt-1">
                      Stops: {sch.drops.join(" > ")}
                    </div>
                  ) : null}
                  {sch.note && <div className="text-[10px] text-gray-500 mt-1">{sch.note}</div>}
                </div>
              ))}
              {schedules.length === 0 && <p className="text-[11px] text-gray-500">No fixed schedules yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
