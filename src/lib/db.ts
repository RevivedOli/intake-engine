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
    SELECT t.id, t.config, t.questions
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

