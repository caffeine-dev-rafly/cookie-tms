import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MENU_ITEMS } from '../config/menuConfig';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredLogout, setHoveredLogout] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Safe check for role
  const userRole = user?.role || 'driver'; 
  const filteredItems = MENU_ITEMS.filter(item => item.allowed_roles.includes(userRole));

  const isPathActive = (path, exactMatch = false) => {
    if (path === '/') return location.pathname === '/';
    if (exactMatch) return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const hasChildPath = (path) =>
    filteredItems.some((item) => item.path !== path && item.path.startsWith(`${path}/`));
  
  // God Mode Styling
  const isGodMode = userRole === 'super_admin';
  const sidebarBg = isGodMode ? 'bg-slate-950 border-r border-red-900/20' : 'bg-slate-900';
  const logoBg = isGodMode ? 'bg-red-600' : 'bg-blue-500';

  return (
    <div className={`h-screen w-64 ${sidebarBg} text-white flex flex-col shadow-lg transition-all duration-300 flex-shrink-0`}>
      <div className="p-6 flex items-center border-b border-slate-700">
        <div className={`w-8 h-8 ${logoBg} rounded-lg flex items-center justify-center mr-3 font-bold text-xl shadow-lg transition-colors`}>
          T
        </div>
        <span className="font-bold text-lg tracking-wide">TMS Pro</span>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-3 space-y-1">
          {filteredItems.map((item) => {
            const isActive = isPathActive(item.path, hasChildPath(item.path));
            return (
              <NavLink
                key={item.label + item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <NavItemContent item={item} isActive={isActive} />
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-700">
        <div className="px-4 py-2 mb-2">
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Logged in as</p>
            <p className="text-sm font-medium text-slate-300 truncate">{user?.username}</p>
            <p className="text-xs text-blue-400 capitalize">{userRole.replace('_', ' ')}</p>
        </div>
        <button
          onClick={handleLogout}
          onMouseEnter={() => setHoveredLogout(true)}
          onMouseLeave={() => setHoveredLogout(false)}
          className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors duration-200 group"
        >
          {hoveredLogout ? (
             <LogOut size={20} className="scale-110 transition-transform duration-200" />
          ) : (
             <LogOut size={20} className="transition-transform duration-200" />
          )}
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
};

// Helper component to handle hover state for nav items
const NavItemContent = ({ item, isActive }) => {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = item.icon; // Lucide icon component directly

  return (
    <div 
      className="flex items-center gap-3 w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Icon 
        size={20} 
        className={`transition-transform duration-200 ${isHovered ? 'scale-110' : ''} ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} 
      />
      <span className="font-medium text-sm">{item.label}</span>
    </div>
  );
};

export default Sidebar;
