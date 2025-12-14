import { 
  LayoutDashboard, LayoutGrid,
  Map, MapPinned,
  Truck, CarFront,
  Users, UserCheck,
  Route as RouteIcon, Waypoints,
  ClipboardList, ClipboardCheck,
  Building2, Building,
  Settings, Settings2,
  Server, Globe, User
} from 'lucide-react';

export const MENU_ITEMS = [
  // SUPER ADMIN
  { 
    name: 'Dashboard', 
    path: '/', 
    icon: LayoutDashboard, 
    hoverIcon: LayoutGrid,
    allowed: ['SUPER_ADMIN'] 
  },
  { 
    name: 'Organizations', 
    path: '/organizations', 
    icon: Building, 
    hoverIcon: Building2,
    allowed: ['SUPER_ADMIN'] 
  },
  { 
    name: 'Global Map', 
    path: '/global-map', 
    icon: Globe, 
    hoverIcon: Map,
    allowed: ['SUPER_ADMIN'] 
  },
  
  // OWNER & STAFF
  { 
    name: 'Dashboard', 
    path: '/', 
    icon: LayoutDashboard, 
    hoverIcon: LayoutGrid,
    allowed: ['OWNER', 'ADMIN'] 
  },
  { 
    name: 'Live Map', 
    path: '/map', 
    icon: Map, 
    hoverIcon: MapPinned,
    allowed: ['OWNER', 'ADMIN'] 
  },
  { 
    name: 'Vehicles', 
    path: '/vehicles', 
    icon: Truck, 
    hoverIcon: CarFront,
    allowed: ['OWNER', 'ADMIN'] 
  },
  { 
    name: 'Drivers', 
    path: '/drivers', 
    icon: Users, 
    hoverIcon: UserCheck,
    allowed: ['OWNER'] // Staff excluded per req
  },
  { 
    name: 'Routes', 
    path: '/routes', 
    icon: RouteIcon, 
    hoverIcon: Waypoints,
    allowed: ['OWNER', 'ADMIN'] 
  },
  { 
    name: 'Trips', 
    path: '/trips', 
    icon: ClipboardList, 
    hoverIcon: ClipboardCheck,
    allowed: ['OWNER', 'ADMIN'] 
  },
  { 
    name: 'Customers', 
    path: '/customers', 
    icon: Building2, 
    hoverIcon: Building,
    allowed: ['OWNER'] // Staff excluded per req implication
  },
  { 
    name: 'Settings', 
    path: '/settings', 
    icon: Settings, 
    hoverIcon: Settings2,
    allowed: ['OWNER'] 
  },

  // DRIVER
  { 
    name: 'My Trips', 
    path: '/', 
    icon: ClipboardList, 
    hoverIcon: ClipboardCheck,
    allowed: ['DRIVER'] 
  },
  { 
    name: 'My Profile', 
    path: '/profile', 
    icon: User, 
    hoverIcon: UserCheck,
    allowed: ['DRIVER'] 
  },
];

export const checkAccess = (user, allowedRoles) => {
    if (!user) return false;
    if (user.is_superuser && allowedRoles.includes('SUPER_ADMIN')) return true;
    if (allowedRoles.includes(user.role)) return true;
    // Allow SUPER_ADMIN to see OWNER/ADMIN stuff? Usually yes, but req implies specific views.
    // If we want Super Admin to see everything, we can add:
    // if (user.is_superuser) return true; 
    // BUT the Dashboard is different for Super Admin vs Owner. So we keep strict check.
    return false;
};
