import type { ReactNode } from "react";
import { fmt } from "../../../utils/currency";
import { useAuth } from "../../../hooks/useAuth";
import { hasPermission } from "../../../utils/permissions";

export const StatCard = ({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string;
  value: ReactNode;
  helper?: string;
  icon?: any;
}) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between h-[110px] transition-all duration-200 hover:shadow-md">
    <div className="flex items-start justify-between">
      <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">{label}</p>
      {Icon && (
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-orange-600 border border-orange-100/50">
          <Icon size={14} />
        </span>
      )}
    </div>
    <div className="mt-1 flex items-baseline justify-between">
      <div className="space-y-0.5">
        <div className="text-2xl font-black text-slate-900 tracking-tight leading-none">{value}</div>
        {helper && <p className="text-[11px] text-slate-400 font-medium truncate">{helper}</p>}
      </div>
    </div>
  </div>
);
export const MobileEntityCard = ({ children }: { children: ReactNode }) => <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:hidden">{children}</article>;
export const DesktopDataTable = ({ children }: { children: ReactNode }) => <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white md:block">{children}</div>;
export const SearchFilterBar = ({ children }: { children: ReactNode }) => <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center">{children}</div>;
export const StickyFormActions = ({ children }: { children: ReactNode }) => <div className="sticky bottom-[72px] z-20 -mx-4 mt-6 flex justify-end gap-2 border-t border-slate-200 bg-white/95 p-4 backdrop-blur md:bottom-0 md:mx-0 md:rounded-xl md:border">{children}</div>;
export const CurrencyDisplay = ({ value }: { value: number | string | null | undefined }) => <span className="tabular-nums">{fmt(Number(value || 0))}</span>;
export const QuantityDisplay = ({ value, unit }: { value: number | string; unit?: string }) => <span className="tabular-nums">{Number(value).toLocaleString("en-IN", { maximumFractionDigits: 3 })}{unit ? ` ${unit}` : ""}</span>;
export function PermissionGuard({ permission, children }: { permission: string; children: ReactNode }) { const { user } = useAuth(); return hasPermission(user, permission) ? <>{children}</> : null; }
