import React from "react";
import { C } from "../../../constants/colors";

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
}

export const Card = ({ children, className = "", dark = false }: CardProps) => (
  <div
    style={{
      background: dark ? C.darkCard : C.white,
      border: `1px solid ${dark ? C.darkBorder : C.border}`,
      boxShadow: dark ? "none" : "0 1px 3px 0 rgba(20, 18, 14, 0.05), 0 1px 2px -1px rgba(20, 18, 14, 0.05)",
    }}
    className={`rounded-xl transition-all duration-300 ${className}`}
  >
    {children}
  </div>
);
