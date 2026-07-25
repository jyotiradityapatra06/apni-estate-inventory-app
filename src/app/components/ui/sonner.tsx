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
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
