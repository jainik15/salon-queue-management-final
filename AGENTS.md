# AGENTS.md — LateCuts Project Rules

> The original LUXE CUTS identity and baseline specifications remain in the historical project documents. For current product decisions, use [`docs/LATECUTS_PROJECT_SPECIFICATION.md`](docs/LATECUTS_PROJECT_SPECIFICATION.md) and [`docs/LATECUTS_PRESERVATION_CHECKLIST.md`](docs/LATECUTS_PRESERVATION_CHECKLIST.md).

## Project overview

LateCuts is a salon queue and floor-management application. The current stack is React, TypeScript, Vite, Zustand, a Node.js API, Supabase PostgreSQL, Vercel, and Render.

## Product identity

- Use the LateCuts name and premium dark luxury visual direction.
- Supported interface languages are English and Gujarati. Do not introduce Hindi as a product language.
- The official service catalog and prices are listed in the current project specification. Preserve the catalog IDs, durations, ordering, selection behavior, and queue calculations unless specifically approved.
- Display Ramesh, Vinod, and Arjun while preserving the existing stylist IDs and relationships.

## Architecture and data

- `src/stores/queueStore.ts` is the client-side queue view cache. The Node API and Supabase PostgreSQL are the shared persistence path.
- Queue reads, writes, validation, and protected mutations go through `server/server.js`; do not restore the legacy JSON file as a source of truth or fallback.
- Supabase migrations are versioned under `supabase/migrations/`. Check the target project's migration history before applying SQL. Never reset, reseed, or delete customer/queue data without an approved backup and explicit authorization.
- Server-Sent Events carry the API's event notices. `BroadcastChannel` is an invalidation signal only; do not put customer records or private tokens in it.
- Preserve existing routes, API contracts, queue workflows, and historical record references when making changes.

## Security

- Staff authentication is server-side. The username is `staff`; the secure `STAFF_PIN` and `STAFF_SESSION_SECRET` are backend environment variables only.
- Keep `SUPABASE_SERVICE_ROLE_KEY` on the Node host. Never expose it through Vite, `VITE_*` variables, browser code, logs, or documentation.
- Protect staff API mutations with the signed server session. Client route guards are not an authorization boundary.
- Keep CORS configured with exact approved origins. Never use wildcard CORS.
- Do not commit real `.env` files, credentials, private database files, or customer data.

## Change and verification rules

- Keep product copy and documentation aligned with the latest confirmed LateCuts decisions; label original LUXE CUTS material as historical rather than treating it as current requirements.
- Do not change service behavior, queue rules, authentication, schema, or deployment settings as incidental cleanup.
- Before code changes, inspect the actual route/component/data path and existing working-tree changes. Preserve unrelated local edits.
- Run the relevant build and tests for code changes. Report checks that could not be performed; do not claim unverified production behavior.
- Do not apply production SQL, alter external accounts, deploy, or publish without explicit authorization.
