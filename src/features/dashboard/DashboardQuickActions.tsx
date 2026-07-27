import { useNavigate } from "react-router";
import { ShoppingCart, ShoppingBag, UserPlus, DollarSign, PackagePlus } from "lucide-react";

export function DashboardQuickActions() {
  const navigate = useNavigate();

  const actions = [
    { label: "Create Sale", path: "/sales-orders/new", icon: ShoppingCart, bg: "bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/50" },
    { label: "Create Purchase", path: "/purchases/new", icon: ShoppingBag, bg: "bg-muted dark:bg-slate-800 text-foreground dark:text-slate-100 border-border dark:border-slate-700" },
    { label: "Add Customer", path: "/customers/new", icon: UserPlus, bg: "bg-muted dark:bg-slate-800 text-foreground dark:text-slate-100 border-border dark:border-slate-700" },
    { label: "Receive Payment", path: "/payments/new", icon: DollarSign, bg: "bg-green-50 dark:bg-green-950/60 text-green-700 dark:text-green-400 border-green-100 dark:border-green-900/50" },
    { label: "Add Material", path: "/materials/new", icon: PackagePlus, bg: "bg-muted dark:bg-slate-800 text-foreground dark:text-slate-100 border-border dark:border-slate-700" },
  ];

  return (
    <section className="space-y-3.5">
      <h2 className="text-xs font-black tracking-wider text-muted-foreground dark:text-muted-foreground uppercase">Quick Actions</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-5 md:overflow-visible" style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="flex min-w-[135px] flex-col items-center justify-center gap-3 rounded-2xl border border-border dark:border-slate-800 bg-card dark:bg-slate-900 p-4 py-4 text-center transition-all duration-200 hover:shadow-md hover:border-orange-400 dark:hover:border-orange-500 group cursor-pointer"
            >
              <span className={`flex h-12 w-12 items-center justify-center rounded-xl border transition-transform group-hover:scale-110 ${action.bg}`}>
                <Icon size={22} />
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-foreground dark:text-white leading-snug">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
