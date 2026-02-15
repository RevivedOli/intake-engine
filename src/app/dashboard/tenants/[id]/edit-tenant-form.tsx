"use client";

import { useState, useEffect, type FormEvent, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  updateTenantAction,
  addDomainForTenantAction,
  removeDomainForTenantAction,
  setPrimaryDomainAction,
  type UpdateTenantState,
} from "../../actions";
import type { AppConfig } from "@/types/config";
import type { Question } from "@/types/question";
import { normalizeConfig, normalizeQuestions } from "./defaults";
import { ConfigFormFields } from "./ConfigFormFields";
import { ConfigPreview } from "./ConfigPreview";
import { QuestionsPreview } from "./QuestionsPreview";
import { QuestionsFormFields } from "./QuestionsFormFields";
import { CTAFormFields } from "./CTAFormFields";
import { CTAPreview } from "./CTAPreview";

type Tenant = {
  name: string | null;
  config: unknown;
  questions: unknown;
};

type DomainRow = { domain: string; is_primary: boolean };

const TOAST_DURATION_MS = 3000;
const inputClass =
  "w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-600 text-white";

export function EditTenantForm({
  tenant,
  tenantId,
  domains,
}: {
  tenant: Tenant;
  tenantId: string;
  domains: DomainRow[];
}) {
  const router = useRouter();
  const [submitState, setSubmitState] = useState<UpdateTenantState>({
    error: null,
  });
  const error = submitState?.error ?? null;
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [domainError, setDomainError] = useState<string | null>(null);
  const [newDomain, setNewDomain] = useState("");
  const [domainActionPending, setDomainActionPending] = useState(false);

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

  const [activeTab, setActiveTab] = useState<"config" | "questions" | "cta">("config");
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

  async function handleAddDomain() {
    const value = newDomain.trim().toLowerCase();
    if (!value) {
      setDomainError("Domain is required");
      return;
    }
    setDomainError(null);
    setDomainActionPending(true);
    try {
      const result = await addDomainForTenantAction(tenantId, value);
      if (result.error) {
        setDomainError(result.error);
        return;
      }
      setNewDomain("");
      router.refresh();
    } finally {
      setDomainActionPending(false);
    }
  }

  async function handleRemoveDomain(domain: string) {
    setDomainActionPending(true);
    try {
      await removeDomainForTenantAction(tenantId, domain);
      router.refresh();
    } finally {
      setDomainActionPending(false);
    }
  }

  async function handleSetPrimaryDomain(domain: string) {
    setDomainActionPending(true);
    try {
      await setPrimaryDomainAction(tenantId, domain);
      router.refresh();
    } finally {
      setDomainActionPending(false);
    }
  }

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

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-zinc-200">Domains</h2>
            <p className="text-sm text-zinc-500">
              Hosts that resolve to this tenant. Add, remove, or set primary. No domains means no host will show this tenant’s funnel.
            </p>
            {domains.length === 0 && (
              <p className="text-sm text-zinc-500 italic">No domains. Add a domain so a host can show this tenant’s funnel.</p>
            )}
            <ul className="space-y-2 list-none pl-0">
              {domains.map((row) => (
                <li
                  key={row.domain}
                  className="flex items-center gap-2 py-2 px-3 rounded border border-zinc-600 bg-zinc-800/50"
                >
                  <span className="font-mono text-sm text-zinc-200">{row.domain}</span>
                  {row.is_primary && (
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
                      Primary
                    </span>
                  )}
                  {!row.is_primary && domains.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimaryDomain(row.domain)}
                      disabled={domainActionPending}
                      className="text-xs text-zinc-400 hover:text-zinc-200 disabled:opacity-50"
                    >
                      Set as primary
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveDomain(row.domain)}
                    disabled={domainActionPending}
                    className="ml-auto text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2 items-center flex-wrap">
              <input
                type="text"
                value={newDomain}
                onChange={(e) => {
                  setNewDomain(e.target.value);
                  setDomainError(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddDomain())}
                placeholder="e.g. lionsden.example.com"
                className={inputClass}
                style={{ maxWidth: 280 }}
              />
              <button
                type="button"
                onClick={handleAddDomain}
                disabled={domainActionPending}
                className="px-4 py-2 rounded border border-zinc-600 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"
              >
                Add domain
              </button>
            </div>
            {domainError && (
              <p className="text-sm text-red-400" role="alert">
                {domainError}
              </p>
            )}
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
        {activeTab === "cta" && (
          <div className="xl:w-[360px] xl:shrink-0">
            <div className="xl:sticky xl:top-4">
              <CTAPreview config={config} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
