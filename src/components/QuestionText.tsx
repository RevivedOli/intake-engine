"use client";

import { useState, useRef, useEffect } from "react";
import type { Question } from "@/types";
import { useTheme } from "@/contexts/ThemeContext";

interface QuestionTextProps {
  question: Question;
  answers: Record<string, string | string[]>;
  value: string;
  onChange: (value: string) => void;
  onNext: (answersWithCurrent?: Record<string, string | string[]>) => void;
  required?: boolean;
  /** Button label (e.g. "OK", "Next"). Defaults to "OK". */
  submitButtonLabel?: string;
}

export function QuestionText({
  question,
  answers,
  value,
  onChange,
  onNext,
  required,
  submitButtonLabel = "OK",
}: QuestionTextProps) {
  const theme = useTheme();
  const primary = theme.primaryColor ?? "#a47f4c";
  const fontFamily = theme.fontFamily ?? "var(--font-sans)";
  const [touched, setTouched] = useState(false);
  const showError = required && touched && !value.trim();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function autoGrow() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 192)}px`; // cap at ~max-h-48
  }

  useEffect(() => {
    autoGrow();
  }, [value]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (required && !value.trim()) return;
    onNext({ ...answers, [question.id]: value });
  };

  /** On mobile, scroll focused textarea to bottom of viewport (just above keyboard) after keyboard opens */
  const scrollInputAboveKeyboard = () => {
    if (typeof window === "undefined" || window.innerWidth >= 640) return;
    setTimeout(() => {
      (document.activeElement as HTMLElement)?.scrollIntoView({ block: "end", behavior: "auto" });
    }, 400);
  };

  return (
    <div
      className="animate-fade-in-up max-w-xl mx-auto"
      style={{ fontFamily }}
    >
      <form onSubmit={handleSubmit}>
        <p className="text-xl sm:text-2xl text-white/95 mb-2">
          {question.question}
          {required && <span className="text-amber-400">*</span>}
        </p>
        {question.imageUrl && (
          <div className="my-4 flex justify-center">
            <img
              src={question.imageUrl}
              alt=""
              className="w-full max-h-52 sm:max-h-64 object-contain"
            />
          </div>
        )}
        <div className="mt-4">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              autoGrow();
            }}
            onFocus={scrollInputAboveKeyboard}
            onBlur={() => setTouched(true)}
            placeholder="Type your answer here..."
            rows={1}
            className="w-full px-0 py-3 bg-transparent border-0 border-b border-white/30 text-white/90 placeholder-white/40 text-base focus:outline-none focus:border-white/60 focus:ring-0 resize-none overflow-y-auto min-h-[2.75rem] max-h-48 rounded-none"
            style={{ height: "2.75rem" }}
            aria-invalid={showError}
            aria-describedby={showError ? "q-error" : undefined}
          />
          {showError && (
            <p id="q-error" className="mt-1 text-sm text-amber-400">
              This field is required.
            </p>
          )}
        </div>
        <div className="mt-6 flex justify-center">
          <button
            type="submit"
            className="px-6 py-3 rounded-lg font-medium text-white focus:outline-none focus:ring-2 focus:ring-white/50"
            style={{ backgroundColor: primary }}
          >
            {submitButtonLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
