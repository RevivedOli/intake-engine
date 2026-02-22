"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Hero } from "@/components/Hero";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { QuestionFlow } from "@/components/QuestionFlow";
import { ResultScreen } from "@/components/ResultScreen";
import type { AppConfig, FlowStep, IntakeResult } from "@/types";
import type {
  CtaConfig,
  CtaMultiChoiceOption,
  CtaMultiChoiceOptionVideoSubChoice,
  CtaResolvedView,
} from "@/types/config";
import { contactKindToPayloadKey } from "@/lib/contact-payload";
import { getFirstQuestionOfLogicalStep, computeLogicalSteps } from "@/lib/logical-steps";

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

function utmFromSearchParams(searchParams: URLSearchParams): Record<string, string> {
  const utm: Record<string, string> = {};
  UTM_KEYS.forEach((k) => {
    const v = searchParams.get(k);
    if (v) utm[k] = v;
  });
  return utm;
}

interface FunnelProps {
  appId: string;
  config: AppConfig;
  questions: import("@/types").Question[];
  /** Fallback for document title when config.siteTitle is not set */
  tenantName?: string | null;
}

/** Session ID for this page load; new UUID on each load/refresh, same for all requests within the load */
let sessionIdForThisLoad: string | null = null;

/** Contact object keyed by canonical names (instagram, phone, email, text) for consistent webhook payload. */
function deriveContactFromAnswers(
  questions: import("@/types").Question[],
  answers: Record<string, string | string[]>
): Record<string, string> {
  const contact: Record<string, string> = {};
  questions.forEach((q) => {
    if (q.type === "contact") {
      const kind = q.contactKind ?? "email";
      const key = contactKindToPayloadKey(kind);
      const v = answers[q.id];
      const value = typeof v === "string" ? v.trim() : Array.isArray(v) ? v.join(" ").trim() : "";
      contact[key] = value;
    }
  });
  return contact;
}

/** Answers keyed by question text (stable when questions reordered). Excludes contact. Handles duplicate text with (2), (3). */
function answersWithQuestionTextKeys(
  questions: import("@/types").Question[],
  answers: Record<string, string | string[]>
): Record<string, string | string[]> {
  const contactIds = new Set(questions.filter((q) => q.type === "contact").map((q) => q.id));
  const usedKeys = new Map<string, number>();
  const out: Record<string, string | string[]> = {};
  for (const q of questions) {
    if (q.type === "contact") continue;
    const value = answers[q.id];
    if (value === undefined) continue;
    const baseKey = q.question?.trim() || q.id;
    const count = (usedKeys.get(baseKey) ?? 0) + 1;
    usedKeys.set(baseKey, count);
    const key = count === 1 ? baseKey : `${baseKey} (${count})`;
    out[key] = value;
  }
  return out;
}

function getOrCreateSessionId(_appId: string): string {
  if (typeof window === "undefined") return "";
  if (!sessionIdForThisLoad) {
    sessionIdForThisLoad = crypto.randomUUID();
  }
  return sessionIdForThisLoad;
}

