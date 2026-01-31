"use client";

import type { Question } from "../types";
import { useTheme } from "../contexts/ThemeContext";

interface QuestionMultiProps {
  question: Question;
  answers: Record<string, string | string[]>;
  value: string[];
  onChange: (value: string[]) => void;
  onNext: (answersWithCurrent?: Record<string, string | string[]>) => void;
  required?: boolean;
}

export function QuestionMulti({
  question,
  answers,
  value,
  onChange,
  onNext,
  required,
}: QuestionMultiProps) {
  const theme = useTheme();
  const primary = theme.primaryColor ?? "#a47f4c";
  const fontFamily = theme.fontFamily ?? "var(--font-sans)";

  const toggle = (option: string) => {
    const next = value.includes(option)
      ? value.filter((x) => x !== option)
      : [...value, option];
    onChange(next);
  };

  const handleOk = () => {
    onNext({ ...answers, [question.id]: value });
  };

  return (
    <div
      className="animate-fade-in-up max-w-xl mx-auto"
      style={{ fontFamily }}
    >
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
      <ul className="space-y-2 mt-4">
        {question.options?.map((option) => (
          <li key={option}>
            <button
              type="button"
              onClick={() => toggle(option)}
              className="w-full text-left px-4 py-3 rounded-lg border border-white/20 bg-white/5 text-white/90 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 transition-colors flex items-center gap-3"
              style={
                value.includes(option)
                  ? { borderColor: primary, backgroundColor: `${primary}20` }
                  : undefined
              }
            >
              <span
                className="w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center"
                style={{
                  borderColor: value.includes(option) ? primary : "rgba(255,255,255,0.3)",
                  backgroundColor: value.includes(option) ? primary : "transparent",
                }}
              >
                {value.includes(option) && (
                  <span className="text-white text-xs">✓</span>
                )}
              </span>
              {option}
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={handleOk}
        className="mt-6 px-6 py-3 rounded-lg font-medium text-white focus:outline-none focus:ring-2 focus:ring-white/50"
        style={{ backgroundColor: primary }}
      >
        OK
      </button>
    </div>
  );
}
