import { LogOut, X } from "lucide-react";
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

  return (
    <div className="fixed inset-0 z-[80] md:hidden" role="dialog" aria-modal="true" aria-label="More menu">
      <button className="absolute inset-0 bg-slate-950/45 cursor-default" aria-label="Close More menu" onClick={onClose} />
      <section className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 shrink-0">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">APNI ESTATE Menu</h2>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{business?.name || "Current Store"}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 cursor-pointer">
            <X size={20}/>
          </button>
        </div>
        
        <div className="overflow-y-auto px-4 py-3 space-y-4">
          {groups.map((group) => {
            const grouped = items.filter((item) => item.group === group);
            if (!grouped.length) return null;
            return (
              <section key={group} className="space-y-1">
                <h3 className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">{group}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {grouped.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button 
                        key={item.id} 
                        onClick={() => go(item.path)} 
                        className="flex min-h-[46px] items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 px-3 text-left text-xs font-bold text-slate-800 hover:bg-slate-50 cursor-pointer"
                      >
                        <Icon size={16} className="text-orange-600 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
        
        <div className="border-t border-slate-200 p-4 shrink-0 pb-[max(16px,env(safe-area-inset-bottom))]">
          <button onClick={signOut} className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-red-50 text-xs font-bold text-red-600 hover:bg-red-100 cursor-pointer">
            <LogOut size={16}/>
            Logout from ERP
          </button>
        </div>
      </section>
    </div>
  );
}

export default MobileMoreSheet;
