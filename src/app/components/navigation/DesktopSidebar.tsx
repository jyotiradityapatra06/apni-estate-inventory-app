import { useLocation, useNavigate } from "react-router";
import { tabs, badges } from "../../../constants/navigation";
import { C } from "../../../constants/colors";
import { Building2, LogOut } from "lucide-react";

export interface DesktopSidebarProps {
  isDark: boolean;
}

export const DesktopSidebar = ({ isDark }: DesktopSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const activeColor = isDark ? "#60A5FA" : C.blue;
  const inactiveColor = isDark ? "rgba(255,255,255,0.4)" : C.muted;
  const textColor = isDark ? "white" : C.ink;

  return (
    <aside
      style={{
        background: isDark ? C.darkCard : C.white,
        borderRight: `1px solid ${isDark ? C.darkBorder : C.border}`,
      }}
      className="hidden md:flex flex-col h-full transition-all duration-300 w-20 lg:w-60 flex-shrink-0"
    >
      {/* Branding Section */}
      <div
        style={{ borderBottom: `1px solid ${isDark ? C.darkBorder : C.border}` }}
        className="h-16 flex items-center justify-center lg:justify-start px-4 gap-3 flex-shrink-0"
      >
        <div style={{ background: C.blue }} className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
          <Building2 size={16} color="white" />
        </div>
        <div className="hidden lg:flex flex-col">
          <span style={{ color: textColor }} className="text-xs font-bold leading-tight truncate max-w-[150px]">
            Shri Krishna Traders
          </span>
          <span className="text-[9px] text-white/50 uppercase tracking-wider font-semibold">
            ERP OS
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;
          const badge = badges[tab.path];

          return (
            <button
              key={tab.id}
              onClick={() => handleNavigate(tab.path)}
              style={{
                background: isActive ? (isDark ? "rgba(255,255,255,0.06)" : "rgba(42,76,214,0.08)") : "transparent",
                color: isActive ? activeColor : textColor,
              }}
              className="w-full flex flex-col lg:flex-row items-center gap-1.5 lg:gap-3 px-2 lg:px-4 py-3 lg:py-2.5 rounded-lg cursor-pointer transition-all hover:bg-black/5 dark:hover:bg-white/5 group"
            >
              <div className="relative flex items-center justify-center flex-shrink-0">
                <Icon
                  size={18}
                  color={isActive ? activeColor : inactiveColor}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                {badge && !isActive && (
                  <span
                    style={{ background: C.error, fontSize: 8, minWidth: 14, height: 14, lineHeight: "14px" }}
                    className="absolute -top-1 -right-1 rounded-full text-white font-bold text-center px-0.5"
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
                  style={{ background: C.error }}
                  className="hidden lg:inline-block ml-auto px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white leading-none"
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
        style={{ borderTop: `1px solid ${isDark ? C.darkBorder : C.border}` }}
        className="p-3 lg:p-4 flex items-center justify-center lg:justify-start gap-3 flex-shrink-0"
      >
        <div style={{ background: "rgba(42,76,214,0.2)", borderRadius: 999 }} className="w-8 h-8 lg:w-9 lg:h-9 flex items-center justify-center flex-shrink-0">
          <span style={{ color: activeColor }} className="text-xs lg:text-sm font-bold">RK</span>
        </div>
        <div className="hidden lg:flex flex-col flex-1 min-w-0">
          <span style={{ color: textColor }} className="text-xs font-bold leading-tight truncate">Ramesh Kumar</span>
          <span className="text-[10px] text-white/50">Owner · Admin</span>
        </div>
        <button
          onClick={() => handleNavigate("/profile")}
          style={{ color: inactiveColor }}
          className="hidden lg:flex p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );
};
export default DesktopSidebar;
