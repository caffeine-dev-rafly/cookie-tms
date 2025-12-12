export type OrderStatus = "New" | "Pending" | "Planned" | "In Transit" | "Delivered";

export interface Order {
  id: string;
  customer: string;
  origin: string;
  destination: string;
  items: OrderItem[];
  containers?: OrderContainerPlan[];
  weightTons: number;
  due: string;
  status: OrderStatus;
  notes?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  code?: string;
  uom: string;
  lengthM: number;
  widthM: number;
  heightM: number;
  weightKg: number;
}
export type ShipmentStatus = "Pending" | "In Transit" | "Delivered";

export interface Shipment {
  id: string;
  route: string;
  status: ShipmentStatus;
  vehicleId?: string;
  driver?: string;
  eta?: string;
  vehicleType?: string;
  tripNumber?: string;
  drops?: string[];
  driverTime?: string;
  orderId?: string;
  originCoord?: [number, number];
  destCoord?: [number, number];
}

export interface StatusEvent {
  id: string;
  shipmentId: string;
  status: ShipmentStatus | "Dispatched" | "Arrived" | "Loaded";
  timestamp: string;
  note?: string;
}

export interface Vehicle {
  id: string;
  carrier: string;
  fuelLevel: number;
  distanceLeftKm: number;
  status: "Active" | "In Service";
  vehicleType: string;
  capacityM2: number;
}

export interface VehicleType {
  id: string;
  name: string;
  lengthM: number;
  widthM: number;
  heightM?: number;
  capacityM2: number;
}

export interface ContainerType {
  id: string;
  name: string;
  description?: string;
  isRollCage?: boolean;
  isReturnable?: boolean;
  lengthM?: number;
  widthM?: number;
  heightM?: number;
  capacityM2?: number;
  weightKg?: number;
  stockQty?: number;
}

export interface ItemType {
  id: string;
  name: string;
  code: string;
  uom: string;
  lengthM: number;
  widthM: number;
  heightM: number;
  weightKg?: number;
}

export interface Customer {
  id: string;
  name: string;
  code?: string;
}

export interface OrderContainerPlan {
  containerTypeId: string;
  count: number;
}

export interface Destination {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: "Active" | "Inactive";
  vehicleTypes?: string[];
}

export interface FuelLog {
  id: string;
  date: string;
  vehicleId: string;
  cost: number;
}

export interface Part {
  id: string;
  name: string;
  stock: number;
}

export interface MaintenanceTask {
  id: string;
  title: string;
  vehicleId?: string;
  dueDate?: string;
  priority?: "Low" | "Med" | "High";
  status: "Open" | "In Progress" | "Done";
}

export interface Carrier {
  id: string;
  name: string;
  score: number;
}

export interface RateContract {
  id: string;
  name: string;
  lane: string;
  ratePerTon: number;
  currency: string;
  fuelSurchargePct: number;
  accessorials?: string;
  validFrom: string;
  validTo?: string;
  carrierId?: string;
}

export type TenderStatus = "Draft" | "Sent" | "Accepted" | "Rejected";

export interface Tender {
  id: string;
  shipmentId: string;
  carrierId: string;
  status: TenderStatus;
  quote?: number;
  currency?: string;
}

export interface Document {
  id: string;
  type: "BOL" | "POD" | "Invoice" | "Inspection" | "License";
  relatedId: string;
  uploadedBy: string;
  uploadedAt: string;
  url?: string;
  status?: "Pending" | "Approved" | "Rejected";
}

export type InvoiceStatus = "Draft" | "Sent" | "Approved" | "Paid";

export interface Invoice {
  id: string;
  orderId?: string;
  shipmentId?: string;
  currency: string;
  amount: number;
  status: InvoiceStatus;
  dueDate?: string;
}

export interface Alert {
  id: string;
  type: "Late" | "Exception" | "ETA Change" | "Geofence";
  message: string;
  severity: "low" | "med" | "high";
  createdAt: string;
  shipmentId?: string;
}

export interface LogEntry {
  id: string;
  entity: string;
  action: string;
  refId?: string;
  timestamp: string;
  user?: string;
  detail?: string;
}
