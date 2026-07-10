import React from "react";
import { C } from "../../../constants/colors";

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
}

export const Card = ({ children, className = "", dark = false }: CardProps) => (
  <div
    style={{ background: dark ? C.darkCard : C.white, border: `1px solid ${dark ? C.darkBorder : C.border}` }}
    className={`rounded-xl ${className}`}
  >
    {children}
  </div>
);
