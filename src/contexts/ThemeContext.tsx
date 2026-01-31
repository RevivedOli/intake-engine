"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AppTheme } from "@/types";

interface ThemeContextValue {
  theme: AppTheme;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  theme,
  children,
}: {
  theme: AppTheme;
  children: ReactNode;
}) {
  return (
    <ThemeContext.Provider value={{ theme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): AppTheme {
  const ctx = useContext(ThemeContext);
  if (!ctx) return {};
  return ctx.theme;
}
