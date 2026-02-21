"use client";

import { useEffect } from "react";
import type { Question } from "@/types";
import type { AppConfig } from "@/types/config";
import { QuestionSingle } from "./QuestionSingle";
import { QuestionMulti } from "./QuestionMulti";
import { QuestionText } from "./QuestionText";
import { QuestionContact } from "./QuestionContact";
import { QuestionContactBlock } from "./QuestionContactBlock";
import { Progress } from "./Progress";
import { computeLogicalSteps, type LogicalStep } from "@/lib/logical-steps";
import { getPrivacyPolicyLink, isConsentRequired, getContactConsentLabel } from "@/lib/privacy-policy";

interface QuestionFlowProps {
  questions: Question[];
  answers: Record<string, string | string[]>;
  currentIndex: number;
  onAnswersChange: (answers: Record<string, string | string[]>) => void;
  onStepChange: (index: number, answersSoFar?: Record<string, string | string[]>, opts?: { consentGiven?: boolean }) => void;
  onComplete: (answersSoFar?: Record<string, string | string[]>, opts?: { consentGiven?: boolean }) => void;
  onBack: () => void;
  stepName: string;
  /** Button label for text-type and contact-type questions (default "OK" / "Next") */
  textQuestionButtonLabel?: string;
  /** App config (for privacy policy link, consent) */
  config?: AppConfig;
  /** When true, use min-h-full to fill the container (e.g. when announcement banner reduces viewport) */
  fillContainer?: boolean;
}

export function QuestionFlow({
  questions,
  answers,
  currentIndex,
  onAnswersChange,
  onStepChange,
  onComplete,
  onBack,
  stepName,
  textQuestionButtonLabel,
  config,
  fillContainer,
}: QuestionFlowProps) {
  if (questions.length === 0) return null;

  const logicalSteps = computeLogicalSteps(questions);
  const currentStep = logicalSteps[currentIndex] as LogicalStep | undefined;
  if (!currentStep) return null;

  const setAnswer = (id: string, value: string | string[]) => {
    onAnswersChange({ ...answers, [id]: value });
  };

  const goNext = (
    answersWithCurrent?: Record<string, string | string[]>,
    opts?: { consentGiven?: boolean }
  ) => {
    const next = answersWithCurrent ?? answers;
    if (currentIndex < logicalSteps.length - 1) {
      onStepChange(currentIndex + 1, next, opts);
    } else {
      onComplete(next, opts);
    }
  };

  const goBack = () => {
    if (currentIndex > 0) {
      onStepChange(currentIndex - 1);
    } else {
      onBack();
    }
  };

  const isContactBlock = Array.isArray(currentStep);
  const isLastStep = currentIndex === logicalSteps.length - 1;
  const cta = config?.cta;
  const freebiePreview =
    isContactBlock &&
    isLastStep &&
    cta?.type === "multi_choice" &&
    cta.showPreviewOnContactStep &&
    (cta.options?.length ?? 0) > 0
      ? {
          prompt:
            cta.freebiePreviewPrompt?.trim() ||
            cta.prompt?.trim() ||
            "Choose your freebie after submitting",
          options: (cta.options ?? []).map((o) => ({ id: o.id, label: o.label })),
        }
      : undefined;

  const nextStep = logicalSteps[currentIndex + 1];
  const nextFirstQuestion = Array.isArray(nextStep) ? nextStep[0] : nextStep;
  const nextImageUrl = nextFirstQuestion?.imageUrl?.trim();

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!nextImageUrl) {
      document.querySelector<HTMLLinkElement>('link[rel="preload"][data-intake-next-question-image]')?.remove();
      return;
    }
    let link = document.querySelector<HTMLLinkElement>('link[rel="preload"][data-intake-next-question-image]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.setAttribute("data-intake-next-question-image", "true");
      document.head.appendChild(link);
    }
    link.href = nextImageUrl;
    return () => link.remove();
  }, [nextImageUrl]);

  const progressLabel = `Question ${currentIndex + 1} of ${logicalSteps.length}`;

  const minHeightClass = fillContainer ? "min-h-full" : "min-h-screen";
  return (
    <div className={`${minHeightClass} flex flex-col p-6 sm:p-8`}>
      <div className="mb-6 max-w-xl mx-auto w-full">
        <Progress
          current={currentIndex + 1}
          total={logicalSteps.length}
          label={progressLabel}
        />
      </div>
      <div className="flex-1 flex flex-col justify-start pt-4 sm:justify-center sm:pt-0">
        {isContactBlock ? (
          <QuestionContactBlock
            key={currentStep.map((q) => q.id).join("-")}
            questions={currentStep}
            answers={answers}
            onAnswersChange={onAnswersChange}
            onNext={goNext}
            submitButtonLabel={currentStep[0]?.submitButtonLabel ?? textQuestionButtonLabel ?? "Next"}
            privacyPolicyLink={getPrivacyPolicyLink(config)}
            consentRequired={isConsentRequired(config)}
            consentLabel={getContactConsentLabel(config)}
            freebiePreview={freebiePreview}
          />
        ) : (
          <>
            {currentStep.type === "single" && (
              <QuestionSingle
                key={currentStep.id}
                question={currentStep}
                answers={answers}
                value={(answers[currentStep.id] as string) ?? null}
                onChange={(v) => setAnswer(currentStep.id, v)}
                onNext={goNext}
                required
              />
            )}
            {currentStep.type === "multi" && (
              <QuestionMulti
                key={currentStep.id}
                question={currentStep}
                answers={answers}
                value={((answers[currentStep.id] as string[]) ?? []) as string[]}
                onChange={(v) => setAnswer(currentStep.id, v)}
                onNext={goNext}
                required
              />
            )}
            {currentStep.type === "text" && (
              <QuestionText
                key={currentStep.id}
                question={currentStep}
                answers={answers}
                value={(answers[currentStep.id] as string) ?? ""}
                onChange={(v) => setAnswer(currentStep.id, v)}
                onNext={goNext}
                required
                submitButtonLabel={currentStep.submitButtonLabel ?? textQuestionButtonLabel}
              />
            )}
            {currentStep.type === "contact" && (
              <QuestionContact
                key={currentStep.id}
                question={currentStep}
                answers={answers}
                value={(answers[currentStep.id] as string) ?? ""}
                onChange={(v) => setAnswer(currentStep.id, v)}
                onNext={goNext}
                required={currentStep.required !== false}
                submitButtonLabel={currentStep.submitButtonLabel ?? textQuestionButtonLabel ?? "Next"
                }
              />
            )}
          </>
        )}
      </div>
      <div className="mt-8 max-w-xl mx-auto w-full flex justify-between items-center">
        <button
          type="button"
          onClick={goBack}
          className="text-white/60 hover:text-white/90 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 rounded px-2 py-1"
          aria-label="Back"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
