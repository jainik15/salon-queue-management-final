# LateCuts Project Specification

## 1. Project overview

LateCuts is the planned conversion of the existing salon queue application. The product manages same-day guest check-in, per-stylist queues, live tokens, chair workflows, lounge display, reception operations, analytics, and feedback. This specification separates the inspected baseline from confirmed decisions and future work; it does not claim planned capabilities are implemented.

## 2. Product identity

- **Confirmed product name:** LateCuts.
- **Historical identity:** LUXE CUTS is the name in the original source and documentation.
- **Confirmed design direction:** Premium dark luxury. This is a direction only; the current implementation still uses the original blue/white design system.

## 3. Languages and localization expectations

- **Confirmed languages:** English and Gujarati.
- **Existing implementation:** `JoinQueue.tsx` has English/Hindi text and a toggle; most other screens currently use hard-coded English. Types and stored language values are `en`/`hi`.
- **Planned expectation:** Translate all user-facing flows consistently, support Gujarati text and fonts/layout, and retain language preference where appropriate. No localization changes are part of this baseline phase.

## 4. User roles

| Role | Existing experience | Confirmed / planned LateCuts expectation |
|---|---|---|
| Guest | Public check-in, token/status, feedback | Preserve the full customer flow. |
| Stylist | Parameterized `/barber/:id` station cockpit | Names become Ramesh, Vinod and Arjun; preserve existing identifiers/references where possible. Authentication expectations require further confirmation; current station route is public. |
| Staff | No dedicated staff role workflow; current login is admin/concierge flavored | Username `staff`; secure server-side authentication. Credential/secret provisioning must not be hardcoded. |
| Owner/administrator | Protected admin/reception dashboard and analytics | Preserve controls; a separate owner-settings capability is not present in the current code. |

## 5. Existing screens and routes

Routes are defined in `src/App.tsx`; `/reception` and `/admin` render the same `AdminDashboard` component.

| Route | Current screen/behavior | Preservation note |
|---|---|---|
| `/` | Redirects to `/join` | Preserve. |
| `/join` | Guest service selection, stylist selection, name entry and check-in | Preserve behavior; localization/branding planned later. |
| `/token/:id` | Customer live token/status | Preserve. |
| `/status/:id` | Alias for customer token/status | Preserve alias. |
| `/display` | Lounge queue board and stylist stations | Preserve. |
| `/barber/:id` | Stylist cockpit | Preserve route and existing IDs where possible. |
| `/login` | PIN/email demo login | Preserve access workflow while replacing insecure implementation in later phase. |
| `/reception` | Protected admin dashboard alias | Preserve route. |
| `/admin` | Protected queue operations dashboard | Preserve. |
| `/analytics` | Protected reporting and CSV export | Preserve. |
| `/feedback/:token` | Customer rating/review | Preserve. |
| `/closed` | Closure schedule/countdown | Preserve; align schedule in planned hours phase. |
| `*` | Not-found screen | Preserve. |

## 6. Existing service catalog and prices

Service IDs, names, durations, icons and LateCuts prices are defined in `src/lib/utils.ts`. The confirmed LateCuts catalog is:

| Service | ID | Duration | LateCuts price |
|---|---|---:|---:|
| Classic Cut | `classic-cut` | 25 min | ₹199 |
| Beard Sculpt | `beard-sculpt` | 20 min | ₹149 |
| Fade | `royal-fade` | 35 min | ₹299 |
| Kids Cut | `kids-cut` | 20 min | ₹149 |
| Hair Spa | `head-spa` | 45 min | ₹149 |
| D-Tan | `bridal` | 90 min | ₹300 |

This is the current authoritative LateCuts catalog. It supersedes inherited source-project names and prices; legacy IDs and durations remain unchanged. Existing persisted queue entries keep their stored values and are normalized for display by `getServiceDisplayName` in `src/lib/utils.ts`.

## 7. Stylist identity mapping

| Existing identity | Existing ID | Confirmed LateCuts identity | Migration rule |
|---|---|---|---|
| Zara | `zara` | Ramesh | Keep `zara` ID/reference initially to avoid breaking queue rows/routes. |
| Marcus | `marcus` | Vinod | Keep `marcus` ID/reference initially. |
| Dev | `dev` | Arjun | Keep `dev` ID/reference initially. |

Names and IDs occur in initial/sample data, server defaults, database seed, historical records, stylist-filter labels, recommendation logic, and routes. A complete reference inventory/migration plan is required before changing identity data; historical prompt/reflection artifacts remain intact.

## 8. Operating hours

- **Confirmed LateCuts hours:** 9:00 AM–9:00 PM daily.
- **Existing display:** `QueueClosed.tsx` lists weekdays 9:00 AM–9:00 PM and weekends 8:30 AM–9:30 PM.
- **Existing gate:** `/closed` is directly accessible, but `/join` does not enforce business hours or online queue closure. An older guide mentions closing online joins before salon closing; this is not current verified behavior.
- **Planned work:** Align displayed hours and clarify whether queue closure should be enforced and how walk-ins behave. Do not silently add a new closure rule.

## 9. Existing queue rules

