import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { C } from "../../../constants/colors";

export interface StatChipProps {
  label: string;
  value: string;
  sub?: string | null;
  trend?: "up" | "down" | null;
}

export const StatChip = ({ label, value, sub, trend }: StatChipProps) => (
  <div style={{ background: C.white, border: `1px solid ${C.border}` }} className="rounded-xl p-3 flex-1 min-w-0">
    <div style={{ color: C.muted }} className="text-[10px] font-medium uppercase tracking-wide mb-1 truncate">{label}</div>
    <div style={{ fontFamily: "'Space Grotesk', monospace", color: C.ink }} className="text-base font-bold leading-none truncate">{value}</div>
    {sub && (
      <div className="flex items-center gap-1 mt-1">
        {trend === "up" && <ArrowUpRight size={10} color={C.success} />}
        {trend === "down" && <ArrowDownRight size={10} color={C.error} />}
        <span style={{ color: trend === "up" ? C.success : trend === "down" ? C.error : C.muted }} className="text-[10px] font-medium">{sub}</span>
      </div>
    )}
  </div>
);
