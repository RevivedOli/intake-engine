# Intake Engine

Multi-tenant onboarding funnel platform: branded questionnaire funnels with a shared API layer and n8n as the processing backend. **One deployment** serves many clients; the request host (domain) is looked up in Neon to load that tenant’s config and questions.

## Monorepo layout

- **Root app (`src/`)** – Single Next.js app. The root route (`/`) resolves the tenant by request host via Neon and renders that tenant’s funnel (or a “not set up” page if no tenant is configured for the domain).
- **`packages/funnel-core`** – Shared funnel UI, types, and API helpers.
- **`apps/lionsden`**, **`apps/elliot-wise`**, etc. – Legacy per-client apps (no longer used for new deploys); funnel is now **domain-based** from the root app only.

## One deployment on Vercel (many domains)

1. Create **one** Vercel project and connect this repo. Deploy from the **repo root** (no Root Directory).
2. Add **all client domains** to this project in Vercel (Domains): e.g. `lionsden.example.com`, `elliot-wise.example.com`. Each domain points at the same deployment.
3. In Neon, ensure each domain has a row in the `domains` table linking to the correct `tenants` row (see **Managing tenants and domains** below).
4. Set env vars for the project:
   - **`DATABASE_URL`** or **`NEON_DATABASE_URL`** – Neon Postgres connection string (required for tenant resolution).
   - **`N8N_WEBHOOK_URL`** – Webhook for intake submissions (progress + submit). Payload includes `app_id` (tenant id) so n8n can route by source.
   - **`N8N_WEBHOOK_API_KEY`** – (Optional) API key sent as `X-API-Key` header.

No per-tenant deploy or Root Directory; one build serves all clients.

## Managing tenants and domains (Neon)

- **`tenants`** – One row per client: `id` (UUID), `name`, `config` (full AppConfig as JSON), `questions` (array of Question as JSON), `created_at`, `updated_at`.
- **`domains`** – One row per host: `tenant_id` (FK to `tenants.id`), `domain` (unique, e.g. `lionsden.example.com`), optional `is_primary`, `verified`.

To add a client: insert into `tenants` with `config` and `questions`, then insert into `domains` with the production domain(s). To add another domain for an existing client, insert another `domains` row with the same `tenant_id`.

Production domains are whatever you add in Neon; placeholder domains (e.g. `lionsden.local`) are used in seed for local dev. Add real domains in Neon when you’re ready to go live.

## Local development

```bash
npm install
cp .env.example .env
```

In `.env` set:

- **`DATABASE_URL`** or **`NEON_DATABASE_URL`** – Your Neon connection string.
- **`N8N_WEBHOOK_URL`** (optional) – For testing n8n.

Then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The seed data maps **localhost** to the first tenant, so you’ll see that tenant’s funnel. To test another tenant locally, add a line in `/etc/hosts` (e.g. `127.0.0.1 elliot-wise.local`) and open [http://elliot-wise.local:3000](http://elliot-wise.local:3000) (placeholder domains like `*.local` are in the seed).

**macOS: slow first request with `*.local`** – On macOS, `.local` is used for mDNS/Bonjour, so the OS may try multicast resolution first and only then use `/etc/hosts`, adding ~1–5 seconds before the request reaches the app. To avoid that, either (1) add IPv6 entries for each host in `/etc/hosts` (e.g. `127.0.0.1 lionsden.local` and `::1 lionsden.local`) so the resolver skips mDNS, or (2) use a different TLD for local dev (e.g. `lionsden.test`) and add both the hosts entry and a matching domain row in Neon for that hostname.

## Seeding tenants (first-time or reset)

After creating the Neon schema (e.g. via Neon MCP or migrations), seed the four existing clients and placeholder domains:

```bash
npx tsx scripts/seed-tenants.ts
```

Requires `DATABASE_URL` or `NEON_DATABASE_URL` in the environment. The script inserts one tenant per client (Elliot Wise, Lions Den University, Lionstone, Peace for Nature) with config and questions, and adds domains `elliot-wise.local`, `lionsden.local`, `lionstone.local`, `peace-for-nature.local` plus **localhost** for the first tenant.

## Admin (login and dashboard)

**Login** and **dashboard** are only available on an **allowlisted host**. If a user visits `/login` or `/dashboard` on a client/tenant domain (e.g. `elliot-wise.example.com`), they are **redirected to `/`** on that domain so funnel visitors cannot access the admin.

- **Allowlist** – Set **`ADMIN_ALLOWED_HOSTS`** to a comma-separated list of hosts that can access `/login` and `/dashboard` (e.g. `localhost` or `admin.example.com`). Defaults to `localhost` if unset.
- **Login** – On an allowed host, open `/login` to sign in with Neon Auth. After sign-in you are redirected to `/dashboard`.
- **Dashboard** – List tenants, create a new tenant (name, domain, config and questions as JSON), or edit an existing tenant. Changes to config/questions are cached for 60 seconds; saving from the dashboard invalidates the cache for that tenant’s domains so the funnel shows updates immediately.
- **Neon Auth** – Provision Neon Auth for your Neon project (e.g. via Neon Console or MCP). Then set **`NEON_AUTH_BASE_URL`** (your Neon Auth URL, e.g. from Project → Branch → Auth → Configuration) and **`NEON_AUTH_COOKIE_SECRET`** (min 32 characters, e.g. `openssl rand -base64 32`) in `.env`. Add your app’s admin URL to Neon Auth’s trusted domains so redirects work.

To use a dedicated admin domain in production: add that domain to your Vercel project, set `ADMIN_ALLOWED_HOSTS=admin.example.com`, and add it to Neon Auth trusted domains.

## Environment

- **DATABASE_URL** / **NEON_DATABASE_URL** – Postgres connection string for Neon. Used to resolve tenant by domain and to load config for the intake API.
- **ADMIN_ALLOWED_HOSTS** – (Optional) Comma-separated hosts that can access `/login` and `/dashboard`. Defaults to `localhost`.
- **NEON_AUTH_BASE_URL** – Neon Auth URL (required for admin login). From Neon Console: Project → Branch → Auth → Configuration.
- **NEON_AUTH_COOKIE_SECRET** – Secret for session cookies (min 32 characters). Generate with `openssl rand -base64 32`.
- **N8N_WEBHOOK_URL** – Single webhook URL for all intake submissions. Every request includes `app_id` (tenant id).
- **N8N_WEBHOOK_API_KEY** – (Optional) API key sent with every webhook request as `X-API-Key` header.

## Architecture

- **Request flow** – `GET /` reads the request host from headers (`x-forwarded-host` or `host`), calls `getTenantByDomain(host)` in Neon. If a tenant is found, the funnel is rendered with that tenant’s `config` and `questions` and `appId = tenant.id`. Otherwise a “Form not set up” page is shown.
- **API** – `POST /api/intake` expects `app_id` (tenant UUID). The route loads the tenant with `getTenantById(app_id)` from Neon and uses `tenant.config` (e.g. `contactFields`) for validation, then forwards to n8n as before. `GET /api/intake/status?job_id=...` unchanged.
- **Payload** – Same as before: `app_id`, `event`, `timestamp`, `session_id`, `answers`, `contact`, `utm`; n8n can route by `app_id`.

## Tech stack

- Next.js 14 (App Router), TypeScript, Tailwind CSS
- Neon (Postgres) for tenants and domains
- n8n for intake processing
