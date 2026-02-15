"use client";

import type { Question } from "@/types";
import { QuestionSingle } from "./QuestionSingle";
import { QuestionMulti } from "./QuestionMulti";
import { QuestionText } from "./QuestionText";
import { QuestionContact } from "./QuestionContact";
import { Progress } from "./Progress";

interface QuestionFlowProps {
  questions: Question[];
  answers: Record<string, string | string[]>;
  currentIndex: number;
  onAnswersChange: (answers: Record<string, string | string[]>) => void;
  onStepChange: (index: number, answersSoFar?: Record<string, string | string[]>) => void;
  onComplete: (answersSoFar?: Record<string, string | string[]>) => void;
  onBack: () => void;
  stepName: string;
  /** Button label for text-type and contact-type questions (default "OK" / "Next") */
  textQuestionButtonLabel?: string;
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
}: QuestionFlowProps) {
  if (questions.length === 0) return null;
  const question = questions[currentIndex];
  if (!question) return null;

  const setAnswer = (id: string, value: string | string[]) => {
    onAnswersChange({ ...answers, [id]: value });
  };

  const goNext = (answersWithCurrent?: Record<string, string | string[]>) => {
    const next = answersWithCurrent ?? answers;
    if (currentIndex < questions.length - 1) {
      onStepChange(currentIndex + 1, next);
    } else {
      onComplete(next);
    }
  };

  const goBack = () => {
    if (currentIndex > 0) {
      onStepChange(currentIndex - 1);
    } else {
      onBack();
    }
  };

  const progressLabel = `Question ${currentIndex + 1} of ${questions.length}`;

  return (
    <div className="min-h-screen flex flex-col p-6 sm:p-8">
      <div className="mb-6 max-w-xl mx-auto w-full">
        <Progress
          current={currentIndex + 1}
          total={questions.length}
          label={progressLabel}
        />
      </div>
      <div className="flex-1 flex flex-col justify-start pt-4 sm:justify-center sm:pt-0">
        {question.type === "single" && (
          <QuestionSingle
            key={question.id}
            question={question}
            answers={answers}
            value={(answers[question.id] as string) ?? null}
            onChange={(v) => setAnswer(question.id, v)}
            onNext={goNext}
            required
          />
        )}
        {question.type === "multi" && (
          <QuestionMulti
            key={question.id}
            question={question}
            answers={answers}
            value={((answers[question.id] as string[]) ?? []) as string[]}
            onChange={(v) => setAnswer(question.id, v)}
            onNext={goNext}
            required
          />
        )}
        {question.type === "text" && (
          <QuestionText
            key={question.id}
            question={question}
            answers={answers}
            value={(answers[question.id] as string) ?? ""}
            onChange={(v) => setAnswer(question.id, v)}
            onNext={goNext}
            required
            submitButtonLabel={question.submitButtonLabel ?? textQuestionButtonLabel}
          />
        )}
        {question.type === "contact" && (
          <QuestionContact
            key={question.id}
            question={question}
            answers={answers}
            value={(answers[question.id] as string) ?? ""}
            onChange={(v) => setAnswer(question.id, v)}
            onNext={goNext}
            required={question.required !== false}
            submitButtonLabel={question.submitButtonLabel ?? textQuestionButtonLabel ?? "Next"}
          />
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
