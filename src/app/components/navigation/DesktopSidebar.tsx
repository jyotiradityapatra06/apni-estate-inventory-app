import { LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { getDesktopNavigation, isNavigationItemActive, type NavigationGroup } from "../../../constants/navigation";
import { useAuth } from "../../../hooks/useAuth";
import { toast } from "sonner";

const groups: NavigationGroup[] = ["Dashboard", "Inventory", "Sales", "Purchase", "Finance", "Reports", "Management"];

interface DesktopSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function DesktopSidebar({ collapsed, onToggle }: DesktopSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, business, logout, isLoading } = useAuth();
  const items = isLoading ? [] : getDesktopNavigation(user);
  const initials = user?.name?.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "AE";
  
  const signOut = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login", { replace: true });
  };

  return (
    <aside 
      className={`fixed inset-y-0 left-0 z-50 hidden flex-col border-r border-slate-800 bg-[#0F172A] text-white lg:flex transition-all duration-300 ${
        collapsed ? "w-[72px]" : "w-[248px]"
      }`}
    >
      {/* Brand Header */}
      <div className="relative border-b border-slate-800 px-4 py-5 flex items-center justify-between min-h-[81px]">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <img src="/brand/apni-estate-logo.jpeg" alt="APNI ESTATE" className="h-9 w-9 rounded-lg bg-white object-cover" />
            <div>
              <p className="text-sm font-black tracking-wide text-white">APNI ESTATE</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Inventory ERP</p>
            </div>
          </div>
        )}
        {collapsed && (
          <img src="/brand/apni-estate-logo.jpeg" alt="APNI ESTATE" className="h-9 w-9 mx-auto rounded-lg bg-white object-cover" />
        )}
        
        {/* Toggle Collapse Button */}
        <button 
          onClick={onToggle}
          className="absolute -right-3 top-6 flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-300 hover:text-white cursor-pointer shadow-md"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      {/* Business context selection */}
      {!collapsed && (
        <div className="px-3 pt-4">
          <div className="rounded-xl bg-slate-800/40 border border-slate-800/60 px-3 py-2">
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Current Shop / Business</p>
            <p className="mt-0.5 truncate text-xs font-semibold text-slate-200">{business?.name || "APNI ESTATE Store"}</p>
          </div>
        </div>
      )}

      {/* Main Navigation Items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4" aria-label="Main navigation" style={{ scrollbarWidth: "none" }}>
        {groups.map((group) => {
          const grouped = items.filter((item) => item.group === group);
          if (!grouped.length) return null;
          
          return (
            <section key={group} className="space-y-1">
              {!collapsed && (
                <h2 className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">{group}</h2>
              )}
              <div className="space-y-1">
                {grouped.map((item) => {
                  const Icon = item.icon;
                  const active = isNavigationItemActive(item, location.pathname);
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.path)}
                      aria-current={active ? "page" : undefined}
                      title={collapsed ? item.label : undefined}
                      className={`flex min-h-[38px] w-full items-center gap-3 rounded-lg px-3 text-left text-xs font-semibold transition-all duration-200 cursor-pointer ${
                        active 
                          ? "bg-[#F97316] text-white shadow-sm font-bold" 
                          : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                      }`}
                    >
                      <Icon size={16} className={active ? "text-white" : "text-slate-400"} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </nav>

      {/* Footer Profile & Logout */}
      <div className="border-t border-slate-800 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2 bg-slate-800/20">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F97316] text-[11px] font-black text-white">
            {initials}
          </span>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-slate-200">{user?.name}</p>
              <p className="text-[10px] text-slate-500 font-semibold uppercase">{user?.role}</p>
            </div>
          )}
          {!collapsed && (
            <button 
              onClick={signOut} 
              aria-label="Logout" 
              title="Logout" 
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

export default DesktopSidebar;
