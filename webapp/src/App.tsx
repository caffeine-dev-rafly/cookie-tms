import { useEffect, useMemo, useRef, useState } from "react";
import HeaderBar from "./components/HeaderBar";
import LoginSection from "./components/LoginSection";
import Sidebar from "./components/Sidebar";
import { RoleKey, ViewKey, rolePermissions } from "./data/roles";
import {
  mockCarriers,
  mockDestinations,
  mockFuelLogs,
  mockMaintenance,
  mockOrders,
  mockParts,
  mockShipments,
  mockVehicles,
  mockContracts,
  mockTenders,
  mockDocuments,
  mockInvoices,
  mockAlerts,
  mockStatusEvents,
  mockLogs,
  mockVehicleTypes,
  mockContainerTypes,
  mockItemTypes,
  mockCustomers,
} from "./data/mock";
import {
  Carrier,
  Destination,
  FuelLog,
  MaintenanceTask,
  Order,
  OrderItem,
  OrderStatus,
  Part,
  Shipment,
  ShipmentStatus,
  Vehicle,
  RateContract,
  Tender,
  Document,
  Invoice,
  Alert,
  StatusEvent,
  LogEntry,
  VehicleType,
  ContainerType,
  ItemType,
  Customer,
} from "./types";
import AdminView from "./views/AdminView";
import CarriersView from "./views/CarriersView";
import CustomerView from "./views/CustomerView";
import DashboardView from "./views/DashboardView";
import DeliveryView from "./views/DeliveryView";
import DestinationsView from "./views/DestinationsView";
import DriverDashboardView from "./views/DriverDashboardView";
import FinanceView from "./views/FinanceView";
import FleetView from "./views/FleetView";
import FuelView from "./views/FuelView";
import HrView from "./views/HrView";
import MaintenanceView from "./views/MaintenanceView";
import OrdersView from "./views/OrdersView";
import PartsView from "./views/PartsView";
import PlanningView from "./views/PlanningView";
import ReportsView from "./views/ReportsView";
import ShipmentsView from "./views/ShipmentsView";
import TrackingView from "./views/TrackingView";
import ContractsView from "./views/ContractsView";
import BillingView from "./views/BillingView";
import ComplianceView from "./views/ComplianceView";
import VehicleTypesView from "./views/VehicleTypesView";
import ContainerTypesView from "./views/ContainerTypesView";
import ItemTypesView from "./views/ItemTypesView";

