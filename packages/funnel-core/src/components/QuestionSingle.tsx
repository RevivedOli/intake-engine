"use client";

import type { Question } from "../types";
import { useTheme } from "../contexts/ThemeContext";

interface QuestionSingleProps {
  question: Question;
  answers: Record<string, string | string[]>;
  value: string | null;
  onChange: (value: string) => void;
  onNext: (answersWithCurrent?: Record<string, string | string[]>) => void;
  required?: boolean;
}

export function QuestionSingle({
  question,
  answers,
  value,
  onChange,
  onNext,
  required,
}: QuestionSingleProps) {
  const theme = useTheme();
  const primary = theme.primaryColor ?? "#a47f4c";
  const fontFamily = theme.fontFamily ?? "var(--font-sans)";

  const handleSelect = (option: string) => {
    onChange(option);
    onNext({ ...answers, [question.id]: option });
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
              onClick={() => handleSelect(option)}
              className="w-full text-left px-4 py-3 rounded-lg border border-white/20 bg-white/5 text-white/90 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 transition-colors"
              style={
                value === option
                  ? { borderColor: primary, backgroundColor: `${primary}20` }
                  : undefined
              }
            >
              {option}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
