# LateCuts --- Vibe Coding Prompt Log

> **Submission note:** This file is a carefully reconstructed,
> project-specific prompt log based on the development work and project
> history available to us. It is not a verbatim export of every message.
> The lab asks for every prompt in order, including prompts that did not
> work; before final submission, compare this reconstruction with your
> actual ChatGPT/Codex history and add any missing or unsuccessful
> prompts. Do not present reconstructed wording as an exact transcript.

## Project context used throughout

-   **Project:** Salon Queue Management System, branded **LateCuts**
-   **Purpose:** Help salon customers select services and a stylist,
    join a live queue, and track their token; allow barbers and
    reception staff to manage the queue; provide a public lounge
    display.
-   **Frontend:** React, TypeScript, Vite, Tailwind CSS, Zustand
-   **Backend:** Node.js API in `server/server.js`
-   **Database:** Supabase PostgreSQL, with database functions/RPCs for
    queue mutations
-   **Deployment:** Vercel frontend, Render backend, Supabase database
-   **Languages:** English and Gujarati
-   **Visual direction:** Premium dark charcoal interface with muted
    gold/copper accents
-   **Important constraints:** Keep service data authoritative in the
    backend/database; keep secrets server-side; preserve existing IDs,
    queue records, private pass tokens, and workflow unless a change
    explicitly requires otherwise.

## 1. Establish the project brief and architecture

**Representative prompt**

> Read the project brief and treat `AGENTS.md`, `docs/01-brief.md`,
> `docs/02-screens.md`, and `docs/03-flows-rules.md` as the product
> requirements. Build LateCuts as a salon queue management system, not a
> generic appointment-booking template. Keep the customer, barber,
> reception, and lounge-display workflows consistent with those
> documents. Before implementing a feature, inspect the existing code
> and preserve established routes, IDs, and behavior.

**Follow-up constraint**

> If the documents conflict with assumptions or an existing
> implementation, identify the conflict first. Do not silently invent a
> new workflow or replace the project's chosen stack.

## 2. Create the premium LateCuts interface

**Representative prompt**

> Refine the UI into a premium salon experience using a dark
> charcoal/near-black background, restrained gold/copper accents, clear
> typography, generous spacing, and responsive layouts. Make the
> customer join flow easy to use on a phone. Avoid excessive badges,
> decorative clutter, or generic dashboard styling. Keep the interface
> branded LateCuts and use English and Gujarati---not Hindi.

**Screen-specific prompt**

> Review the customer Join Queue, Customer Token, Barber Dashboard,
> Reception/Admin Dashboard, and Lounge Display screens. Make each
> screen visually consistent while retaining its distinct job and
> existing navigation. Check the mobile layout as well as desktop.

## 3. Keep the service catalog correct

**Representative prompt**

> Use the backend's service catalog as the source of truth. Do not
> hardcode prices or durations in React. Preserve the existing service
> IDs and API contract. Confirm the displayed catalog matches these
> approved services:
>
> -   Classic Cut --- ₹199, 25 minutes, `classic-cut`
> -   Beard Style --- ₹149, 20 minutes, `beard-sculpt`
> -   Fade --- ₹299, 35 minutes, `royal-fade`
> -   Kids Cut --- ₹149, 20 minutes, `kids-cut`
> -   Hair Spa --- ₹149, 45 minutes, `head-spa`
> -   D-Tan --- ₹499, 90 minutes, `bridal`
>
> Customers may select multiple services; show the combined price and
> duration accurately.

## 4. Implement customer queue joining

**Representative prompt**

> Implement the customer check-in flow: load services from the API,
> allow service selection, allow a preferred stylist or "Any Stylist,"
> collect the customer's name, submit the join request, and display the
> returned queue token and status. Handle loading, empty, and error
> states clearly. Do not generate fake success when the API request
> fails.

**Validation prompt**

> Verify that a successful join creates a real queue entry and that the
> customer token page uses the returned record and private pass token.
> Do not expose the private pass token in public queue displays or logs.

## 5. Build barber, reception, and lounge workflows

**Representative prompt**

> Connect the barber dashboard to the real queue API. A barber should
> see the relevant queue, call the next customer, manage the current
> service, and complete or mark a customer absent according to the
> documented rules. Keep stylist routes such as `/barber/ramesh`,
> `/barber/vinod`, and `/barber/arjun` working.

**Reception prompt**

> Keep reception operations distinct from barber operations. Support the
> documented walk-in and waiting-entry management workflow, enforce
> staff authorization on protected mutations, and show clear feedback
> when an action is rejected.

**Display prompt**

> Keep the public `/display` lounge screen readable from a distance.
> Show public queue information only; never display private customer
> pass tokens or staff credentials.

