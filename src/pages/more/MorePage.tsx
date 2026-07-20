import { useNavigate } from "react-router";
import { moreItems } from "../../constants/navigation";
import { useAuth } from "../../hooks/useAuth";
import { hasPermission } from "../../utils/permissions";

export default function MorePage() {
  const navigate = useNavigate();
  const { user, business } = useAuth();
  const visible = moreItems.filter((item) => {
    if (!user) return false;
    if (item.allowedRoles && !item.allowedRoles.includes(user.role.toUpperCase())) return false;
    return !item.requiredPermission || hasPermission(user, item.requiredPermission);
  });
  return <div className="space-y-6">
    <div><h1 className="text-2xl md:text-3xl font-bold text-slate-950">More</h1><p className="mt-1 text-base text-slate-600">{business?.name || "Your business"}</p></div>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {visible.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => navigate(item.path)} className="min-h-28 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md active:scale-[.98]">
        <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700"><Icon size={22}/></span>
        <span className="text-base font-semibold text-slate-900">{item.label}</span>
      </button>; })}
    </div>
  </div>;
}
