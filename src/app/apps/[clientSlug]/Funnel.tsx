"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Hero } from "@/components/Hero";
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

const SESSION_KEY_PREFIX = "intake_session_";

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

/** Answers with contact question ids removed so payload.answers only has Q1, Q2, Q3 style. */
function answersWithoutContact(
  questions: import("@/types").Question[],
  answers: Record<string, string | string[]>
): Record<string, string | string[]> {
  const contactIds = new Set(questions.filter((q) => q.type === "contact").map((q) => q.id));
  const out: Record<string, string | string[]> = {};
  for (const [id, value] of Object.entries(answers)) {
    if (!contactIds.has(id)) out[id] = value;
  }
  return out;
}

function getOrCreateSessionId(appId: string): string {
  if (typeof window === "undefined") return "";
  const key = `${SESSION_KEY_PREFIX}${appId}`;
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
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
      } = {}
    ) => ({
      app_id: appId,
      event,
      timestamp: new Date().toISOString(),
      session_id: typeof window !== "undefined" ? getOrCreateSessionId(appId) : undefined,
      step: overrides.step,
      question_index: overrides.question_index,
      question_id: overrides.question_id,
      answers: answersWithoutContact(questions, overrides.answers ?? answers),
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
      questionId?: string
    ) => {
      try {
        const contactSoFar = deriveContactFromAnswers(questions, answersSoFar);
        await fetch("/api/intake", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            buildPayload("progress", {
              step: stepName,
              answers: answersSoFar,
              contact: contactSoFar,
              question_index: questionIndex,
              question_id: questionId,
            })
          ),
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
      if (prevStep) sendProgress(prevStep, answersSoFar);
      setStep(nextStep);
      setStepIndex(nextIndex);
    },
    [config.steps, stepIndex, sendProgress]
  );

  const handleStart = useCallback(() => {
    const idx = config.steps.indexOf("questions");
    if (idx >= 0) {
      setQuestionIndex(0);
      moveToStep("questions", idx, answers);
      sendProgress("questions", answers, 0, getFirstQuestionOfLogicalStep(questions, 0)?.id);
    }
  }, [config.steps, answers, moveToStep, sendProgress, questions]);

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
    async (answersSoFar?: Record<string, string | string[]>) => {
      const a = answersSoFar ?? answers;
      setAnswers(a);
      setError(null);
      setSubmitting(true);
      try {
        const contactPayload = deriveContactFromAnswers(questions, a);
        const res = await fetch("/api/intake", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            buildPayload("submit", { answers: a, contact: contactPayload })
          ),
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
    [config.steps, answers, questions, buildPayload]
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
    [buildPayload, resolveCtaViewFromOption]
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

  return (
    <ThemeProvider theme={config.theme}>
      <div
        className="min-h-screen"
        style={{
          background:
            config.theme.background?.startsWith("http")
              ? `url(${config.theme.background}) center/cover`
              : config.theme.background ?? "#1a2e28",
          fontFamily: config.theme.fontFamily ?? "var(--font-sans)",
        }}
      >
        {step === "hero" && config.hero && (
          <Hero config={config.hero} onStart={handleStart} />
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
            onStepChange={(idx, answersSoFar) => {
              if (idx > questionIndex) {
                const firstQuestion = getFirstQuestionOfLogicalStep(questions, idx);
                sendProgress("questions", answersSoFar ?? answers, idx, firstQuestion?.id);
              }
              setQuestionIndex(idx);
            }}
            onComplete={handleQuestionsComplete}
            onBack={handleQuestionsBack}
            stepName="questions"
            textQuestionButtonLabel={config.textQuestionButtonLabel}
            config={config}
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
          />
        )}
      </div>
    </ThemeProvider>
  );
}
