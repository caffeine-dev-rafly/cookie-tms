import {
  Carrier,
  ContainerType,
  Customer,
  Destination,
  FuelLog,
  MaintenanceTask,
  ItemType,
  Order,
  Part,
  Shipment,
  Vehicle,
  RateContract,
  Tender,
  Document,
  Invoice,
  Alert,
  StatusEvent,
  LogEntry,
  VehicleType,
  OrderContainerPlan,
} from "../types";

export const mockOrders: Order[] = [
  {
    id: "ORD-5001",
    customer: "Sony",
    origin: "Tokyo",
    destination: "Osaka",
    items: [
      {
        id: "IT-1",
        name: "TV Panels",
        code: "TVP-100",
        uom: "Pallet",
        lengthM: 1.2,
        widthM: 1.0,
        heightM: 1.5,
        weightKg: 400,
      },
    ],
    containers: [
      { containerTypeId: "CT-1", count: 2 },
    ],
    weightTons: 0.4,
    due: "2025-11-28",
    status: "New",
    notes: "Expedite by morning",
  },
  {
    id: "ORD-5002",
    customer: "Panasonic",
    origin: "Kyoto",
    destination: "Tokyo",
    items: [
      {
        id: "IT-2",
        name: "Batteries",
        code: "BAT-10",
        uom: "Roll Cage",
        lengthM: 1,
        widthM: 0.8,
        heightM: 1.2,
        weightKg: 200,
      },
    ],
    containers: [{ containerTypeId: "CT-2", count: 1 }],
    weightTons: 0.2,
    due: "2025-11-30",
    status: "Pending",
  },
];

export const mockShipments: Shipment[] = [
  {
    id: "SHP-9021",
    route: "Osaka > Kyoto",
    status: "In Transit",
    vehicleId: "A-102",
    driver: "John Driver",
    eta: "Today 18:00",
    originCoord: [34.6937, 135.5023],
    destCoord: [35.0116, 135.7681],
  },
];

export const mockStatusEvents: StatusEvent[] = [
  { id: "EVT-1", shipmentId: "SHP-9021", status: "Dispatched", timestamp: "2025-11-25T08:00:00Z" },
  { id: "EVT-2", shipmentId: "SHP-9021", status: "In Transit", timestamp: "2025-11-25T09:30:00Z" },
];

export const mockVehicles: Vehicle[] = [
  {
    id: "A-102",
    carrier: "Internal Fleet",
    fuelLevel: 75,
    distanceLeftKm: 450,
    status: "Active",
    vehicleType: "Truck",
    capacityM2: 40,
  },
  {
    id: "B-221",
    carrier: "Global Freight",
    fuelLevel: 52,
    distanceLeftKm: 320,
    status: "Active",
    vehicleType: "Van",
    capacityM2: 28,
  },
];

export const mockDestinations: Destination[] = [
  { id: "DST-001", name: "Osaka Hub", lat: 34.6937, lng: 135.5023, status: "Active", vehicleTypes: ["Truck"] },
  { id: "DST-002", name: "Tokyo Central Hub", lat: 35.6895, lng: 139.6917, status: "Active", vehicleTypes: ["Van", "Truck"] },
];

export const mockFuelLogs: FuelLog[] = [
  { id: "F-1", date: "2025-10-25", vehicleId: "A-102", cost: 680 },
];

export const mockParts: Part[] = [{ id: "P-1", name: "Oil Filter", stock: 45 }];

export const mockMaintenance: MaintenanceTask[] = [
  { id: "M-1", title: "Brake Inspection", vehicleId: "A-102", status: "Open", priority: "High" },
];

export const mockCarriers: Carrier[] = [
  { id: "C-INT", name: "GreenLine Internal", score: 98 },
  { id: "C-GF", name: "Global Freight", score: 95 },
  { id: "C-DHL", name: "DHL", score: 92 },
];

export const mockVehicleTypes: VehicleType[] = [
  { id: "VT-1", name: "Truck 40m²", lengthM: 10, widthM: 4, heightM: 3, capacityM2: 40 },
  { id: "VT-2", name: "Van 28m²", lengthM: 7, widthM: 4, heightM: 2.5, capacityM2: 28 },
];

