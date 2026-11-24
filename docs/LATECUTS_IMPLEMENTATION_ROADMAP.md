# LateCuts Implementation Roadmap

This roadmap preserves the original phase plan. **Status update (2026-11-25):** Backend integration, server-side auth/RLS migration preparation, and Vercel/Render configuration have since been implemented locally. The migration has not been applied, production data has not been changed, and nothing has been deployed. See [`LATECUTS_PRODUCTION_BACKEND.md`](./LATECUTS_PRODUCTION_BACKEND.md) for current configuration, review gates and remaining validation.

## Phase 1: Baseline, specifications and preservation checklist

- **Objectives:** Record inspected behavior and confirmed LateCuts decisions; enumerate preservation requirements; surface contradictions and risks.
- **Expected files:** `docs/LATECUTS_PRESERVATION_CHECKLIST.md`, `docs/LATECUTS_PROJECT_SPECIFICATION.md`, `docs/LATECUTS_IMPLEMENTATION_ROADMAP.md`; minimal historical context notices in `README.md`, `AGENTS.md`, `docs/01-brief.md`, `docs/02-screens.md`, `docs/03-flows-rules.md` if needed.
- **Dependencies:** Read-only repository audit and confirmed product decisions.
- **Risks:** Treating doc claims as verified behavior; misreading the conflicting service prices; disturbing historical records.
- **Acceptance criteria:** Three new docs exist; original routes/features are inventoried; actual source prices and supplied updated prices are both recorded with conflict flagged; source/application/database/environment files are untouched; no feature is called working without code/evidence.

## Phase 2: Brand identity, premium dark luxury UI and localization

- **Objectives:** Apply LateCuts identity and premium dark luxury design across existing screens; provide complete English/Gujarati localization while retaining all screen behavior and routes.
- **Expected candidate files and why:**
  - `index.html` (document title/metadata).
  - `src/App.tsx`, `src/index.css`, `tailwind.config.js` (global identity, theme tokens, shared background/layout).
  - `src/pages/JoinQueue.tsx`, `CustomerToken.tsx`, `LiveDisplay.tsx`, `BarberDashboard.tsx`, `AdminDashboard.tsx`, `BarberAnalytics.tsx`, `AdminLogin.tsx`, `CustomerFeedback.tsx`, `QueueClosed.tsx`, `NotFound.tsx` (page branding and untranslated text; likely all need review).
  - `src/components/ui/LiveToast.tsx`, `QRCode.tsx`, `src/components/layout/ProtectedRoute.tsx` (shared visible text/style if present).
  - A new localization module may be appropriate; no such centralized file currently exists. `src/types/index.ts` may need language type expansion from `en | hi` to `en | gu`.
- **Dependencies:** Approve design tokens/visual direction, translation content, Gujarati font/rendering approach, and any accessibility requirements. Resolve scope of retaining Hindi historical data.
- **Risks:** Incomplete translations; Gujarati text overflow; replacing visuals in ways that hide controls; stale stored `hi` values; generic global CSS regressions.
- **Acceptance criteria:** All routes still render and all controls/workflows remain; English/Gujarati coverage is complete on each screen; responsive layouts and contrast/readability are reviewed; no queue or service semantics change.

## Phase 3: Stylist identity and operating-hours updates

- **Objectives:** Present Ramesh, Vinod and Arjun while preserving legacy IDs/relations; align hours display with 9 AM–9 PM after closure policy is decided.
- **Expected candidate files and why:**
  - `src/lib/utils.ts` (initial stylist display identities and recommendations; careful not to alter IDs/services).
  - `server/server.js`, `server/data/database.json`, `supabase-schema.sql` (server defaults, persisted demo rows and seed data).
  - Stylist screens/components: `src/pages/BarberDashboard.tsx`, `LiveDisplay.tsx`, `AdminDashboard.tsx`, `BarberAnalytics.tsx`, `JoinQueue.tsx` (names may be displayed or used in labels/filters).
  - `src/pages/QueueClosed.tsx` and relevant specification/README docs (hours currently differ on weekends).
- **Dependencies:** Use the latest approved six-service catalog while preserving existing IDs/durations; inventory stylist ID references and decide mapping compatibility; clarify whether 9 AM–9 PM is display-only or enforced and whether online check-in closes early.
- **Risks:** Breaking existing queue/stylist foreign keys by changing IDs; confusing historical reviews; unintended change to service recommendation or queue routing.
- **Acceptance criteria:** New names appear consistently; legacy IDs still resolve existing queue rows and routes; no queue/service behavior changes; hours match the approved policy on all displays.

## Phase 4: Backend architecture, Supabase integration and queue synchronization

