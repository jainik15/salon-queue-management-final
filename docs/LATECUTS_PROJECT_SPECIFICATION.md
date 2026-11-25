# LateCuts Project Specification

> **Current status (2026-11-25):** This document reflects the current LateCuts product and repository. The owner reports the Vercel frontend, Render API, and Supabase-backed production flows are live and manually verified. The follow-up release-blocker migration `202611250002_queue_release_blockers.sql` and matching API changes are in the repository; the production-backend guide records them as pending application/deployment. Verify Supabase migration history before applying SQL. Older LUXE CUTS documents and the root `supabase-schema.sql` are historical references, not current product specifications.

## 1. Project overview

LateCuts is a salon queue and floor-management application for same-day guest check-in, per-stylist queues, live tokens, chair workflows, lounge display, reception operations, analytics, and feedback. It continues the existing application's routes and workflows while using the confirmed LateCuts identity and production architecture.

## 2. Product identity

- **Confirmed product name:** LateCuts.
- **Historical identity:** LUXE CUTS appears in archived source material and compatibility identifiers.
- **Current design direction:** Premium dark luxury with charcoal, espresso, muted copper gold, and warm neutral colors. The current screens use the LateCuts design direction; final visual regression remains part of release verification.

## 3. Languages and localization expectations

- **Confirmed languages:** English and Gujarati.
- **Current implementation:** English is the default; the shared locale provider and language switcher in `src/lib/locale.tsx` support Gujarati, persist the preference, and update the document language.
- **Verification:** Check translation coverage, wrapping, and immediate language switching across all routes before release. Hindi is not a supported LateCuts language; references in original documents are historical only.

## 4. User roles

| Role | Current experience | LateCuts behavior |
|---|---|---|
| Guest | Public check-in, private token/status, cancellation, and feedback | Keep guest flows public where intended; private pass data is accessed with a per-entry token. |
| Stylist | Protected `/barber/:id` station workflow | Display Ramesh, Vinod, and Arjun while retaining legacy database IDs and route compatibility. |
| Staff/reception | Backend-authenticated login and protected reception/admin operations | Username `staff`; credentials are configured only on the backend. |
| Owner/administrator | Protected admin dashboard and analytics | Preserve existing controls. A separate owner-settings interface is not currently documented as implemented. |

## 5. Current screens and routes

Routes are defined in `src/App.tsx`; `/reception` and `/admin` render the same `AdminDashboard` component.

| Route | Current screen/behavior | Access |
|---|---|---|
| `/` | Redirects to `/join` | Public |
| `/join` | Guest service selection, stylist preference, name entry, and check-in | Public |
| `/token/:id`, `/status/:id` | Customer queue pass, status, wait estimate, and cancellation | Private per-pass access token |
| `/display` | Lounge queue and stylist display | Public redacted projection |
| `/barber/:id` | Stylist station workflow | Protected |
| `/login` | Staff sign-in | Public login; backend validates credentials |
| `/reception`, `/admin` | Reception and queue administration; both render `AdminDashboard` | Protected |
| `/analytics` | Reporting and CSV export | Protected |
| `/feedback/:token` | Customer review flow | Private completed-pass access token |
| `/closed` | Salon closure and reopening information | Public |
| `*` | Not-found screen | Public |

## 6. Official service catalog and prices

The Supabase service catalog is the source for service IDs, names, durations, icons and prices; the frontend loads it through the Node API. `src/lib/utils.ts` normalizes legacy service labels for display. The confirmed LateCuts catalog is:

| Service | ID | Duration | LateCuts price |
|---|---|---:|---:|
| Classic Cut | `classic-cut` | 25 min | ₹199 |
| Beard Style | `beard-sculpt` | 20 min | ₹149 |
| Fade | `royal-fade` | 35 min | ₹299 |
| Kids Cut | `kids-cut` | 20 min | ₹149 |
| Hair Spa | `head-spa` | 45 min | ₹149 |
| D-Tan | `bridal` | 90 min | ₹499 |

This is the current authoritative LateCuts catalog. It supersedes inherited source-project names and prices; legacy IDs and durations remain unchanged. Existing persisted queue entries keep their stored values and are normalized for display by `getServiceDisplayName` in `src/lib/utils.ts`.

## 7. Current stylist identity mapping

| Existing identity | Existing ID | Confirmed LateCuts identity | Migration rule |
|---|---|---|---|
| Zara | `zara` | Ramesh | Keep `zara` ID/reference initially to avoid breaking queue rows/routes. |
| Marcus | `marcus` | Vinod | Keep `marcus` ID/reference initially. |
| Dev | `dev` | Arjun | Keep `dev` ID/reference initially. |

Names and IDs occur in sample data, database seed, historical records, filters, recommendation logic, and routes. Preserve legacy identifiers and relationships unless a separately reviewed migration is approved. Keep original project records clearly historical while the current prompt log and reflection describe LateCuts.

## 8. Operating hours

- **Confirmed LateCuts hours:** 9:00 AM–9:00 PM daily.
- **Current configuration:** The LateCuts closed screen displays 9:00 AM–9:00 PM, and the Supabase salon settings use the same schedule with `Asia/Kolkata`.
- **Release check:** Verify online-join cutoff behavior against the deployed API before changing it. A displayed schedule and a server-enforced cutoff are separate things; do not infer enforcement from the screen copy.

## 9. Existing queue rules

