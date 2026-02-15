import type { ContactKind } from "@/types/question";

/** Canonical key for contact in the webhook payload. Same regardless of question order. */
const CONTACT_KIND_TO_KEY: Record<ContactKind, string> = {
  email: "email",
  tel: "phone",
  instagram: "instagram",
  text: "text",
};

export function contactKindToPayloadKey(kind: ContactKind): string {
  return CONTACT_KIND_TO_KEY[kind];
}

/** Known payload keys for contact (for typing/documentation). */
export const CONTACT_PAYLOAD_KEYS = ["email", "phone", "instagram", "text"] as const;
export type ContactPayloadKey = (typeof CONTACT_PAYLOAD_KEYS)[number];
