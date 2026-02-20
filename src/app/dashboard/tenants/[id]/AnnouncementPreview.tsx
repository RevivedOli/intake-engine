"use client";

import { useState } from "react";
import type { AppConfig } from "@/types/config";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";

const WIDTH_OPTIONS = [
  { value: 320, label: "320px" },
  { value: 360, label: "360px" },
  { value: 480, label: "480px" },
  { value: 768, label: "768px" },
  { value: "100%", label: "Full" },
] as const;

function getAnnouncement(config: AppConfig) {
  const a = config.announcement;
  if (!a || typeof a !== "object" || !a.enabled || !a.message?.trim())
    return null;
  return {
    message: a.message,
    backgroundColor: a.backgroundColor ?? "#c41e3a",
    textColor: a.textColor ?? "#ffffff",
  };
}

export function AnnouncementPreview({ config }: { config: AppConfig }) {
  const [width, setWidth] = useState<number | "100%">(360);
  const a = getAnnouncement(config);

  return (
    <div
      className="rounded-lg border border-zinc-600 overflow-hidden shadow-lg shrink-0"
      style={{
        maxWidth: width === "100%" ? "100%" : width,
        width: width === "100%" ? "100%" : width,
      }}
    >
      <div className="px-3 py-2 border-b border-zinc-600 bg-zinc-800/80 text-zinc-400 text-xs font-medium flex items-center justify-between gap-2 flex-wrap">
        <span>Announcement preview</span>
        <select
          value={width}
          onChange={(e) =>
            setWidth(e.target.value === "100%" ? "100%" : Number(e.target.value))
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
      <div className="bg-zinc-900/50">
        {a ? (
          <AnnouncementBanner
            message={a.message}
            backgroundColor={a.backgroundColor}
            textColor={a.textColor}
          />
        ) : (
          <div className="py-6 px-4 text-center text-zinc-500 text-sm">
            Enable the announcement banner and add a message to see the preview.
          </div>
        )}
        <div className="h-24 flex items-center justify-center text-zinc-600 text-xs">
          (Page content below)
        </div>
      </div>
    </div>
  );
}
