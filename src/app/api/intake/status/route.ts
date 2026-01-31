import { NextRequest, NextResponse } from "next/server";
import { getWebhookUrl, getN8nHeaders, normaliseResult } from "@/api/n8n";
import type { IntakeResponseEnvelope } from "@/types";

/** Optional: poll for async result. n8n must accept same webhook with job_id in body. */
export async function GET(request: NextRequest) {
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
    const res = await fetch(getWebhookUrl()!, {
      method: "POST",
      headers: getN8nHeaders(),
      body: JSON.stringify({ job_id: jobId }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`n8n returned ${res.status}`);
    const envelope = (await res.json()) as IntakeResponseEnvelope;

    const env = envelope as IntakeResponseEnvelope;
    if (env.status === "error") {
      return NextResponse.json(
        { error: "upstream_error", message: env.message ?? "n8n returned an error" },
        { status: 502 }
      );
    }

    const result = normaliseResult(env);
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
