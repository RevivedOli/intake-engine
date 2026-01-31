"use client";

import type { IntakeResult, EmbedResultWithUrl, EmbedResultWithHtml } from "@/types";
import { useTheme } from "@/contexts/ThemeContext";

interface ResultScreenProps {
  result: IntakeResult;
  defaultThankYouMessage?: string;
}

export function ResultScreen({ result, defaultThankYouMessage }: ResultScreenProps) {
  const theme = useTheme();
  const primary = theme.primaryColor ?? "#a47f4c";
  const fontFamily = theme.fontFamily ?? "var(--font-sans)";

  if ("job_id" in result) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-8 text-white/80"
        style={{ fontFamily }}
      >
        <p>Processing…</p>
      </div>
    );
  }

  if (result.mode === "thank_you") {
    const message =
      result.message ?? defaultThankYouMessage ?? "Thank you.";
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-8 text-center animate-fade-in"
        style={{ fontFamily }}
      >
        <p className="text-xl text-white/95 max-w-md">{message}</p>
      </div>
    );
  }

  if (result.mode === "link") {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-8 text-center animate-fade-in"
        style={{ fontFamily }}
      >
        <a
          href={result.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-8 py-3 rounded-lg font-semibold text-white focus:outline-none focus:ring-2 focus:ring-white/50"
          style={{ backgroundColor: primary }}
        >
          {result.label}
        </a>
      </div>
    );
  }

  if (result.mode === "embed") {
    const hasUrl = "url" in result && result.url;
    const hasHtml = "html" in result && result.html;

    if (hasUrl) {
      const r = result as EmbedResultWithUrl;
      return (
        <div
          className="min-h-screen p-6 sm:p-8 flex flex-col items-center justify-center animate-fade-in max-w-2xl mx-auto"
          style={{ fontFamily }}
        >
          {r.title && (
            <h2 className="text-2xl font-bold text-white/95 text-center mb-1 w-full">
              {r.title}
            </h2>
          )}
          {r.subtitle && (
            <p className="text-lg text-white/80 text-center mb-6 w-full">
              {r.subtitle}
            </p>
          )}
          <div className="w-full aspect-video rounded-lg overflow-hidden bg-black/20 mb-6">
            <iframe
              title={r.title ?? "Video"}
              src={r.url}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          {r.textBelow && (
            <p className="text-white/80 text-center mb-6 w-full">{r.textBelow}</p>
          )}
          {r.button && (
            <a
              href={r.button.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-3 rounded-lg font-semibold text-white focus:outline-none focus:ring-2 focus:ring-white/50"
              style={{ backgroundColor: primary }}
            >
              {r.button.label}
            </a>
          )}
        </div>
      );
    }

    if (hasHtml) {
      const r = result as EmbedResultWithHtml;
      return (
        <div
          className="min-h-screen p-6 sm:p-8 animate-fade-in"
          style={{ fontFamily }}
        >
          <iframe
            title="Result content"
            srcDoc={r.html}
            sandbox="allow-scripts allow-same-origin"
            className="w-full min-h-[60vh] border-0 rounded-lg bg-white/5"
          />
        </div>
      );
    }
  }

  return null;
}
