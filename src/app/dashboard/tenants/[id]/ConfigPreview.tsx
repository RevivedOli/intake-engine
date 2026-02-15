"use client";

import { useState } from "react";
import type { AppConfig } from "@/types/config";

const WIDTH_OPTIONS = [
  { value: 320, label: "320px" },
  { value: 360, label: "360px" },
  { value: 480, label: "480px" },
  { value: 768, label: "768px" },
  { value: "100%", label: "Full" },
] as const;

export function ConfigPreview({ config }: { config: AppConfig }) {
  const [width, setWidth] = useState<number | "100%">(360);
  const theme = config.theme ?? {};
  const primary = theme.primaryColor ?? "#4a6b5a";
  const bg = theme.background ?? "#0d1f18";
  const fontFamily = theme.fontFamily ?? "var(--font-sans)";
  const layout = theme.layout ?? "centered";
  const hero = config.hero;
  const isBgImage = bg.startsWith("http");

  const layoutCenter = layout === "centered";
  const layoutLeft = layout === "left";

  return (
    <div
      className="rounded-lg border border-zinc-600 overflow-hidden shadow-lg flex flex-col min-h-[320px] shrink-0"
      style={{
        maxWidth: width === "100%" ? "100%" : width,
        width: width === "100%" ? "100%" : width,
      }}
    >
      <div className="px-3 py-2 border-b border-zinc-600 bg-zinc-800/80 text-zinc-400 text-xs font-medium flex items-center justify-between gap-2 flex-wrap">
        <span>Live preview</span>
        <div className="flex items-center gap-2">
          <select
            value={width}
            onChange={(e) =>
              setWidth(
                e.target.value === "100%" ? "100%" : Number(e.target.value)
              )
            }
            className="rounded bg-zinc-700 border border-zinc-600 text-zinc-200 text-xs py-1 px-2"
            aria-label="Preview width"
          >
            {WIDTH_OPTIONS.map((o) => (
              <option key={String(o.value)} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div
          className={`flex-1 flex flex-col justify-center p-5 transition-colors duration-150 ${
            layoutCenter
              ? "items-center text-center"
              : layoutLeft
                ? "items-start text-left"
                : "items-center text-center"
          }`}
          style={{
            background: isBgImage ? `url(${bg}) center/cover` : bg,
            fontFamily,
          }}
        >
          {hero?.logoUrl && (
            <div className={`mb-4 flex ${layoutCenter ? "justify-center" : "justify-start"}`}>
              <img
                src={hero.logoUrl}
                alt=""
                className="max-h-10 w-auto object-contain"
              />
            </div>
          )}
          {hero?.imageUrl && (
            <div className={`mb-3 flex ${layoutCenter ? "justify-center" : "justify-start"}`}>
              <img
                src={hero.imageUrl}
                alt=""
                className="w-full max-h-24 object-contain rounded"
              />
            </div>
          )}
          {hero?.title && (
            <h2 className="text-xl font-bold mb-3 text-white/95">
              {hero.title}
            </h2>
          )}
          <div
            className={`space-y-2 mb-4 text-white/80 text-sm leading-relaxed ${
              layoutCenter ? "text-center" : "text-left"
            }`}
          >
            {(hero?.body ?? []).slice(0, 3).map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
            {(hero?.body?.length ?? 0) > 3 && (
              <p className="text-white/50 text-xs">…</p>
            )}
          </div>
          {hero?.ctaLabel && (
            <p className={`text-white/70 text-xs mb-2 ${layoutCenter ? "text-center" : "text-left"}`}>
              {hero.ctaLabel}
            </p>
          )}
          <button
            type="button"
            className="px-5 py-2 rounded-lg font-semibold text-white text-sm transition-opacity hover:opacity-90 pointer-events-none"
            style={{ backgroundColor: primary }}
          >
            {hero?.buttonLabel ?? hero?.ctaLabel ?? "Get started"}
          </button>
          {hero?.footerText && (
            <p className={`mt-3 text-white/50 text-xs ${layoutCenter ? "text-center" : "text-left"}`}>
              {hero.footerText}
            </p>
          )}
        </div>
    </div>
  );
}
