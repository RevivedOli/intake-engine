"use client";

import { useState } from "react";
import type { ContactField } from "../types";
import { useTheme } from "../contexts/ThemeContext";

interface ContactCaptureProps {
  fields: ContactField[];
  contact: Record<string, string>;
  onContactChange: (contact: Record<string, string>) => void;
  onSubmit: () => void;
  /** Optional image shown above the contact form */
  imageUrl?: string;
  introText?: string;
  submitLabel?: string;
  submitting?: boolean;
}

export function ContactCapture({
  fields,
  contact,
  onContactChange,
  onSubmit,
  imageUrl,
  introText,
  submitLabel = "Submit",
  submitting = false,
}: ContactCaptureProps) {
  const theme = useTheme();
  const primary = theme.primaryColor ?? "#a47f4c";
  const fontFamily = theme.fontFamily ?? "var(--font-sans)";
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    for (const field of fields) {
      const value = (contact[field.id] ?? "").trim();
      if (field.required && !value) {
        next[field.id] = "This field is required.";
      } else if (field.type === "email" && value) {
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRe.test(value)) next[field.id] = "Please enter a valid email.";
      } else if (field.type === "tel" && value && !/^[\d\s+()-]+$/.test(value)) {
        next[field.id] = "Please enter a valid phone number.";
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(Object.fromEntries(fields.map((f) => [f.id, true])));
    if (!validate()) return;
    onSubmit();
  };

  const setValue = (id: string, value: string) => {
    onContactChange({ ...contact, [id]: value });
    if (errors[id]) setErrors((prev) => ({ ...prev, [id]: "" }));
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-center p-6 sm:p-8 animate-fade-in-up max-w-xl mx-auto w-full"
      style={{ fontFamily }}
    >
      {imageUrl && (
        <div className="mb-6 flex justify-center">
          <img
            src={imageUrl}
            alt=""
            className="w-full max-h-52 sm:max-h-64 object-contain"
          />
        </div>
      )}
      {introText && (
        <p className="text-white/80 text-lg mb-6">{introText}</p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => (
          <div key={field.id}>
            <label htmlFor={field.id} className="block text-white/90 text-sm mb-1">
              {field.label}
              {field.required && <span className="text-amber-400">*</span>}
            </label>
            {field.type === "tel" ? (
              <input
                id={field.id}
                type="tel"
                value={contact[field.id] ?? ""}
                onChange={(e) => setValue(field.id, e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, [field.id]: true }))}
                placeholder={field.placeholder ?? "e.g. 07400 123456"}
                className="w-full px-0 py-2 bg-transparent border-0 border-b border-white/30 text-white/90 placeholder-white/40 focus:outline-none focus:border-white/60"
                aria-invalid={!!errors[field.id]}
                aria-describedby={errors[field.id] ? `${field.id}-error` : undefined}
              />
            ) : (
              <input
                id={field.id}
                type={field.type === "email" ? "email" : "text"}
                value={contact[field.id] ?? ""}
                onChange={(e) => setValue(field.id, e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, [field.id]: true }))}
                placeholder={field.placeholder}
                className="w-full px-0 py-2 bg-transparent border-0 border-b border-white/30 text-white/90 placeholder-white/40 focus:outline-none focus:border-white/60"
                aria-invalid={!!errors[field.id]}
                aria-describedby={errors[field.id] ? `${field.id}-error` : undefined}
              />
            )}
            {errors[field.id] && (
              <p id={`${field.id}-error`} className="mt-1 text-sm text-amber-400">
                {errors[field.id]}
              </p>
            )}
          </div>
        ))}
        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full px-6 py-3 rounded-lg font-medium text-white focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ backgroundColor: primary }}
        >
          {submitLabel}
        </button>
      </form>
    </div>
  );
}
