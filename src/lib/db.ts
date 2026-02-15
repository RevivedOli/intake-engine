import { neon } from "@neondatabase/serverless";
import type { AppConfig } from "@/types/config";
import type { Question } from "@/types/question";

const connectionString = process.env.DATABASE_URL ?? process.env.NEON_DATABASE_URL;
const sql = connectionString ? neon(connectionString) : null;

export interface TenantRow {
  id: string;
  name: string | null;
  config: AppConfig;
  questions: Question[];
}

export interface TenantByDomain {
  id: string;
  name: string | null;
  config: AppConfig;
  questions: Question[];
}

function logNeonQuery(queryLabel: string, domainOrId: string, startMs: number) {
  const durationMs = Date.now() - startMs;
  const ts = new Date().toISOString();
  console.log(`[Neon] ${ts} | ${queryLabel}(${domainOrId}) | ${durationMs}ms`);
}

/**
 * Resolve tenant by request host (e.g. lionsden.example.com).
 * Returns tenant id, config, and questions or null if not found.
 */
export async function getTenantByDomain(domain: string): Promise<TenantByDomain | null> {
  if (!sql) return null;
  const neonStart = Date.now();
  const rows = await sql`
    SELECT t.id, t.name, t.config, t.questions
    FROM tenants t
    INNER JOIN domains d ON d.tenant_id = t.id
    WHERE d.domain = ${domain}
    LIMIT 1
  `;
  logNeonQuery("getTenantByDomain", domain, neonStart);
  const row = rows[0];
  if (!row || row.id == null) return null;
  return {
    id: String(row.id),
    name: row.name != null ? String(row.name) : null,
    config: row.config as AppConfig,
    questions: Array.isArray(row.questions) ? (row.questions as Question[]) : [],
  };
}

/**
 * Load tenant by id (used by API when app_id = tenant id).
 */
export async function getTenantById(id: string): Promise<TenantRow | null> {
  if (!sql) return null;
  const neonStart = Date.now();
  const rows = await sql`
    SELECT id, name, config, questions
    FROM tenants
    WHERE id = ${id}
    LIMIT 1
  `;
  logNeonQuery("getTenantById", id, neonStart);
  const row = rows[0];
  if (!row || row.id == null) return null;
  return {
    id: String(row.id),
    name: row.name != null ? String(row.name) : null,
    config: row.config as AppConfig,
    questions: Array.isArray(row.questions) ? (row.questions as Question[]) : [],
  };
}

export interface TenantListItem {
  id: string;
  name: string | null;
  domain: string | null;
}

/**
 * List all tenants with their first domain (for dashboard list).
 */
export async function listTenants(): Promise<TenantListItem[]> {
  if (!sql) return [];
  const neonStart = Date.now();
  const rows = await sql`
    SELECT DISTINCT ON (t.id) t.id, t.name, d.domain
    FROM tenants t
    LEFT JOIN domains d ON d.tenant_id = t.id
    ORDER BY t.id, d.is_primary DESC NULLS LAST, d.created_at ASC
  `;
  logNeonQuery("listTenants", "*", neonStart);
  return (rows as { id: string; name: string | null; domain: string | null }[]).map(
    (r) => ({
      id: String(r.id),
      name: r.name != null ? String(r.name) : null,
      domain: r.domain != null ? String(r.domain) : null,
    })
  );
}

export interface CreateTenantInput {
  name: string;
  domain: string;
  config: AppConfig;
  questions: Question[];
}

/**
 * Create a new tenant and its first domain.
 */
export async function createTenant(
  input: CreateTenantInput
): Promise<string | null> {
  if (!sql) return null;
  const configJson = JSON.stringify(input.config);
  const questionsJson = JSON.stringify(input.questions);
  const rows = await sql`
    INSERT INTO tenants (name, config, questions)
    VALUES (${input.name}, ${configJson}::jsonb, ${questionsJson}::jsonb)
    RETURNING id
  `;
  const row = rows[0];
  if (!row || (row as { id?: string }).id == null) return null;
  const tenantId = String((row as { id: string }).id);
  await sql`
    INSERT INTO domains (tenant_id, domain, is_primary)
    VALUES (${tenantId}, ${input.domain}, true)
  `;
  return tenantId;
}

export interface UpdateTenantInput {
  name?: string;
  config?: AppConfig;
  questions?: Question[];
}

/**
 * Update an existing tenant.
 */