## 6. Connect the backend and Supabase safely

**Representative prompt**

> Review the Node.js backend and Supabase integration. Use Supabase
> PostgreSQL for persistent production queue data and database RPCs for
> queue mutations that need transaction safety. Keep the service-role
> key, staff PIN, and session secret exclusively in Render backend
> environment variables. Never place them in Vite variables, frontend
> bundles, committed files, or logs.

**Migration prompt**

> Review the existing migration history before writing SQL. Create
> forward-only migrations that preserve current records and established
> IDs. Do not run sample-data reset functions, destructive SQL, or a
> migration against production without explicit approval. Explain the
> intended impact and how to verify it.

## 7. Configure production hosting

**Representative prompt**

> Prepare LateCuts for the existing deployment: Vercel for the React
> frontend, Render for the Node API, and Supabase PostgreSQL for
> storage. Use the existing repository and production services. Document
> the required environment variables by name, but do not print secret
> values. Remember that Vite environment changes require a frontend
> rebuild and redeployment.

**CORS troubleshooting prompt**

> The frontend and backend are deployed separately. Inspect the actual
> browser origin and the backend CORS allowlist. Add only the exact
> required production origin, retain existing valid origins, and avoid
> wildcard CORS. Do not change unrelated environment variables or create
> a second production project.

## 8. Diagnose production errors using evidence

**Representative prompt**

> Investigate the deployed error using the browser symptom, the exact
> backend endpoint, and deployment logs. First verify the correct health
> route from the code; do not guess endpoint names. Compare the frontend
> request origin with the backend CORS configuration. Make the smallest
> evidence-based fix and tell me how to verify it before redeploying.

**Observed debugging lesson**

> When the service menu failed to load, the services API itself returned
> the expected six services. The frontend's current Vercel origin needed
> to be included in Render's CORS allowlist. Verify the deployed domain
> rather than assuming an older deployment URL is still current.

## 9. Perform the release audit

**Representative prompt**

> Audit LateCuts before release. Separate code-review findings,
> automated checks, owner-reported manual tests, and tests that remain
> unverified. Review queue ordering, estimates, stylist availability,
> no-show timing, staff authorization, database migration safety, CORS,
> deployment state, and repository hygiene. Do not claim full production
> signoff if staging database workflows have not been exercised.

## 10. Fix the queue release blockers

**Representative prompt**

> Implement the approved release-blocker fixes only:
>
> 1.  Recalculate waiting positions and estimates after queue changes
>     using the established queue order and documented formula.
> 2.  Reject new assignments to unavailable stylists. For "Any Stylist,"
>     select an available stylist server-side using the documented
>     queue-balancing rule.
> 3.  Enforce the ten-minute no-show threshold using database time after
>     the customer is called.
>
> Preserve current queue records, service IDs, stylist IDs, private pass
> tokens, routes, and existing cancellation/removal authorization. Add
> focused regression tests. Do not apply SQL, commit, push, or deploy
> until reviewed.

## 11. Verify and release the blocker fix

**Representative prompt**

> Run the production build, test suite, server syntax check, and Git
> diff checks. Review exactly which files changed. Commit only the
> approved implementation, migration, and tests; exclude `.env.example`,
> unrelated README changes, customer data, and secrets. Push to `main`,
> but do not deploy until the migration has been reviewed and applied in
> the correct environment.

## 12. Update the token branding from LX to LC

**Representative prompt**

> Change the customer-facing queue token prefix from `LX` to `LC`
> throughout LateCuts. First find where the token is generated and where
> it is displayed. Keep existing database token values, queue IDs, queue
> ordering, and private pass-token UUIDs unchanged. Use a shared
> formatter so customer, barber, reception, analytics, display,
> notifications, and exports remain consistent. Add a test for `LX-03`
> displaying as `LC-03`. Determine whether a migration is actually
> necessary; do not run SQL without approval.

## 13. Prepare the Vibe Coding Lab submission

**Representative prompt**

> Prepare the repository for the lab submission. Put the live demo URL
> at the very top of `README.md`, immediately after the required project
> title. Include hosting details and safe evaluator staff access. Keep
> `prompts.md` contextual to the actual LateCuts project and distinguish
> reconstructed prompts from a verbatim transcript. Write a half-page
> reflection describing one real agent mistake, how I noticed it, and
> how the prompt or documentation was improved. Plan a three-minute
> mobile demo that shows the main customer-to-staff flow.

## Final note

This log captures the major prompt themes and decisions in the project.
It should be supplemented with the original prompt history---including
unsuccessful prompts and debugging attempts---if the submission rubric
requires a complete chronological transcript.
