import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../../../hooks/useAuth";
import { getVisibleQuickActions } from "../../../constants/quickActions";

export function MobileQuickActionFab() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  if (!user) return null;
  if (location.pathname.endsWith("/new") || location.pathname.endsWith("/edit")) return null;
  const actions = getVisibleQuickActions(user);
  if (!actions.length) return null;
  const go = (path: string) => { setOpen(false); navigate(path); };
  return <>
    {open && <button aria-label="Close quick actions" onClick={() => setOpen(false)} className="fixed inset-0 z-[55] bg-slate-950/35 md:hidden" />}
    {open && <div className="fixed bottom-28 right-4 z-[60] w-[min(320px,calc(100vw-32px))] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl md:hidden">
      <p className="px-2 pb-2 text-base font-bold text-slate-900">Quick Actions</p>
      <div className="space-y-1">{actions.map(({label,icon:Icon,path}) => <button key={label} onClick={() => go(path)} className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-base font-semibold text-slate-800 hover:bg-slate-50"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700"><Icon size={20}/></span>{label}</button>)}</div>
    </div>}
    <button aria-label={open ? "Close quick actions" : "Open quick actions"} onClick={() => setOpen(!open)} className="fixed bottom-[84px] right-4 z-[65] flex h-14 w-14 items-center justify-center rounded-full bg-blue-700 text-white shadow-lg ring-4 ring-white md:hidden active:scale-95">{open ? <X size={26}/> : <Plus size={28}/>}</button>
  </>;
}
