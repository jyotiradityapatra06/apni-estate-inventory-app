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
    <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between h-[110px] transition-all duration-200 hover:shadow-md ${className}`}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">{displayTitle}</p>
        {Icon && (
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-orange-600 border border-orange-100/50">
            <Icon size={14} />
          </span>
        )}
      </div>
      <div className="mt-1 flex items-baseline justify-between">
        <div className="space-y-0.5">
          <div className="text-2xl font-black text-slate-900 tracking-tight leading-none">{value}</div>
          {displayExplanation && <p className="text-[11px] text-slate-400 font-medium truncate">{displayExplanation}</p>}
        </div>
        {trend && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${trend.positive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
};
