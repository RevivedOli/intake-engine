"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AppConfig } from "@/types/config";

const WIDTH_OPTIONS = [
  { value: 320, label: "320px" },
  { value: 360, label: "360px" },
  { value: 480, label: "480px" },
  { value: 768, label: "768px" },
  { value: "100%", label: "Full" },
] as const;

function getPrivacyMode(pp: AppConfig["privacyPolicy"]): "internal" | "external" {
  if (!pp || typeof pp !== "object") return "internal";
  const raw = pp as Record<string, unknown>;
  if (raw.mode === "external") return "external";
  return "internal";
}

export function PrivacyPolicyPreview({ config }: { config: AppConfig }) {
  const [width, setWidth] = useState<number | "100%">(360);
  const theme = config.theme ?? {};
  const primary = theme.primaryColor ?? "#4a6b5a";
  const bg = theme.background ?? "#0d1f18";
  const fontFamily = theme.fontFamily ?? "var(--font-sans)";
  const pp = config.privacyPolicy;
  const mode = getPrivacyMode(pp);
  const content =
    pp && typeof pp === "object" && "content" in pp && typeof (pp as { content?: string }).content === "string"
      ? ((pp as { content: string }).content ?? "").trim()
      : "";
  const url =
    pp && typeof pp === "object" && "url" in pp && typeof (pp as { url?: string }).url === "string"
      ? ((pp as { url: string }).url ?? "").trim()
      : "";
  const isBgImage = typeof bg === "string" && bg.startsWith("http");

  return (
    <div
      className="rounded-lg border border-zinc-600 overflow-hidden shadow-lg flex flex-col shrink-0"
      style={{
        maxWidth: width === "100%" ? "100%" : width,
        width: width === "100%" ? "100%" : width,
      }}
    >
      <div className="px-3 py-2 border-b border-zinc-600 bg-zinc-800/80 text-zinc-400 text-xs font-medium flex items-center justify-between gap-2 flex-wrap">
        <span>Privacy policy preview</span>
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
      <div
        className="p-5 flex-1 overflow-y-auto min-h-[320px]"
        style={{
          background: isBgImage ? `url(${bg}) center/cover` : bg,
          fontFamily,
        }}
      >
        {mode === "external" ? (
          url ? (
            <p className="text-white/80 text-sm">
              Privacy policy links to:{" "}
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:underline break-all"
              >
                {url}
              </a>
            </p>
          ) : (
            <p className="text-white/40 text-sm">Enter an external URL for your privacy policy.</p>
          )
        ) : content ? (
          <article
            className="prose prose-invert prose-sm max-w-none
              prose-headings:text-white/95 prose-headings:mt-6 prose-headings:mb-3
              prose-p:text-white/80 prose-p:my-2
              prose-li:text-white/80 prose-li:my-0.5
              prose-hr:my-6 prose-hr:border-white/20
              prose-a:text-amber-400 prose-a:no-underline hover:prose-a:underline"
            style={{
              ["--tw-prose-links" as string]: primary,
            }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 hover:underline"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </article>
        ) : (
          <p className="text-white/40 text-sm">No content yet. Add your privacy policy in Markdown.</p>
        )}
      </div>
    </div>
  );
}