export async function updateTenant(
  id: string,
  input: UpdateTenantInput
): Promise<boolean> {
  if (!sql) return false;
  if (input.name !== undefined) {
    await sql`UPDATE tenants SET name = ${input.name}, updated_at = now() WHERE id = ${id}`;
  }
  if (input.config !== undefined) {
    const configJson = JSON.stringify(input.config);
    await sql`UPDATE tenants SET config = ${configJson}::jsonb, updated_at = now() WHERE id = ${id}`;
  }
  if (input.questions !== undefined) {
    const questionsJson = JSON.stringify(input.questions);
    await sql`UPDATE tenants SET questions = ${questionsJson}::jsonb, updated_at = now() WHERE id = ${id}`;
  }
  return true;
}

/**
 * Get all domain strings for a tenant (e.g. for cache invalidation).
 */
export async function getDomainsByTenantId(tenantId: string): Promise<string[]> {
  if (!sql) return [];
  const rows = await sql`
    SELECT domain FROM domains WHERE tenant_id = ${tenantId}
  `;
  return (rows as { domain: string }[]).map((r) => String(r.domain));
}

export interface DomainRow {
  domain: string;
  is_primary: boolean;
}

/**
 * Get all domains for a tenant with primary flag (for edit UI).
 */
export async function getDomainRowsByTenantId(tenantId: string): Promise<DomainRow[]> {
  if (!sql) return [];
  const rows = await sql`
    SELECT domain, is_primary FROM domains WHERE tenant_id = ${tenantId}
    ORDER BY is_primary DESC, domain ASC
  `;
  return (rows as { domain: string; is_primary: boolean }[]).map((r) => ({
    domain: String(r.domain),
    is_primary: Boolean(r.is_primary),
  }));
}

/**
 * Add a domain for a tenant. Domain is normalized (trim, lowercase).
 * First domain for tenant gets is_primary = true. Returns error if domain already in use.
 */
export async function addDomain(
  tenantId: string,
  domain: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!sql) return { ok: false, error: "Database not configured" };
  const normalized = domain.trim().toLowerCase();
  if (!normalized) return { ok: false, error: "Domain is required" };
  const existing = await sql`
    SELECT 1 FROM domains WHERE domain = ${normalized} LIMIT 1
  `;
  if (existing.length > 0) return { ok: false, error: "Domain already in use" };
  const current = await sql`
    SELECT 1 FROM domains WHERE tenant_id = ${tenantId} LIMIT 1
  `;
  const isPrimary = current.length === 0;
  try {
    await sql`
      INSERT INTO domains (tenant_id, domain, is_primary)
      VALUES (${tenantId}, ${normalized}, ${isPrimary})
    `;
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to add domain";
    return { ok: false, error: msg };
  }
}

/**
 * Remove a domain for a tenant. If the removed domain was primary and others exist,
 * sets the first remaining (by domain name) to primary.
 */
export async function removeDomain(
  tenantId: string,
  domain: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!sql) return { ok: false, error: "Database not configured" };
  const normalized = domain.trim().toLowerCase();
  const row = await sql`
    SELECT is_primary FROM domains WHERE tenant_id = ${tenantId} AND domain = ${normalized} LIMIT 1
  `;
  if (row.length === 0) return { ok: true };
  const wasPrimary = Boolean((row[0] as { is_primary: boolean }).is_primary);
  await sql`
    DELETE FROM domains WHERE tenant_id = ${tenantId} AND domain = ${normalized}
  `;
  if (wasPrimary) {
    const remaining = await sql`
      SELECT domain FROM domains WHERE tenant_id = ${tenantId} ORDER BY domain ASC LIMIT 1
    `;
    if (remaining.length > 0) {
      const newPrimary = String((remaining[0] as { domain: string }).domain);
      await sql`
        UPDATE domains SET is_primary = true WHERE tenant_id = ${tenantId} AND domain = ${newPrimary}
      `;
    }
  }
  return { ok: true };
}

/**
 * Set the given domain as the primary for this tenant.
 */
export async function setPrimaryDomain(
  tenantId: string,
  domain: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!sql) return { ok: false, error: "Database not configured" };
  const normalized = domain.trim().toLowerCase();
  const exists = await sql`
    SELECT 1 FROM domains WHERE tenant_id = ${tenantId} AND domain = ${normalized} LIMIT 1
  `;
  if (exists.length === 0) return { ok: false, error: "Domain not found for this tenant" };
  await sql`
    UPDATE domains SET is_primary = false WHERE tenant_id = ${tenantId}
  `;
  await sql`
    UPDATE domains SET is_primary = true WHERE tenant_id = ${tenantId} AND domain = ${normalized}
  `;
  return { ok: true };
}

