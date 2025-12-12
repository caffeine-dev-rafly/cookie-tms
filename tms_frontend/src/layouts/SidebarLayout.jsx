import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Map as MapIcon,
  History, 
  Truck, 
  Wrench, 
  Settings,
  Database, // New Icon
  ClipboardCheck,
  Menu, 
  X, 
  LogOut,
  ChevronDown
} from 'lucide-react';

const SidebarLayout = () => {
  const { user, logout, login } = useAuth(); // login exposed for demo
  const [isOpen, setIsOpen] = useState(true);
  const [financeOpen, setFinanceOpen] = useState(true);
  const [masterOpen, setMasterOpen] = useState(true); // New State
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    // In a real app, redirect to login
    navigate('/'); 
  };

  const navItemClass = ({ isActive }) => 
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      isActive 
        ? 'bg-blue-600 text-white' 
        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
    }`;

  // Helper to check roles
  const hasAccess = (allowedRoles) => allowedRoles.includes(user?.role);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      
      {/* Mobile Backdrop */}
      {!isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden" 
          onClick={() => setIsOpen(true)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 bg-gray-900 text-white transition-transform duration-300 transform
        ${!isOpen ? '-translate-x-full' : 'translate-x-0'}
        lg:translate-x-0 flex flex-col
      `}>
        <div className="h-16 flex items-center justify-between px-6 bg-gray-950">
          <span className="text-xl font-bold tracking-wider">NEXUS TMS</span>
          <button onClick={() => setIsOpen(false)} className="lg:hidden">
            <X />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-2 px-3">
          
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Main
          </div>
          
          <NavLink to="/" className={navItemClass} end>
            <LayoutDashboard size={20} />
            Dashboard
          </NavLink>

          <NavLink to="/map" className={navItemClass}>
            <MapIcon size={20} />
            Live Map
          </NavLink>

          <NavLink to="/history" className={navItemClass}>
            <History size={20} />
            Trip Playback
          </NavLink>

          {(hasAccess(['DRIVER', 'ADMIN'])) && (
            <NavLink to="/driver/tasks" className={navItemClass}>
              <ClipboardCheck size={20} />
              Driver Tasks
            </NavLink>
          )}

          {/* Departure Section (previously Finance) */}
          {(hasAccess(['ADMIN', 'FINANCE'])) && (
            <>
                <button 
                  onClick={() => setFinanceOpen(!financeOpen)}
                  className="flex items-center justify-between w-full px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Truck size={20} />
                    Departure
                  </div>
                  <ChevronDown size={16} className={`transition-transform ${financeOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {financeOpen && (
                  <div className="ml-4 space-y-1 border-l border-gray-700 pl-2">
                     <NavLink to="/departure/create-trip" className={navItemClass}>
                        Input Departure
                     </NavLink>
                     <NavLink to="/departure/history" className={navItemClass}>
                        History Trip Departure
                     </NavLink>
                     <NavLink to="/departure/settlement" className={navItemClass}>
                        Setoran Driver
                     </NavLink>
                  </div>
                )}
            </>
          )}

          {/* Mechanic Section */}
          {(hasAccess(['ADMIN', 'MECHANIC'])) && (
            <NavLink to="/mechanic/maintenance" className={navItemClass}>
              <Wrench size={20} />
              Maintenance
            </NavLink>
          )}

          {/* Master Data Section (Admin Only) */}
          {(hasAccess(['ADMIN'])) && (
            <>
                <button 
                  onClick={() => setMasterOpen(!masterOpen)}
                  className="flex items-center justify-between w-full px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Database size={20} />
                    Master Data
                  </div>
                  <ChevronDown size={16} className={`transition-transform ${masterOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {masterOpen && (
                  <div className="ml-4 space-y-1 border-l border-gray-700 pl-2">
                     <NavLink to="/admin/customers" className={navItemClass}>
                        Customers
                     </NavLink>
                     <NavLink to="/admin/routes" className={navItemClass}>
                        Routes
                     </NavLink>
                  </div>
                )}
            </>
          )}
          
        </div>

        {/* User Profile / Mock Role Switcher */}
        <div className="p-4 bg-gray-950 border-t border-gray-800">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold">
                    {user?.username?.[0]}
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-medium truncate">{user?.username}</p>
                    <p className="text-xs text-gray-400">{user?.role}</p>
                </div>
            </div>
            
            <div className="grid grid-cols-4 gap-1 mb-2">
                <button title="Admin" onClick={() => login('ADMIN')} className="text-xs bg-gray-800 p-1 rounded hover:bg-gray-700">ADM</button>
                <button title="Finance/Departure" onClick={() => login('FINANCE')} className="text-xs bg-gray-800 p-1 rounded hover:bg-gray-700">FIN</button>
                <button title="Mechanic" onClick={() => login('MECHANIC')} className="text-xs bg-gray-800 p-1 rounded hover:bg-gray-700">MEC</button>
                <button title="Driver" onClick={() => login('DRIVER')} className="text-xs bg-gray-800 p-1 rounded hover:bg-gray-700">DRV</button>
            </div>

            <button onClick={handleLogout} className="flex items-center gap-2 text-red-400 hover:text-red-300 w-full px-2 py-1 text-sm">
                <LogOut size={16} /> Logout
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 z-10">
           <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600 lg:hidden">
             <Menu />
           </button>
           <h2 className="font-semibold text-gray-700">
             {/* Dynamic Title could go here */}
             Transport Management System
           </h2>
           <div className="flex items-center gap-4">
              {/* Notifications, etc */}
           </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-0 relative">
           <Outlet />
        </main>
      </div>

    </div>
  );
};

export default SidebarLayout;
