import type { LucideIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  Banknote,
  Briefcase,
  CheckSquare,
  Droplet,
  Gauge,
  LayoutDashboard,
  Layers,
  Map as MapIcon,
  MapPin,
  MapPinned,
  Package,
  ShieldAlert,
  ShoppingCart,
  Store,
  Truck,
  Users,
  Wrench,
} from "lucide-react";

export type RoleKey =
  | "superadmin"
  | "loader"
  | "driver"
  | "hr"
  | "mechanic"
  | "accountant"
  | "customer";

export type ViewKey =
  | "dashboard"
  | "reports"
  | "admin"
  | "orders"
  | "planning"
  | "shipments"
  | "tracking"
  | "fleet"
  | "maintenance"
  | "parts"
  | "fuel"
  | "finance"
  | "hr"
  | "customer"
  | "carriers"
  | "destinations"
  | "delivery"
  | "driver-dashboard"
  | "contracts"
  | "billing"
  | "compliance"
  | "vehicle-types"
  | "container-types"
  | "item-types";

export type NavSection =
  | "Executive"
  | "Operations"
  | "Fleet"
  | "Business"
  | "Resources"
  | "Mobile Tools";

export interface UserDetails {
  name: string;
  role: string;
  avatar: string;
}

export interface NavItem {
  id: ViewKey;
  label: string;
  icon: LucideIcon;
  section: NavSection;
  tone?: "danger";
}

export const rolePermissions: Record<RoleKey, ViewKey[]> = {
  superadmin: [
    "dashboard",
    "admin",
    "finance",
    "hr",
    "billing",
    "contracts",
    "compliance",
    "fleet",
    "vehicle-types",
    "container-types",
    "item-types",
    "maintenance",
    "reports",
    "tracking",
    "carriers",
    "orders",
    "planning",
    "shipments",
    "destinations",
    "fuel",
    "delivery",
    "parts",
  ],
  loader: [
    "dashboard",
    "orders",
    "planning",
    "shipments",
    "contracts",
    "fleet",
    "vehicle-types",
    "container-types",
    "item-types",
    "tracking",
    "parts",
    "destinations",
  ],
  driver: ["driver-dashboard", "delivery", "tracking", "fuel", "compliance"],
  hr: ["dashboard", "hr", "reports", "compliance"],
  mechanic: ["maintenance", "fleet", "parts", "vehicle-types", "container-types", "item-types", "compliance"],
  accountant: ["dashboard", "finance", "billing", "reports"],
  customer: ["customer", "billing"],
};

export const userDetails: Record<RoleKey, UserDetails> = {
  superadmin: { name: "System Admin", role: "Super Admin", avatar: "SA" },
  loader: { name: "Sarah Dispatch", role: "Head Dispatcher", avatar: "SD" },
  driver: { name: "John Driver", role: "Truck Driver", avatar: "JD" },
  hr: { name: "Holly Resource", role: "HR Manager", avatar: "HR" },
  mechanic: { name: "Mike Wrench", role: "Lead Mechanic", avatar: "MW" },
  accountant: { name: "Fiona Finance", role: "Accountant", avatar: "FF" },
  customer: { name: "Sony Corp", role: "Customer", avatar: "SC" },
};

export const navItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    section: "Executive",
  },
  {
    id: "reports",
    label: "Analytics",
    icon: BarChart3,
    section: "Executive",
  },
  {
    id: "admin",
    label: "System Admin",
    icon: ShieldAlert,
    section: "Executive",
    tone: "danger",
  },
  {
    id: "orders",
    label: "Orders",
    icon: ShoppingCart,
    section: "Operations",
  },
  {
    id: "planning",
    label: "Planning",
    icon: MapIcon,
    section: "Operations",
  },
  {
    id: "shipments",
    label: "Shipments",
    icon: Package,
    section: "Operations",
  },
  {
    id: "tracking",
    label: "Live Tracking",
    icon: MapPin,
    section: "Operations",
  },
  {
    id: "fleet",
    label: "Vehicles",
    icon: Truck,
    section: "Fleet",
  },
  {
    id: "vehicle-types",
    label: "Vehicle Types",
    icon: Layers,
    section: "Fleet",
  },
  {
    id: "maintenance",
    label: "Maintenance",
    icon: Wrench,
    section: "Fleet",
  },
  {
    id: "parts",
    label: "Inventory",
    icon: Layers,
    section: "Fleet",
  },
  {
    id: "fuel",
    label: "Fuel Logs",
    icon: Droplet,
    section: "Fleet",
  },
  {
    id: "finance",
    label: "Finance",
    icon: Banknote,
    section: "Business",
  },
  {
    id: "billing",
    label: "Billing",
    icon: Banknote,
    section: "Business",
  },
  {
    id: "hr",
    label: "HR Portal",
    icon: Users,
    section: "Business",
  },
  {
    id: "customer",
    label: "Portal View",
    icon: Store,
    section: "Business",
  },
  {
    id: "carriers",
    label: "Carriers",
    icon: Briefcase,
    section: "Resources",
  },
  {
    id: "contracts",
    label: "Contracts",
    icon: Layers,
    section: "Resources",
  },
  {
    id: "container-types",
    label: "Containers",
    icon: Package,
    section: "Resources",
  },
  {
    id: "item-types",
    label: "Item Master",
    icon: Package,
    section: "Resources",
  },
  {
    id: "destinations",
    label: "Destinations",
    icon: MapPinned,
    section: "Resources",
  },
  {
    id: "driver-dashboard",
    label: "Driver Dash",
    icon: Gauge,
    section: "Mobile Tools",
  },
  {
    id: "delivery",
    label: "Confirm Delivery",
    icon: CheckSquare,
    section: "Mobile Tools",
  },
  {
    id: "compliance",
    label: "Compliance",
    icon: ShieldAlert,
    section: "Mobile Tools",
  },
];
