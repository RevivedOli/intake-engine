"use client";

import { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Hero } from "@/components/Hero";
import { QuestionFlow } from "@/components/QuestionFlow";
import { ContactCapture } from "@/components/ContactCapture";
import { ResultScreen } from "@/components/ResultScreen";
import type { AppConfig, FlowStep, IntakeResult } from "@/types";

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
}

const SESSION_KEY_PREFIX = "intake_session_";

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

export function Funnel({ appId, config, questions }: FunnelProps) {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<FlowStep | "result">(
    config.steps[0] ?? "hero"
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [contact, setContact] = useState<Record<string, string>>({});
  const [result, setResult] = useState<IntakeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      answers: overrides.answers ?? answers,
      contact: overrides.contact ?? contact,
      utm,
    }),
    [appId, answers, contact, utm]
  );

  const sendProgress = useCallback(
    async (
      stepName: string,
      answersSoFar: Record<string, string | string[]>,
      contactSoFar: Record<string, string>,
      questionIndex?: number,
      questionId?: string
    ) => {
      try {
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
    [buildPayload]
  );

  const moveToStep = useCallback(
    (nextStep: FlowStep, nextIndex: number, answersSoFar: Record<string, string | string[]>, contactSoFar: Record<string, string>) => {
      const prevStep = config.steps[stepIndex];
      if (prevStep) sendProgress(prevStep, answersSoFar, contactSoFar);
      setStep(nextStep);
      setStepIndex(nextIndex);
    },
    [config.steps, stepIndex, sendProgress]
  );

  const handleStart = useCallback(() => {
    const idx = config.steps.indexOf("questions");
    if (idx >= 0) {
      setQuestionIndex(0);
      moveToStep("questions", idx, answers, contact);
      // Report they reached first question (last step = question 0)
      sendProgress("questions", answers, contact, 0, questions[0]?.id);
    } else {
      const contactIdx = config.steps.indexOf("contact");
      if (contactIdx >= 0) moveToStep("contact", contactIdx, answers, contact);
    }
  }, [config.steps, answers, contact, moveToStep, sendProgress, questions]);

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
    (answersSoFar?: Record<string, string | string[]>) => {
      const a = answersSoFar ?? answers;
      const contactIdx = config.steps.indexOf("contact");
      if (contactIdx >= 0) {
        moveToStep("contact", contactIdx, a, contact);
      }
    },
    [config.steps, answers, contact, moveToStep]
  );

  const handleContactSubmit = useCallback(async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload("submit")),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Something went wrong. Please try again.");
        return;
      }
      const r = data.result;
      if (r && "job_id" in r) {
        setResult(r);
        setStep("result");
        const jobId = r.job_id;
        const poll = async () => {
          const statusRes = await fetch(`/api/intake/status?job_id=${encodeURIComponent(jobId)}`);
          const statusData = await statusRes.json();
          if (statusData.result) {
            setResult(statusData.result);
            return;
          }
          setTimeout(poll, 2000);
        };
        setTimeout(poll, 2000);
      } else if (r) {
        setResult(r);
        setStep("result");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [buildPayload]);

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
          <QuestionFlow
            questions={questions}
            answers={answers}
            currentIndex={questionIndex}
            onAnswersChange={setAnswers}
            onStepChange={(idx, answersSoFar) => {
              // Only report progress when moving forward (not on Back) for drop-off analytics
              if (idx > questionIndex) {
                sendProgress("questions", answersSoFar ?? answers, contact, idx, questions[idx]?.id);
              }
              setQuestionIndex(idx);
            }}
            onComplete={handleQuestionsComplete}
            onBack={handleQuestionsBack}
            stepName="questions"
            textQuestionButtonLabel={config.textQuestionButtonLabel}
          />
        )}

        {step === "contact" && (
          <>
            {error && (
              <p className="text-center text-amber-400 text-sm mt-4 px-6">
                {error}
              </p>
            )}
            <ContactCapture
              fields={config.contactFields}
              contact={contact}
              onContactChange={setContact}
              onSubmit={handleContactSubmit}
              imageUrl={config.contactImageUrl}
              introText={config.contactIntro}
              submitLabel={submitting ? "Submitting…" : "Submit"}
              submitting={submitting}
            />
          </>
        )}

        {(step === "result" || (step === "contact" && result)) && result && (
          <ResultScreen
            result={result}
            defaultThankYouMessage={config.defaultThankYouMessage}
          />
        )}
      </div>
    </ThemeProvider>
  );
}
