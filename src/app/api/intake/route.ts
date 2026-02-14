import { NextRequest, NextResponse } from "next/server";
import { getTenantById } from "@/lib/db";
import { forwardToN8n, getWebhookUrl, normaliseResult } from "@/api/n8n";
import type { IntakeRequest, IntakeResult } from "@/types";

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
  return payload;
}

function validateContact(
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = parseBody(body);
    if (!payload) {
      return NextResponse.json(
        { error: "validation_failed", message: "Invalid request body" },
        { status: 400 }
      );
    }

    const tenant = await getTenantById(payload.app_id);
    if (!tenant) {
      return NextResponse.json(
        { error: "validation_failed", message: "Unknown app_id" },
        { status: 400 }
      );
    }

    if (payload.event === "submit") {
      const validation = validateContact(
        payload.contact,
        tenant.config.contactFields
      );
      if (!validation.ok) {
        return NextResponse.json(
          { error: "validation_failed", message: validation.message },
          { status: 400 }
        );
      }
    }

    const webhookUrl = getWebhookUrl();
    if (!webhookUrl) {
      // Stub: when no webhook is configured, return success so the funnel can be tested locally
      if (payload.event === "progress") {
        return NextResponse.json({ ok: true });
      }
      return NextResponse.json({
        result: { mode: "thank_you" as const, message: "Thanks. (No webhook configured – add N8N_WEBHOOK_URL to test n8n.)" },
      });
    }

    const envelope = await forwardToN8n(payload);

    if (payload.event === "progress") {
      return NextResponse.json({ ok: true });
    }

    if (envelope.status === "error") {
      return NextResponse.json(
        { error: "upstream_error", message: envelope.message ?? "n8n returned an error" },
        { status: 502 }
      );
    }

    const result = normaliseResult(envelope);
    if (!result) {
      return NextResponse.json(
        { error: "upstream_error", message: "Invalid response from n8n" },
        { status: 502 }
      );
    }

    const response: { result: IntakeResult } = { result };
    if ("message" in envelope && envelope.message) {
      (response as Record<string, unknown>).message = envelope.message;
    }
    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request to n8n failed";
    const isTimeout = message.includes("timeout") || message.includes("aborted");
    return NextResponse.json(
      { error: "webhook_unavailable", message: isTimeout ? "Request timed out. Please try again." : "Request failed. Please try again." },
      { status: 502 }
    );
  }
}
