import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import { getTenantByDomain } from "@/lib/db";
import { NotConfigured } from "@/components/NotConfigured";
import { PrivacyPolicyContent } from "./PrivacyPolicyContent";

const CACHE_REVALIDATE_SECONDS = 60;

export default async function PrivacyPolicyPage() {
  const headersList = await headers();
  const hostHeader =
    headersList.get("x-forwarded-host") ??
    headersList.get("host") ??
    "localhost";
  const host = hostHeader.includes(":") ? hostHeader.split(":")[0] : hostHeader;

  const tenant = await unstable_cache(
    () => getTenantByDomain(host),
    ["tenant-by-domain", host],
    { revalidate: CACHE_REVALIDATE_SECONDS, tags: [`tenant-domain-${host}`] }
  )();

  if (!tenant) {
    return <NotConfigured />;
  }

  const config = tenant.config;
  const privacyPolicy = config?.privacyPolicy;

  if (!privacyPolicy || typeof privacyPolicy !== "object") {
    notFound();
  }
  const raw = privacyPolicy as Record<string, unknown>;
  const mode = raw.mode === "external" ? "external" : "internal";
  const content = typeof raw.content === "string" ? raw.content.trim() : "";
  if (mode === "external" || !content) {
    notFound();
  }

  const theme = config?.theme ?? {};
  const siteTitle = config?.siteTitle ?? tenant.name ?? "Privacy Policy";

  return (
    <PrivacyPolicyContent
      content={content}
      theme={theme}
      siteTitle={siteTitle}
    />
  );
}
