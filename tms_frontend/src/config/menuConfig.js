import { 
  LayoutDashboard, Building, Server, Map, Truck, Users, 
  ClipboardList, DollarSign, Settings, Route, User 
} from 'lucide-react';

export const MENU_ITEMS = [
  { 
    label: 'Dashboard', 
    path: '/', 
    icon: LayoutDashboard, 
    allowed_roles: ['super_admin', 'owner', 'staff'] 
  },
  { 
    label: 'Dispatcher', 
    path: '/dispatcher', 
    icon: ClipboardList, 
    allowed_roles: ['super_admin', 'owner', 'staff'] 
  },
  { 
    label: 'Organizations', 
    path: '/organizations', 
    icon: Building, 
    allowed_roles: ['super_admin'] 
  },
  { 
    label: 'Infrastructure', 
    path: '/infrastructure', 
    icon: Server, 
    allowed_roles: ['super_admin'] 
  },
  { 
    label: 'Live Map', 
    path: '/map', 
    icon: Map, 
    allowed_roles: ['owner', 'staff'] 
  },
  { 
    label: 'Vehicles', 
    path: '/vehicles', 
    icon: Truck, 
    allowed_roles: ['owner', 'staff'] 
  },
  { 
    label: 'Drivers', 
    path: '/drivers', 
    icon: Users, 
    allowed_roles: ['owner'] 
  },
  { 
    label: 'Trips', 
    path: '/trips', 
    icon: ClipboardList, 
    allowed_roles: ['owner', 'staff'] 
  },
  { 
    label: 'Routes', 
    path: '/routes', 
    icon: Route, 
    allowed_roles: ['owner', 'staff'] 
  },
  { 
    label: 'Customers', 
    path: '/customers', 
    icon: Users, 
    allowed_roles: ['owner', 'staff'] 
  },
  { 
    label: 'Finance', 
    path: '/finance', 
    icon: DollarSign, 
    allowed_roles: ['owner'] 
  },
  { 
    label: 'Settings', 
    path: '/settings', 
    icon: Settings, 
    allowed_roles: ['owner'] 
  },
  // Driver specific views
  { 
    label: 'My Trips', 
    path: '/my-trips', 
    icon: ClipboardList, 
    allowed_roles: ['driver'] 
  },
  { 
    label: 'My Profile', 
    path: '/profile', 
    icon: User, 
    allowed_roles: ['driver'] 
  },
];