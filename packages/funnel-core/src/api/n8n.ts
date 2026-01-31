import type { IntakeRequest, IntakeResponseEnvelope, IntakeResult } from "../types";

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
const N8N_WEBHOOK_API_KEY = process.env.N8N_WEBHOOK_API_KEY;

export function getWebhookUrl(): string | undefined {
  return N8N_WEBHOOK_URL;
}

/** Headers sent with every webhook request (includes API key when set in env). */
export function getN8nHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (N8N_WEBHOOK_API_KEY) {
    headers["X-API-Key"] = N8N_WEBHOOK_API_KEY;
  }
  return headers;
}

export async function forwardToN8n(payload: IntakeRequest): Promise<IntakeResponseEnvelope> {
  const url = getWebhookUrl();
  if (!url) {
    throw new Error("N8N_WEBHOOK_URL is not set");
  }

  const res = await fetch(url, {
    method: "POST",
    headers: getN8nHeaders(),
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    throw new Error(`n8n returned ${res.status}`);
  }

  const data = (await res.json()) as IntakeResponseEnvelope;
  return data;
}

/** Normalise n8n response to client result (thank_you | link | embed | job_id). */
export function normaliseResult(envelope: IntakeResponseEnvelope): IntakeResult | null {
  if (envelope.status === "error") return null;
  if (!envelope.result) return null;
  const r = envelope.result as IntakeResult;
  if ("job_id" in r) return r;
  if ("mode" in r && (r.mode === "thank_you" || r.mode === "link" || r.mode === "embed")) return r;
  return null;
}