- Queue state and transition validation run through the Node API and Supabase RPCs; the frontend store is a view cache.
- The release-blocker changes add wait-time recalculation, unavailable-stylist rejection, “any stylist” selection, and the 10-minute no-show boundary. Regression coverage is in `tests/` and the forward migration `202611250002_queue_release_blockers.sql`.
- The queue keeps per-stylist order, prevents a stylist from serving multiple customers simultaneously, and uses an idempotency key to make retried joins safe.
- Stored queue tokens retain their historical `LX-` representation. The API/client display formatter shows the approved `LC-` prefix without changing stored rows or pass tokens.
- **Deployment dependency:** The production-backend guide records migration `202611250002_queue_release_blockers.sql` and its matching API release as pending. Production behavior must not be described as enforcing these new rules until that migration and API version are deployed and verified.
- The original `docs/03-flows-rules.md` remains a historical rule reference; its old `[x]` marks are not current test results.

## 10. Current technical architecture

- **Frontend:** React 18, TypeScript, Vite, Tailwind, React Router, and Zustand.
- **State and localization:** `src/stores/queueStore.ts` caches the API view; `src/lib/locale.tsx` provides English/Gujarati language state and switching.
- **Backend:** `server/server.js` is the Node.js REST API and SSE endpoint. It binds to the host-provided port and uses Supabase rather than the legacy JSON file.
- **Database:** Supabase PostgreSQL is authoritative. The Node API uses the service-role key server-side; the browser does not receive that key.
- **Synchronization:** SSE carries server event notices. BroadcastChannel only signals clients to refresh their view.
- **Hosting:** Vercel serves the frontend and SPA routes; Render runs the long-lived Node API/SSE connection; Supabase stores shared queue data. Local Vite proxies `/api` to `localhost:3001`.
- **Quality tooling:** `npm run build` runs TypeScript and Vite production builds; `npm test` uses Node's test runner. Current focused tests include queue-token formatting and the no-show boundary.
- The root `supabase-schema.sql` and `server/data/database.json` are historical/inert artifacts. Do not use them as current schema or production data sources.

## 11. Current production architecture and rollout status

- **Confirmed architecture:** Vercel frontend, Render Node.js API with persistent SSE, Supabase PostgreSQL as the authoritative store.
- **Owner-reported live verification:** Production health reports Supabase connectivity and configured staff auth; the service catalog, login, check-in, stylist visibility, and service completion were manually verified.
- **Release-blocker follow-up:** Migration `202611250002_queue_release_blockers.sql` and matching API changes are in the repository but are not yet recorded as applied/deployed in the production-backend guide. Verify migration history and deploy only after the approved staging/release checks.
- The exact production origins and migration history are not stored in the repository. Do not copy secrets or infer environment values from this specification.

## 12. Security expectations

- Staff username is `staff`; `STAFF_PIN` and `STAFF_SESSION_SECRET` are backend-only environment variables. No production credential belongs in this repository or submission materials.
- Protected API mutations verify the signed staff session server-side. A frontend route guard is a usability control, not the authorization boundary.
- `SUPABASE_SERVICE_ROLE_KEY` stays on the Node host. RLS must not grant public access to customer queue data; public API projections omit other customers' identifying details.
- CORS uses explicitly configured exact origins. Do not use wildcard CORS.
- Customer pass and feedback access uses per-entry tokens; cancellation is limited to the relevant pass token.

## 13. Deployment expectations

- Vercel build command is `npm run build`, with `dist` as output; `vercel.json` handles SPA deep links.
- Render starts the existing backend with `npm start`; it supplies `PORT`. Set the Vercel `VITE_API_BASE_URL` to the Render API origin and configure the exact Vercel origin in backend CORS.
- Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STAFF_PIN`, `STAFF_SESSION_SECRET`, and `CORS_ALLOWED_ORIGINS` only in private backend configuration. `.env.example` may contain placeholders only.
- The owner reports the current frontend/backend deployment is live. The release-blocker API/migration rollout remains pending as described in `LATECUTS_PRODUCTION_BACKEND.md`.

## 14. Non-negotiable feature preservation requirements

Preserve every route, screen, queue workflow, stylist action, customer feedback, lounge display, analytics/export, QR path, sample reset, notification, responsive behavior, simulator, and documented queue intent listed in `LATECUTS_PRESERVATION_CHECKLIST.md`. Keep legacy stylist and service identifiers/references wherever possible. Use the current six LateCuts service names and prices while retaining existing service IDs, durations, selection and queue calculations. Do not remove or silently alter behavior to make migration simpler. Securely replace authentication only in its planned phase.

## 15. Classification of work

| Classification | Items |
|---|---|
| Classification | Items |
|---|---|
| Current implementation | LateCuts-branded screens; English/Gujarati locale provider; six-service catalog; stylist display mapping; React/Vite frontend; Node/Supabase API; SSE notices; protected staff workflows; analytics/CSV; QR, audio, feedback, and simulator features. See the preservation checklist for verification limits. |
| Confirmed decisions | LateCuts; premium dark luxury; English/Gujarati; Vercel + Render + Supabase; 9 AM–9 PM; Ramesh/Vinod/Arjun with preserved legacy IDs; staff username `staff`; backend-only credentials; preserve simulator and existing workflows. |
| Pending release work | Apply the reviewed forward migration to staging, verify database-side release-blocker rules, then deploy the matching API only after acceptance checks. Complete route/workflow and responsive regression verification. |
| Requires investigation | Exact production migration-history version and origins; production verification of the release-blocker rollout; closure cutoff enforcement; legacy pass-link compatibility; whether a distinct owner-settings interface is required. |
