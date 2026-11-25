# LateCuts Implementation Roadmap

This roadmap retains the original phase sequence and tracks the current LateCuts work. **Status update (2026-11-25):** The owner reports the baseline Vercel frontend and Render/Supabase backend are live and core flows were manually verified. The release-blocker migration `202611250002_queue_release_blockers.sql` and matching API changes are in the repository; the production-backend guide records them as pending application/deployment. Verify migration history and complete staging checks before that rollout. See [`LATECUTS_PRODUCTION_BACKEND.md`](./LATECUTS_PRODUCTION_BACKEND.md) for the current release gates.

| Phase | Current status |
|---|---|
| 1. Baseline and preservation docs | Complete; keep the original documents clearly historical. |
| 2. Brand and localization | Implemented in the repository; full route, Gujarati, and responsive regression review remains a release check. |
| 3. Stylist identity and hours | Display identities and 9 AM–9 PM schedule are represented; verify the join cutoff policy separately. |
| 4. Supabase backend and synchronization | Implemented in the repository and used by the owner-verified live baseline; release-blocker migration rollout remains pending. |
| 5. Authentication and database security | Backend session authentication and restricted database access are implemented; retain final authorization/RLS checks in release verification. |
| 6. Hosting and deployment | Baseline Vercel/Render deployment is owner-reported live; deploy the release-blocker API only after its migration is verified. |
| 7. Regression and final verification | In progress; the focused token/no-show tests do not replace the full route and workflow matrix. |

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
- **Dependencies:** The LateCuts identity, English/Gujarati copy direction, Gujarati font, and visual direction are confirmed. Historical Hindi references belong only to archived source material; verify current routes and Gujarati rendering during regression review.
- **Risks:** Incomplete translations; Gujarati text overflow; replacing visuals in ways that hide controls; stale stored `hi` values; generic global CSS regressions.
- **Acceptance criteria:** All routes still render and all controls/workflows remain; English/Gujarati coverage is complete on each screen; responsive layouts and contrast/readability are reviewed; no queue or service semantics change.

## Phase 3: Stylist identity and operating-hours updates

- **Objectives:** Present Ramesh, Vinod and Arjun while preserving legacy IDs/relations; keep the displayed and configured schedule at 9 AM–9 PM and verify cutoff behavior explicitly.
- **Expected candidate files and why:**
  - `src/lib/utils.ts` (initial stylist display identities and recommendations; careful not to alter IDs/services).
  - `server/server.js`, `server/data/database.json`, `supabase-schema.sql` (server defaults, persisted demo rows and seed data).
  - Stylist screens/components: `src/pages/BarberDashboard.tsx`, `LiveDisplay.tsx`, `AdminDashboard.tsx`, `BarberAnalytics.tsx`, `JoinQueue.tsx` (names may be displayed or used in labels/filters).
  - `src/pages/QueueClosed.tsx` and relevant specification/README docs (hours currently differ on weekends).
- **Dependencies:** The approved six-service catalog and stylist mapping are in place. Verify whether online check-in closes at the displayed cutoff; do not add a new cutoff rule without approval.
- **Risks:** Breaking existing queue/stylist foreign keys by changing IDs; confusing historical reviews; unintended change to service recommendation or queue routing.
- **Acceptance criteria:** New names appear consistently; legacy IDs still resolve existing queue rows and routes; no queue/service behavior changes; hours match the approved policy on all displays.

## Phase 4: Backend architecture, Supabase integration and queue synchronization

- **Objectives:** Maintain the Node.js/Supabase authoritative read/write model, preserve cross-screen events, and complete the approved queue release-blocker rollout.
- **Expected candidate files and why:**
-  - `server/server.js` (current API; release-blocker behavior needs the matching migration before rollout).
  - `supabase/migrations/202611250001_latecuts_backend.sql` and `202611250002_queue_release_blockers.sql` (versioned database changes; verify staging and target migration history).
  - `src/stores/queueStore.ts`, `src/lib/api.ts`, and `src/lib/queueToken.js` (API hydration, queue view, and displayed token formatting).
  - `src/types/index.ts` and `src/lib/utils.ts` (shared records and display normalization).
  - `vite.config.ts`, `vercel.json`, and `.env.example` (local proxy, SPA routing, and placeholder configuration).
