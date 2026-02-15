"use client";

import { useState } from "react";
import type {
  AppConfig,
  CtaConfig,
  CtaMultiChoiceOption,
  CtaMultiChoiceOptionVideoSubChoice,
  CtaResolvedView,
} from "@/types/config";

export function CTAPreview({ config }: { config: AppConfig }) {
  const cta = config.cta ?? { type: "thank_you", message: "Thank you." };
  const theme = config.theme ?? {};
  const primary = theme.primaryColor ?? "#4a6b5a";
  const bg = theme.background ?? "#0d1f18";
  const fontFamily = theme.fontFamily ?? "var(--font-sans)";

  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [selectedSubChoiceIndex, setSelectedSubChoiceIndex] = useState<number | null>(null);

  const isBgImage = typeof bg === "string" && bg.startsWith("http");

  const containerStyle = {
    minHeight: 320,
    background: isBgImage ? `url(${bg}) center/cover` : bg,
    fontFamily,
  };

  if (cta.type !== "multi_choice") {
    return (
      <div
        className="rounded-lg border border-zinc-600 overflow-hidden shadow-lg flex flex-col shrink-0"
        style={{ maxWidth: 360 }}
      >
        <div className="px-3 py-2 border-b border-zinc-600 bg-zinc-800/80 text-zinc-400 text-xs font-medium">
          CTA preview
        </div>
        <div
          className="p-4 flex flex-col items-center justify-center text-center"
          style={containerStyle}
        >
          <CtaPreviewContent cta={cta} primary={primary} fontFamily={fontFamily} />
        </div>
      </div>
    );
  }

  const selectedOption = selectedOptionId
    ? cta.options.find((o) => o.id === selectedOptionId)
    : null;

  const showMainList = selectedOptionId === null;
  const showSubPicker =
    selectedOption &&
    selectedOption.kind === "embed_video" &&
    selectedOption.variant === "sub_choice" &&
    selectedSubChoiceIndex === null;
  const subChoiceOption =
    showSubPicker && selectedOption?.variant === "sub_choice" ? selectedOption : null;

  const resolvedView = ((): CtaResolvedView | null => {
    if (!selectedOption) return null;
    if (
      selectedOption.kind === "embed_video" &&
      selectedOption.variant === "sub_choice" &&
      selectedSubChoiceIndex !== null
    ) {
      const choice = selectedOption.choices[selectedSubChoiceIndex];
      if (!choice) return null;
      return {
        kind: "embed_video",
        videoUrl: choice.videoUrl,
        title: choice.title,
        subtitle: choice.subtitle,
        button: choice.button,
      };
    }
    if (selectedOption.kind === "embed_video" && selectedOption.variant === "direct") {
      return {
        kind: "embed_video",
        videoUrl: selectedOption.videoUrl,
        title: selectedOption.title,
        subtitle: selectedOption.subtitle,
        button: selectedOption.button,
      };
    }
    if (selectedOption.kind === "discount_code") {
      return {
        kind: "discount",
        title: selectedOption.title,
        description: selectedOption.description,
        linkUrl: selectedOption.linkUrl,
        linkLabel: selectedOption.linkLabel,
        code: selectedOption.code,
      };
    }
    if (selectedOption.kind === "link") {
      return {
        kind: "link",
        label: selectedOption.label,
        url: selectedOption.url,
        openInNewTab: selectedOption.openInNewTab,
      };
    }
    if (selectedOption.kind === "webhook_then_message") {
      return {
        kind: "thank_you",
        message: selectedOption.thankYouMessage,
        header: selectedOption.thankYouHeader?.trim() || undefined,
        subheading: selectedOption.thankYouSubheading?.trim() || undefined,
      };
    }
    return null;
  })();

  const showResolved = resolvedView !== null;

  const handleSelectOption = (option: CtaMultiChoiceOption) => {
    setSelectedOptionId(option.id);
    if (option.kind === "embed_video" && option.variant === "sub_choice") {
      setSelectedSubChoiceIndex(null);
      return;
    }
    setSelectedSubChoiceIndex(null);
  };

  const handleSelectSubChoice = (subChoiceIndex: number) => {
    setSelectedSubChoiceIndex(subChoiceIndex);
  };

  const handleBackToOptions = () => {
    setSelectedOptionId(null);
    setSelectedSubChoiceIndex(null);
  };

  return (
    <div
      className="rounded-lg border border-zinc-600 overflow-hidden shadow-lg flex flex-col shrink-0"
      style={{ maxWidth: 360 }}
    >
      <div className="px-3 py-2 border-b border-zinc-600 bg-zinc-800/80 text-zinc-400 text-xs font-medium flex items-center justify-between gap-2">
        <span>CTA preview</span>
        {(showResolved || showSubPicker) && (
          <button
            type="button"
            onClick={handleBackToOptions}
            className="text-zinc-500 hover:text-zinc-300"
          >
            Back to options
          </button>
        )}
      </div>
      <div
        className="p-4 flex flex-col items-center justify-center text-center overflow-auto"
        style={{ ...containerStyle, maxHeight: 480 }}
      >
        {showResolved && resolvedView ? (
          <ResolvedPreviewView view={resolvedView} primary={primary} fontFamily={fontFamily} />
        ) : showSubPicker && subChoiceOption ? (
          <div className="w-full space-y-3">
            {subChoiceOption.title?.trim() && (
              <h3 className="text-white font-semibold text-lg">{subChoiceOption.title}</h3>
            )}
            {subChoiceOption.subheading?.trim() && (
              <p className="text-white/70 text-sm">{subChoiceOption.subheading}</p>
            )}
            {subChoiceOption.imageUrl?.trim() && (
              <div className="w-full max-w-[280px] mx-auto">
                <img
                  src={subChoiceOption.imageUrl}
                  alt=""
                  className="w-full rounded-lg object-contain max-h-32"
                />
              </div>
            )}
            {(subChoiceOption.prompt ?? cta.prompt ?? "").trim() && (
              <p className="text-white/80 text-sm">{(subChoiceOption.prompt ?? cta.prompt ?? "").trim()}</p>
            )}
            <div className="flex flex-col gap-2">
              {subChoiceOption.choices.map((choice, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSubChoice(idx)}
                  className="w-full px-4 py-2 rounded text-sm font-medium text-left text-white border border-white/20 hover:bg-white/10"
                  style={{ fontFamily }}
                >
                  {choice.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full space-y-3">
            {cta.title && <h3 className="text-white font-semibold text-lg">{cta.title}</h3>}
            {cta.subheading && <p className="text-white/70 text-sm">{cta.subheading}</p>}
            {cta.imageUrl && (
              <div className="w-full max-w-[280px] mx-auto">
                <img
                  src={cta.imageUrl}
                  alt=""
                  className="w-full rounded-lg object-contain max-h-32"
                />
              </div>
            )}
            {cta.prompt && (
              <p className="text-white/90 text-sm">{cta.prompt}</p>
            )}
            <div className="flex flex-col gap-2">
              {cta.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelectOption(option)}
                  className="w-full px-4 py-2 rounded text-sm font-medium text-left text-white border border-white/20 hover:bg-white/10"
                  style={{ fontFamily }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CtaPreviewContent({
  cta,
  primary,
  fontFamily,
}: {
  cta: Exclude<CtaConfig, { type: "multi_choice" }>;
  primary: string;
  fontFamily: string;
}) {
  if (cta.type === "thank_you") {
    return (
      <p className="text-sm text-white/95 max-w-[280px] whitespace-pre-line">
        {cta.message ?? "Thank you."}
      </p>
    );
  }
  if (cta.type === "link") {
    return (
      <a
        href={cta.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block px-4 py-2 rounded text-sm font-semibold text-white"
        style={{ backgroundColor: primary }}
      >
        {cta.label}
      </a>
    );
  }
  if (cta.type === "embed") {
    return (
      <div className="w-full space-y-2 text-left">
        {cta.title && (
          <p className="text-sm font-bold text-white/95">{cta.title}</p>
        )}
        {cta.subtitle && (
          <p className="text-xs text-white/80">{cta.subtitle}</p>
        )}
        {cta.url ? (
          <div className="w-full aspect-video rounded bg-black/30 overflow-hidden">
            <iframe
              title="Preview"
              src={cta.url}
              className="w-full h-full border-0 pointer-events-none"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        ) : (
          <div className="w-full aspect-video rounded bg-black/20 flex items-center justify-center text-white/50 text-xs">
            Video URL
          </div>
        )}
        {cta.button && (
          <a
            href={cta.button.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 rounded text-sm font-semibold text-white"
            style={{ backgroundColor: (cta.button.color && /^#[0-9A-Fa-f]{3,6}$/.test(cta.button.color)) ? cta.button.color : primary }}
          >
            {cta.button.label}
          </a>
        )}
      </div>
    );
  }
  return null;
}

function ResolvedPreviewView({
  view,
  primary,
  fontFamily,
}: {
  view: CtaResolvedView;
  primary: string;
  fontFamily: string;
}) {
  if (view.kind === "thank_you") {
    return (
      <div className="w-full space-y-2 text-center">
        {view.header?.trim() && (
          <p className="text-sm font-bold text-white/95">{view.header.trim()}</p>
        )}
        {view.subheading?.trim() && (
          <p className="text-xs text-white/80">{view.subheading.trim()}</p>
        )}
        {view.message?.trim() && (
          <p className="text-sm text-white/95 max-w-[280px] mx-auto whitespace-pre-line">{view.message.trim()}</p>
        )}
      </div>
    );
  }
  if (view.kind === "link") {
    return (
      <a
        href={view.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block px-4 py-2 rounded text-sm font-semibold text-white"
        style={{ backgroundColor: primary }}
      >
        {view.label}
      </a>
    );
  }
  if (view.kind === "embed_video") {
    const btnBg = (view.button?.color && /^#[0-9A-Fa-f]{3,6}$/.test(view.button.color)) ? view.button.color : primary;
    return (
      <div className="w-full space-y-2">
        {view.title && (
          <p className="text-sm font-bold text-white/95">{view.title}</p>
        )}
        {view.subtitle && (
          <p className="text-xs text-white/80">{view.subtitle}</p>
        )}
        {view.videoUrl ? (
          <div className="w-full aspect-video rounded bg-black/30 overflow-hidden">
            <iframe
              title={view.title ?? "Video"}
              src={view.videoUrl}
              className="w-full h-full border-0 pointer-events-none"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        ) : (
          <div className="w-full aspect-video rounded bg-black/20 flex items-center justify-center text-white/50 text-xs">
            Video URL
          </div>
        )}
        {view.button && (
          <a
            href={view.button.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 rounded text-sm font-semibold text-white"
            style={{ backgroundColor: btnBg }}
          >
            {view.button.label}
          </a>
        )}
      </div>
    );
  }
  if (view.kind === "discount") {
    return (
      <div className="w-full space-y-2 text-center">
        {view.title && (
          <p className="text-sm font-bold text-white/95">{view.title}</p>
        )}
        {view.description && (
          <p className="text-xs text-white/80">{view.description}</p>
        )}
        <a
          href={view.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-3 py-1.5 rounded text-xs font-medium text-white"
          style={{ backgroundColor: primary }}
        >
          {view.linkLabel ?? "Get offer"}
        </a>
        <p className="text-xs font-mono font-semibold text-white/95 bg-white/10 px-2 py-1 rounded inline-block">
          {view.code}
        </p>
      </div>
    );
  }
  if (view.kind === "embed") {
    const btnBg = (view.button?.color && /^#[0-9A-Fa-f]{3,6}$/.test(view.button.color)) ? view.button.color : primary;
    return (
      <div className="w-full space-y-2 text-left">
        {view.title && (
          <p className="text-sm font-bold text-white/95">{view.title}</p>
        )}
        {view.subtitle && (
          <p className="text-xs text-white/80">{view.subtitle}</p>
        )}
        {view.url ? (
          <div className="w-full aspect-video rounded bg-black/30 overflow-hidden">
            <iframe
              title={view.title ?? "Video"}
              src={view.url}
              className="w-full h-full border-0 pointer-events-none"
            />
          </div>
        ) : (
          <div className="w-full aspect-video rounded bg-black/20 flex items-center justify-center text-white/50 text-xs">
            Video URL
          </div>
        )}
        {view.button && (
          <a
            href={view.button.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 rounded text-sm font-semibold text-white"
            style={{ backgroundColor: btnBg }}
          >
            {view.button.label}
          </a>
        )}
      </div>
    );
  }
  return null;
}
