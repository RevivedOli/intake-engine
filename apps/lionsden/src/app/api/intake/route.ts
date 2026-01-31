import { NextRequest, NextResponse } from "next/server";
import { parseBody, validateContact, forwardToN8n, getWebhookUrl, normaliseResult } from "funnel-core";
import type { IntakeResult } from "funnel-core";
import config from "../../../config";

const APP_ID = "lionsden";

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

    if (payload.app_id !== APP_ID) {
      return NextResponse.json(
        { error: "validation_failed", message: "Unknown app_id" },
        { status: 400 }
      );
    }

    if (payload.event === "submit") {
      const validation = validateContact(payload.contact, config.contactFields);
      if (!validation.ok) {
        return NextResponse.json(
          { error: "validation_failed", message: validation.message },
          { status: 400 }
        );
      }
    }

    const webhookUrl = getWebhookUrl();
    if (!webhookUrl) {
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
