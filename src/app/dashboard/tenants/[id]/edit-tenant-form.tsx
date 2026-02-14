"use client";

import { useState, useEffect, type FormEvent, useMemo } from "react";
import Link from "next/link";
import {
  updateTenantAction,
  type UpdateTenantState,
} from "../../actions";
import type { AppConfig } from "@/types/config";
import type { Question } from "@/types/question";
import { normalizeConfig, normalizeQuestions } from "./defaults";
import { ConfigFormFields } from "./ConfigFormFields";
import { ConfigPreview } from "./ConfigPreview";
import { QuestionsPreview } from "./QuestionsPreview";
import { QuestionsFormFields } from "./QuestionsFormFields";

type Tenant = {
  name: string | null;
  config: unknown;
  questions: unknown;
};

const TOAST_DURATION_MS = 3000;
const inputClass =
  "w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-600 text-white";

export function EditTenantForm({
  tenant,
  tenantId,
}: {
  tenant: Tenant;
  tenantId: string;
}) {
  const [submitState, setSubmitState] = useState<UpdateTenantState>({
    error: null,
  });
  const error = submitState?.error ?? null;
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!showSuccess) return;
    const t = setTimeout(() => setShowSuccess(false), TOAST_DURATION_MS);
    return () => clearTimeout(t);
  }, [showSuccess]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(
      () => setSubmitState((s) => (s?.error ? { error: null } : s)),
      TOAST_DURATION_MS
    );
    return () => clearTimeout(t);
  }, [error]);

  const initialConfig = useMemo(
    () => normalizeConfig(tenant.config),
    [tenant.config]
  );
  const initialQuestions = useMemo(
    () => normalizeQuestions(tenant.questions),
    [tenant.questions]
  );

  const [activeTab, setActiveTab] = useState<"config" | "questions">("config");
  const [config, setConfig] = useState<AppConfig>(initialConfig);
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitState({ error: null });
    setShowSuccess(false);

    if (config.steps.length === 0) {
      setSubmitState({ error: "Add at least one step to the flow." });
      return;
    }
    if (config.contactFields.length === 0) {
      setSubmitState({ error: "Add at least one contact field." });
      return;
    }
    const emptyContact = config.contactFields.find(
      (f) => !f.label?.trim() || !f.id?.trim()
    );
    if (emptyContact) {
      setSubmitState({ error: "Each contact field needs an id and label." });
      return;
    }
    const emptyQuestion = questions.find((q) => !q.question?.trim());
    if (emptyQuestion) {
      setSubmitState({ error: "Each question needs question text." });
      return;
    }

    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("config", JSON.stringify(config));
    fd.set("questions", JSON.stringify(questions));
    setIsSubmitting(true);
    try {
      const result = await updateTenantAction(submitState, fd);
      setSubmitState(
        result && typeof result === "object" && "error" in result
          ? result
          : { error: null }
      );
      if (result && typeof result === "object" && result.success) {
        setShowSuccess(true);
      }
    } catch (err: unknown) {
      const d =
        err && typeof err === "object" && "digest" in err
          ? (err as { digest?: string }).digest
          : undefined;
      if (typeof d === "string" && d.startsWith("NEXT_REDIRECT")) throw err;
      setSubmitState({
        error: err instanceof Error ? err.message : "Failed to save",
      });
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
            {error ? error : "Saved successfully."}
          </div>
        </div>
      )}
      <div className="flex gap-8 flex-col xl:flex-row">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 max-w-2xl flex-1 min-w-0"
        >
          <input type="hidden" name="tenantId" value={tenantId} />

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-zinc-200">Name</h2>
            <input
              name="name"
              type="text"
              defaultValue={tenant.name ?? ""}
              className={inputClass}
            />
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
            </div>

            {activeTab === "config" && (
              <ConfigFormFields config={config} onChange={setConfig} />
            )}
            {activeTab === "questions" && (
              <QuestionsFormFields questions={questions} onChange={setQuestions} />
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded bg-amber-500 text-zinc-900 font-medium hover:bg-amber-400 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving…" : "Save changes"}
            </button>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded border border-zinc-600 text-zinc-300 hover:bg-zinc-800"
            >
              Back to list
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
      </div>
    </>
  );
}
