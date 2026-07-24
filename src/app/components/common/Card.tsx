import React from "react";
import { C } from "../../../constants/colors";
import type { LucideIcon } from "lucide-react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
}

export const Card = ({ children, className = "", dark = false, ...props }: CardProps) => (
  <div
    style={{
      background: dark ? C.darkCard : C.white,
      border: `1px solid ${dark ? C.darkBorder : C.border}`,
      boxShadow: dark ? "none" : "0 1px 3px 0 rgba(20, 18, 14, 0.05), 0 1px 2px -1px rgba(20, 18, 14, 0.05)",
    }}
    className={`rounded-xl transition-all duration-300 ${className}`}
    {...props}
  >
    {children}
  </div>
);

export interface StatCardProps {
  title?: string;
  label?: string;
  value: string | number | React.ReactNode;
  explanation?: string;
  helper?: string;
  icon?: any;
  trend?: {
    value: string;
    positive?: boolean;
  };
  className?: string;
}

export const StatCard = ({ title, label, value, explanation, helper, icon: Icon, trend, className = "" }: StatCardProps) => {
  const displayTitle = title || label || "";
  const displayExplanation = explanation || helper;

  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between min-h-[115px] transition-all duration-200 hover:shadow-md ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-extrabold tracking-wide text-slate-600 uppercase leading-snug">{displayTitle}</p>
        {Icon && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600 border border-orange-100/50">
            <Icon size={16} />
          </span>
        )}
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-2">
        <div className="space-y-0.5 min-w-0 flex-1">
          <div className="text-2xl sm:text-[28px] font-black text-slate-900 tracking-tight leading-none truncate">{value}</div>
          {displayExplanation && <p className="text-xs text-slate-500 font-semibold truncate mt-1">{displayExplanation}</p>}
        </div>
        {trend && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${trend.positive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
};
