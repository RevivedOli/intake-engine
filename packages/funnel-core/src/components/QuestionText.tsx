"use client";

import { useState } from "react";
import type { Question } from "../types";
import { useTheme } from "../contexts/ThemeContext";

interface QuestionTextProps {
  question: Question;
  answers: Record<string, string | string[]>;
  value: string;
  onChange: (value: string) => void;
  onNext: (answersWithCurrent?: Record<string, string | string[]>) => void;
  required?: boolean;
}

export function QuestionText({
  question,
  answers,
  value,
  onChange,
  onNext,
  required,
}: QuestionTextProps) {
  const theme = useTheme();
  const primary = theme.primaryColor ?? "#a47f4c";
  const fontFamily = theme.fontFamily ?? "var(--font-sans)";
  const [touched, setTouched] = useState(false);
  const showError = required && touched && !value.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (required && !value.trim()) return;
    onNext({ ...answers, [question.id]: value });
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
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="Type your answer here..."
            rows={3}
            className="w-full px-4 py-3 rounded-lg border border-white/25 bg-white/5 text-white/90 placeholder-white/40 text-base focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 resize-y min-h-[88px] max-h-48"
            aria-invalid={showError}
            aria-describedby={showError ? "q-error" : undefined}
          />
          {showError && (
            <p id="q-error" className="mt-1 text-sm text-amber-400">
              This field is required.
            </p>
          )}
        </div>
        <button
          type="submit"
          className="mt-6 px-6 py-3 rounded-lg font-medium text-white focus:outline-none focus:ring-2 focus:ring-white/50"
          style={{ backgroundColor: primary }}
        >
          OK
        </button>
      </form>
    </div>
  );
}
