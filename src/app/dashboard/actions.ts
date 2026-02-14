"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import {
  createTenant,
  updateTenant,
  getDomainsByTenantId,
  type CreateTenantInput,
  type UpdateTenantInput,
} from "@/lib/db";
import type { AppConfig } from "@/types/config";
import type { Question } from "@/types/question";

async function requireAuth() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect("/login");
  }
}

export type CreateTenantState = {
  error: string | null;
  success?: boolean;
  id?: string;
};

/** On success returns { error: null, success: true, id }. On failure returns { error }. */
export async function createTenantAction(
  formData: FormData
): Promise<CreateTenantState> {
  try {
    await requireAuth();
    const name = formData.get("name") as string;
    const domain = (formData.get("domain") as string)?.trim().toLowerCase();
    if (!name?.trim() || !domain) {
      return { error: "Name and domain are required" };
    }
    const configRaw = formData.get("config") as string;
    const questionsRaw = formData.get("questions") as string;
    let config: AppConfig;
    let questions: Question[];
    try {
      config = JSON.parse(configRaw || "{}") as AppConfig;
      questions = JSON.parse(questionsRaw || "[]") as Question[];
    } catch {
      return { error: "Invalid config or questions JSON" };
    }
    if (!config.theme) {
      config.theme = { primaryColor: "#4a6b5a", background: "#0d1f18", fontFamily: "var(--font-sans)", layout: "centered" };
    }
    if (!config.steps?.length) config.steps = ["hero", "questions", "contact", "result"];
    if (!config.contactFields?.length) config.contactFields = [{ id: "email", type: "email", label: "Email", required: true }];
    const id = await createTenant({ name: name.trim(), domain, config, questions });
    if (!id) return { error: "Failed to create tenant" };
    return { error: null, success: true, id };
  } catch (err) {
    const d = err && typeof err === "object" && "digest" in err ? (err as { digest?: string }).digest : undefined;
    if (typeof d === "string" && d.startsWith("NEXT_REDIRECT")) throw err;
    const message = err instanceof Error ? err.message : "Failed to create tenant";
    return { error: message };
  }
}

export type UpdateTenantState = {
  error: string | null;
  success?: boolean;
};

export async function updateTenantAction(
  _prev: UpdateTenantState,
  formData: FormData
): Promise<UpdateTenantState> {
  try {
    await requireAuth();
    const tenantId = formData.get("tenantId") as string;
    if (!tenantId) return { error: "Missing tenant id" };
    const name = formData.get("name") as string | null;
    const configRaw = formData.get("config") as string;
    const questionsRaw = formData.get("questions") as string;
    let config: AppConfig | undefined;
    let questions: Question[] | undefined;
    try {
      if (configRaw) config = JSON.parse(configRaw) as AppConfig;
      if (questionsRaw) questions = JSON.parse(questionsRaw) as Question[];
    } catch {
      return { error: "Invalid config or questions JSON" };
    }
    const input: UpdateTenantInput = {};
    if (name !== null && name !== undefined) input.name = name.trim();
    if (config) input.config = config;
    if (questions) input.questions = questions;
    await updateTenant(tenantId, input);
    const domains = await getDomainsByTenantId(tenantId);
    for (const d of domains) {
      revalidateTag(`tenant-domain-${d}`);
    }
    return { error: null, success: true };
  } catch (err) {
    const d = err && typeof err === "object" && "digest" in err ? (err as { digest?: string }).digest : undefined;
    if (typeof d === "string" && d.startsWith("NEXT_REDIRECT")) throw err;
    const message = err instanceof Error ? err.message : "Failed to save";
    return { error: message };
  }
}