The original `docs/03-flows-rules.md` documents:

- Status flow `waiting → serving → completed`; cancellation `waiting → absent`.
- First-come/first-served ordering within each stylist queue.
- Specific stylist preference remains locked; “Any Stylist” uses the available stylist with the shortest queue.
- One serving customer per stylist.
- Estimate intended as queue position times average stylist duration, recalculated as the queue changes.
- Break status preserves the current line but removes the stylist from fastest-available routing.
- Cross-screen synchronization via backend SSE and BroadcastChannel, with optional Supabase.

These are preservation requirements, not assertions that every invariant is currently enforced. In current code, wait calculations differ (`position * average` in `addToQueue`, `(position - 1) * average` in `getWaitTime`), arbitrary `updateStatus` transitions are accepted, no-show timing is not enforced, and single-chair concurrency is not robustly guarded. Resolve documented-versus-coded semantics deliberately before changing logic.

## 10. Existing technical architecture

- **Frontend:** React 18, TypeScript, Vite, Tailwind, React Router, Zustand; dependencies/scripts in `package.json`.
- **State:** `src/stores/queueStore.ts` owns queue/stylists/reviews; localStorage is the immediate local persistence path.
- **Backend:** Built-in Node HTTP server in `server/server.js`, JSON file storage at `server/data/database.json`, REST endpoints and SSE `/api/events`.
- **Cloud database:** Optional browser-side `@supabase/supabase-js` client in `src/lib/supabase.ts`; SQL schema and permissive RLS policies in `supabase-schema.sql`. Node server does not currently use Supabase.
- **Cross-tab sync:** Browser `BroadcastChannel`.
- **Development routing:** Vite proxies `/api` to localhost port 3001.
- **Hosting config:** `vercel.json` rewrites SPA routes to `index.html`; it does not configure the external Node API. README describes Vercel frontend and Render backend, but production API base URL/integration is not present in current client configuration.
- **Quality tooling:** `npm run build` runs `tsc && vite build`; package has no test script. At audit time dependencies were absent and build could not start (`tsc` not found); no source test suite was found.

## 11. Target technical architecture

Confirmed choices are existing React + TypeScript + Vite frontend, Node.js backend, Supabase database, and Vercel hosting. The exact production API topology, source-of-truth boundaries, real-time transport, database migration, and rollback strategy remain planned decisions. Target architecture should use one authoritative write path and preserve realtime behavior; avoid treating localStorage, JSON and Supabase as independent authoritative databases.

## 12. Security expectations

- Staff username is `staff`; credentials are configured securely on the server/deployment environment, never embedded in source or client bundles.
- Authentication and authorization must be checked server-side for protected pages’ data/API mutations; a client route guard alone is not security.
- Review RLS and ensure only appropriate operations/roles are allowed. Current SQL policies allow public reads, inserts, and updates on operational tables.
- Replace the current hardcoded fallback/default demo credentials and synthetic unvalidated token flow in a later approved phase.
- Do not put service-role keys or password secrets in `VITE_*` variables or frontend code.

## 13. Deployment expectations

- Vercel hosts the frontend; Node.js backend must be reachable in production through an explicitly configured secure API origin or an approved serverless/proxy arrangement.
- Supabase is the target database and must be configured in the right runtime with least-privilege credentials and reviewed policies.
- Preserve SPA deep-link routing while making `/api` behavior work in deployed environments.
- `.env.example` does not currently exist; it is a candidate documentation/config template, not an existing file. Do not add secrets to it.
- No external service was accessed and no deployment was performed in this phase.

## 14. Non-negotiable feature preservation requirements

Preserve every route, screen, queue workflow, stylist action, customer feedback, lounge display, analytics/export, QR path, sample reset, notification, responsive behavior, simulator, and documented queue intent listed in `LATECUTS_PRESERVATION_CHECKLIST.md`. Keep legacy stylist and service identifiers/references wherever possible. Use the current six LateCuts service names and prices while retaining existing service IDs, durations, selection and queue calculations. Do not remove or silently alter behavior to make migration simpler. Securely replace authentication only in its planned phase.

## 15. Classification of work

| Classification | Items |
|---|---|
| Existing functionality | Routes/screens, Zustand store, queue actions, Node JSON API/SSE, optional browser Supabase client, BroadcastChannel, demo login/route guard, analytics, CSV, QR, audio, confetti and simulator, with caveats recorded in the checklist. |
| Confirmed project decisions | LateCuts name; premium dark luxury direction; English/Gujarati; React + TypeScript + Vite; Node.js; Supabase; Vercel; daily 9 AM–9 PM; Ramesh/Vinod/Arjun mapped to legacy IDs; `staff` username; secure server-side authentication; simulator retained with enable/disable control. |
| Planned future improvements | Brand/localization work, stylist label migration, hours alignment, unified queue persistence/realtime, secure auth/RLS, production API connectivity, automated regression verification. |
| Requires investigation/decision | Conflicting service price instructions; final queue wait-time formula and enforcement of invariants; production API hosting/origin; whether stylist routes require auth; owner-settings scope; closure cutoff policy; historical data migration and legacy route/token compatibility. |
