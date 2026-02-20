"use client";

import type { AppConfig, AnnouncementConfig } from "@/types/config";

const inputClass =
  "w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-600 text-white";
const labelClass = "block text-sm font-medium text-zinc-300 mb-1";
const hintClass = "text-xs text-zinc-500 mt-1";

function ColorHexInput({
  value,
  onChange,
  className,
  placeholder = "#hex",
}: {
  value: string;
  onChange: (hex: string | undefined) => void;
  className?: string;
  placeholder?: string;
}) {
  const normalizedHex = (() => {
    const h = (value ?? "").replace(/^#/, "").trim();
    if (/^[0-9A-Fa-f]{6}$/.test(h)) return `#${h.toLowerCase()}`;
    if (/^[0-9A-Fa-f]{3}$/.test(h))
      return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toLowerCase();
    return null;
  })();
  const pickerValue = normalizedHex ?? "#808080";

  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={pickerValue}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-9 rounded border border-zinc-600 cursor-pointer bg-transparent shrink-0 [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded"
        title="Pick colour"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value || undefined)}
        className={className}
        placeholder={placeholder}
      />
    </div>
  );
}

const DEFAULT_ANNOUNCEMENT: AnnouncementConfig = {
  enabled: false,
  message: "Sale now",
  backgroundColor: "#c41e3a",
  textColor: "#ffffff",
  scope: "hero",
};

function getAnnouncement(config: AppConfig): AnnouncementConfig {
  const a = config.announcement;
  if (!a || typeof a !== "object") return DEFAULT_ANNOUNCEMENT;
  return {
    enabled: Boolean(a.enabled),
    message: typeof a.message === "string" ? a.message : DEFAULT_ANNOUNCEMENT.message,
    backgroundColor: typeof a.backgroundColor === "string" ? a.backgroundColor : DEFAULT_ANNOUNCEMENT.backgroundColor,
    textColor: typeof a.textColor === "string" ? a.textColor : DEFAULT_ANNOUNCEMENT.textColor,
    scope: a.scope === "full" ? "full" : "hero",
  };
}

export function AnnouncementFormFields({
  config,
  onChange,
}: {
  config: AppConfig;
  onChange: (config: AppConfig) => void;
}) {
  const a = getAnnouncement(config);

  function updateAnnouncement(patch: Partial<AnnouncementConfig>) {
    const next = { ...a, ...patch };
    onChange({ ...config, announcement: next });
  }

  return (
    <div className="space-y-6">
      <section className="flex items-start gap-3">
        <input
          type="checkbox"
          id="announcement-enabled"
          checked={a.enabled}
          onChange={(e) => updateAnnouncement({ enabled: e.target.checked })}
          className="mt-1 rounded border-zinc-600 bg-zinc-800 text-amber-500 focus:ring-amber-500"
        />
        <div>
          <label htmlFor="announcement-enabled" className={labelClass}>
            Show announcement banner
          </label>
          <p className={hintClass}>
            A thin strip at the top (e.g. for sales or promos).
          </p>
        </div>
      </section>

      {a.enabled && (
        <>
          <section>
            <label className={labelClass} htmlFor="announcement-message">
              Message
            </label>
            <input
              id="announcement-message"
              type="text"
              value={a.message}
              onChange={(e) => updateAnnouncement({ message: e.target.value })}
              className={inputClass}
              placeholder="e.g. Sale ends 15th October"
            />
          </section>

          <section>
            <label className={labelClass}>Background colour</label>
            <ColorHexInput
              value={a.backgroundColor}
              onChange={(v) => updateAnnouncement({ backgroundColor: v || DEFAULT_ANNOUNCEMENT.backgroundColor })}
              className={inputClass}
              placeholder="#c41e3a"
            />
          </section>

          <section>
            <label className={labelClass}>Text colour</label>
            <ColorHexInput
              value={a.textColor}
              onChange={(v) => updateAnnouncement({ textColor: v || DEFAULT_ANNOUNCEMENT.textColor })}
              className={inputClass}
              placeholder="#ffffff"
            />
          </section>

          <section>
            <label className={labelClass}>Scope</label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="announcement-scope"
                  checked={a.scope === "hero"}
                  onChange={() => updateAnnouncement({ scope: "hero" })}
                  className="border-zinc-500 bg-zinc-800 text-amber-500 focus:ring-amber-500"
                />
                <span>Hero only</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="announcement-scope"
                  checked={a.scope === "full"}
                  onChange={() => updateAnnouncement({ scope: "full" })}
                  className="border-zinc-500 bg-zinc-800 text-amber-500 focus:ring-amber-500"
                />
                <span>Full funnel</span>
              </label>
            </div>
            <p className={hintClass}>
              Hero only: banner appears on the welcome page. Full funnel: banner appears on all steps.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
