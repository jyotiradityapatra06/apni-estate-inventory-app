"use client";

import { Toaster as Sonner, ToasterProps } from "sonner";
import { useTheme } from "../../../hooks/useTheme";

const Toaster = ({ ...props }: ToasterProps) => {
  let theme: "light" | "dark" = "light";
  try {
    const themeContext = useTheme();
    theme = themeContext.theme;
  } catch (e) {
    // Fallback if rendered outside ThemeProvider
  }

  return (
    <Sonner
      theme={theme}
      className="toaster group z-[99999]"
      style={
        {
          "--normal-bg": "var(--popover, #ffffff)",
          "--normal-text": "var(--popover-foreground, #0f172a)",
          "--normal-border": "var(--border, #e2e8f0)",
          zIndex: 99999,
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
