import React from "react";

export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

const badgeStyles: Record<BadgeVariant, {
  bg: string;
  text: string;
  dot: string;
  border?: string;
}> = {
  default: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    dot: "bg-slate-400"
  },
  success: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500"
  },
  warning: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500"
  },
  danger: {
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500"
  },
  info: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500"
  },
  neutral: {
    bg: "bg-gray-100",
    text: "text-gray-600",
    dot: "bg-gray-400"
  }
};

export interface BadgeProps {
  label?: string;
  children?: React.ReactNode;
  variant?: BadgeVariant;
  color?: string; // Kept as string for transition fallback safety
  className?: string;
}

export const Badge = ({ label, children, variant = "default", color, className }: BadgeProps) => {
  // Translate legacy color prop values if provided
  let activeVariant: BadgeVariant = variant;
  if (color) {
    if (color === "error") activeVariant = "danger";
    else if (color === "blue") activeVariant = "info";
    else if (color === "success" || color === "warning" || color === "neutral") {
      activeVariant = color as BadgeVariant;
    } else {
      activeVariant = "default";
    }
  }

  const selectedStyle = badgeStyles[activeVariant] ?? badgeStyles.default;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold leading-none ${selectedStyle.bg} ${selectedStyle.text} ${className || ""}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${selectedStyle.dot}`} />
      {children || label}
    </span>
  );
};
export default Badge;
