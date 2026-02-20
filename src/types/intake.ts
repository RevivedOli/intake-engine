export type IntakeEvent = "progress" | "submit";

export interface IntakeRequest {
  app_id: string;
  event: IntakeEvent;
  timestamp: string; // ISO 8601
  answers: Record<string, string | string[]>;
  contact: Record<string, string>;
  utm?: Record<string, string>;
  /** Per-session UUID set when user loads the page; n8n can use to track/update the same row */
  session_id?: string;
  /** For event "progress": step name (e.g. "hero" | "questions" | "contact") */
  step?: string | number;
  /** For event "progress" when step is "questions": 0-based index of the question they reached */
  question_index?: number;
  /** For event "progress" when step is "questions": id of that question */
  question_id?: string;
  /** Actual question text for the step reached (stable when questions are reordered) */
  step_question?: string;
  [key: string]: unknown; // per-app extras forwarded as-is
}

/** n8n response envelope */
export interface IntakeResponseEnvelope {
  status: "ok" | "error";
  message?: string;
  result?: IntakeResult;
}

/** Embed result: n8n returns a URL plus optional title, subtitle, text below, and button */
export interface EmbedResultWithUrl {
  mode: "embed";
  url: string;
  title?: string;
  subtitle?: string;
  textBelow?: string;
  button?: { label: string; url: string };
}

/** Legacy embed: raw HTML (still supported) */
export interface EmbedResultWithHtml {
  mode: "embed";
  html: string;
}

export type IntakeResult =
  | { mode: "thank_you"; message?: string }
  | { mode: "link"; label: string; url: string }
  | EmbedResultWithUrl
  | EmbedResultWithHtml
  | { job_id: string };
