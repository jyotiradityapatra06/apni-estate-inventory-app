import { useLocation, useNavigate } from "react-router";
import { Bell, Search, User } from "lucide-react";
import { C } from "../../../constants/colors";

export interface AppHeaderProps {
  isDark: boolean;
}

export const AppHeader = ({ isDark }: AppHeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case "/dashboard":
        return "Dashboard";
      case "/sales":
        return "Sales & Ledger";
      case "/inventory":
        return "Stock Inventory";
      case "/deliveries":
        return "Live Delivery Tracking";
      case "/profile":
        return "Configuration Settings";
      default:
        return "ERP System";
    }
  };

  const title = getPageTitle(location.pathname);
  const textColor = isDark ? "white" : C.ink;
  const borderColor = isDark ? C.darkBorder : C.border;

  return (
    <header
      style={{
        background: isDark ? C.darkCard : C.white,
        borderBottom: `1px solid ${borderColor}`,
      }}
      className="hidden md:flex items-center justify-between px-6 h-16 flex-shrink-0 select-none z-30"
    >
      {/* Title */}
      <div>
        <h1 style={{ color: textColor }} className="text-base lg:text-lg font-bold">
          {title}
        </h1>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden lg:block">
          <input
            type="text"
            placeholder="Search transactions, stock..."
            style={{
              background: isDark ? C.dark : C.surface,
              border: `1px solid ${borderColor}`,
              color: textColor,
            }}
            className="w-64 pl-9 pr-3 py-1.5 rounded-lg text-xs outline-none"
          />
          <Search size={14} style={{ color: C.muted }} className="absolute left-3 top-2.5" />
        </div>
        <button
          style={{ color: isDark ? "rgba(255,255,255,0.7)" : C.muted }}
          className="lg:hidden p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
        >
          <Search size={18} />
        </button>

        {/* Notifications */}
        <button
          style={{
            background: isDark ? "rgba(255,255,255,0.06)" : C.surface,
            border: `1px solid ${borderColor}`,
          }}
          className="w-9 h-9 rounded-full flex items-center justify-center relative cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
        >
          <Bell size={16} color={isDark ? "white" : C.ink} />
          <span style={{ background: C.error }} className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" />
        </button>

        {/* Avatar Control */}
        <button
          onClick={() => navigate("/profile")}
          style={{
            background: isDark ? "rgba(255,255,255,0.06)" : C.surface,
            border: `1px solid ${borderColor}`,
          }}
          className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
        >
          <User size={16} color={isDark ? "white" : C.ink} />
        </button>
      </div>
    </header>
  );
};
export default AppHeader;
