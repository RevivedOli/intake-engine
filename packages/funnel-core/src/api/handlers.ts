import { NextRequest, NextResponse } from "next/server";
import type { AppConfig } from "../types";
import type { IntakeResult, IntakeResponseEnvelope } from "../types";
import { parseBody, validateContact } from "./parse";
import { forwardToN8n, getWebhookUrl, getN8nHeaders, normaliseResult } from "./n8n";

export async function handleIntakePost(
  request: NextRequest,
  config: AppConfig,
  appId: string
): Promise<NextResponse> {
  try {
    const body = await request.json();
    const payload = parseBody(body);
    if (!payload) {
      return NextResponse.json(
        { error: "validation_failed", message: "Invalid request body" },
        { status: 400 }
      );
    }

    if (payload.app_id !== appId) {
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

export async function handleIntakeStatus(request: NextRequest): Promise<NextResponse> {
  const jobId = request.nextUrl.searchParams.get("job_id");
  if (!jobId) {
    return NextResponse.json(
      { error: "validation_failed", message: "Missing job_id" },
      { status: 400 }
    );
  }

  const url = getWebhookUrl();
  if (!url) {
    return NextResponse.json(
      { error: "webhook_unavailable", message: "Webhook not configured" },
      { status: 502 }
    );
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: getN8nHeaders(),
      body: JSON.stringify({ job_id: jobId }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`n8n returned ${res.status}`);
    const envelope = (await res.json()) as IntakeResponseEnvelope;

    if (envelope.status === "error") {
      return NextResponse.json(
        { error: "upstream_error", message: envelope.message ?? "n8n returned an error" },
        { status: 502 }
      );
    }

    const result = normaliseResult(envelope);
    if (!result || "job_id" in result) {
      return NextResponse.json({ status: "pending", job_id: jobId });
    }

    return NextResponse.json({ result });
  } catch (err) {
    return NextResponse.json(
      { error: "webhook_unavailable", message: "Request failed. Please try again." },
      { status: 502 }
    );
  }
}
