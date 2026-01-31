import type { IntakeRequest } from "../types";

export function parseBody(body: unknown): IntakeRequest | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  if (typeof o.app_id !== "string" || !o.app_id) return null;
  if (o.event !== "progress" && o.event !== "submit") return null;
  if (typeof o.answers !== "object" || o.answers === null) return null;
  if (typeof o.contact !== "object" || o.contact === null) return null;
  const payload: IntakeRequest = {
    app_id: o.app_id,
    event: o.event as "progress" | "submit",
    timestamp: typeof o.timestamp === "string" ? o.timestamp : new Date().toISOString(),
    answers: o.answers as Record<string, string | string[]>,
    contact: o.contact as Record<string, string>,
    utm: (typeof o.utm === "object" && o.utm !== null ? o.utm : {}) as Record<string, string>,
  };
  if (typeof o.step !== "undefined") payload.step = o.step as string | number;
  if (typeof o.session_id === "string" && o.session_id) payload.session_id = o.session_id;
  if (typeof o.question_index === "number") payload.question_index = o.question_index;
  if (typeof o.question_id === "string") payload.question_id = o.question_id;
  return payload;
}

export function validateContact(
  contact: Record<string, string>,
  contactFields: { id: string; type: string; required?: boolean }[]
): { ok: true } | { ok: false; message: string } {
  for (const field of contactFields) {
    const value = contact[field.id] ?? "";
    const trimmed = String(value).trim();
    if (field.required && !trimmed) {
      return { ok: false, message: `Missing required field: ${field.id}` };
    }
    if (trimmed && field.type === "email") {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(trimmed)) {
        return { ok: false, message: "Invalid email address" };
      }
    }
  }
  return { ok: true };
}
