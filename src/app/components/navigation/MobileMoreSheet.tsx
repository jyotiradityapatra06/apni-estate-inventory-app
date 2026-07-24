import { LogOut, X, User as UserIcon, Bell, ChevronRight, Settings } from "lucide-react";
import { useNavigate } from "react-router";
import { getDesktopNavigation, type NavigationGroup } from "../../../constants/navigation";
import { useAuth } from "../../../hooks/useAuth";
import { toast } from "sonner";

const groups: NavigationGroup[] = ["Inventory", "Sales", "Purchase", "Finance", "Reports", "Management"];

export function MobileMoreSheet({ open, onClose, onNotifications }: { open: boolean; onClose: () => void; onNotifications: () => void }) {
  const navigate = useNavigate();
  const { user, business, logout } = useAuth();
  
  if (!open) return null;
  const items = getDesktopNavigation(user);
  
  const go = (path: string) => { 
    onClose(); 
    if (path === "#notifications") {
      onNotifications();
    } else {
      navigate(path); 
    }
  };
  
  const signOut = () => { 
    logout(); 
    toast.success("Logged out successfully"); 
    onClose(); 
    navigate("/login", { replace: true }); 
  };

  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "AE";

  return (
    <div className="fixed inset-0 z-[80] md:hidden" role="dialog" aria-modal="true" aria-label="More menu">
      <button 
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs cursor-default animate-fade-in" 
        aria-label="Close More menu" 
        onClick={onClose} 
      />
      <section className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-3xl bg-white shadow-2xl animate-in slide-in-from-bottom duration-250">
        
        {/* Header & User Profile Banner */}
        <div className="border-b border-slate-100 bg-[#0F172A] p-4 text-white rounded-t-3xl shrink-0">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F97316] text-white font-black text-sm shadow-md">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black text-white truncate">{user?.name || "User Profile"}</h2>
                  {user?.role && (
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[9px] font-bold text-orange-400 border border-slate-700">
                      {user.role}
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-semibold text-slate-400 truncate mt-0.5">
                  {business?.name || "APNI ESTATE Material Store"}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              aria-label="Close menu" 
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
            >
              <X size={18}/>
            </button>
          </div>

          <div className="flex items-center justify-between pt-2.5 text-xs text-slate-300">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              GST: {business?.gstNumber || "Unregistered"}
            </span>
            <button 
              onClick={() => go("/management")} 
              className="flex items-center gap-1 font-bold text-orange-400 hover:underline text-xs cursor-pointer"
            >
              <Settings size={13}/>
              <span>Business Settings</span>
              <ChevronRight size={12}/>
            </button>
          </div>
        </div>
        
        {/* Scrollable Navigation Grid */}
        <div className="overflow-y-auto px-4 py-4 space-y-5 scroll-smooth-mobile">
          {groups.map((group) => {
            const grouped = items.filter((item) => item.group === group);
            if (!grouped.length) return null;
            return (
              <section key={group} className="space-y-1.5">
                <h3 className="px-1 text-[10px] font-black uppercase tracking-wider text-slate-400">{group}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {grouped.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button 
                        key={item.id} 
                        onClick={() => go(item.path)} 
                        className="flex min-h-[48px] items-center gap-2.5 rounded-2xl border border-slate-100 bg-slate-50/60 px-3 text-left text-xs font-bold text-slate-800 transition-all hover:bg-slate-100 press-active cursor-pointer"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-[#F97316] shrink-0">
                          <Icon size={16} />
                        </span>
                        <span className="truncate leading-tight">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
        
        {/* Footer Actions */}
        <div className="border-t border-slate-200 p-4 shrink-0 space-y-2 pb-[max(16px,env(safe-area-inset-bottom))] bg-slate-50/50">
          <button 
            onClick={() => go("#notifications")} 
            className="flex min-h-[48px] w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer press-active"
          >
            <div className="flex items-center gap-2.5">
              <Bell size={16} className="text-slate-500" />
              <span>Notifications & Alerts</span>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </button>

          <button 
            onClick={signOut} 
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-red-50 text-xs font-extrabold text-red-600 hover:bg-red-100 cursor-pointer press-active border border-red-100"
          >
            <LogOut size={16}/>
            <span>Logout from ERP</span>
          </button>
        </div>
      </section>
    </div>
  );
}

export default MobileMoreSheet;
