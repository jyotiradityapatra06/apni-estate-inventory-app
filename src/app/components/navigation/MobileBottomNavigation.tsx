import { useLocation, useNavigate } from "react-router";
import { tabs, driverTabs, badges } from "../../../constants/navigation";
import { C } from "../../../constants/colors";
import { useAuth } from "../../../hooks/useAuth";
import { hasPermission } from "../../../utils/permissions";

export interface MobileBottomNavigationProps {
  isDark: boolean;
}

export const MobileBottomNavigation = ({ isDark }: MobileBottomNavigationProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const visibleTabs = isLoading || !user
    ? []
    : user.role.toUpperCase() === "DRIVER"
      ? driverTabs
      : tabs.filter((tab) => {
          if (tab.id === "delivery") {
            const role = user.role.toUpperCase();
            return role === "OWNER" || role === "MANAGER";
          }
          return !tab.requiredPermission || hasPermission(user, tab.requiredPermission);
        });

  return (
    <div
      style={{
        background: isDark ? "#0E1823" : C.white,
        borderTop: `1px solid ${isDark ? C.darkBorder : C.border}`,
        flexShrink: 0,
        paddingBottom: 16,
      }}
    >
      <div className="flex">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;
          const badge = badges[tab.path];
          const activeColor = isDark ? "#60A5FA" : C.blue;
          const inactiveColor = isDark ? "rgba(255,255,255,0.35)" : C.muted;
          return (
            <button
              key={tab.id}
              onClick={() => handleNavigate(tab.path)}
              className="flex-1 flex flex-col items-center gap-1 pt-3 pb-1 relative cursor-pointer"
            >
              <div className="relative">
                <Icon size={20} color={isActive ? activeColor : inactiveColor} strokeWidth={isActive ? 2.5 : 1.8} />
                {badge && !isActive && (
                  <span
                    style={{ background: C.error, fontSize: 9, minWidth: 16, height: 16, lineHeight: "16px" }}
                    className="absolute -top-1.5 -right-1.5 rounded-full text-white font-bold text-center px-0.5"
                  >
                    {badge}
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? activeColor : inactiveColor,
                }}
              >
                {tab.label}
              </span>
              {isActive && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 32,
                    height: 3,
                    background: C.yellow,
                    borderRadius: "0 0 4px 4px",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
export default MobileBottomNavigation;
