"use client";

import type { HeroConfig } from "@/types";
import { useTheme } from "@/contexts/ThemeContext";

interface HeroProps {
  config: HeroConfig;
  onStart: () => void;
  /** When true, use min-h-full to fill the container (e.g. when announcement banner reduces viewport) */
  fillContainer?: boolean;
}

export function Hero({ config, onStart, fillContainer }: HeroProps) {
  const theme = useTheme();
  const bg = theme.background ?? "#1a2e28";
  const primary = theme.primaryColor ?? "#a47f4c";
  const fontFamily = theme.fontFamily ?? "var(--font-sans)";
  const layout = theme.layout ?? "centered";
  const isCentered = layout === "centered" || layout === "full-width";
  const isLeft = layout === "left";

  const minHeightClass = fillContainer ? "min-h-full" : "min-h-screen";
  const outerClasses = [
    `${minHeightClass} flex flex-col p-6 sm:p-8 transition-opacity duration-300 animate-fade-in`,
    isCentered ? "items-center justify-center" : isLeft ? "items-start justify-center" : "items-center justify-center",
  ].join(" ");

  const innerAlign = isCentered ? "text-center" : "text-left";
  const innerJustify = isCentered ? "justify-center" : "justify-start";

  return (
    <div
      className={outerClasses}
      style={{
        background: bg.startsWith("http") ? `url(${bg}) center/cover` : bg,
        fontFamily,
      }}
    >
      <div className={`max-w-xl w-full ${innerAlign}`}>
        {config.logoUrl && (
          <div className={`mb-8 flex ${innerJustify}`}>
            <img
              src={config.logoUrl}
              alt=""
              className="max-h-16 sm:max-h-20 w-auto object-contain"
              fetchPriority="high"
              loading="eager"
            />
          </div>
        )}
        {config.imageUrl && (
          <div className={`mb-6 flex ${innerJustify}`}>
            <img
              src={config.imageUrl}
              alt=""
              className="w-full max-h-52 sm:max-h-64 object-contain"
              fetchPriority="high"
              loading="eager"
            />
          </div>
        )}
        {config.title && (
          <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-white/95">
            {config.title}
          </h1>
        )}
        <div
          className={`space-y-4 mb-8 text-white/80 text-base sm:text-lg leading-relaxed ${innerAlign}`}
        >
          {config.body.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
        {config.ctaLabel && (
          <p className={`text-white/70 text-sm mb-4 ${innerAlign}`}>
            {config.ctaLabel}
          </p>
        )}
        <div className={isCentered ? "flex justify-center" : "flex justify-start"}>
          <button
            type="button"
            onClick={onStart}
            className="px-8 py-3 rounded-lg font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/50"
            style={{ backgroundColor: primary }}
          >
            {config.buttonLabel ?? config.ctaLabel ?? "Start"}
          </button>
        </div>
        {config.footerText && (
          <p className={`mt-4 text-white/50 text-sm ${innerAlign}`}>
            {config.footerText}
          </p>
        )}
      </div>
    </div>
  );
}
