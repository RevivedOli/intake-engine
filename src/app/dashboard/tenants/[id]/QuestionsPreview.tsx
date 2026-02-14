"use client";

import { useState } from "react";
import type { AppConfig } from "@/types/config";
import type { Question } from "@/types/question";

const WIDTH_OPTIONS = [
  { value: 320, label: "320px" },
  { value: 360, label: "360px" },
  { value: 480, label: "480px" },
  { value: 768, label: "768px" },
  { value: "100%", label: "Full" },
] as const;

function QuestionPreviewCard({
  question,
  primary,
  fontFamily,
  textButtonLabel,
}: {
  question: Question;
  primary: string;
  fontFamily: string;
  textButtonLabel: string;
}) {
  const options = question.options ?? [];
  const isSingle = question.type === "single";
  const isMulti = question.type === "multi";
  const isText = question.type === "text";

  return (
    <div
      className="max-w-xl mx-auto p-4"
      style={{ fontFamily }}
    >
      <p className="text-lg sm:text-xl text-white/95 mb-2">
        {question.question || "(No question text)"}
      </p>
      {question.imageUrl && (
        <div className="my-3 flex justify-center">
          <img
            src={question.imageUrl}
            alt=""
            className="w-full max-h-40 object-contain rounded"
          />
        </div>
      )}
      {isSingle && (
        <ul className="space-y-2 mt-3">
          {options.length ? (
            options.map((option) => (
              <li key={option}>
                <div
                  className="w-full text-left px-3 py-2 rounded-lg border border-white/20 bg-white/5 text-white/90 text-sm"
                  style={{ borderColor: "rgba(255,255,255,0.2)" }}
                >
                  {option}
                </div>
              </li>
            ))
          ) : (
            <p className="text-white/50 text-sm">No options yet</p>
          )}
        </ul>
      )}
      {isMulti && (
        <ul className="space-y-2 mt-3">
          {options.length ? (
            options.map((option) => (
              <li key={option}>
                <div
                  className="w-full text-left px-3 py-2 rounded-lg border border-white/20 bg-white/5 text-white/90 text-sm"
                  style={{ borderColor: "rgba(255,255,255,0.2)" }}
                >
                  {option}
                </div>
              </li>
            ))
          ) : (
            <p className="text-white/50 text-sm">No options yet</p>
          )}
        </ul>
      )}
      {isText && (
        <div className="mt-3 w-full">
          <div
            className="w-full px-0 py-2 bg-transparent border-0 border-b border-white/30 text-white/50 text-sm rounded-none"
            style={{ fontFamily }}
          >
            Text answer…
          </div>
          <div className="mt-3 w-full flex justify-center">
            <span className="px-4 py-2 rounded-lg text-white/60 text-sm" style={{ backgroundColor: primary }}>
              {textButtonLabel}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function QuestionsPreview({
  questions,
  config,
}: {
  questions: Question[];
  config: AppConfig;
}) {
  const [width, setWidth] = useState<number | "100%">(360);
  const [index, setIndex] = useState(0);
  const theme = config.theme ?? {};
  const primary = theme.primaryColor ?? "#4a6b5a";
  const bg = theme.background ?? "#0d1f18";
  const fontFamily = theme.fontFamily ?? "var(--font-sans)";
  const isBgImage = bg.startsWith("http");

  const count = questions.length;
  const safeIndex = count ? Math.max(0, Math.min(index, count - 1)) : 0;
  const current = count ? questions[safeIndex] : null;
  const textButtonLabel =
    current?.type === "text"
      ? (current.submitButtonLabel ?? (config.textQuestionButtonLabel?.trim() || "OK"))
      : "OK";

  return (
    <div
      className="rounded-lg border border-zinc-600 overflow-hidden shadow-lg flex flex-col min-h-[280px] shrink-0"
      style={{
        maxWidth: width === "100%" ? "100%" : width,
        width: width === "100%" ? "100%" : width,
      }}
    >
      <div className="px-3 py-2 border-b border-zinc-600 bg-zinc-800/80 text-zinc-400 text-xs font-medium flex items-center justify-between gap-2 flex-wrap">
        <span>Live preview</span>
        <div className="flex items-center gap-2">
          {count > 0 && (
            <>
              <button
                type="button"
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                disabled={safeIndex === 0}
                className="rounded bg-zinc-700 border border-zinc-600 text-zinc-200 px-2 py-1 disabled:opacity-40"
                aria-label="Previous question"
              >
                Prev
              </button>
              <span className="text-zinc-500">
                {safeIndex + 1} of {count}
              </span>
              <button
                type="button"
                onClick={() => setIndex((i) => Math.min(count - 1, i + 1))}
                disabled={safeIndex === count - 1}
                className="rounded bg-zinc-700 border border-zinc-600 text-zinc-200 px-2 py-1 disabled:opacity-40"
                aria-label="Next question"
              >
                Next
              </button>
            </>
          )}
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
        className="flex-1 flex flex-col justify-center min-h-[200px] transition-colors duration-150"
        style={{
          background: isBgImage ? `url(${bg}) center/cover` : bg,
        }}
      >
        {current ? (
          <QuestionPreviewCard
            question={current}
            primary={primary}
            fontFamily={fontFamily}
            textButtonLabel={textButtonLabel}
          />
        ) : (
          <p className="text-white/50 text-sm text-center px-4 py-8">
            Add questions to see preview
          </p>
        )}
      </div>
    </div>
  );
}
