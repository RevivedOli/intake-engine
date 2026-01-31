# Intake Engine

Multi-tenant onboarding funnel platform: branded questionnaire funnels with a shared API layer and n8n as the processing backend.

## Quick start

```bash
npm install
cp .env.example .env   # set N8N_WEBHOOK_URL
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Try:

- [/apps/elliot-wise](http://localhost:3000/apps/elliot-wise) – full funnel (hero, 6 questions, contact)
- [/apps/lionstone](http://localhost:3000/apps/lionstone) – questions only, no hero
- [/apps/peace-for-nature](http://localhost:3000/apps/peace-for-nature) – hero + 1 question + contact

## Environment

- **N8N_WEBHOOK_URL** – Single webhook URL for all intake submissions (progress + submit). Every request includes `app_id` so n8n can route by source.
- **N8N_WEBHOOK_API_KEY** – (Optional) API key sent with every webhook request as the `X-API-Key` header. Set this in your deployment secrets if n8n expects authentication.

## Architecture

- **Frontend** – Per-client funnel at `/apps/[clientSlug]` (hero optional, questions, contact capture, dynamic result).
- **API** – `POST /api/intake` forwards payload to n8n; optional `GET /api/intake/status?job_id=...` for polling.
- **Payload** – `app_id`, `event` (`"progress"` | `"submit"`), `timestamp`, `session_id` (UUID per user/session, stable for the funnel visit), `answers`, `contact`, `utm`, and for progress `step`. Progress is sent on every step change (hero → questions, each question advance, questions → contact) so n8n can track drop-off and update the same row by `session_id`.
- **Result** – n8n returns a standard envelope (`status`, `message`, `result`). Result can be thank_you, link, embed, or `job_id` for polling.

## Adding a new app

1. Create `src/apps/your-client/config.ts` (theme, steps, hero?, contactFields, defaultThankYouMessage).
2. Create `src/apps/your-client/questions.ts` (export `questions` array) if the flow includes questions.
3. Register the slug in `src/apps/index.ts` (`KNOWN_APPS` and the config/question loaders).

The funnel will be available at `/apps/your-client`.

## Tech stack

- Next.js 14 (App Router), TypeScript, Tailwind CSS
