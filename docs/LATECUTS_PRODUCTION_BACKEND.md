# LateCuts Production Backend and Deployment Guide

## Status

This document describes the backend integration and deployment configuration prepared in this change. No Supabase migration was applied, no production database was contacted or changed, and no Render or Vercel deployment was performed. The local `server/data/database.json` remains untouched and ignored; it is no longer read by the API.

## Target architecture

- **Vercel:** React + TypeScript + Vite static frontend (`npm run build`, output `dist`). Vercel SPA rewrites preserve direct routes.
- **Render:** Long-running Node.js HTTP API (`npm run server`) and persistent Server-Sent Events (`GET /api/events`). Keep one API instance until SSE events are fanned out through a shared broker or Supabase Realtime is verified across instances.
- **Supabase:** Authoritative PostgreSQL storage. The frontend never creates a Supabase client. The Render API uses the backend-only service-role key and RLS is enabled without anonymous/authenticated data policies.
- **Browser state:** Zustand is a view cache. API responses hydrate it; mutations go through Node. Browser storage and BroadcastChannel do not persist or broadcast queue/customer records.

## Data model prepared

Migration: [`supabase/migrations/202611250001_latecuts_backend.sql`](../supabase/migrations/202611250001_latecuts_backend.sql).

| Table | Stored fields / purpose |
|---|---|
| `barbers` | Existing IDs `zara`, `marcus`, `dev`; display name, specialty, duty status, avatar, queue count, served-today count and average duration. Existing foreign-key relationships stay keyed to the original IDs. |
| `services` | Canonical service ID, English/Gujarati name, icon, duration, price, display order and active flag. The official LateCuts catalog is seeded here. |
| `queue_entries` | Existing text ID and token, customer name, selected service summary and IDs, service duration, stylist ID/name snapshot, status, position, joined/called/completed timestamps, wait estimate and language. `public_access_token` authorizes a customer to view/cancel their own pass; `join_request_id` makes retries idempotent. |
| `salon_state` | Single global sequential token counter. |
| `salon_settings` | Single row for 9:00 AM–9:00 PM and `Asia/Kolkata`. No current owner-settings UI/API was found, so this row is not yet editable in the app. |
| `reviews` | One review per completed queue entry, rating, optional comment, aspect answers and timestamps; customer/stylist/service fields are sourced from the completed entry, not trusted from the browser. |

### Service catalog

The database catalog is the frontend and backend source for service selection, duration and price:

| ID | Service | Duration preserved | Price |
|---|---|---:|---:|
| `classic-cut` | Classic Cut | 25 min | ₹199 |
| `beard-sculpt` | Beard Style | 20 min | ₹149 |
| `royal-fade` | Fade | 35 min | ₹299 |
| `kids-cut` | Kids Cut | 20 min | ₹149 |
| `head-spa` | Hair Spa | 45 min | ₹149 |
| `bridal` | D-Tan | 90 min | ₹499 |

The migration inserts these values and updates only matching service-catalog rows on conflict. Queue rows and stylist IDs are not renamed by the migration.

## Queue and privacy behavior

- Join, token allocation, position calculation and service validation run in a PostgreSQL RPC transaction. Existing token format (`LX-##`), IDs and duration values are retained.
- Position remains the number of waiting customers for that stylist plus one; estimated wait remains `position × stylist average duration`, matching the current Node join behavior. Existing estimates are not silently recalculated when a customer is called, completed or cancelled.
- The database prevents more than one `serving` row per stylist. `call_next` locks the stylist and selects the earliest waiting row. A repeated request with the same `join_request_id` returns the existing entry.
- The check-in form collects only a name, not a stable customer identity. Idempotency prevents retries of the same check-in request from creating duplicates. It cannot safely identify two separately submitted check-ins by the same human; adding phone/email-based identity would require a separate product decision and privacy review.
- Public `GET /api/queue` and SSE include only active queue rows and replace customer names with a generic label. They do not return phone/contact fields or pass tokens. Staff queue data requires a signed staff bearer session.
- A customer's `/token/:id`, `/status/:id`, and `/feedback/:token` links use a random per-entry access token. This API returns only that entry. Legacy links containing a database ID or sequential token will not resolve; existing queue records require a reviewed link/access-token migration before those links can be preserved.
- Customer cancellation is limited to the entry's private pass token. Reviews can be submitted only for a completed pass. Feedback is stored in Supabase and returned in full only to staff analytics.
- Customer cancellation from a currently serving state remains supported because the existing token UI allowed leaving until completion. Reopening a completed/absent entry is rejected.
- Sample-data reset requires staff authorization and `ENABLE_SAMPLE_DATA_RESET=true` in a non-production environment. It is blocked in production. Never enable it on a production Render service.

## Authentication and security

Required backend-only variables:

| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | Supabase project HTTPS URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged API database access. Render only; never a `VITE_*` variable. |
| `STAFF_PIN` | Private six-digit staff PIN; repeated or sequential patterns are rejected. |
| `STAFF_SESSION_SECRET` | At least 32 bytes used to sign eight-hour staff sessions. |
| `CORS_ALLOWED_ORIGINS` | Comma-separated exact browser origins, with no wildcard. |

