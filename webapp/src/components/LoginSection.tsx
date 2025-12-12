import { FormEvent, useMemo, useState } from "react";
import {
  Banknote,
  Package,
  ShieldAlert,
  Store,
  Truck,
  Users,
  Wrench,
} from "lucide-react";
import type { RoleKey } from "../data/roles";

interface LoginSectionProps {
  onLogin: (role: RoleKey) => void;
}

type RoleButton = {
  key: RoleKey;
  label: string;
  tone:
    | "red"
    | "blue"
    | "yellow"
    | "orange"
    | "purple"
    | "teal"
    | "pink";
  icon: React.ComponentType<{ className?: string }>;
  copy: string;
};

const ROLE_BUTTONS: RoleButton[] = [
  {
    key: "superadmin",
    label: "Admin",
    tone: "red",
    icon: ShieldAlert,
    copy: "System admin experience",
  },
  {
    key: "loader",
    label: "Operations",
    tone: "blue",
    icon: Package,
    copy: "Dispatcher workflow",
  },
  {
    key: "driver",
    label: "Driver",
    tone: "yellow",
    icon: Truck,
    copy: "Mobile driver tools",
  },
  {
    key: "mechanic",
    label: "Mechanic",
    tone: "orange",
    icon: Wrench,
    copy: "Maintenance cockpit",
  },
  {
    key: "hr",
    label: "HR Mgr",
    tone: "purple",
    icon: Users,
    copy: "People operations",
  },
  {
    key: "accountant",
    label: "Finance",
    tone: "teal",
    icon: Banknote,
    copy: "Billing and ledgers",
  },
  {
    key: "customer",
    label: "Customer",
    tone: "pink",
    icon: Store,
    copy: "Portal view",
  },
];

const toneStyles: Record<RoleButton["tone"], string> = {
  red: "bg-red-100 text-red-600 group-hover:bg-red-500 group-hover:text-white",
  blue:
    "bg-blue-100 text-blue-600 group-hover:bg-blue-500 group-hover:text-white",
  yellow:
    "bg-yellow-100 text-yellow-600 group-hover:bg-yellow-500 group-hover:text-white",
  orange:
    "bg-orange-100 text-orange-600 group-hover:bg-orange-500 group-hover:text-white",
  purple:
    "bg-purple-100 text-purple-600 group-hover:bg-purple-500 group-hover:text-white",
  teal: "bg-teal-100 text-teal-600 group-hover:bg-teal-500 group-hover:text-white",
  pink: "bg-pink-100 text-pink-600 group-hover:bg-pink-500 group-hover:text-white",
};