export default function App() {
  const [role, setRole] = useState<RoleKey | null>(null);
  const [activeView, setActiveView] = useState<ViewKey>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mainRef = useRef<HTMLElement | null>(null);
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [shipments, setShipments] = useState<Shipment[]>(mockShipments);
  const [vehicles, setVehicles] = useState<Vehicle[]>(mockVehicles);
  const [destinations, setDestinations] = useState<Destination[]>(mockDestinations);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>(mockFuelLogs);
  const [parts, setParts] = useState<Part[]>(mockParts);
  const [maintenance, setMaintenance] = useState<MaintenanceTask[]>(mockMaintenance);
  const [carriers] = useState<Carrier[]>(mockCarriers);
  const [contracts, setContracts] = useState<RateContract[]>(mockContracts);
  const [tenders, setTenders] = useState<Tender[]>(mockTenders);
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [statusEvents, setStatusEvents] = useState<StatusEvent[]>(mockStatusEvents);
  const [logs, setLogs] = useState<LogEntry[]>(mockLogs);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>(mockVehicleTypes);
  const [containerTypes, setContainerTypes] = useState<ContainerType[]>(mockContainerTypes);
  const [itemTypes, setItemTypes] = useState<ItemType[]>(mockItemTypes);
  const [customers] = useState<Customer[]>(mockCustomers);
  const currencyOptions = [
    { code: "USD", symbol: "$", locale: "en-US" },
    { code: "IDR", symbol: "Rp", locale: "id-ID" },
    { code: "EUR", symbol: "EUR", locale: "de-DE" },
  ];
  const [currency, setCurrency] = useState<string>("USD");

  const logAction = (entry: Omit<LogEntry, "id" | "timestamp">) => {
    setLogs((prev) => {
      const nextId = `LOG-${prev.length + 1}`;
      return [
        {
          id: nextId,
          timestamp: new Date().toISOString(),
          ...entry,
        },
        ...prev,
      ];
    });
  };

  const adjustContainerStock = (id: string, delta: number, reason?: string) => {
    setContainerTypes((prev) =>
      prev.map((ct) =>
        ct.id === id
          ? { ...ct, stockQty: Math.max(0, (ct.stockQty ?? 0) + delta) }
          : ct
      )
    );
    logAction({
      entity: "ContainerType",
      action: `Stock:${delta >= 0 ? "+" : ""}${delta}${reason ? `:${reason}` : ""}`,
      refId: id,
      user: role ?? "System",
    });
  };

  const allowedViews = useMemo(
    () => (role ? rolePermissions[role] : []),
    [role]
  );

  useEffect(() => {
    if (role && !allowedViews.includes(activeView)) {
      const fallback = allowedViews[0] ?? "dashboard";
      setActiveView(fallback);
    }
  }, [role, allowedViews, activeView]);

  useEffect(() => {
    // Ensure content scrolls back to the top when switching views
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activeView]);

  const handleLogin = (selected: RoleKey) => {
    const defaultView = rolePermissions[selected]?.[0] ?? "dashboard";
    setRole(selected);
    setActiveView(defaultView);
  };

  const handleLogout = () => {
    setRole(null);
    setActiveView("dashboard");
    setSidebarOpen(false);
  };

  const handleViewChange = (view: ViewKey) => {
    setActiveView(view);
    setSidebarOpen(false);
  };

  const addOrder = (
    payload: Omit<Order, "id" | "status" | "items" | "weightTons"> & {
      status?: OrderStatus;
      items?: OrderItem[];
      weightTons?: number;
    }
  ) => {
    const nextId = `ORD-${String(orders.length + 5001).padStart(4, "0")}`;
    const itemsWeightKg = payload.items ? payload.items.reduce((acc, item) => acc + (item.weightKg || 0), 0) : 0;
    const weightTons = itemsWeightKg / 1000 || payload.weightTons || 0;
    setOrders((prev) => [
      ...prev,
      {
        id: nextId,
        status: payload.status ?? "New",
        ...payload,
        weightTons,
        items: payload.items ?? [],
      },
    ]);
    logAction({ entity: "Order", action: "Create", refId: nextId, user: role ?? "System" });
  };

  const deleteOrder = (id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
    logAction({ entity: "Order", action: "Delete", refId: id, user: role ?? "System" });
  };

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    logAction({ entity: "Order", action: `Status:${status}`, refId: id, user: role ?? "System" });
  };


  const addShipment = (payload: Omit<Shipment, "id">) => {
    const nextId = `SHP-${String(shipments.length + 9021)}`;
    setShipments((prev) => [...prev, { id: nextId, ...payload }]);
    logAction({ entity: "Shipment", action: "Create", refId: nextId, user: role ?? "System" });
  };

  const deleteShipment = (id: string) => {
    setShipments((prev) => prev.filter((s) => s.id !== id));
    logAction({ entity: "Shipment", action: "Delete", refId: id, user: role ?? "System" });
  };

  const updateShipmentStatus = (id: string, status: ShipmentStatus) => {
    setShipments((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    logAction({ entity: "Shipment", action: `Status:${status}`, refId: id, user: role ?? "System" });
  };

  const planOrderToShipment = (payload: {
    orderId: string;
    vehicleId?: string;
    driver?: string;
    vehicleType?: string;
    driverTime?: string;
    drops?: string[];
    tripNumber?: string;
  }) => {
    const { orderId, vehicleId, driver, vehicleType, driverTime, drops } = payload;
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const tripNumber = payload.tripNumber ?? `TRIP-${shipments.length + 1}`;
    const routeParts = [order.origin, ...(drops?.filter(Boolean) ?? []), order.destination];
    const route = routeParts.join(" > ");
    addShipment({
      route,
      status: "Pending",
      vehicleId,
      driver,
      vehicleType: vehicleType ?? vehicles.find((v) => v.id === vehicleId)?.vehicleType,
      eta: driverTime,
      tripNumber,
      drops: drops?.filter(Boolean),
      orderId,
    });
    updateOrderStatus(orderId, "Planned");
    logAction({
      entity: "Order",
      action: `Planned:${tripNumber}`,
      refId: orderId,
      user: role ?? "System",
    });
  };

  const addVehicle = (vehicle: Omit<Vehicle, "status" | "fuelLevel" | "distanceLeftKm">) => {
    setVehicles((prev) => [
      ...prev,
      {
        ...vehicle,
        status: "Active",
        fuelLevel: 100,
        distanceLeftKm: 600,
        vehicleType: vehicle.vehicleType || "Truck",
        capacityM2: vehicle.capacityM2 ?? 0,
      },
    ]);
    logAction({ entity: "Vehicle", action: "Create", refId: vehicle.id, user: role ?? "System" });
  };

  const deleteVehicle = (id: string) => {
    setVehicles((prev) => prev.filter((v) => v.id !== id));
    logAction({ entity: "Vehicle", action: "Delete", refId: id, user: role ?? "System" });
  };

  const toggleVehicleStatus = (id: string) => {
    let nextStatus: Vehicle["status"] = "Active";
    setVehicles((prev) => {
      const target = prev.find((v) => v.id === id);
      nextStatus = target?.status === "Active" ? "In Service" : "Active";
      return prev.map((v) => (v.id === id ? { ...v, status: nextStatus } : v));
    });
    logAction({ entity: "Vehicle", action: `Status:${nextStatus}`, refId: id, user: role ?? "System" });
  };

  const addVehicleType = (vt: Omit<VehicleType, "id">) => {
    const nextId = `VT-${vehicleTypes.length + 1}`;
    setVehicleTypes((prev) => [...prev, { ...vt, id: nextId }]);
    logAction({ entity: "VehicleType", action: "Create", refId: nextId, user: role ?? "System" });
  };

  const deleteVehicleType = (id: string) => {
    setVehicleTypes((prev) => prev.filter((v) => v.id !== id));
    logAction({ entity: "VehicleType", action: "Delete", refId: id, user: role ?? "System" });
  };

  const addContainerType = (ct: Omit<ContainerType, "id">) => {
    const nextId = `CT-${containerTypes.length + 1}`;
    setContainerTypes((prev) => [...prev, { ...ct, id: nextId, stockQty: ct.stockQty ?? 0 }]);
    logAction({ entity: "ContainerType", action: "Create", refId: nextId, user: role ?? "System" });
  };

  const deleteContainerType = (id: string) => {
    setContainerTypes((prev) => prev.filter((c) => c.id !== id));
    logAction({ entity: "ContainerType", action: "Delete", refId: id, user: role ?? "System" });
  };

  const addItemType = (it: Omit<ItemType, "id">) => {
    const nextId = `ITM-${itemTypes.length + 1}`;
    setItemTypes((prev) => [...prev, { ...it, id: nextId }]);
    logAction({ entity: "ItemType", action: "Create", refId: nextId, user: role ?? "System" });
  };

  const deleteItemType = (id: string) => {
    setItemTypes((prev) => prev.filter((i) => i.id !== id));
    logAction({ entity: "ItemType", action: "Delete", refId: id, user: role ?? "System" });
  };

  const addDestination = (destination: Omit<Destination, "id" | "status">) => {
    const nextId = `DST-${String(destinations.length + 3).padStart(3, "0")}`;
    setDestinations((prev) => [...prev, { ...destination, id: nextId, status: "Active" }]);
    logAction({ entity: "Destination", action: "Create", refId: nextId, user: role ?? "System" });
  };

  const deleteDestination = (id: string) => {
    setDestinations((prev) => prev.filter((d) => d.id !== id));
    logAction({ entity: "Destination", action: "Delete", refId: id, user: role ?? "System" });
  };

  const addFuelLog = (log: Omit<FuelLog, "id">) => {
    const nextId = `F-${fuelLogs.length + 2}`;
    setFuelLogs((prev) => [...prev, { ...log, id: nextId }]);
    logAction({ entity: "FuelLog", action: "Create", refId: nextId, user: role ?? "System" });
  };

  const deleteFuelLog = (id: string) => {
    setFuelLogs((prev) => prev.filter((f) => f.id !== id));
    logAction({ entity: "FuelLog", action: "Delete", refId: id, user: role ?? "System" });
  };

  const addPart = (part: Omit<Part, "id">) => {
    const nextId = `P-${parts.length + 1}`;
    setParts((prev) => [...prev, { ...part, id: nextId }]);
    logAction({ entity: "Part", action: "Create", refId: nextId, user: role ?? "System" });
  };

  const deletePart = (id: string) => {
    setParts((prev) => prev.filter((p) => p.id !== id));
    logAction({ entity: "Part", action: "Delete", refId: id, user: role ?? "System" });
  };

  const addMaintenance = (task: Omit<MaintenanceTask, "id" | "status">) => {
    const nextId = `M-${maintenance.length + 1}`;
    setMaintenance((prev) => [...prev, { ...task, id: nextId, status: "Open" }]);
    logAction({ entity: "Maintenance", action: "Create", refId: nextId, user: role ?? "System" });
  };

  const deleteMaintenance = (id: string) => {
    setMaintenance((prev) => prev.filter((m) => m.id !== id));
    logAction({ entity: "Maintenance", action: "Delete", refId: id, user: role ?? "System" });
  };

  const markDelivered = (shipmentId: string) => {
    const shipment = shipments.find((s) => s.id === shipmentId);
    if (!shipment) return;
    updateShipmentStatus(shipmentId, "Delivered");
    if (shipment.orderId) {
      updateOrderStatus(shipment.orderId, "Delivered");
    }
    logAction({ entity: "Shipment", action: "Delivered", refId: shipmentId, user: role ?? "System" });
  };

  const waveOrders = (ids: string[]) => {
    setOrders((prev) =>
      prev.map((o) => (ids.includes(o.id) ? { ...o, status: "Planned" as OrderStatus } : o))
    );
    ids.forEach((id) =>
      logAction({ entity: "Order", action: "Wave", refId: id, user: role ?? "System" })
    );
  };

  const addContract = (contract: Omit<RateContract, "id">) => {
    const nextId = `RC-${contracts.length + 1001}`;
    setContracts((prev) => [...prev, { ...contract, id: nextId }]);
    logAction({ entity: "Contract", action: "Create", refId: nextId, user: role ?? "System" });
  };

  const deleteContract = (id: string) => {
    setContracts((prev) => prev.filter((c) => c.id !== id));
    logAction({ entity: "Contract", action: "Delete", refId: id, user: role ?? "System" });
  };

  const addTender = (tender: Omit<Tender, "id" | "status">) => {
    const nextId = `TDR-${tenders.length + 1}`;
    setTenders((prev) => [...prev, { ...tender, id: nextId, status: "Draft" }]);
    logAction({ entity: "Tender", action: "Create", refId: nextId, user: role ?? "System" });
  };

  const deleteTender = (id: string) => {
    setTenders((prev) => prev.filter((t) => t.id !== id));
    logAction({ entity: "Tender", action: "Delete", refId: id, user: role ?? "System" });
  };

  const updateTenderStatus = (id: string, status: Tender["status"], quote?: number) => {
    setTenders((prev) => prev.map((t) => (t.id === id ? { ...t, status, quote: quote ?? t.quote } : t)));
    logAction({ entity: "Tender", action: `Status:${status}`, refId: id, user: role ?? "System" });
  };

  const addDocument = (doc: Omit<Document, "id" | "uploadedAt" | "status">) => {
    const nextId = `DOC-${documents.length + 1}`;
    setDocuments((prev) => [
      ...prev,
      { ...doc, id: nextId, uploadedAt: new Date().toISOString(), status: "Pending" },
    ]);
    logAction({ entity: "Document", action: "Upload", refId: nextId, user: role ?? "System" });
  };

  const deleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    logAction({ entity: "Document", action: "Delete", refId: id, user: role ?? "System" });
  };

  const addInvoice = (invoice: Omit<Invoice, "id" | "status">) => {
    const nextId = `INV-${invoices.length + 1001}`;
    setInvoices((prev) => [...prev, { ...invoice, id: nextId, status: "Draft" }]);
    logAction({ entity: "Invoice", action: "Create", refId: nextId, user: role ?? "System" });
  };

  const updateInvoiceStatus = (id: string, status: Invoice["status"]) => {
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, status } : inv)));
    logAction({ entity: "Invoice", action: `Status:${status}`, refId: id, user: role ?? "System" });
  };

  const deleteInvoice = (id: string) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    logAction({ entity: "Invoice", action: "Delete", refId: id, user: role ?? "System" });
  };

  const addStatusEvent = (event: Omit<StatusEvent, "id">) => {
    const nextId = `EVT-${statusEvents.length + 1}`;
    setStatusEvents((prev) => [...prev, { ...event, id: nextId }]);
    logAction({ entity: "StatusEvent", action: event.status, refId: event.shipmentId, user: role ?? "System" });
  };

  const addAlert = (alert: Omit<Alert, "id" | "createdAt">) => {
    const nextId = `AL-${alerts.length + 1}`;
    setAlerts((prev) => [...prev, { ...alert, id: nextId, createdAt: new Date().toISOString() }]);
    logAction({ entity: "Alert", action: "Create", refId: nextId, user: role ?? "System" });
  };

  const deleteAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    logAction({ entity: "Alert", action: "Delete", refId: id, user: role ?? "System" });
  };

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return <DashboardView />;
      case "reports":
        return <ReportsView />;
      case "admin":
        return (
          <AdminView
            currency={currency}
            currencyOptions={currencyOptions}
            onCurrencyChange={setCurrency}
            logs={logs}
          />
        );
      case "orders":
        return (
          <OrdersView
            orders={orders}
            onCreate={addOrder}
            onDelete={deleteOrder}
            onStatusChange={updateOrderStatus}
            onWave={waveOrders}
            itemTypes={itemTypes}
            destinations={destinations}
            customers={customers}
          />
        );
      case "planning":
        return (
          <PlanningView
            orders={orders}
            vehicles={vehicles}
            destinations={destinations}
            onPlan={planOrderToShipment}
          />
        );
      case "shipments":
        return (
          <ShipmentsView
            shipments={shipments}
            onCreate={addShipment}
            onStatusChange={updateShipmentStatus}
            statusEvents={statusEvents}
            onAddEvent={addStatusEvent}
            tenders={tenders}
            onTenderStatus={updateTenderStatus}
            onDelete={deleteShipment}
          />
        );
      case "tracking":
        return <TrackingView shipments={shipments} destinations={destinations} alerts={alerts} />;
      case "fleet":
        return (
          <FleetView
            vehicles={vehicles}
            carriers={carriers}
            onAddVehicle={addVehicle}
            onDelete={deleteVehicle}
            onToggleStatus={toggleVehicleStatus}
          />
        );
      case "vehicle-types":
        return (
          <VehicleTypesView
            vehicleTypes={vehicleTypes}
            onCreate={addVehicleType}
            onDelete={deleteVehicleType}
          />
        );
      case "maintenance":
        return (
          <MaintenanceView
            tasks={maintenance}
            onCreate={addMaintenance}
            onDelete={deleteMaintenance}
          />
        );
      case "parts":
        return <PartsView parts={parts} onCreate={addPart} onDelete={deletePart} />;
      case "fuel":
        return (
          <FuelView
            fuelLogs={fuelLogs}
            vehicles={vehicles}
            onCreate={addFuelLog}
            onDelete={deleteFuelLog}
          />
        );
      case "finance":
        return (
          <FinanceView
            orders={orders}
            shipments={shipments}
            currency={currency}
            currencyOptions={currencyOptions}
            onCurrencyChange={setCurrency}
          />
        );
      case "billing":
        return (
          <BillingView
            invoices={invoices}
            currency={currency}
            currencyOptions={currencyOptions}
            onCreate={addInvoice}
            onStatusChange={updateInvoiceStatus}
            onDelete={deleteInvoice}
          />
        );
      case "hr":
        return <HrView />;
      case "customer":
        return <CustomerView onCreateOrder={addOrder} />;
      case "carriers":
        return <CarriersView carriers={carriers} />;
      case "contracts":
        return (
          <ContractsView
            contracts={contracts}
            tenders={tenders}
            carriers={carriers}
            onCreateContract={addContract}
            onCreateTender={addTender}
            onDeleteContract={deleteContract}
            onDeleteTender={deleteTender}
          />
        );
      case "item-types":
        return (
          <ItemTypesView
            itemTypes={itemTypes}
            onCreate={addItemType}
            onDelete={deleteItemType}
          />
        );
      case "container-types":
        return (
          <ContainerTypesView
            containerTypes={containerTypes}
            onCreate={addContainerType}
            onDelete={deleteContainerType}
            onAdjustStock={adjustContainerStock}
          />
        );
      case "destinations":
        return (
          <DestinationsView
            destinations={destinations}
            onCreate={addDestination}
            onDelete={deleteDestination}
          />
        );
      case "delivery":
        return <DeliveryView shipments={shipments} onConfirm={markDelivered} />;
      case "driver-dashboard":
        return <DriverDashboardView shipments={shipments} alerts={alerts} />;
      case "compliance":
        return (
          <ComplianceView
            documents={documents}
            onUpload={addDocument}
            alerts={alerts}
            onDeleteDoc={deleteDocument}
            onDeleteAlert={deleteAlert}
          />
        );
      default:
        return <DashboardView />;
    }
  };

  if (!role) {
    return <LoginSection onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-matcha-50 flex relative">
      <Sidebar
        role={role}
        activeView={activeView}
        onSelect={handleViewChange}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div
        className={`fixed inset-0 bg-matcha-900/20 backdrop-blur-sm z-30 lg:hidden transition-opacity ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <main
        className="flex-1 p-4 lg:p-6 overflow-y-auto h-screen"
        ref={mainRef}
      >
        <HeaderBar
          activeView={activeView}
          role={role}
          onToggleSidebar={() => setSidebarOpen(true)}
        />
        <div className="space-y-4">{renderView()}</div>
      </main>
    </div>
  );
}

