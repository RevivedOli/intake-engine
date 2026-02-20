"use client";

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createTenantAction } from "../actions";
import type { AppConfig } from "@/types/config";
import type { Question } from "@/types/question";
import { normalizeConfig } from "../tenants/[id]/defaults";
import { ConfigFormFields } from "../tenants/[id]/ConfigFormFields";
import { ConfigPreview } from "../tenants/[id]/ConfigPreview";
import { QuestionsPreview } from "../tenants/[id]/QuestionsPreview";
import { QuestionsFormFields } from "../tenants/[id]/QuestionsFormFields";
import { CTAFormFields } from "../tenants/[id]/CTAFormFields";
import { CTAPreview } from "../tenants/[id]/CTAPreview";
import { PrivacyPolicyFormFields } from "../tenants/[id]/PrivacyPolicyFormFields";
import { PrivacyPolicyPreview } from "../tenants/[id]/PrivacyPolicyPreview";

const TOAST_DURATION_MS = 3000;
const REDIRECT_DELAY_MS = 1500;
const inputClass =
  "w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-600 text-white";
const labelClass = "block text-sm font-medium text-zinc-300 mb-1";

const INITIAL_CONFIG = normalizeConfig({
  hero: {
    title: "Welcome",
    body: ["Answer a few questions to get started."],
    ctaLabel: "Get started",
    buttonLabel: "Start",
  },
  defaultThankYouMessage: "Thank you. We'll be in touch.",
});

const INITIAL_QUESTIONS: Question[] = [
  {
    id: "q1",
    type: "single",
    question: "What best describes you?",
    options: ["Option A", "Option B", "Other"],
  },
];

export function NewTenantForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"config" | "questions" | "cta" | "privacy">("config");
  const [config, setConfig] = useState<AppConfig>(INITIAL_CONFIG);
  const [questions, setQuestions] = useState<Question[]>(INITIAL_QUESTIONS);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), TOAST_DURATION_MS);
    return () => clearTimeout(t);
  }, [error]);

  useEffect(() => {
    if (!showSuccess) return;
    const t = setTimeout(() => setShowSuccess(false), TOAST_DURATION_MS);
    return () => clearTimeout(t);
  }, [showSuccess]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const name = (e.currentTarget.elements.namedItem("name") as HTMLInputElement)
      ?.value?.trim();
    const domain = (
      e.currentTarget.elements.namedItem("domain") as HTMLInputElement
    )
      ?.value?.trim()
      ?.toLowerCase();
    if (!name || !domain) {
      setError("Name and domain are required");
      return;
    }
    if (config.steps.length === 0) {
      setError("Add at least one step to the flow.");
      return;
    }
    const emptyQuestion = questions.find((q) => !q.question?.trim());
    if (emptyQuestion) {
      setError("Each question needs question text.");
      return;
    }

    const fd = new FormData(e.currentTarget);
    fd.set("config", JSON.stringify(config));
    fd.set("questions", JSON.stringify(questions));
    setIsSubmitting(true);
    try {
      const result = await createTenantAction(fd);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success && result?.id) {
        setShowSuccess(true);
        const id = result.id;
        setTimeout(() => {
          router.push(`/dashboard/tenants/${id}`);
        }, REDIRECT_DELAY_MS);
      }
    } catch (err: unknown) {
      const d =
        err && typeof err === "object" && "digest" in err
          ? (err as { digest?: string }).digest
          : undefined;
      if (typeof d === "string" && d.startsWith("NEXT_REDIRECT")) throw err;
      setError(
        err instanceof Error ? err.message : "Failed to create tenant"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const showToast = showSuccess || error;

  return (
    <>
      {showToast && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 pointer-events-none"
          role={error ? "alert" : "status"}
          aria-live="polite"
        >
          <div
            className={`rounded-lg border px-4 py-3 shadow-lg pointer-events-auto ${
              error
                ? "border-red-500/50 bg-red-600/95 text-red-50"
                : "border-emerald-500/50 bg-emerald-600/95 text-emerald-50"
            }`}
          >
            {error ? error : "Tenant created successfully."}
          </div>
        </div>
      )}
      <div className="flex gap-8 flex-col xl:flex-row">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 max-w-2xl flex-1 min-w-0"
        >
          <section className="space-y-4">
            <h2 className="text-lg font-medium text-zinc-200">Basics</h2>
            <div>
              <label htmlFor="name" className={labelClass}>
                Tenant name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className={inputClass}
                placeholder="e.g. Acme Corp"
              />
            </div>
            <div>
              <label htmlFor="domain" className={labelClass}>
                Domain (host to match)
              </label>
              <input
                id="domain"
                name="domain"
                type="text"
                required
                className={inputClass}
                placeholder="e.g. acme.example.com or acme.local"
              />
            </div>
          </section>

          <div>
            <div className="flex gap-1 border-b border-zinc-600 mb-4">
              <button
                type="button"
                onClick={() => setActiveTab("config")}
                className={`px-4 py-2 text-sm font-medium rounded-t -mb-px ${
                  activeTab === "config"
                    ? "bg-zinc-700 text-white border border-zinc-600 border-b-0"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Config
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("questions")}
                className={`px-4 py-2 text-sm font-medium rounded-t -mb-px ${
                  activeTab === "questions"
                    ? "bg-zinc-700 text-white border border-zinc-600 border-b-0"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Questions
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("cta")}
                className={`px-4 py-2 text-sm font-medium rounded-t -mb-px ${
                  activeTab === "cta"
                    ? "bg-zinc-700 text-white border border-zinc-600 border-b-0"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                CTA
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("privacy")}
                className={`px-4 py-2 text-sm font-medium rounded-t -mb-px ${
                  activeTab === "privacy"
                    ? "bg-zinc-700 text-white border border-zinc-600 border-b-0"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Privacy Policy
              </button>
            </div>

            {activeTab === "config" && (
              <ConfigFormFields config={config} onChange={setConfig} />
            )}
            {activeTab === "questions" && (
              <QuestionsFormFields questions={questions} onChange={setQuestions} />
            )}
            {activeTab === "cta" && (
              <CTAFormFields config={config} onChange={setConfig} />
            )}
            {activeTab === "privacy" && (
              <PrivacyPolicyFormFields config={config} onChange={setConfig} />
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded bg-amber-500 text-zinc-900 font-medium hover:bg-amber-400 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating…" : "Create tenant"}
            </button>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded border border-zinc-600 text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </Link>
          </div>
        </form>
        {activeTab === "config" && (
          <div className="xl:w-[360px] xl:shrink-0">
            <div className="xl:sticky xl:top-4">
              <ConfigPreview config={config} />
            </div>
          </div>
        )}
        {activeTab === "questions" && (
          <div className="xl:w-[360px] xl:shrink-0">
            <div className="xl:sticky xl:top-4">
              <QuestionsPreview questions={questions} config={config} />
            </div>
          </div>
        )}
        {activeTab === "cta" && (
          <div className="xl:w-[360px] xl:shrink-0">
            <div className="xl:sticky xl:top-4">
              <CTAPreview config={config} />
            </div>
          </div>
        )}
        {activeTab === "privacy" && (
          <div className="xl:w-[360px] xl:shrink-0">
            <div className="xl:sticky xl:top-4">
              <PrivacyPolicyPreview config={config} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