export default function LoginSection({ onLogin }: LoginSectionProps) {
  const [selectedRole, setSelectedRole] = useState<RoleKey | null>(null);

  const emailValue = useMemo(
    () => (selectedRole ? `${selectedRole}@greenline.com` : ""),
    [selectedRole]
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedRole) return;
    onLogin(selectedRole);
  };

  return (
    <div className="text-matcha-900 min-h-screen selection:bg-matcha-300 selection:text-matcha-900 flex flex-col items-center justify-center p-4 transition-all duration-500 overflow-y-auto bg-matcha-50">
      <div className="bg-white w-full max-w-6xl rounded-[2rem] shadow-art overflow-hidden flex flex-col lg:flex-row relative z-10">
        <div className="lg:w-1/2 bg-matcha-100 relative overflow-hidden flex flex-col items-center justify-center p-6">
          <div className="absolute top-[-20%] left-[-20%] w-[400px] h-[400px] bg-matcha-200 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] bg-matcha-300 rounded-full blur-3xl opacity-40" />
          <div className="relative z-10 floating-truck scale-75 lg:scale-90">
            <svg
              width="450"
              height="350"
              viewBox="0 0 450 350"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <ellipse
                cx="225"
                cy="310"
                rx="140"
                ry="15"
                fill="#3D5E4A"
                opacity="0.2"
              />
              <path
                d="M50 320 Q 225 340 400 320"
                stroke="#6A9C78"
                strokeWidth="4"
                strokeDasharray="15 10"
                opacity="0.5"
              />
              <path
                d="M70 100 L 320 100 L 320 260 L 70 260 Z"
                fill="#6A9C78"
              />
              <path d="M70 100 L 110 70 L 360 70 L 320 100" fill="#8FB496" />
              <rect
                x="70"
                y="100"
                width="250"
                height="160"
                fill="url(#containerGrad)"
                opacity="0.2"
              />
              <rect
                x="85"
                y="120"
                width="220"
                height="120"
                rx="4"
                fill="#527D63"
                opacity="0.1"
              />
              <path
                d="M280 140 L 300 160 L 280 180"
                stroke="#E8EFE9"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.5"
              />
              <path
                d="M320 130 L 390 130 L 410 190 L 410 260 L 320 260 Z"
                fill="#527D63"
              />
              <path d="M320 130 L 360 100 L 400 100 L 390 130" fill="#6A9C78" />
              <path d="M410 190 L 410 260 L 415 255 L 415 200 Z" fill="#3D5E4A" />
              <path
                d="M325 140 L 385 140 L 400 185 L 325 185 Z"
                fill="#D1E0D3"
              />
              <circle cx="120" cy="260" r="28" fill="#18261E" />
              <circle cx="120" cy="260" r="18" fill="#3D5E4A" />
              <circle cx="120" cy="260" r="6" fill="#8FB496" />
              <circle cx="190" cy="260" r="28" fill="#18261E" />
              <circle cx="190" cy="260" r="18" fill="#3D5E4A" />
              <circle cx="190" cy="260" r="6" fill="#8FB496" />
              <circle cx="370" cy="260" r="28" fill="#18261E" />
              <circle cx="370" cy="260" r="18" fill="#3D5E4A" />
              <circle cx="370" cy="260" r="6" fill="#8FB496" />
              <path d="M400 250 L 420 250 L 420 270 L 400 270 Z" fill="#2A4234" />
              <path
                className="leaf-spin"
                d="M100 80 Q 120 40 140 80"
                stroke="#8FB496"
                strokeWidth="3"
                fill="none"
              />
              <defs>
                <linearGradient id="containerGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#2A4234" stopOpacity="0" />
                  <stop offset="100%" stopColor="#2A4234" stopOpacity="0.2" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="text-center mt-4 relative z-10">
            <h2 className="text-2xl font-bold text-matcha-800 mb-1">
              GreenLine TMS
            </h2>
            <p className="text-sm text-matcha-600">
              Efficient logistics. Fresh delivery.
            </p>
          </div>
        </div>

        <div className="lg:w-1/2 bg-white flex flex-col justify-center p-8 lg:p-10">
          <div className="max-w-sm w-full mx-auto">
            <div className="mb-6 text-center lg:text-left">
              <h1 className="text-3xl font-bold text-matcha-900 mb-2">
                Select Role
              </h1>
              <p className="text-sm text-matcha-500">
                Experience the tailored interface for each user type.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {ROLE_BUTTONS.map((role) => {
                const Icon = role.icon;
                const isActive = role.key === selectedRole;
                return (
                  <button
                    key={role.key}
                    onClick={() => setSelectedRole(role.key)}
                    className={`role-btn flex flex-col items-center p-3 rounded-xl border transition-all group text-center ${
                      isActive
                        ? "border-matcha-500 bg-matcha-50"
                        : "border-matcha-200 hover:bg-matcha-50 hover:border-matcha-500"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors mb-2 ${toneStyles[role.tone]}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold text-xs text-matcha-800">
                      {role.label}
                    </h4>
                    <p className="text-[10px] text-matcha-400">{role.copy}</p>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSubmit} className="max-w-sm mx-auto">
              <div className="mb-4 group">
                <label
                  className="block text-xs font-bold text-matcha-700 mb-1"
                  htmlFor="email"
                >
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-matcha-400 group-focus-within:text-matcha-600 transition-colors">
                    @
                  </span>
                  <input
                    type="email"
                    id="email"
                    value={emailValue}
                    className="w-full pl-10 pr-3 py-2 bg-matcha-50 border border-matcha-200 rounded-lg focus:outline-none focus:border-matcha-500 focus:bg-white transition-all text-matcha-800 placeholder-matcha-300 text-sm font-medium"
                    placeholder="Select a role above"
                    required
                    readOnly
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={!selectedRole}
                className="w-full bg-matcha-600 hover:bg-matcha-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 flex items-center justify-center gap-2 text-sm"
              >
                <span>Sign In</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
