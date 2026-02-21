import { NextRequest, NextResponse } from "next/server";
import { getTenantById } from "@/lib/db";
import { forwardToN8n, forwardToN8nWithUrl, getWebhookUrl } from "@/api/n8n";
import { contactKindToPayloadKey } from "@/lib/contact-payload";
import { isConsentRequired, getPrivacyPolicyLink } from "@/lib/privacy-policy";
import type { IntakeRequest, Question } from "@/types";

function parseBody(body: unknown): IntakeRequest | null {
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
  if (typeof o.step_question === "string" && o.step_question.trim())
    (payload as Record<string, unknown>).step_question = o.step_question.trim();
  return payload;
}

/** Parse consent_given from body. Returns true only when explicitly true; undefined/absent is treated as not given. */
function parseConsentGiven(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const o = body as Record<string, unknown>;
  return o.consent_given === true;
}

/** Optional: for CTA "webhook then message" option – tag and optional webhook URL override */
function parseCtaAction(body: unknown): { cta_tag: string; cta_webhook_url?: string } | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  if (typeof o.cta_tag !== "string" || !o.cta_tag.trim()) return null;
  return {
    cta_tag: o.cta_tag.trim(),
    cta_webhook_url: typeof o.cta_webhook_url === "string" && o.cta_webhook_url.trim() ? o.cta_webhook_url.trim() : undefined,
  };
}

function validateContact(
  contact: Record<string, string>,
  contactFields: { type: string; required?: boolean }[]
): { ok: true } | { ok: false; message: string } {
  for (const field of contactFields) {
    const key = contactKindToPayloadKey(field.type as "email" | "tel" | "instagram" | "text");
    const value = contact[key] ?? "";
    const trimmed = String(value).trim();
    if (trimmed === "hidden") continue; // sentinel when consent not given; no format validation
    if (field.required && !trimmed) {
      return { ok: false, message: `Missing required field: ${key}` };
    }
    if (trimmed && field.type === "email") {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(trimmed)) {
        return { ok: false, message: "Invalid email address" };
      }
    }
    if (trimmed && field.type === "instagram") {
      const handle = trimmed.replace(/^@/, "").trim();
      if (handle.length > 30 || !/^[a-zA-Z0-9._]+$/.test(handle)) {
        return { ok: false, message: "Invalid Instagram handle" };
      }
    }
    if (trimmed && field.type === "tel") {
      const digits = trimmed.replace(/\D/g, "");
      if (digits.length < 10) {
        return { ok: false, message: "Invalid phone number" };
      }
    }
  }
  return { ok: true };
}

export async function POST(request: NextRequest) {
  let payload: IntakeRequest | null = null;
  try {
    const body = await request.json();
    payload = parseBody(body);
    if (!payload) {
      const o = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
      console.error(
        "[intake] Parse failed app_id=",
        typeof o.app_id === "string" ? o.app_id : "?"
      );
      return NextResponse.json(
        { error: "validation_failed", message: "Invalid request body" },
        { status: 400 }
      );
    }

    console.log(
      `[intake] Received event=${payload.event} app_id=${payload.app_id}`
    );

    const tenant = await getTenantById(payload.app_id);
    if (!tenant) {
      console.error(`[intake] Tenant not found app_id=${payload.app_id}`);
      return NextResponse.json(
        { error: "validation_failed", message: "Unknown app_id" },
        { status: 400 }
      );
    }

    const hasConsentPlacement =
      isConsentRequired(tenant.config) &&
      !!getPrivacyPolicyLink(tenant.config) &&
      (tenant.questions ?? []).some((q: Question) => q.showConsentUnder);
    const consentGivenExplicitTrue = parseConsentGiven(body);
    const consentGiven =
      hasConsentPlacement ? consentGivenExplicitTrue : true;
    if (!consentGiven) {
      for (const k of Object.keys(payload.contact)) {
        payload.contact[k] = "hidden";
      }
    }
    (payload as Record<string, unknown>).consent_given = consentGiven;

    if (payload.event === "submit") {
      const contactFieldsFromQuestions = (tenant.questions ?? [])
        .filter((q: Question) => q.type === "contact")
        .map((q: Question) => ({
          type: q.contactKind ?? "email",
          required: q.required !== false,
        }));
      const validation = validateContact(
        payload.contact,
        contactFieldsFromQuestions
      );
      if (!validation.ok) {
        console.error(
          `[intake] Contact validation failed app_id=${payload.app_id} message=${validation.message}`
        );
        return NextResponse.json(
          { error: "validation_failed", message: validation.message },
          { status: 400 }
        );
      }
    }

    if (payload.event === "progress") {
      const webhookUrl = getWebhookUrl();
      if (!webhookUrl) {
        console.log(
          `[intake] Progress skipped (no webhook URL) app_id=${payload.app_id}`
        );
        return NextResponse.json({ ok: true });
      }
      await forwardToN8n(payload);
      console.log(`[intake] Progress forwarded app_id=${payload.app_id}`);
      return NextResponse.json({ ok: true });
    }

    // --- submit: fire-and-forget to n8n, always return useCtaConfig so client shows CTA from config ---
    const ctaAction = parseCtaAction(body);
    const webhookUrl = getWebhookUrl();
    const targetUrl = ctaAction?.cta_webhook_url || webhookUrl;

    if (ctaAction) {
      // User clicked a "webhook then message" CTA option: send to n8n with tag (optional override URL)
      if (targetUrl) {
        const tagPayload = { ...payload, cta_tag: ctaAction.cta_tag };
        console.log(
          `[intake] CTA webhook forwarded app_id=${payload.app_id} cta_tag=${ctaAction.cta_tag}`
        );
        forwardToN8nWithUrl(targetUrl, tagPayload).catch((err) => {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(
            `[intake] CTA webhook failed app_id=${payload.app_id} cta_tag=${ctaAction.cta_tag} error=${msg}`
          );
        });
      }
      return NextResponse.json({ ok: true });
    }

    // Initial form submit: fire-and-forget main webhook
    if (webhookUrl) {
      console.log(`[intake] Submit forwarded app_id=${payload.app_id}`);
      forwardToN8n(payload).catch((err) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(
          `[intake] Submit webhook failed app_id=${payload.app_id} error=${msg}`
        );
      });
    } else {
      console.log(
        `[intake] Submit skipped (no webhook URL) app_id=${payload.app_id}`
      );
    }
    return NextResponse.json({ ok: true, useCtaConfig: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request to n8n failed";
    const appId = payload?.app_id ?? "?";
    const event = payload?.event ?? "?";
    console.error(
      `[intake] Error app_id=${appId} event=${event} error=${message}`
    );
    const isTimeout = message.includes("timeout") || message.includes("aborted");
    return NextResponse.json(
      { error: "webhook_unavailable", message: isTimeout ? "Request timed out. Please try again." : "Request failed. Please try again." },
      { status: 502 }
    );
  }
}
