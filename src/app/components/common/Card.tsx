import React from "react";
import { C } from "../../../constants/colors";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
}

export const Card = ({ children, className = "", dark = false, ...props }: CardProps) => (
  <div
    style={dark ? {
      background: C.darkCard,
      border: `1px solid ${C.darkBorder}`,
    } : undefined}
    className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all duration-300 ${className}`}
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
    <div className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col justify-between min-h-[115px] transition-all duration-200 hover:shadow-md ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-extrabold tracking-wide text-slate-600 dark:text-slate-400 uppercase leading-snug">{displayTitle}</p>
        {Icon && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-100/50 dark:border-orange-900/50">
            <Icon size={16} />
          </span>
        )}
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-2">
        <div className="space-y-0.5 min-w-0 flex-1">
          <div className="text-2xl sm:text-[28px] font-black text-slate-900 dark:text-white tracking-tight leading-none truncate">{value}</div>
          {displayExplanation && <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold truncate mt-1">{displayExplanation}</p>}
        </div>
        {trend && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${trend.positive ? "bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-400" : "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400"}`}>
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
};
