import React from "react";
import { Loader2 } from "lucide-react";

export interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string; size?: number }>;
  variant?: "primary" | "secondary" | "outline" | "danger";
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  loadingText,
  children,
  type = "button",
  disabled,
  className = "",
  onClick,
  icon: Icon,
  variant = "primary",
  ...props
}) => {
  const isBlocked = disabled || loading;

  const baseStyles = "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 press-active";
  
  const variantStyles = {
    primary: "bg-orange-600 hover:bg-orange-700 text-white shadow-sm disabled:bg-orange-400",
    secondary: "bg-slate-900 hover:bg-slate-800 text-white shadow-sm disabled:bg-slate-700",
    outline: "border border-border bg-card hover:bg-muted text-muted-foreground disabled:bg-muted",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-sm disabled:bg-red-400"
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isBlocked) {
      e.preventDefault();
      return;
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      type={type}
      disabled={isBlocked}
      onClick={handleClick}
      className={`${baseStyles} ${variantStyles[variant] || ""} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin shrink-0" size={16} />
          <span>{loadingText || children}</span>
        </>
      ) : (
        <>
          {Icon && <Icon size={16} className="shrink-0" />}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};

export default LoadingButton;
