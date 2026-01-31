"use client";

import type { HeroConfig } from "@/types";
import { useTheme } from "@/contexts/ThemeContext";

interface HeroProps {
  config: HeroConfig;
  onStart: () => void;
}

export function Hero({ config, onStart }: HeroProps) {
  const theme = useTheme();
  const bg = theme.background ?? "#1a2e28";
  const primary = theme.primaryColor ?? "#a47f4c";
  const fontFamily = theme.fontFamily ?? "var(--font-sans)";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-8 transition-opacity duration-300 animate-fade-in"
      style={{
        background: bg.startsWith("http") ? `url(${bg}) center/cover` : bg,
        fontFamily,
      }}
    >
      <div className="max-w-xl w-full text-center">
        {config.logoUrl && (
          <div className="mb-8 flex justify-center">
            <img
              src={config.logoUrl}
              alt=""
              className="max-h-16 sm:max-h-20 w-auto object-contain"
            />
          </div>
        )}
        {config.imageUrl && (
          <div className="mb-6 flex justify-center">
            <img
              src={config.imageUrl}
              alt=""
              className="w-full max-h-52 sm:max-h-64 object-contain"
            />
          </div>
        )}
        {config.title && (
          <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-white/95">
            {config.title}
          </h1>
        )}
        <div className="space-y-4 mb-8 text-white/80 text-left text-base sm:text-lg leading-relaxed">
          {config.body.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
        {config.ctaLabel && (
          <p className="text-white/70 text-sm mb-4">{config.ctaLabel}</p>
        )}
        <button
          type="button"
          onClick={onStart}
          className="px-8 py-3 rounded-lg font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/50"
          style={{ backgroundColor: primary }}
        >
          Start
        </button>
        {config.footerText && (
          <p className="mt-4 text-white/50 text-sm">{config.footerText}</p>
        )}
      </div>
    </div>
  );
}
