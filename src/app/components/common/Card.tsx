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
    className={`rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition-all duration-200 ${className}`}
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
    <div className={`rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm flex flex-col justify-between min-h-[128px] transition-all duration-200 hover:shadow-md ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm md:text-[15px] font-medium text-muted-foreground leading-snug">{displayTitle}</p>
        {Icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-100/60 dark:border-orange-900/60">
            <Icon size={18} />
          </span>
        )}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="text-2xl md:text-3xl lg:text-[34px] font-bold text-foreground tracking-tight leading-none truncate">{value}</div>
          {displayExplanation && <p className="text-xs text-muted-foreground font-medium truncate mt-1">{displayExplanation}</p>}
        </div>
        {trend && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${trend.positive ? "bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-400 border border-green-200/60 dark:border-green-800/60" : "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-200/60 dark:border-red-800/60"}`}>
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
};

