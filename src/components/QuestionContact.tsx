"use client";

import { useState } from "react";
import type { Question } from "@/types/question";
import { useTheme } from "@/contexts/ThemeContext";

const COUNTRY_CODES: { code: string; label: string }[] = [
  { code: "+44", label: "UK" },
  { code: "+1", label: "US/CA" },
  { code: "+61", label: "AU" },
  { code: "+49", label: "DE" },
  { code: "+33", label: "FR" },
  { code: "+39", label: "IT" },
  { code: "+34", label: "ES" },
  { code: "+31", label: "NL" },
  { code: "+32", label: "BE" },
  { code: "+41", label: "CH" },
  { code: "+43", label: "AT" },
  { code: "+48", label: "PL" },
  { code: "+46", label: "SE" },
  { code: "+47", label: "NO" },
  { code: "+353", label: "IE" },
  { code: "+351", label: "PT" },
  { code: "+358", label: "FI" },
  { code: "+45", label: "DK" },
  { code: "+81", label: "JP" },
  { code: "+86", label: "CN" },
  { code: "+91", label: "IN" },
  { code: "+55", label: "BR" },
  { code: "+52", label: "MX" },
  { code: "+27", label: "ZA" },
  { code: "+971", label: "AE" },
  { code: "+234", label: "NG" },
  { code: "+254", label: "KE" },
  { code: "+64", label: "NZ" },
  { code: "+65", label: "SG" },
  { code: "+60", label: "MY" },
];

function parseTelValue(value: string): { code: string; national: string } {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return { code: "+44", national: "" };
  const codesByLength = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
  for (const { code } of codesByLength) {
    if (trimmed.startsWith(code)) {
      const national = trimmed.slice(code.length).replace(/\D/g, "");
      return { code, national };
    }
  }
  const digits = trimmed.replace(/\D/g, "");
  return { code: "+44", national: digits };
}

function buildE164(code: string, nationalDigits: string): string {
  const d = nationalDigits.replace(/\D/g, "");
  if (!d) return "";
  return `${code}${d}`;
}

interface QuestionContactProps {
  question: Question;
  answers: Record<string, string | string[]>;
  value: string;
  onChange: (value: string) => void;
  onNext: (answersWithCurrent?: Record<string, string | string[]>) => void;
  required?: boolean;
  submitButtonLabel?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INSTAGRAM_HANDLE_RE = /^[a-zA-Z0-9._]+$/;

export function QuestionContact({
  question,
  answers,
  value,
  onChange,
  onNext,
  required = true,
  submitButtonLabel = "Next",
}: QuestionContactProps) {
  const theme = useTheme();
  const primary = theme.primaryColor ?? "#a47f4c";
  const fontFamily = theme.fontFamily ?? "var(--font-sans)";
  const [touched, setTouched] = useState(false);
  const kind = question.contactKind ?? "email";
  const label = question.label?.trim() || null;
  const placeholder = question.placeholder?.trim() || (kind === "email" ? "you@example.com" : kind === "tel" ? "e.g. 7123456789" : kind === "instagram" ? "@username" : "");
  const isTel = kind === "tel";
  const parsed = isTel ? parseTelValue(value) : { code: "+44", national: "" };
  const hasInput = isTel ? parsed.national.length > 0 : value.trim().length > 0;

  function validate(): string | null {
    const v = value.trim();
    if (required && !v) return "This field is required.";
    if (!v) return null;
    if (kind === "email" && !EMAIL_RE.test(v)) return "Please enter a valid email.";
    if (kind === "tel") {
      const digits = v.replace(/\D/g, "");
      if (digits.length < 10) return "Please enter a valid phone number.";
    }
    if (kind === "instagram") {
      const handle = v.replace(/^@/, "").trim();
      if (handle.length === 0) return "Please enter your Instagram handle.";
      if (handle.length > 30 || !INSTAGRAM_HANDLE_RE.test(handle)) {
        return "Please enter a valid Instagram handle (letters, numbers, dots, underscores only).";
      }
    }
    return null;
  }

  const error = touched ? validate() : null;
  const canSubmit = !validate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    onNext({ ...answers, [question.id]: value.trim() });
  };

  /** On mobile, scroll focused input to bottom of viewport (just above keyboard) after keyboard opens */
  const scrollInputAboveKeyboard = () => {
    if (typeof window === "undefined" || window.innerWidth >= 640) return;
    setTimeout(() => {
      (document.activeElement as HTMLElement)?.scrollIntoView({ block: "end", behavior: "auto" });
    }, 400);
  };

  return (
    <div
      className="animate-fade-in-up max-w-xl mx-auto min-w-0 w-full px-6 sm:px-8"
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
          {label && (
            <label htmlFor={`contact-${question.id}`} className="block text-white/80 text-sm mb-1">
              {label}
            </label>
          )}
          {kind === "tel" ? (
            <div
              className="flex items-center gap-2 border-b border-white/30 focus-within:border-white/60 transition-colors pb-1 min-w-0 w-full"
              role="group"
              aria-label="Phone number"
            >
              <select
                id={`contact-${question.id}-cc`}
                value={parsed.code}
                onChange={(e) => onChange(buildE164(e.target.value, parsed.national))}
                className="shrink-0 min-w-0 max-w-[5.5rem] pl-0 pr-2 sm:pr-3 py-2.5 bg-transparent border-0 border-r border-white/20 text-white/90 focus:outline-none focus:ring-0 cursor-pointer text-sm sm:text-base"
                aria-label="Country code"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} {c.label}
                  </option>
                ))}
              </select>
              <input
                id={`contact-${question.id}`}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="tel-national"
                value={parsed.national}
                onChange={(e) => onChange(buildE164(parsed.code, e.target.value))}
                onFocus={scrollInputAboveKeyboard}
                onBlur={() => setTouched(true)}
                placeholder={placeholder}
                className="flex-1 min-w-0 py-2.5 pl-2 pr-3 bg-transparent border-0 text-white/90 placeholder-white/40 focus:outline-none focus:ring-0"
                aria-invalid={!!error}
                aria-describedby={error ? `contact-${question.id}-error` : undefined}
              />
              <span className="shrink-0 w-10 h-10 flex items-center justify-center">
                {hasInput && (
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    style={{ backgroundColor: primary }}
                    aria-label={submitButtonLabel}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                )}
              </span>
            </div>
          ) : (
            <div
              className="flex items-center gap-2 border-b border-white/30 focus-within:border-white/60 transition-colors pb-1"
              role="group"
            >
              <input
                id={`contact-${question.id}`}
                type={kind === "email" ? "email" : "text"}
                inputMode={kind === "email" ? "email" : "text"}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={scrollInputAboveKeyboard}
                onBlur={() => setTouched(true)}
                placeholder={placeholder}
                className="flex-1 min-w-0 py-2.5 px-0 bg-transparent border-0 text-white/90 placeholder-white/40 focus:outline-none focus:ring-0"
                aria-invalid={!!error}
                aria-describedby={error ? `contact-${question.id}-error` : undefined}
              />
              <span className="shrink-0 w-10 h-10 flex items-center justify-center">
                {hasInput && (
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    style={{ backgroundColor: primary }}
                    aria-label={submitButtonLabel}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                )}
              </span>
            </div>
          )}
          {error && (
            <p id={`contact-${question.id}-error`} className="mt-1 text-sm text-amber-400">
              {error}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
