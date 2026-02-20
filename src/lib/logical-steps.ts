import type { Question } from "@/types/question";

export type LogicalStep = Question | Question[];

/**
 * Groups consecutive contact questions into a single step.
 * Non-contact questions remain one per step.
 * Example: [q1, q2_contact, q3_contact, q4] → [[q1], [q2, q3], [q4]]
 */
export function computeLogicalSteps(questions: Question[]): LogicalStep[] {
  const steps: LogicalStep[] = [];
  let i = 0;

  while (i < questions.length) {
    const q = questions[i];
    if (q.type === "contact") {
      const block: Question[] = [];
      while (i < questions.length && questions[i].type === "contact") {
        block.push(questions[i]);
        i++;
      }
      steps.push(block);
    } else {
      steps.push(q);
      i++;
    }
  }

  return steps;
}

/**
 * Returns the first question of a logical step (for progress reporting).
 */
export function getFirstQuestionOfLogicalStep(
  questions: Question[],
  logicalStepIndex: number
): Question | undefined {
  const steps = computeLogicalSteps(questions);
  const step = steps[logicalStepIndex];
  if (!step) return undefined;
  return Array.isArray(step) ? step[0] : step;
}
