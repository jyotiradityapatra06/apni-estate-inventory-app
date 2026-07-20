import React from "react";
import { C } from "../../../constants/colors";

export interface SectionLabelProps {
  children: React.ReactNode;
  action?: string;
  onAction?: () => void;
}

export const SectionLabel = ({ children, action, onAction }: SectionLabelProps) => (
  <div className="flex items-center justify-between mb-3">
    <span style={{ color: C.muted }} className="text-[11px] font-semibold uppercase tracking-wider">{children}</span>
    {action && <button onClick={onAction} style={{ color: C.blue }} className="text-xs font-semibold">{action}</button>}
  </div>
);
