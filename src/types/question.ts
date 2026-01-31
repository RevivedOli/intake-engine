export type QuestionType = "single" | "multi" | "text";

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  /** Optional contextual image below question text (per-app flavour) */
  imageUrl?: string;
}
