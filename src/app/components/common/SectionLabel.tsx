import React from "react";

export interface SectionLabelProps {
  children: React.ReactNode;
  action?: string;
  onAction?: () => void;
}

export const SectionLabel = ({ children, action, onAction }: SectionLabelProps) => (
  <div className="flex items-center justify-between mb-3">
    <h3 className="text-base md:text-lg font-semibold text-foreground tracking-tight">{children}</h3>
    {action && <button onClick={onAction} className="text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer">{action}</button>}
  </div>
);

