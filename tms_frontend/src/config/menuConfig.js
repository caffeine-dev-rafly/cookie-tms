import {
  LayoutDashboard,
  Building,
  Server,
  Map,
  Truck,
  Users,
  ClipboardList,
  DollarSign,
  Settings,
  Route,
  MapPin,
  User,
  Globe,
  FileText,
  History,
} from 'lucide-react';

export const MENU_ITEMS = [
  {
    label: 'Dashboard',
    path: '/',
    icon: LayoutDashboard,
    allowed_roles: ['super_admin', 'owner', 'finance', 'staff'],
    read_only_roles: [],
  },
  {
    label: 'System Logs',
    path: '/admin/logs',
    icon: FileText,
    allowed_roles: ['super_admin', 'owner', 'staff'],
    read_only_roles: [],
  },
  {
    label: 'Global Map',
    path: '/admin/global-map',
    icon: Globe,
    allowed_roles: ['super_admin'],
    read_only_roles: [],
  },
  {
    label: 'Org Manager',
    path: '/admin/organizations',
    icon: Building,
    allowed_roles: ['super_admin'],
    read_only_roles: [],
  },
  {
    label: 'Dispatcher',
    path: '/dispatcher',
    icon: ClipboardList,
    allowed_roles: ['owner', 'staff'],
    read_only_roles: [],
  },
  {
    label: 'Infrastructure',
    path: '/infrastructure',
    icon: Server,
    allowed_roles: ['super_admin'],
    read_only_roles: [],
  },
  {
    label: 'Users',
    path: '/users',
    icon: Users,
    allowed_roles: ['super_admin', 'owner'],
    read_only_roles: [],
  },
  {
    label: 'Live Map',
    path: '/map',
    icon: Map,
    allowed_roles: ['owner', 'staff'],
    read_only_roles: [],
  },
  {
    label: 'Vehicles',
    path: '/vehicles',
    icon: Truck,
    allowed_roles: ['owner', 'staff'],
    read_only_roles: [],
  },
  {
    label: 'Drivers',
    path: '/drivers',
    icon: Users,
    allowed_roles: ['owner', 'staff'],
    read_only_roles: ['staff'], // staff is view-only
  },
  {
    label: 'Trips',
    path: '/trips',
    icon: ClipboardList,
    allowed_roles: ['owner', 'staff', 'finance'],
    read_only_roles: ['finance'], // finance is view-only
  },
  {
    label: 'Routes',
    path: '/routes',
    icon: Route,
    allowed_roles: ['owner', 'staff'],
    read_only_roles: [],
  },
  {
    label: 'Origins',
    path: '/origins',
    icon: MapPin,
    allowed_roles: ['owner', 'staff'],
    read_only_roles: [],
  },
  {
    label: 'Customers',
    path: '/customers',
    icon: Users,
    allowed_roles: ['owner', 'finance'],
    read_only_roles: ['finance'], // finance is view-only
  },
  {
    label: 'Finance',
    path: '/finance',
    icon: DollarSign,
    allowed_roles: ['owner', 'finance'],
    read_only_roles: [],
  },
  {
    label: 'Invoices',
    path: '/finance/invoices',
    icon: FileText,
    allowed_roles: ['owner', 'finance'],
    read_only_roles: [],
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: Settings,
    allowed_roles: ['owner'],
    read_only_roles: [],
  },
  // Driver specific views
  {
    label: 'My Trips',
    path: '/my-trips',
    icon: ClipboardList,
    allowed_roles: ['driver'],
    read_only_roles: [],
  },
  {
    label: 'History',
    path: '/trip-history',
    icon: History,
    allowed_roles: ['driver'],
    read_only_roles: [],
  },
  {
    label: 'My Profile',
    path: '/profile',
    icon: User,
    allowed_roles: ['super_admin', 'owner', 'finance', 'staff', 'driver'],
    read_only_roles: [],
  },
];

export function canEdit(userRole, menuLabel) {
  const item = MENU_ITEMS.find((m) => m.label === menuLabel);
  if (!item) return false;
  if (!item.allowed_roles.includes(userRole)) return false;
  if (item.read_only_roles.includes(userRole)) return false;
  return true;
}
