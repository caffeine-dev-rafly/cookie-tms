import { Menu } from "lucide-react";
import { navItems, userDetails } from "../data/roles";
import type { RoleKey, ViewKey } from "../data/roles";

interface HeaderBarProps {
  activeView: ViewKey;
  role: RoleKey;
  onToggleSidebar: () => void;
}

export default function HeaderBar({
  activeView,
  role,
  onToggleSidebar,
}: HeaderBarProps) {
  const user = userDetails[role];
  const activeNav = navItems.find((item) => item.id === activeView);
  const title = activeNav?.label ?? "Executive Dashboard";

  return (
    <div className="flex justify-between items-center mb-6 sticky top-0 z-20 bg-matcha-50/95 backdrop-blur-sm py-2">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 bg-white rounded-lg shadow-sm text-matcha-700"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-matcha-900" id="page-title">
            {title}
          </h2>
          <p className="text-matcha-500 text-xs">
            Role:{" "}
            <span className="font-bold text-matcha-700">{user.role}</span>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-matcha-200 rounded-xl overflow-hidden border-2 border-white shadow-sm flex items-center justify-center text-sm font-bold text-matcha-700">
          {user.avatar}
        </div>
      </div>
    </div>
  );
}
