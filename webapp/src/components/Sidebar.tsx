import { LogOut, X } from "lucide-react";
import { navItems, rolePermissions } from "../data/roles";
import type { RoleKey, ViewKey, NavSection } from "../data/roles";

interface SidebarProps {
  role: RoleKey;
  activeView: ViewKey;
  onSelect: (view: ViewKey) => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const sectionOrder: NavSection[] = [
  "Executive",
  "Operations",
  "Fleet",
  "Business",
  "Resources",
  "Mobile Tools",
];

export default function Sidebar({
  role,
  activeView,
  onSelect,
  onLogout,
  isOpen,
  onClose,
}: SidebarProps) {
  const allowed = new Set<ViewKey>(rolePermissions[role]);

  return (
    <aside
      className={`w-64 bg-white fixed inset-y-0 left-0 z-40 transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0 lg:static lg:flex flex-col border-r border-matcha-100 transition-transform duration-300 ease-in-out h-full lg:h-screen shadow-xl lg:shadow-none`}
    >
      <div className="p-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-matcha-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
            G
          </div>
          <span className="text-lg font-bold text-matcha-800">GreenLine</span>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden text-matcha-400 hover:text-matcha-700"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-4 mt-1 overflow-y-auto pb-4" id="main-nav">
        {sectionOrder.map((section) => {
          const items = navItems.filter(
            (item) => item.section === section && allowed.has(item.id)
          );
          if (items.length === 0) return null;

          return (
            <div className="nav-section" key={section}>
              <p className="text-[10px] font-bold text-matcha-400 uppercase tracking-wider px-3 mb-2">
                {section}
              </p>
              <div className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  const base =
                    "nav-item flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer";
                  const defaultTone =
                    item.tone === "danger"
                      ? "text-red-500 hover:bg-red-50 hover:text-red-700"
                      : "text-gray-500 hover:bg-matcha-50 hover:text-matcha-700";
                  const active =
                    activeView === item.id
                      ? "bg-matcha-100 text-matcha-800"
                      : defaultTone;

                  return (
                    <button
                      type="button"
                      key={item.id}
                      className={`${base} ${active} w-full text-left`}
                      onClick={() => onSelect(item.id)}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="p-3 border-t border-matcha-100">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2 text-matcha-500 hover:text-red-500 transition-colors w-full text-left font-medium text-sm"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
