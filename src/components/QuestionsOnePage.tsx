"use client";

import { useState, useRef, useCallback } from "react";
import type { Question } from "@/types/question";
import type { AppConfig } from "@/types/config";
import { QuestionSingle } from "./QuestionSingle";
import { QuestionMulti } from "./QuestionMulti";
import { QuestionText } from "./QuestionText";
import { QuestionContactBlock, validateContactBlock } from "./QuestionContactBlock";
import { getPrivacyPolicyLink, isConsentRequired, getContactConsentLabel } from "@/lib/privacy-policy";
import { computeLogicalSteps } from "@/lib/logical-steps";

type Section =
  | { kind: "question"; question: Question }
  | { kind: "contact"; questions: Question[] };

function buildSections(
  questions: Question[],
  contactPosition: "inline" | "bottom"
): Section[] {
  if (contactPosition === "bottom") {
    const nonContact = questions.filter((q) => q.type !== "contact");
    const contact = questions.filter((q) => q.type === "contact");
    const sections: Section[] = nonContact.map((q) => ({ kind: "question" as const, question: q }));
    if (contact.length > 0) {
      sections.push({ kind: "contact", questions: contact });
    }
    return sections;
  }
  const steps = computeLogicalSteps(questions);
  const sections: Section[] = [];
  for (const step of steps) {
    if (Array.isArray(step)) {
      sections.push({ kind: "contact", questions: step });
    } else {
      sections.push({ kind: "question", question: step });
    }
  }
  return sections;
}

function getFirstInvalidId(
  sections: Section[],
  errors: Record<string, string>
): string | null {
  for (const s of sections) {
    if (s.kind === "question") {
      if (errors[s.question.id]) return s.question.id;
    } else {
      for (const q of s.questions) {
        if (errors[q.id]) return q.id;
      }
    }
  }
  return null;
}

interface QuestionsOnePageProps {
  questions: Question[];
  answers: Record<string, string | string[]>;
  onAnswersChange: (answers: Record<string, string | string[]>) => void;
  onComplete: (answersSoFar?: Record<string, string | string[]>, opts?: { consentGiven?: boolean }) => void;
  config?: AppConfig;
  singlePageContactPosition: "inline" | "bottom";
  /** When true, use min-h-full to fill the container */
  fillContainer?: boolean;
  /** Optional id for the form section (e.g. for scroll target from hero) */
  formSectionId?: string;
}

