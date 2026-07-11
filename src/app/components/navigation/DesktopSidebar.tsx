import { useLocation, useNavigate } from "react-router";
import { tabs, driverTabs, badges } from "../../../constants/navigation";
import { C } from "../../../constants/colors";
import { Building2, LogOut } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { toast } from "sonner";
import { hasPermission } from "../../../utils/permissions";

export interface DesktopSidebarProps {
  isDark: boolean;
}

export const DesktopSidebar = ({ isDark }: DesktopSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, business, logout } = useAuth();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login", { replace: true });
  };

  const activeColor = C.blue;
  const inactiveColor = "#94A3B8";
  const textColor = "#F8FAFC";

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "RK";

  const visibleTabs = user?.role === "DRIVER"
    ? driverTabs
    : tabs.filter((tab) => !tab.requiredPermission || hasPermission(user, tab.requiredPermission));

  return (
    <aside
      style={{
        background: "#0F172A",
        borderRight: "1px solid #1E293B",
      }}
      className="hidden md:flex flex-col h-full transition-all duration-300 w-20 lg:w-60 flex-shrink-0"
    >
      {/* Branding Section */}
      <div
        style={{ borderBottom: "1px solid #1E293B" }}
        className="h-16 flex items-center justify-center lg:justify-start px-4 gap-3 flex-shrink-0"
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden bg-white">
          <img src="/brand/apni-estate-logo.jpeg" alt="APNI ESTATE Logo" className="w-full h-full object-cover" />
        </div>
        <div className="hidden lg:flex flex-col">
          <span style={{ color: textColor }} className="text-xs font-bold leading-tight truncate max-w-[150px]">
            APNI ESTATE
          </span>
          <span className="text-[8px] text-white/50 uppercase tracking-wider font-semibold">
            Construction Supplier ERP
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto px-2">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;
          const badge = badges[tab.path];

          return (
            <button
              key={tab.id}
              onClick={() => handleNavigate(tab.path)}
              style={{
                background: isActive ? "rgba(38, 72, 231, 0.15)" : "transparent",
                color: isActive ? activeColor : inactiveColor,
              }}
              className="w-full flex flex-col lg:flex-row items-center gap-1.5 lg:gap-3 px-2 lg:px-4 py-3 lg:py-2.5 rounded-lg cursor-pointer transition-all duration-200 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 group active:scale-[0.98]"
            >
              <div className="relative flex items-center justify-center flex-shrink-0">
                <Icon
                  size={18}
                  color={isActive ? activeColor : inactiveColor}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                {badge && !isActive && (
                  <span
                    style={{ background: C.yellow, color: C.ink, fontSize: 8, minWidth: 14, height: 14, lineHeight: "14px" }}
                    className="absolute -top-1 -right-1 rounded-full font-bold text-center px-0.5"
                  >
                    {badge}
                  </span>
                )}
              </div>
              <span
                style={{
                  fontWeight: isActive ? 700 : 500,
                }}
                className="text-[10px] lg:text-xs truncate max-w-[140px]"
              >
                {tab.label}
              </span>
              {/* Desktop Only Badge */}
              {badge && !isActive && (
                <span
                  style={{ background: C.yellow, color: C.ink }}
                  className="hidden lg:inline-block ml-auto px-1.5 py-0.5 rounded-full text-[9px] font-bold leading-none"
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Profile Footer Section */}
      <div
        style={{ borderTop: "1px solid #1E293B" }}
        className="p-3 lg:p-4 flex items-center justify-center lg:justify-start gap-3 flex-shrink-0"
      >
        <div style={{ background: "rgba(38,72,231,0.2)", borderRadius: 999 }} className="w-8 h-8 lg:w-9 lg:h-9 flex items-center justify-center flex-shrink-0">
          <span style={{ color: activeColor }} className="text-xs lg:text-sm font-bold">{initials}</span>
        </div>
        <div className="hidden lg:flex flex-col flex-1 min-w-0">
          <span style={{ color: textColor }} className="text-xs font-bold leading-tight truncate">{user?.name || "Ramesh Kumar"}</span>
          <span className="text-[10px] text-white/50">{user?.role || "OWNER"}</span>
        </div>
        <button
          onClick={handleLogout}
          style={{ color: inactiveColor }}
          className="hidden lg:flex p-1.5 rounded-lg hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-200 active:scale-90 cursor-pointer"
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );
};
export default DesktopSidebar;
