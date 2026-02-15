"use client";

import * as React from "react";
import type { IntakeResult, EmbedResultWithUrl, EmbedResultWithHtml } from "@/types";
import type {
  CtaConfig,
  CtaMultiChoiceOption,
  CtaMultiChoiceOptionVideoSubChoice,
  CtaResolvedView,
} from "@/types/config";
import { useTheme } from "@/contexts/ThemeContext";

interface ResultScreenProps {
  /** Legacy: result from n8n (used when cta is not provided) */
  result?: IntakeResult | null;
  /** In-app CTA config: what to show after submit */
  cta?: CtaConfig | null;
  /** When using multi_choice CTA, the currently resolved view (null = show picker) */
  ctaView?: CtaResolvedView | null;
  /** When set, show sub-choice picker for this option (embed_video variant sub_choice) */
  subChoiceOption?: CtaMultiChoiceOptionVideoSubChoice | null;
  /** Called when user selects a multi-choice option (parent may send webhook then set ctaView) */
  onSelectOption?: (optionId: string, option: CtaMultiChoiceOption) => void;
  /** Called when user selects a sub-choice (e.g. video category) */
  onSelectSubChoice?: (optionId: string, subChoiceIndex: number) => void;
  defaultThankYouMessage?: string;
}

export function ResultScreen({
  result = null,
  cta = null,
  ctaView = null,
  subChoiceOption = null,
  onSelectOption,
  onSelectSubChoice,
  defaultThankYouMessage,
}: ResultScreenProps) {
  const theme = useTheme();
  const primary = theme.primaryColor ?? "#a47f4c";
  const fontFamily = theme.fontFamily ?? "var(--font-sans)";

  // --- CTA-driven rendering (preferred when cta is set) ---
  if (cta) {
    if (cta.type !== "multi_choice") {
      return (
        <CtaResultView
          cta={cta}
          primary={primary}
          fontFamily={fontFamily}
          defaultThankYouMessage={defaultThankYouMessage}
        />
      );
    }
    return (
      <CtaMultiChoiceView
        cta={cta}
        ctaView={ctaView}
        subChoiceOption={subChoiceOption}
        primary={primary}
        fontFamily={fontFamily}
        defaultThankYouMessage={defaultThankYouMessage}
        onSelectOption={onSelectOption}
        onSelectSubChoice={onSelectSubChoice}
      />
    );
  }

  // --- Legacy: result from n8n ---
  if (!result) return null;

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
        <p className="text-xl text-white/95 max-w-md whitespace-pre-line">{message}</p>
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

function CtaResultView({
  cta,
  primary,
  fontFamily,
  defaultThankYouMessage,
}: {
  cta: Exclude<CtaConfig, { type: "multi_choice" }>;
  primary: string;
  fontFamily: string;
  defaultThankYouMessage?: string;
}) {
  if (cta.type === "thank_you") {
    const message = cta.message ?? defaultThankYouMessage ?? "Thank you.";
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-8 text-center animate-fade-in"
        style={{ fontFamily }}
      >
        <p className="text-xl text-white/95 max-w-md whitespace-pre-line">{message}</p>
      </div>
    );
  }

  if (cta.type === "link") {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-8 text-center animate-fade-in"
        style={{ fontFamily }}
      >
        <a
          href={cta.url}
          target={cta.openInNewTab ? "_blank" : "_self"}
          rel={cta.openInNewTab ? "noopener noreferrer" : undefined}
          className="inline-block px-8 py-3 rounded-lg font-semibold text-white focus:outline-none focus:ring-2 focus:ring-white/50"
          style={{ backgroundColor: primary }}
        >
          {cta.label}
        </a>
      </div>
    );
  }

  if (cta.type === "embed") {
    return (
      <div
        className="min-h-screen p-6 sm:p-8 flex flex-col items-center justify-center animate-fade-in max-w-2xl mx-auto"
        style={{ fontFamily }}
      >
        {cta.title && (
          <h2 className="text-2xl font-bold text-white/95 text-center mb-1 w-full">
            {cta.title}
          </h2>
        )}
        {cta.subtitle && (
          <p className="text-lg text-white/80 text-center mb-6 w-full">
            {cta.subtitle}
          </p>
        )}
        <div className="w-full aspect-video rounded-lg overflow-hidden bg-black/20 mb-6">
          <iframe
            title={cta.title ?? "Video"}
            src={cta.url}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        {cta.textBelow && (
          <p className="text-white/80 text-center mb-6 w-full">{cta.textBelow}</p>
        )}
        {cta.button && (
          <a
            href={cta.button.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-3 rounded-lg font-semibold text-white focus:outline-none focus:ring-2 focus:ring-white/50"
            style={{ backgroundColor: cta.button.color && /^#[0-9A-Fa-f]{3,6}$/.test(cta.button.color) ? cta.button.color : primary }}
          >
            {cta.button.label}
          </a>
        )}
      </div>
    );
  }

  return null;
}

function CtaMultiChoiceView({
  cta,
  ctaView,
  subChoiceOption,
  primary,
  fontFamily,
  defaultThankYouMessage,
  onSelectOption,
  onSelectSubChoice,
}: {
  cta: Extract<CtaConfig, { type: "multi_choice" }>;
  ctaView: CtaResolvedView | null | undefined;
  subChoiceOption?: CtaMultiChoiceOptionVideoSubChoice | null;
  primary: string;
  fontFamily: string;
  defaultThankYouMessage?: string;
  onSelectOption?: (optionId: string, option: CtaMultiChoiceOption) => void;
  onSelectSubChoice?: (optionId: string, subChoiceIndex: number) => void;
}) {
  const baseClass =
    "min-h-screen p-6 sm:p-8 flex flex-col items-center justify-center animate-fade-in-up max-w-2xl mx-auto";
  const style = { fontFamily };

  if (ctaView) {
    if (ctaView.kind === "thank_you") {
      return (
        <div key={`cta-resolved-${ctaView.kind}`} className={`${baseClass} text-center`} style={style}>
          {ctaView.header?.trim() && (
            <h2 className="text-2xl font-bold text-white/95 mb-2 w-full">
              {ctaView.header.trim()}
            </h2>
          )}
          {ctaView.subheading?.trim() && (
            <p className="text-lg text-white/80 mb-4 w-full">
              {ctaView.subheading.trim()}
            </p>
          )}
          {ctaView.message?.trim() && (
            <p className="text-xl text-white/95 max-w-md whitespace-pre-line">
              {ctaView.message.trim()}
            </p>
          )}
        </div>
      );
    }
    if (ctaView.kind === "link") {
      return (
        <div key={`cta-resolved-${ctaView.kind}`} className={`${baseClass} text-center`} style={style}>
          <a
            href={ctaView.url}
            target={ctaView.openInNewTab ? "_blank" : "_self"}
            rel={ctaView.openInNewTab ? "noopener noreferrer" : undefined}
            className="inline-block px-8 py-3 rounded-lg font-semibold text-white focus:outline-none focus:ring-2 focus:ring-white/50"
            style={{ backgroundColor: primary }}
          >
            {ctaView.label}
          </a>
        </div>
      );
    }
    if (ctaView.kind === "embed") {
      return (
        <div key={`cta-resolved-${ctaView.kind}`} className={baseClass} style={style}>
          {ctaView.title && (
            <h2 className="text-2xl font-bold text-white/95 text-center mb-1 w-full">
              {ctaView.title}
            </h2>
          )}
          {ctaView.subtitle && (
            <p className="text-lg text-white/80 text-center mb-6 w-full">
              {ctaView.subtitle}
            </p>
          )}
          <div className="w-full aspect-video rounded-lg overflow-hidden bg-black/20 mb-6">
            <iframe
              title={ctaView.title ?? "Video"}
              src={ctaView.url}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          {ctaView.textBelow && (
            <p className="text-white/80 text-center mb-6 w-full">{ctaView.textBelow}</p>
          )}
          {ctaView.button && (
            <a
              href={ctaView.button.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-3 rounded-lg font-semibold text-white focus:outline-none focus:ring-2 focus:ring-white/50"
              style={{ backgroundColor: (ctaView.button.color && /^#[0-9A-Fa-f]{3,6}$/.test(ctaView.button.color)) ? ctaView.button.color : primary }}
            >
              {ctaView.button.label}
            </a>
          )}
        </div>
      );
    }
    if (ctaView.kind === "discount") {
      return (
        <div key={`cta-resolved-${ctaView.kind}`} className={`${baseClass} text-center`} style={style}>
          {ctaView.title && (
            <h2 className="text-2xl font-bold text-white/95 mb-2">{ctaView.title}</h2>
          )}
          {ctaView.description && (
            <p className="text-white/80 mb-4">{ctaView.description}</p>
          )}
          <a
            href={ctaView.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-2 rounded-lg font-medium text-white focus:outline-none focus:ring-2 focus:ring-white/50 mb-4"
            style={{ backgroundColor: primary }}
          >
            {ctaView.linkLabel ?? "Get offer"}
          </a>
          <p className="text-lg font-mono font-semibold text-white/95 bg-white/10 px-4 py-2 rounded inline-block">
            {ctaView.code}
          </p>
        </div>
      );
    }
    if (ctaView.kind === "embed_video") {
      const btnBg = (ctaView.button?.color && /^#[0-9A-Fa-f]{3,6}$/.test(ctaView.button.color)) ? ctaView.button.color : primary;
      return (
        <div key={`cta-resolved-${ctaView.kind}`} className={baseClass} style={style}>
          {ctaView.title && (
            <h2 className="text-2xl font-bold text-white/95 text-center mb-1 w-full">
              {ctaView.title}
            </h2>
          )}
          {ctaView.subtitle && (
            <p className="text-lg text-white/80 text-center mb-6 w-full">
              {ctaView.subtitle}
            </p>
          )}
          <div className="w-full aspect-video rounded-lg overflow-hidden bg-black/20 mb-6">
            <iframe
              title={ctaView.title ?? "Video"}
              src={ctaView.videoUrl}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          {ctaView.button && (
            <a
              href={ctaView.button.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-3 rounded-lg font-semibold text-white focus:outline-none focus:ring-2 focus:ring-white/50"
              style={{ backgroundColor: btnBg }}
            >
              {ctaView.button.label}
            </a>
          )}
        </div>
      );
    }
  }

  // Sub-choice picker (parent set subChoiceOption when user picked embed_video sub_choice)
  if (subChoiceOption && "choices" in subChoiceOption) {
    return (
      <div key={`cta-sub-${subChoiceOption.id}`} className={baseClass} style={style}>
        {subChoiceOption.title?.trim() && <h2 className="text-white text-xl font-semibold text-center mb-2 w-full">{subChoiceOption.title}</h2>}
        {subChoiceOption.subheading?.trim() && <p className="text-white/80 text-center mb-4 w-full">{subChoiceOption.subheading}</p>}
        {subChoiceOption.imageUrl?.trim() && (
          <div className="w-full max-w-sm mx-auto mb-6">
            <img
              src={subChoiceOption.imageUrl}
              alt=""
              className="w-full rounded-lg object-contain max-h-48"
              loading="lazy"
              decoding="async"
            />
          </div>
        )}
        {(subChoiceOption.prompt ?? cta.prompt ?? "").trim() && (
          <p className="text-white/80 text-center mb-6 w-full">
            {(subChoiceOption.prompt ?? cta.prompt ?? "").trim()}
          </p>
        )}
        <div className="flex flex-col gap-3 w-full max-w-sm">
          {subChoiceOption.choices.map((choice, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectSubChoice?.(subChoiceOption.id, idx)}
              className="w-full px-6 py-3 rounded-lg font-medium text-left text-white border border-white/20 hover:border-white/40 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50"
              style={{ fontFamily }}
            >
              {choice.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const handleOptionClick = (option: CtaMultiChoiceOption) => {
    if (option.kind === "webhook_then_message" && onSelectOption) {
      onSelectOption(option.id, option);
      return;
    }
    if (onSelectOption) onSelectOption(option.id, option);
  };

  return (
    <div key="cta-main" className={baseClass} style={style}>
      {cta.title && <h2 className="text-white text-xl font-semibold text-center mb-2 w-full">{cta.title}</h2>}
      {cta.subheading && <p className="text-white/80 text-center mb-4 w-full">{cta.subheading}</p>}
      {cta.imageUrl && (
        <div className="w-full max-w-sm mx-auto mb-6">
          <img
            src={cta.imageUrl}
            alt=""
            className="w-full rounded-lg object-contain max-h-48"
            loading="lazy"
            decoding="async"
          />
        </div>
      )}
      {cta.prompt && (
        <p className="text-white/90 text-center mb-6 w-full text-lg">{cta.prompt}</p>
      )}
      <div className="flex flex-col gap-3 w-full max-w-sm">
        {cta.options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => handleOptionClick(option)}
            className="w-full px-6 py-3 rounded-lg font-medium text-left text-white border border-white/20 hover:border-white/40 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50"
            style={{ backgroundColor: "transparent", fontFamily }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
