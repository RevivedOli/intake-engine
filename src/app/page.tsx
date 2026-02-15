import { unstable_cache } from "next/cache";
import { headers } from "next/headers";
import { getTenantByDomain } from "@/lib/db";
import { Funnel } from "@/app/apps/[clientSlug]/Funnel";
import { NotConfigured } from "@/components/NotConfigured";

const CACHE_REVALIDATE_SECONDS = 60;

export default async function HomePage() {
  const requestStart = Date.now();
  console.log(`[Page] / handler entered at ${new Date().toISOString()}`);

  const headersList = await headers();
  const hostHeader =
    headersList.get("x-forwarded-host") ??
    headersList.get("host") ??
    "localhost";
  const host = hostHeader.includes(":") ? hostHeader.split(":")[0] : hostHeader;

  const neonStart = Date.now();
  const tenant = await unstable_cache(
    () => getTenantByDomain(host),
    ["tenant-by-domain", host],
    { revalidate: CACHE_REVALIDATE_SECONDS, tags: [`tenant-domain-${host}`] }
  )();
  const neonMs = Date.now() - neonStart;

  const totalMs = Date.now() - requestStart;
  const otherMs = totalMs - neonMs;
  console.log(
    `[GET /] host=${host} | Neon (getTenantByDomain)=${neonMs}ms | other(headers/render)=${otherMs}ms | total=${totalMs}ms`
  );

  if (!tenant) {
    return <NotConfigured />;
  }

  const hero = tenant.config && typeof tenant.config === "object" && "hero" in tenant.config
    ? (tenant.config as { hero?: { imageUrl?: string; logoUrl?: string } }).hero
    : undefined;
  const heroImageUrl = hero?.imageUrl?.trim();
  const logoUrl = hero?.logoUrl?.trim();

  return (
    <>
      {heroImageUrl && (
        <link rel="preload" as="image" href={heroImageUrl} />
      )}
      {logoUrl && (
        <link rel="preload" as="image" href={logoUrl} />
      )}
      <Funnel
        appId={tenant.id}
        config={tenant.config}
        questions={tenant.questions}
        tenantName={tenant.name}
      />
    </>
  );
}