export function QuestionsOnePage({
  questions,
  answers,
  onAnswersChange,
  onComplete,
  config,
  singlePageContactPosition,
  fillContainer,
  formSectionId,
}: QuestionsOnePageProps) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [consentChecked, setConsentChecked] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const sections = buildSections(questions, singlePageContactPosition);
  const contactQuestions = questions.filter((q) => q.type === "contact");
  const hasContact = contactQuestions.length > 0;
  const privacyPolicyLink = getPrivacyPolicyLink(config);
  const consentRequired = isConsentRequired(config) && hasContact && contactQuestions.some((q) => q.showConsentUnder);
  const consentLabel = getContactConsentLabel(config);

  const setAnswer = useCallback(
    (id: string, value: string | string[]) => {
      onAnswersChange({ ...answers, [id]: value });
    },
    [answers, onAnswersChange]
  );

  const noopNext = useCallback(
    (ans?: Record<string, string | string[]>) => {
      if (ans) onAnswersChange(ans);
    },
    [onAnswersChange]
  );

  const validate = useCallback((): { valid: boolean; newErrors: Record<string, string> } => {
    const newErrors: Record<string, string> = {};
    for (const s of sections) {
      if (s.kind === "question") {
        const q = s.question;
        const required = true;
        if (q.type === "single" || q.type === "multi") {
          const v = answers[q.id];
          const has = Array.isArray(v) ? v.length > 0 : v != null && String(v).trim() !== "";
          if (required && !has) {
            newErrors[q.id] = "This field is required.";
          }
        } else if (q.type === "text") {
          const v = (answers[q.id] as string) ?? "";
          if (required && !v.trim()) {
            newErrors[q.id] = "This field is required.";
          }
        }
      } else {
        const result = validateContactBlock(s.questions, answers, {
          consentRequired,
          consentChecked,
        });
        if (!result.valid) {
          for (const [id, msg] of Object.entries(result.errors)) {
            newErrors[id] = msg;
          }
          if (consentRequired && !consentChecked) {
            newErrors["_consent"] = "Please agree to continue.";
          }
        }
      }
    }
    return { valid: Object.keys(newErrors).length === 0, newErrors };
  }, [sections, answers, consentRequired, consentChecked]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched: Record<string, boolean> = {};
    questions.forEach((q) => {
      allTouched[q.id] = true;
    });
    setTouched((prev) => ({ ...prev, ...allTouched }));

    const { valid, newErrors } = validate();
    setErrors(newErrors);

    if (!valid) {
      const firstId = getFirstInvalidId(sections, newErrors);
      if (firstId && firstId !== "_consent") {
        const el = document.getElementById(`section-${firstId}`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    onComplete(answers, consentRequired ? { consentGiven: consentChecked } : undefined);
  };

  const minHeightClass = fillContainer ? "min-h-full" : "min-h-screen";

  if (questions.length === 0) return null;

  return (
    <div
      id={formSectionId}
      className={`${minHeightClass} flex flex-col p-6 sm:p-8`}
    >
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="flex-1 flex flex-col max-w-xl mx-auto w-full space-y-10 sm:space-y-12"
      >
        {sections.map((section) => {
          if (section.kind === "question") {
            const q = section.question;
            const sectionId = q.id;
            return (
              <section
                key={sectionId}
                id={`section-${sectionId}`}
                className="scroll-mt-6"
                aria-labelledby={`section-label-${sectionId}`}
              >
                {q.type === "single" && (
                  <QuestionSingle
                    question={q}
                    answers={answers}
                    value={(answers[q.id] as string) ?? null}
                    onChange={(v) => setAnswer(q.id, v)}
                    onNext={noopNext}
                    required
                  />
                )}
                {q.type === "multi" && (
                  <QuestionMulti
                    question={q}
                    answers={answers}
                    value={((answers[q.id] as string[]) ?? []) as string[]}
                    onChange={(v) => setAnswer(q.id, v)}
                    onNext={noopNext}
                    required
                    singlePageMode
                  />
                )}
                {q.type === "text" && (
                  <QuestionText
                    question={q}
                    answers={answers}
                    value={(answers[q.id] as string) ?? ""}
                    onChange={(v) => setAnswer(q.id, v)}
                    onNext={noopNext}
                    required
                    submitButtonLabel={q.submitButtonLabel ?? config?.textQuestionButtonLabel}
                    singlePageMode
                  />
                )}
              </section>
            );
          }

          const contactBlockId = section.questions.map((x) => x.id).join("-");
          return (
            <section
              key={contactBlockId}
              id={`section-${contactBlockId}`}
              className="scroll-mt-6"
            >
              <QuestionContactBlock
                questions={section.questions}
                answers={answers}
                onAnswersChange={onAnswersChange}
                onNext={() => {}}
                privacyPolicyLink={privacyPolicyLink}
                consentRequired={consentRequired}
                consentLabel={consentLabel}
                consentChecked={consentChecked}
                onConsentChange={setConsentChecked}
                fieldsOnly
                externalErrors={section.questions.some((q) => errors[q.id]) ? Object.fromEntries(section.questions.filter((q) => errors[q.id]).map((q) => [q.id, errors[q.id]!])) : undefined}
              />
            </section>
          );
        })}

        <div className="pt-4 flex justify-center">
          <button
            type="submit"
            className="px-8 py-3 rounded-full font-medium text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent transition-opacity"
            style={{
              backgroundColor: (typeof config?.theme?.primaryColor === "string" && config.theme.primaryColor) || "#4a6b5a",
            }}
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
}