export function Funnel({ appId, config, questions, tenantName }: FunnelProps) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const title = config.siteTitle?.trim() || tenantName?.trim() || "Intake";
    document.title = title;
  }, [config.siteTitle, tenantName]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const url = config.faviconUrl?.trim();
    if (url) {
      let link = document.querySelector<HTMLLinkElement>('link[rel="icon"][data-intake-dynamic]');
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        link.setAttribute("data-intake-dynamic", "true");
        document.head.appendChild(link);
      }
      link.href = url;
    } else {
      const link = document.querySelector<HTMLLinkElement>('link[rel="icon"][data-intake-dynamic]');
      if (link) link.remove();
    }
  }, [config.faviconUrl]);

  const [step, setStep] = useState<FlowStep | "result">(
    config.steps[0] ?? "hero"
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const derivedContact = useMemo(
    () => deriveContactFromAnswers(questions, answers),
    [questions, answers]
  );
  const [result, setResult] = useState<IntakeResult | null>(null);
  const [ctaView, setCtaView] = useState<CtaResolvedView | null>(null);
  const [subChoiceOption, setSubChoiceOption] = useState<CtaMultiChoiceOptionVideoSubChoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  /** Set when user submits contact form; used to mask contact in CTA webhooks if consent wasn't given */
  const [consentGivenAtSubmit, setConsentGivenAtSubmit] = useState<boolean | null>(null);
  /** Set when user gives consent at any step; never reset; used to include consent_given in progress and submit */
  const [consentGivenEver, setConsentGivenEver] = useState(false);

  // When on Hero, preload first question image so it's ready when user clicks Start
  useEffect(() => {
    if (typeof document === "undefined" || step !== "hero") return;
    const url = questions[0]?.imageUrl?.trim();
    if (!url) return;
    let link = document.querySelector<HTMLLinkElement>('link[rel="preload"][data-intake-first-question-image]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.setAttribute("data-intake-first-question-image", "true");
      document.head.appendChild(link);
    }
    link.href = url;
    return () => link?.remove();
  }, [step, questions]);

  useEffect(() => {
    if (typeof document === "undefined" || step !== "questions") return;
    const cta = config.cta;
    const url = cta?.type === "multi_choice" && cta.imageUrl?.trim() ? cta.imageUrl.trim() : null;
    if (!url) return;
    let link = document.querySelector<HTMLLinkElement>('link[rel="preload"][data-intake-cta-image]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.setAttribute("data-intake-cta-image", "true");
      document.head.appendChild(link);
    }
    link.href = url;
    return () => {
      link?.remove();
    };
  }, [step, config.cta]);

  // When on the before-last question, preload all CTA images (main + sub-choice) so they're ready on result
  const logicalStepsCount = useMemo(() => computeLogicalSteps(questions).length, [questions]);
  useEffect(() => {
    if (typeof document === "undefined" || step !== "questions") return;
    if (logicalStepsCount < 2 || questionIndex !== logicalStepsCount - 2) return;
    const cta = config.cta;
    if (cta?.type !== "multi_choice") return;
    const urls: string[] = [];
    if (cta.imageUrl?.trim()) urls.push(cta.imageUrl.trim());
    (cta.options ?? []).forEach((opt: CtaMultiChoiceOption) => {
      if (opt.kind === "embed_video" && opt.variant === "sub_choice" && opt.imageUrl?.trim()) {
        urls.push(opt.imageUrl.trim());
      }
    });
    const links: HTMLLinkElement[] = [];
    urls.forEach((href) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = href;
      link.setAttribute("data-intake-cta-preload-all", "true");
      document.head.appendChild(link);
      links.push(link);
    });
    return () => links.forEach((l) => l.remove());
  }, [step, questionIndex, logicalStepsCount, config.cta]);

  const utm = useMemo(
    () => (searchParams ? utmFromSearchParams(searchParams) : {}),
    [searchParams]
  );

  const buildPayload = useCallback(
    (
      event: "progress" | "submit",
      overrides: {
        step?: string;
        answers?: Record<string, string | string[]>;
        contact?: Record<string, string>;
        question_index?: number;
        question_id?: string;
        /** Actual question text for this step (stable when questions are reordered) */
        step_question?: string;
      } = {}
    ) => ({
      app_id: appId,
      event,
      timestamp: new Date().toISOString(),
      session_id: typeof window !== "undefined" ? getOrCreateSessionId(appId) : undefined,
      step: overrides.step,
      question_index: overrides.question_index,
      question_id: overrides.question_id,
      step_question: overrides.step_question,
      answers: answersWithQuestionTextKeys(questions, overrides.answers ?? answers),
      contact: overrides.contact ?? derivedContact,
      utm,
    }),
    [appId, answers, derivedContact, utm, questions]
  );

  const sendProgress = useCallback(
    async (
      stepName: string,
      answersSoFar: Record<string, string | string[]>,
      questionIndex?: number,
      questionId?: string,
      stepQuestion?: string,
      consentGiven?: boolean
    ) => {
      try {
        const contactSoFar = deriveContactFromAnswers(questions, answersSoFar);
        const body = buildPayload("progress", {
          step: stepName,
          answers: answersSoFar,
          contact: contactSoFar,
          question_index: questionIndex,
          question_id: questionId,
          step_question: stepQuestion,
        });
        if (consentGiven) {
          (body as Record<string, unknown>).consent_given = true;
        }
        await fetch("/api/intake", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } catch {
        // non-blocking
      }
    },
    [buildPayload, questions]
  );

  const moveToStep = useCallback(
    (nextStep: FlowStep, nextIndex: number, answersSoFar: Record<string, string | string[]>) => {
      const prevStep = config.steps[stepIndex];
      // Skip hero progress when moving to questions; handleStart sends the "reached first question" progress
      if (prevStep && !(prevStep === "hero" && nextStep === "questions")) {
        sendProgress(prevStep, answersSoFar, undefined, undefined, undefined, consentGivenEver);
      }
      setStep(nextStep);
      setStepIndex(nextIndex);
    },
    [config.steps, stepIndex, sendProgress, consentGivenEver]
  );

  const handleStart = useCallback(() => {
    const idx = config.steps.indexOf("questions");
    if (idx >= 0) {
      setQuestionIndex(0);
      moveToStep("questions", idx, answers);
      const firstQ = getFirstQuestionOfLogicalStep(questions, 0);
      sendProgress("questions", answers, 0, firstQ?.id, firstQ?.question, consentGivenEver);
    }
  }, [config.steps, answers, moveToStep, sendProgress, questions, consentGivenEver]);

  const handleQuestionsBack = useCallback(() => {
    if (questionIndex > 0) {
      setQuestionIndex((q) => q - 1);
    } else {
      const heroIdx = config.steps.indexOf("hero");
      if (heroIdx >= 0) {
        setStep("hero");
        setStepIndex(heroIdx);
      }
    }
  }, [config.steps, questionIndex]);

  const handleQuestionsComplete = useCallback(
    async (
      answersSoFar?: Record<string, string | string[]>,
      opts?: { consentGiven?: boolean }
    ) => {
      const a = answersSoFar ?? answers;
      setAnswers(a);
      setError(null);
      setSubmitting(true);
      try {
        const contactPayload = deriveContactFromAnswers(questions, a);
        const logicalStepsCount = computeLogicalSteps(questions).length;
        const lastQ = logicalStepsCount > 0
          ? getFirstQuestionOfLogicalStep(questions, logicalStepsCount - 1)
          : undefined;
        const body = buildPayload("submit", {
          answers: a,
          contact: contactPayload,
          step: "questions",
          question_index: logicalStepsCount - 1,
          question_id: lastQ?.id,
          step_question: lastQ?.question,
        });
        if (opts?.consentGiven === true) {
          setConsentGivenEver(true);
        }
        const consentToSend = consentGivenEver || opts?.consentGiven === true;
        if (consentToSend) {
          (body as Record<string, unknown>).consent_given = true;
          setConsentGivenAtSubmit(true);
        } else if (typeof opts?.consentGiven === "boolean") {
          (body as Record<string, unknown>).consent_given = false;
          setConsentGivenAtSubmit(false);
        } else {
          setConsentGivenAtSubmit(true);
        }
        const res = await fetch("/api/intake", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.message ?? "Something went wrong. Please try again.");
          setSubmitting(false);
          return;
        }
        setCtaView(null);
        setSubChoiceOption(null);
        setStep("result");
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [config.steps, answers, questions, buildPayload, consentGivenEver]
  );

  const resolveCtaViewFromOption = useCallback((option: CtaMultiChoiceOption): CtaResolvedView | null => {
    if (option.kind === "embed_video") {
      if (option.variant === "direct") {
        return {
          kind: "embed_video",
          videoUrl: option.videoUrl,
          title: option.title,
          subtitle: option.subtitle,
          button: option.button,
        };
      }
      return null;
    }
    if (option.kind === "discount_code") {
      return {
        kind: "discount",
        title: option.title,
        description: option.description,
        linkUrl: option.linkUrl,
        linkLabel: option.linkLabel,
        code: option.code,
      };
    }
    return null;
  }, []);

  const handleSelectOption = useCallback(
    async (optionId: string, option: CtaMultiChoiceOption) => {
      if (option.kind === "link") {
        if (option.openInNewTab) {
          window.open(option.url, "_blank", "noopener,noreferrer");
        } else {
          window.location.href = option.url;
        }
        return;
      }
      if (option.kind === "embed_video" && option.variant === "sub_choice") {
        setSubChoiceOption(option);
        setCtaView(null);
        return;
      }
      const view = resolveCtaViewFromOption(option);
      if (view) {
        setCtaView(view);
        setSubChoiceOption(null);
        return;
      }
      if (option.kind === "webhook_then_message") {
        try {
          const body = {
            ...buildPayload("submit"),
            cta_tag: option.webhookTag,
            ...(option.webhookUrl ? { cta_webhook_url: option.webhookUrl } : {}),
            ...(typeof consentGivenAtSubmit === "boolean"
              ? { consent_given: consentGivenAtSubmit }
              : consentGivenEver
                ? { consent_given: true }
                : {}),
          };
          await fetch("/api/intake", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
        } catch {
          // still show thank you
        }
        setCtaView({
          kind: "thank_you",
          message: option.thankYouMessage,
          header: option.thankYouHeader?.trim() || undefined,
          subheading: option.thankYouSubheading?.trim() || undefined,
        });
        setSubChoiceOption(null);
      }
    },
    [buildPayload, consentGivenAtSubmit, consentGivenEver, resolveCtaViewFromOption]
  );

  const handleSelectSubChoice = useCallback((_optionId: string, subChoiceIndex: number) => {
    if (!subChoiceOption || !("choices" in subChoiceOption)) return;
    const choice = subChoiceOption.choices[subChoiceIndex];
    if (choice) {
      setCtaView({
        kind: "embed_video",
        videoUrl: choice.videoUrl,
        title: choice.title,
        subtitle: choice.subtitle,
        button: choice.button,
      });
      setSubChoiceOption(null);
    }
  }, [subChoiceOption]);

  const currentStepName = config.steps[stepIndex];

  const announcement = config.announcement;
  const showAnnouncement =
    announcement?.enabled &&
    announcement.message?.trim() &&
    (announcement.scope === "full" || (announcement.scope === "hero" && step === "hero"));

  return (
    <ThemeProvider theme={config.theme}>
      <div
        className={showAnnouncement ? "h-screen flex flex-col overflow-hidden" : "min-h-screen"}
        style={{
          background:
            config.theme.background?.startsWith("http")
              ? `url(${config.theme.background}) center/cover`
              : config.theme.background ?? "#1a2e28",
          fontFamily: config.theme.fontFamily ?? "var(--font-sans)",
        }}
      >
        {showAnnouncement && (
          <AnnouncementBanner
            message={announcement!.message}
            backgroundColor={announcement!.backgroundColor ?? "#c41e3a"}
            textColor={announcement!.textColor ?? "#ffffff"}
          />
        )}
        <div className={showAnnouncement ? "flex-1 min-h-0 overflow-y-auto flex flex-col" : undefined}>
          {step === "hero" && config.hero && (
            <Hero config={config.hero} onStart={handleStart} fillContainer={!!showAnnouncement} />
          )}

          {step === "questions" && questions.length > 0 && (
            <>
              {error && (
                <p className="text-center text-amber-400 text-sm mt-4 px-6">
                  {error}
                </p>
              )}
              <QuestionFlow
                questions={questions}
                answers={answers}
                currentIndex={questionIndex}
                onAnswersChange={setAnswers}
                onStepChange={(idx, answersSoFar, opts) => {
                  if (opts?.consentGiven === true) {
                    setConsentGivenEver(true);
                  }
                  if (idx > questionIndex) {
                    // Last step = question they just completed (current index), not the one they're moving to
                    const completedQ = getFirstQuestionOfLogicalStep(questions, questionIndex);
                    const consentToSend = opts?.consentGiven === true || consentGivenEver;
                    sendProgress(
                      "questions",
                      answersSoFar ?? answers,
                      questionIndex,
                      completedQ?.id,
                      completedQ?.question,
                      consentToSend
                    );
                  }
                  setQuestionIndex(idx);
                }}
                onComplete={handleQuestionsComplete}
                onBack={handleQuestionsBack}
                stepName="questions"
                textQuestionButtonLabel={config.textQuestionButtonLabel}
                config={config}
                fillContainer={!!showAnnouncement}
              />
            </>
          )}

          {step === "result" && (
            <ResultScreen
              result={null}
              cta={config.cta ?? { type: "thank_you", message: config.defaultThankYouMessage ?? "Thank you." }}
              ctaView={ctaView}
              subChoiceOption={subChoiceOption}
              onSelectOption={config.cta?.type === "multi_choice" ? handleSelectOption : undefined}
              onSelectSubChoice={config.cta?.type === "multi_choice" ? handleSelectSubChoice : undefined}
              defaultThankYouMessage={config.defaultThankYouMessage}
              fillContainer={!!showAnnouncement}
            />
          )}
        </div>
      </div>
    </ThemeProvider>
  );
}