Staff writes (`walk-in`, call-next, completion, absence, stylist status and reset) verify a signed bearer session on the server. Login is rate-limited. Missing Supabase credentials, PIN or signing secret fail closed. Staff sessions currently live in browser localStorage and expire after eight hours; logout clears the browser copy, and rotating `STAFF_SESSION_SECRET` invalidates all outstanding sessions.

Public operations are limited to check-in, private-pass lookup/cancellation and completed-pass feedback. The new migration enables RLS and removes the old named public read/update policies. No anon/authenticated policies are created. Do not run the historical `supabase-schema.sql`; it is now marked deprecated and inert.

## Environment configuration

`.env.example` contains placeholders only. Copy it to an ignored `.env` for local use and replace placeholders. Never paste real secrets into source, Vercel frontend variables, `VITE_*` variables, issue reports or logs.

### Render API

`render.yaml` prepares a Node web service with:

- Build: `npm ci`
- Start: `npm run server`
- Health check: `/api/health`
- Runtime: Node.js 20 or newer
- Auto deploy: disabled in the blueprint

Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STAFF_PIN`, `STAFF_SESSION_SECRET`, and `CORS_ALLOWED_ORIGINS` in Render's private environment settings. `PORT` is provided by Render. `CORS_ALLOWED_ORIGINS` must include the exact Vercel production origin and any explicitly used preview origin. Keep sample reset disabled.

### Vercel frontend

- Build command: `npm run build`
- Output directory: `dist`
- Set only `VITE_API_BASE_URL` to the Render HTTPS origin, such as `https://latecuts-api.onrender.com`.
- No Supabase key belongs in Vercel. The `/api` calls go directly to the configured Render API; `vercel.json` handles SPA deep links and does not proxy the API or SSE.
- Set the API URL for each Vercel environment explicitly. Preview deployments must be added to Render CORS only if those preview origins are intended to access the API.

## Database application and existing data

1. Create/choose a Supabase project and take a verified backup before applying schema changes.
2. Review whether the existing `queue_entries` data contains duplicate tokens or multiple simultaneous `serving` rows per stylist. The migration intentionally fails on constraint violations rather than rewriting queue history. It also removes all existing RLS policies on the operational tables and grants access only to the server service role; review these access changes before applying.

Read-only preflight queries for the existing Supabase schema:

```sql
select token, count(*) from public.queue_entries group by token having count(*) > 1;
select barber_id, count(*) from public.queue_entries where status = 'serving' group by barber_id having count(*) > 1;
select status, count(*) from public.queue_entries group by status order by status;
```

3. Obtain explicit approval to apply the migration to the intended Supabase project. The migration has not been run by this change.
4. Apply the SQL migration to a staging project first. Verify table grants/RLS using anon, authenticated and service-role clients; only the backend service role should read/write customer rows.
5. Local `server/data/database.json` records are not automatically imported. A separate import plan/tool, verified backup, field mapping, duplicate-token plan, and approval are required before migrating them.
6. Plan how to issue private access links for pre-existing queue records. Do not restore public lookup by sequential token or database ID as a workaround.
7. Configure Render secrets and CORS, then deploy the API. Confirm `/api/health` reports Supabase connected.
8. Configure Vercel `VITE_API_BASE_URL` to the Render origin and deploy the frontend only after the API and schema are ready.

## API contract

| Endpoint | Access | Purpose |
|---|---|---|
| `GET /api/health` | Public, aggregate only | API and Supabase connectivity. |
| `GET /api/events` | Public, redacted events | Persistent SSE stream; no customer names or private pass tokens. |
| `POST /api/auth/login` | Public, rate-limited | Issues a signed eight-hour staff session. |
| `GET /api/queue` | Public redacted projection; staff bearer gets full queue and reviews | Store hydration. |
| `GET /api/services` | Public | Active canonical service catalog. |
| `GET /api/queue/entry/:accessToken` | Private per-entry access token | One customer's queue pass. |
| `POST /api/queue/join` | Public, rate-limited | Guest check-in. |
| `POST /api/queue/cancel` | Private per-entry access token | Cancel that queue pass. |
| `GET /api/feedback/:accessToken`, `POST /api/feedback` | Private completed-pass token | Load/save that customer's review. |
| `POST /api/queue/walk-in` | Staff bearer | Reception walk-in or simulator entry. |
| `POST /api/queue/call-next`, `/mark-done`, `/mark-absent` | Staff bearer | Stylist/reception queue transitions. |
| `POST /api/barbers/status` | Staff bearer | Stylist break/availability. |
| `POST /api/database/reset` | Staff bearer + non-production env gate | Restore sample queue data in a non-production environment only. |

## Verification state and limitations

The repository has no automated test script at this point. The implementation must still be validated with the production build, Node syntax check, API fail-closed checks, and—after a staging migration—database/RLS, authentication, concurrent queue transition, feedback, and two-client SSE checks. No Supabase credentials were added by this change. A single Render instance is required for the current in-memory SSE fan-out; cross-instance SSE delivery needs a shared event bus or a verified Supabase Realtime bridge. In-memory rate limits also reset on restart and are per API process.
