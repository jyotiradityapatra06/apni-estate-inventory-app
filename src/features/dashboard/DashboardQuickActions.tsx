import { useNavigate } from "react-router";
import { ShoppingCart, ShoppingBag, UserPlus, DollarSign, PackagePlus } from "lucide-react";

export function DashboardQuickActions() {
  const navigate = useNavigate();

  const actions = [
    { label: "Create Sale", path: "/sales-orders/new", icon: ShoppingCart, bg: "bg-orange-50 text-orange-600 border-orange-100" },
    { label: "Create Purchase", path: "/purchases/new", icon: ShoppingBag, bg: "bg-slate-50 text-slate-900 border-slate-200" },
    { label: "Add Customer", path: "/customers/new", icon: UserPlus, bg: "bg-slate-50 text-slate-900 border-slate-200" },
    { label: "Receive Payment", path: "/payments/new", icon: DollarSign, bg: "bg-green-50 text-green-700 border-green-100" },
    { label: "Add Material", path: "/materials/new", icon: PackagePlus, bg: "bg-slate-50 text-slate-900 border-slate-200" },
  ];

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-bold tracking-wider text-slate-500 uppercase">Quick Actions</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-5 md:overflow-visible" style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="flex min-w-[125px] flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-center transition-all duration-200 hover:shadow-md hover:border-orange-400 group cursor-pointer"
            >
              <span className={`flex h-12 w-12 items-center justify-center rounded-xl border transition-transform group-hover:scale-110 ${action.bg}`}>
                <Icon size={22} />
              </span>
              <span className="text-xs font-bold text-slate-900 leading-tight">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
