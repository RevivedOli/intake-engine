"use client";

import { useTheme } from "@/contexts/ThemeContext";

interface ProgressProps {
  current: number;
  total: number;
  /** Optional step name for display (e.g. "Question 2 of 6") */
  label?: string;
}

export function Progress({ current, total, label }: ProgressProps) {
  const theme = useTheme();
  const primary = theme.primaryColor ?? "#a47f4c";
  const pct = total > 0 ? Math.min(100, (current / total) * 100) : 0;

  return (
    <div className="w-full">
      {label && (
        <p className="text-sm text-white/60 mb-1" style={{ fontFamily: theme.fontFamily }}>
          {label}
        </p>
      )}
      <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${pct}%`, backgroundColor: primary }}
        />
      </div>
    </div>
  );
}
