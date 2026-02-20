"use client";

import { useState } from "react";
import type { Question } from "@/types/question";
import { useTheme } from "@/contexts/ThemeContext";

/** Country codes for phone input (dial code, label) */
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

/** Parse stored E.164 value into code + national digits. Match longest code first. */
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

/** Build E.164: code + digits only. No auto-adding. */
function buildE164(code: string, nationalDigits: string): string {
  const d = nationalDigits.replace(/\D/g, "");
  if (!d) return "";
  return `${code}${d}`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INSTAGRAM_HANDLE_RE = /^[a-zA-Z0-9._]+$/;

export interface PrivacyPolicyLink {
  href: string;
  openInNewTab: boolean;
}

export interface FreebiePreviewOption {
  id: string;
  label: string;
}

interface QuestionContactBlockProps {
  questions: Question[];
  answers: Record<string, string | string[]>;
  onAnswersChange: (answers: Record<string, string | string[]>) => void;
  onNext: (answersWithCurrent?: Record<string, string | string[]>, opts?: { consentGiven?: boolean }) => void;
  submitButtonLabel?: string;
  privacyPolicyLink?: PrivacyPolicyLink | null;
  consentRequired?: boolean;
  consentLabel?: string;
  /** Greyed-out preview of freebie options shown below contact form */
  freebiePreview?: { prompt?: string; options: FreebiePreviewOption[] };
}

export function QuestionContactBlock({
  questions,
  answers,
  onAnswersChange,
  onNext,
  submitButtonLabel = "Next",
  privacyPolicyLink,
  consentRequired = false,
  consentLabel = "I agree to share my information in accordance with the Privacy Policy.",
  freebiePreview,
}: QuestionContactBlockProps) {
  const theme = useTheme();
  const primary = theme.primaryColor ?? "#a47f4c";
  const fontFamily = theme.fontFamily ?? "var(--font-sans)";
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [consentChecked, setConsentChecked] = useState(false);

  const hasConsentPlacement = questions.some((q) => q.showConsentUnder);
  const showConsent = consentRequired && privacyPolicyLink && hasConsentPlacement;

  const setAnswer = (id: string, value: string) => {
    onAnswersChange({ ...answers, [id]: value });
  };

  function validateQuestion(q: Question): string | null {
    const v = ((answers[q.id] as string) ?? "").trim();
    const required = q.required !== false;
    if (required && !v) return "This field is required.";
    if (!v) return null;
    const kind = q.contactKind ?? "email";
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

  const errors: Record<string, string> = {};
  let canSubmit = true;
  for (const q of questions) {
    const err = validateQuestion(q);
    if (err) {
      if (touched[q.id]) errors[q.id] = err;
      canSubmit = false;
    }
  }
  // Allow submit even without consent; we pass consentGiven so API can send "hidden" for contact fields

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTouched: Record<string, boolean> = {};
    questions.forEach((q) => { newTouched[q.id] = true; });
    setTouched((prev) => ({ ...prev, ...newTouched }));
    if (!canSubmit) return;
    onNext(
      { ...answers },
      showConsent ? { consentGiven: consentChecked } : undefined
    );
  };

  const scrollInputAboveKeyboard = () => {
    if (typeof window === "undefined" || window.innerWidth >= 640) return;
    setTimeout(() => {
      (document.activeElement as HTMLElement)?.scrollIntoView({ block: "end", behavior: "auto" });
    }, 400);
  };

  const firstQuestion = questions[0];
  const hasImage = questions.some((q) => q.imageUrl?.trim());
  const imageUrl = firstQuestion?.imageUrl?.trim();

  return (
    <div
      className="animate-fade-in-up max-w-xl mx-auto min-w-0 w-full px-6 sm:px-8"
      style={{ fontFamily }}
    >
      <form onSubmit={handleSubmit}>
        <p className="text-xl sm:text-2xl text-white/95 mb-2">
          {firstQuestion?.question ?? "Contact details"}
          {questions.some((q) => q.required !== false) && <span className="text-amber-400">*</span>}
        </p>
        {imageUrl && (
          <div className="my-4 flex justify-center">
            <img
              src={imageUrl}
              alt=""
              className="w-full max-h-52 sm:max-h-64 object-contain"
            />
          </div>
        )}
        <div className="mt-4 space-y-4">
          {questions.map((q) => (
            <div key={q.id}>
              <ContactFieldRow
                question={q}
                value={(answers[q.id] as string) ?? ""}
                onChange={(v) => setAnswer(q.id, v)}
                error={errors[q.id]}
                onBlur={() => setTouched((t) => ({ ...t, [q.id]: true }))}
                onFocus={scrollInputAboveKeyboard}
              />
              {showConsent && q.showConsentUnder && (
                <div className="mt-4 flex items-start gap-3">
                  <input
                    id="contact-consent"
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-white/30 bg-transparent text-white focus:ring-white/50 focus:ring-offset-0"
                    aria-describedby="contact-consent-label"
                  />
                  <label id="contact-consent-label" htmlFor="contact-consent" className="text-sm text-white/90">
                    {(() => {
                      if (!consentLabel.includes("Privacy Policy") || !privacyPolicyLink) return consentLabel;
                      const parts = consentLabel.split("Privacy Policy");
                      return parts.map((part, i) => (
                        <span key={i}>
                          {part}
                          {i < parts.length - 1 && (
                            <a
                              href={privacyPolicyLink.href}
                              target={privacyPolicyLink.openInNewTab ? "_blank" : undefined}
                              rel={privacyPolicyLink.openInNewTab ? "noopener noreferrer" : undefined}
                              className="underline hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50 rounded"
                            >
                              Privacy Policy
                            </a>
                          )}
                        </span>
                      ));
                    })()}
                  </label>
                </div>
              )}
            </div>
          ))}
        </div>

        {freebiePreview && freebiePreview.options.length > 0 && (
          <div className="mt-6">
            {freebiePreview.prompt?.trim() && (
              <p className="text-white/80 text-center mb-4 text-sm">
                {freebiePreview.prompt.trim()}
              </p>
            )}
            <div className="flex flex-col gap-3">
              {freebiePreview.options.map((option) => (
                <div
                  key={option.id}
                  className="w-full px-6 py-3 rounded-lg font-medium text-left text-white/60 border border-white/20 opacity-50 cursor-not-allowed flex items-center gap-2"
                  style={{ fontFamily }}
                  aria-hidden
                >
                  <svg
                    className="w-4 h-4 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  {option.label}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={!canSubmit}
            className="px-6 py-2.5 rounded-full font-medium text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            style={{ backgroundColor: primary }}
          >
            {submitButtonLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

interface ContactFieldRowProps {
  question: Question;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  onBlur: () => void;
  onFocus: () => void;
}

function ContactFieldRow({ question, value, onChange, error, onBlur, onFocus }: ContactFieldRowProps) {
  const kind = question.contactKind ?? "email";
  const label = question.label?.trim() || null;
  const placeholder = question.placeholder?.trim() || (kind === "email" ? "you@example.com" : kind === "tel" ? "e.g. 7123456789" : kind === "instagram" ? "@username" : "");
  const isTel = kind === "tel";

  const parsed = kind === "tel" ? parseTelValue(value) : { code: "+44", national: "" };

  return (
    <div>
      {label && (
        <label htmlFor={`contact-${question.id}`} className="block text-white/80 text-sm mb-1">
          {label}
          {question.required !== false && <span className="text-amber-400">*</span>}
        </label>
      )}
      {isTel ? (
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
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder={placeholder}
            className="flex-1 min-w-0 py-2.5 pl-2 pr-3 bg-transparent border-0 text-white/90 placeholder-white/40 focus:outline-none focus:ring-0"
            aria-invalid={!!error}
            aria-describedby={error ? `contact-${question.id}-error` : undefined}
          />
        </div>
      ) : (
        <div className="flex items-center gap-2 border-b border-white/30 focus-within:border-white/60 transition-colors pb-1">
          <input
            id={`contact-${question.id}`}
            type={kind === "email" ? "email" : "text"}
            inputMode={kind === "email" ? "email" : "text"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder={placeholder}
            className="flex-1 min-w-0 py-2.5 px-0 bg-transparent border-0 text-white/90 placeholder-white/40 focus:outline-none focus:ring-0"
            aria-invalid={!!error}
            aria-describedby={error ? `contact-${question.id}-error` : undefined}
          />
        </div>
      )}
      {error && (
        <p id={`contact-${question.id}-error`} className="mt-1 text-sm text-amber-400">
          {error}
        </p>
      )}
    </div>
  );
}