- **Dependencies:** Verify the staging schema, migration history, API/migration compatibility, idempotency, privacy/RLS, SSE behavior, and rollback plan. Keep Supabase authoritative and avoid restoring JSON or browser-side privileged access.
- **Risks:** Duplicate/lost queue entries, data loss, inconsistent tokens, open realtime policies, client/server record drift, serverless/static hosting mismatch.
- **Acceptance criteria:** Each action persists once; records and tokens agree across screens; concurrent actions preserve FCFS and single-chair semantics; offline/failure behavior is explicit; legacy data remains readable or has a verified migration/rollback.

## Phase 5: Authentication and database security

- **Objectives:** Preserve the implemented server-side staff authentication and least-privilege access; verify the auth and database rules against the deployed release candidate.
- **Expected candidate files and why:**
-  - `src/stores/authStore.ts`, `src/pages/AdminLogin.tsx`, `src/components/layout/ProtectedRoute.tsx`, and `src/App.tsx` (session UX and route coverage).
  - `server/server.js` (backend credential validation, signed sessions, and authorization checks).
  - `supabase/migrations/` (RLS and grants; do not apply against production without the release process).
  - `.env.example` (variable names and placeholders only; never include actual credentials).
- **Dependencies:** Keep secret rotation, session expiry, recovery, and staff permissions documented; run role-specific tests in staging.
- **Risks:** Exposing credentials in bundle/logs; public queue mutation; overbroad RLS; locking staff out; breaking cross-screen flows.
- **Acceptance criteria:** No source/client hardcoded credential or service key; unauthenticated/unauthorized API actions fail server-side; valid staff can perform required workflows; RLS is verified with role-specific tests; secrets are configured outside source control.

## Phase 6: Vercel and production deployment

- **Objectives:** Maintain the owner-verified Vercel/Render/Supabase deployment, and release the current queue fixes only after the forward migration and staging checks pass.
- **Expected candidate files and why:**
-  - `vercel.json`, `render.yaml`, and `package.json` (existing SPA, backend start, and build configuration).
  - `src/lib/api.ts` and Vite configuration (production API origin versus local proxy).
  - `server/server.js` (health, exact-origin CORS, API, and SSE behavior).
  - `docs/LATECUTS_PRODUCTION_BACKEND.md` and `README.md` (release instructions/status; no secrets).
- **Dependencies:** Verify the exact deployed origins and current migration history in the provider dashboards; do not infer or publish secret values.
- **Risks:** Vercel rewrite swallowing `/api`, SSE incompatibility/timeouts, misconfigured CORS, leaked environment variables, deployment split-brain.
- **Acceptance criteria:** Deep-link refresh works for every route; frontend API calls reach intended backend; health check and realtime stream work in production; no secrets are committed; deployment rollback is documented.

## Phase 7: Regression testing and final verification

- **Objectives:** Verify preserved functionality and the approved migration requirements in browsers and against staging/backend/database; report limitations accurately.
- **Expected candidate files and why:**
  - `tests/queueToken.test.js` and `tests/noShowPolicy.test.js` (existing focused Node tests; add coverage only for approved gaps).
  - Existing routes/pages/stores/utilities and `server/server.js` as test targets, not presumptive code changes.
  - `docs/03-flows-rules.md`, `docs/LATECUTS_PRESERVATION_CHECKLIST.md`, `README.md` for accurate final verification notes.
- **Dependencies:** Phases 2–6 complete, test data/environment, approved queue invariants and price decision.
- **Risks:** Mistaking historical `[x]` checklist marks for new verification; testing only one persistence mode; insufficient concurrent/device coverage.
- **Acceptance criteria:** Route and workflow matrix passes; pricing/service and identity decisions match approved specification; queue invariants, auth/RLS and production connectivity have evidence; responsive/localization checks cover all screens; failures and known limits are listed; no feature regressions are accepted.

## Verified candidate file inventory

All candidate paths above were checked against the current repository. `src/lib/locale.tsx`, `.env.example`, both listed migrations, and the focused Node test files exist. Candidate lists do not imply that every file must change.
