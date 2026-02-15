export type QuestionType = "single" | "multi" | "text" | "contact";

export type ContactKind = "email" | "tel" | "instagram" | "text";

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  /** Optional contextual image below question text (per-app flavour) */
  imageUrl?: string;
  /** Button label for text-type questions (e.g. "OK", "Next", "Submit"). Falls back to config default. */
  submitButtonLabel?: string;
  /** When type === "contact": kind of contact field */
  contactKind?: ContactKind;
  /** When type === "contact": label for the input (e.g. "Email address") */
  label?: string;
  /** When type === "contact": placeholder/hint (e.g. "you@example.com") */
  placeholder?: string;
  /** When type === "contact": whether the field is required (default true) */
  required?: boolean;
}