- **Objectives:** Establish one authoritative write/read model using Node.js and Supabase; preserve cross-device events; address duplicate IDs/tokens and conflict paths.
- **Expected candidate files and why:**
  - `src/stores/queueStore.ts` (optimistic local state and multiple write paths).
  - `src/lib/supabase.ts` (optional client config and browser Realtime channel).
  - `server/server.js` (currently JSON-file API/SSE and not connected to Supabase).
  - `supabase-schema.sql` (schema may need constraints, policies, queue state/timestamp/index decisions; schema edits require migration plan).
  - `src/types/index.ts`, `src/lib/utils.ts` (shared record types, token/wait rules).
  - `vite.config.ts`, `vercel.json`, possibly `.env.example` (API origin/config documentation; `.env.example` would be new).
- **Dependencies:** Decide authority and API contracts, Supabase schema/data migration, SSE vs Supabase Realtime responsibilities, idempotency/token generation, conflict resolution, and rollback.
- **Risks:** Duplicate/lost queue entries, data loss, inconsistent tokens, open realtime policies, client/server record drift, serverless/static hosting mismatch.
- **Acceptance criteria:** Each action persists once; records and tokens agree across screens; concurrent actions preserve FCFS and single-chair semantics; offline/failure behavior is explicit; legacy data remains readable or has a verified migration/rollback.

## Phase 5: Authentication and database security

- **Objectives:** Implement secure server-side staff auth for username `staff`, protect sensitive routes and all mutating APIs, and apply least-privilege database policies.
- **Expected candidate files and why:**
  - `src/stores/authStore.ts`, `src/pages/AdminLogin.tsx`, `src/components/layout/ProtectedRoute.tsx`, `src/App.tsx` (client session and route UX).
  - `server/server.js` (credential verification, session/token validation, authorization middleware, rate limiting/audit as selected).
  - `supabase-schema.sql`, `src/lib/supabase.ts` (review access policy; client uses only publishable/anon key).
  - `.env.example` (potentially document variable names only; absent currently; never include values/secrets).
- **Dependencies:** Select auth/session mechanism, password storage/rotation process, secret manager/runtime configuration, staff permissions, session expiry and recovery policy.
- **Risks:** Exposing credentials in bundle/logs; public queue mutation; overbroad RLS; locking staff out; breaking cross-screen flows.
- **Acceptance criteria:** No source/client hardcoded credential or service key; unauthenticated/unauthorized API actions fail server-side; valid staff can perform required workflows; RLS is verified with role-specific tests; secrets are configured outside source control.

## Phase 6: Vercel and production deployment

- **Objectives:** Deploy frontend on Vercel with reliable deep links and a production Node API/Supabase connection; provide documented environment configuration and health checks.
- **Expected candidate files and why:**
  - `vercel.json` (SPA rewrites and any approved API routing configuration).
  - `vite.config.ts` (development proxy only; production must not assume localhost/same-origin API).
  - `src/lib/supabase.ts` and API client/config module (runtime origins/keys).
  - `server/server.js` (production startup, health/CORS/SSE behavior if deployed separately).
  - `package.json` (build/start scripts only if hosting setup requires them; avoid unnecessary dependency changes).
  - `.env.example` (new, if approved, variable names and safe placeholders); `README.md` (deployment documentation).
- **Dependencies:** Choose Node hosting location and stable API URL; configure Vercel and backend secrets; verify HTTPS, CORS, streaming and Supabase project setup.
- **Risks:** Vercel rewrite swallowing `/api`, SSE incompatibility/timeouts, misconfigured CORS, leaked environment variables, deployment split-brain.
- **Acceptance criteria:** Deep-link refresh works for every route; frontend API calls reach intended backend; health check and realtime stream work in production; no secrets are committed; deployment rollback is documented.

## Phase 7: Regression testing and final verification

- **Objectives:** Verify preserved functionality and all approved migration requirements in browsers and against backend/database; report limitations accurately.
- **Expected candidate files and why:**
  - New test/config files (no test suite exists currently; framework choice to be approved/selected).
  - Existing routes/pages/stores/utilities and `server/server.js` as test targets, not presumptive code changes.
  - `docs/03-flows-rules.md`, `docs/LATECUTS_PRESERVATION_CHECKLIST.md`, `README.md` for accurate final verification notes.
- **Dependencies:** Phases 2–6 complete, test data/environment, approved queue invariants and price decision.
- **Risks:** Mistaking historical `[x]` checklist marks for new verification; testing only one persistence mode; insufficient concurrent/device coverage.
- **Acceptance criteria:** Route and workflow matrix passes; pricing/service and identity decisions match approved specification; queue invariants, auth/RLS and production connectivity have evidence; responsive/localization checks cover all screens; failures and known limits are listed; no feature regressions are accepted.

## Verified candidate file inventory

All application paths above exist in the current repository except `src/lib/localization.ts` (possible new module) and `.env.example` (possible new template). The roadmap lists candidate files only; it does not imply that every candidate must change.
