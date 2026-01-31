# Intake Engine

Multi-tenant onboarding funnel platform: branded questionnaire funnels with a shared API layer and n8n as the processing backend.

## Monorepo layout

- **`packages/funnel-core`** – Shared funnel UI, types, and API helpers (used by each app).
- **`apps/lionsden`**, **`apps/elliot-wise`**, **`apps/lionstone`**, **`apps/peace-for-nature`** – One deployable Next.js app per client. Each app shows **only** that client’s funnel at the root URL (`/`). No app picker / main menu.

## Deploying a single app to Vercel (one domain per client)

1. In Vercel, create a **new project** and connect this repo.
2. Set **Root Directory** to the app folder you want (e.g. `apps/lionsden`, `apps/elliot-wise`, `apps/lionstone`, or `apps/peace-for-nature`).
3. Leave **Install Command** and **Build Command** as default (`npm install`, `npm run build`). Vercel will run them inside that root directory; the app depends on `funnel-core` via `file:../../packages/funnel-core`, so the full repo is used.
4. Add env vars (e.g. `N8N_WEBHOOK_URL`, `N8N_WEBHOOK_API_KEY`) in the project settings.
5. Deploy. That deployment serves only that client’s funnel at `/` (no main menu).

Repeat with a new Vercel project and a different Root Directory for each client.

## Quick start (all-in-one dev server at repo root)

```bash
npm install
cp .env.example .env   # set N8N_WEBHOOK_URL
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You’ll see the app picker; try any client.

To run **one app** locally (no picker) **from repo root** with a single `.env`:

```bash
npm install
# Put N8N_WEBHOOK_URL (and optionally N8N_WEBHOOK_API_KEY) in .env at repo root
npm run lionsden:dev      # or elliot-wise:dev, lionstone:dev, peace-for-nature:dev
```

Then open [http://localhost:3000](http://localhost:3000) for that app’s funnel only. Env vars are loaded from the root `.env` via `env-cmd`, so you don’t need a separate `.env` inside each app folder.

## Environment

- **N8N_WEBHOOK_URL** – Single webhook URL for all intake submissions (progress + submit). Every request includes `app_id` so n8n can route by source.
- **N8N_WEBHOOK_API_KEY** – (Optional) API key sent with every webhook request as the `X-API-Key` header. Set this in your deployment secrets if n8n expects authentication.

## Architecture

- **Frontend** – Per-client funnel at `/apps/[clientSlug]` (hero optional, questions, contact capture, dynamic result).
- **API** – `POST /api/intake` forwards payload to n8n; optional `GET /api/intake/status?job_id=...` for polling.
- **Payload** – `app_id`, `event` (`"progress"` | `"submit"`), `timestamp`, `session_id` (UUID per user/session, stable for the funnel visit), `answers`, `contact`, `utm`, and for progress `step`. Progress is sent on every step change (hero → questions, each question advance, questions → contact) so n8n can track drop-off and update the same row by `session_id`.
- **Result** – n8n returns a standard envelope (`status`, `message`, `result`). Result can be thank_you, link, embed, or `job_id` for polling.

## Adding a new deployable app

1. Copy an existing app under `apps/` (e.g. `apps/lionstone`) to `apps/your-client`.
2. Update `src/config.ts`, `src/questions.ts`, and `APP_ID` in `src/app/page.tsx` and `src/app/api/intake/route.ts`.
3. In Vercel, create a new project, set Root Directory to `apps/your-client`, and deploy.

## Tech stack

- Next.js 14 (App Router), TypeScript, Tailwind CSS