export const mockContainerTypes: ContainerType[] = [
  {
    id: "CT-1",
    name: "Grey Empty Container",
    description: "Standard empty container",
    isReturnable: true,
    lengthM: 1.2,
    widthM: 1.0,
    heightM: 1.5,
    capacityM2: 1.2,
    weightKg: 50,
    stockQty: 120,
  },
  {
    id: "CT-2",
    name: "Roll Cage",
    description: "Roll cage for store deliveries",
    isRollCage: true,
    isReturnable: true,
    lengthM: 1.0,
    widthM: 0.8,
    heightM: 1.8,
    capacityM2: 0.8,
    weightKg: 35,
    stockQty: 40,
  },
  {
    id: "CT-3",
    name: "Pallet",
    description: "Standard pallet",
    isReturnable: true,
    lengthM: 1.2,
    widthM: 1.0,
    heightM: 0.2,
    capacityM2: 1.2,
    weightKg: 20,
    stockQty: 200,
  },
];

export const mockItemTypes: ItemType[] = [
  {
    id: "ITM-1",
    name: "TV Panels",
    code: "TVP-100",
    uom: "Pallet",
    lengthM: 1.2,
    widthM: 1.0,
    heightM: 1.5,
    weightKg: 400,
  },
  {
    id: "ITM-2",
    name: "Batteries",
    code: "BAT-10",
    uom: "Roll Cage",
    lengthM: 1.0,
    widthM: 0.8,
    heightM: 1.2,
    weightKg: 200,
  },
];

export const mockCustomers: Customer[] = [
  { id: "CUST-1", name: "Sony", code: "SONY" },
  { id: "CUST-2", name: "Panasonic", code: "PANA" },
  { id: "CUST-3", name: "DHL Store", code: "DHL" },
];

export const mockContracts: RateContract[] = [
  {
    id: "RC-1001",
    name: "JP Linehaul",
    lane: "Tokyo > Osaka",
    ratePerTon: 1200,
    currency: "USD",
    fuelSurchargePct: 12,
    accessorials: "Liftgate, Inside delivery",
    validFrom: "2025-01-01",
    validTo: "2025-12-31",
    carrierId: "C-INT",
  },
];

export const mockTenders: Tender[] = [
  { id: "TDR-1", shipmentId: "SHP-9021", carrierId: "C-GF", status: "Sent", quote: 1150, currency: "USD" },
  { id: "TDR-2", shipmentId: "SHP-9021", carrierId: "C-DHL", status: "Draft" },
];

export const mockDocuments: Document[] = [
  {
    id: "DOC-1",
    type: "BOL",
    relatedId: "SHP-9021",
    uploadedBy: "Ops",
    uploadedAt: "2025-11-24T12:00:00Z",
    url: "#",
    status: "Approved",
  },
  {
    id: "DOC-2",
    type: "POD",
    relatedId: "SHP-9021",
    uploadedBy: "Driver",
    uploadedAt: "2025-11-25T10:00:00Z",
    url: "#",
    status: "Pending",
  },
];

export const mockInvoices: Invoice[] = [
  { id: "INV-1001", orderId: "ORD-5001", currency: "USD", amount: 1800, status: "Draft", dueDate: "2025-12-10" },
  { id: "INV-1002", shipmentId: "SHP-9021", currency: "USD", amount: 1500, status: "Sent", dueDate: "2025-12-05" },
];

export const mockAlerts: Alert[] = [
  {
    id: "AL-1",
    type: "ETA Change",
    message: "SHP-9021 ETA slipped by 30 mins",
    severity: "med",
    createdAt: "2025-11-25T09:45:00Z",
    shipmentId: "SHP-9021",
  },
];

export const mockLogs: LogEntry[] = [
  {
    id: "LOG-1",
    entity: "Order",
    action: "Create",
    refId: "ORD-5001",
    timestamp: "2025-11-25T08:00:00Z",
    user: "System Admin",
    detail: "Seed order created",
  },
];
