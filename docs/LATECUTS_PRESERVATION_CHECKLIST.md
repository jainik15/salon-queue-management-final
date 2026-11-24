# LateCuts Feature Preservation Checklist

## Purpose and evidence rules

This checklist records the behavior present in the repository before the LateCuts conversion. Its baseline was inspected in `src/`, `server/`, `supabase-schema.sql`, `package.json`, `vercel.json`, and the original project documentation. LUXE CUTS, Hindi labels, and Zara/Marcus/Dev are historical baseline identity details; the confirmed LateCuts identity is in `LATECUTS_PROJECT_SPECIFICATION.md`.

Status terms:

- **Present in code** means a corresponding route, component, store method, API, or utility exists. It does not claim production readiness.
- **Partial / caveat** means code exists but does not fully meet the documented rule, is only local, or has known synchronization/security limits.
- **Not found** means the requested feature is not currently implemented as described; preserve existing behavior and treat the capability as future work.
- **Must preserve** applies to the conversion. Verification steps below are future checks; no such checks are claimed as passed here.

## Customer experience

| Feature | Existing implementation location | Current behavior and evidence | Preserve? | Future verification method |
|---|---|---|---|---|
| Guest check-in | `src/pages/JoinQueue.tsx`; `queueStore.addToQueue`; `POST /api/queue/join` | Public `/join` form checks name and at least one service, creates a local entry, and navigates to its token. Browser, server and Supabase may diverge. | Yes | Submit a guest and verify one consistent entry and token in store, server/database, and customer view. |
| Multiple-service selection | `JoinQueue.tsx`; `src/lib/utils.ts` (`SERVICES`) | Selectable services sum duration and price; service names are joined into one summary string. | Yes | Select several services and compare displayed totals and stored summary. |
| Stylist selection and recommendation | `JoinQueue.tsx`; `INITIAL_BARBERS`; `queueStore.addToQueue` | Offers a fastest available choice and specific stylists; maps service categories to a recommended stylist. Fastest selection uses available stylists sorted by queue count. | Yes | Check each service recommendation, explicit stylist lock, unavailable stylist, and tie behavior. |
| Queue position and wait estimate | `queueStore.ts`; `src/lib/utils.ts`; `CustomerToken.tsx` | Entry position and wait are shown; creation currently uses `position * avg_duration`, while `getWaitTime` uses `(position - 1) * avg_duration`. Recalculation on all queue changes is not established. | Yes; retain current intended queue behavior pending explicit rule changes | Compare displayed position/wait with an agreed calculation after join, call, completion and cancellation. |
| Digital token | `CustomerToken.tsx`; `/token/:id` and `/status/:id` | Shows token, status steps, queue position/wait, service and stylist details, elapsed wait, and a cancellation confirmation. | Yes | Open a newly issued token and an existing token by both route aliases; reload and verify correct entry. |
| Live token updates | `queueStore.initRealtimeSync`; `LiveToast.tsx`; SSE/BroadcastChannel/Supabase listeners | Store subscribes to backend SSE and BroadcastChannel, and optionally Supabase Realtime. This is partial because the layers can disagree and backend calls do not consistently adopt returned records. | Yes | Use separate browser sessions and verify join/call/done/cancel updates propagate once and remain consistent. |
| Cancellation flow | `CustomerToken.tsx`; `queueStore.updateStatus`; Supabase update | Confirmation UI sets status to `absent`; status transition constraints are not enforced centrally. | Yes | Confirm and dismiss cancellation; confirm cancellation propagates and cannot be undone by a stale client. |
| Notifications and chimes | `src/lib/audio.ts`; `CustomerToken.tsx`; `LiveDisplay.tsx`; `LiveToast.tsx` | Web Audio synthesizes the 528/1056 Hz chime; display can announce calls; BroadcastChannel activity creates toasts. Browser autoplay may affect audio. | Yes | Trigger call events with sound enabled/disabled and verify one chime/toast per event on supported browsers. |
| Customer feedback and reviews | `src/pages/CustomerFeedback.tsx`; `queueStore.addFeedback`; `BarberAnalytics.tsx` | Public feedback route records rating/comment/aspects in local storage and feeds local analytics. Review persistence is not wired to Node/Supabase. | Yes | Submit a review, reload, and verify it appears once in analytics; verify agreed persistent storage after migration. |
| Salon closed screen | `src/pages/QueueClosed.tsx`; `/closed` | Shows a live countdown and weekly hours. Current code lists weekdays 9–9 and weekends 8:30–9:30; route is not an enforced closure gate. | Yes, update hours only in its planned phase | Verify displayed schedule/countdown at open/close boundaries and confirm join behavior against approved policy. |

## Stylist experience

| Feature | Existing implementation location | Current behavior and evidence | Preserve? | Future verification method |
|---|---|---|---|---|
| Individual stylist dashboards | `src/pages/BarberDashboard.tsx`; `/barber/:id` | One parameterized cockpit resolves a stylist identifier; there are no separate source files per stylist. Route is public. | Yes; retain IDs/references where possible | Open each retained ID and verify the correct stylist and queue are shown. |
| Current customer | `BarberDashboard.tsx`; `queueStore.getCurrentlyServing` | Displays the entry with `serving` status for that stylist. Store logic does not enforce the one-chair invariant on every path. | Yes | Verify at most one current customer per stylist under simultaneous call attempts. |
| Next customer | `queueStore.getBarberQueue`; `callNext` | Waiting entries are ordered by join timestamp; next waiting entry is selected by stylist ID. | Yes | Create ordered entries and confirm each stylist receives their own earliest waiting entry. |
| Service timer and overtime alert | `BarberDashboard.tsx` | Timer advances from `timestamp_called`; pace display and overtime warning compare elapsed time to service duration. | Yes | Verify timer start, minute progression, cleanup, overtime boundary and completed-state reset. |
| Call next | `BarberDashboard.tsx`; `queueStore.callNext`; `POST /api/queue/call-next` | Changes a waiting entry to serving locally and requests the same action from Node; server can select a different entry if the queue has diverged. No robust concurrency guard is present. | Yes | Call next once and concurrently; verify the same entry is served once and only one chair is occupied. |
| Mark done | `BarberDashboard.tsx`; `queueStore.markDone`; `POST /api/queue/mark-done` | Marks completed, records timestamp, updates stylist completed count in local/server state. | Yes | Complete a serving entry and verify queue status, counter, timestamps and analytics. |
| Mark absent / no-show | `BarberDashboard.tsx`; `queueStore.markAbsent`; API endpoint | Marks an entry absent. The flow exists; the documented 10-minute threshold/re-add-to-end policy is not enforced in code. | Yes; distinguish current action from documented policy | Mark absent and verify current line/counters; separately verify any approved timeout/re-entry behavior. |
| Break toggle | `BarberDashboard.tsx`; `queueStore.updateBarberStatus`; `POST /api/barbers/status` | Toggles available/break status; new fastest assignments filter to available stylists. | Yes | Toggle each status and verify all clients and fastest selection respond consistently. |

## Reception and administration

| Feature | Existing implementation location | Current behavior and evidence | Preserve? | Future verification method |
|---|---|---|---|---|
| Staff login | `src/pages/AdminLogin.tsx`; `src/stores/authStore.ts`; `POST /api/auth/login` | PIN and username/PIN modes submit to backend validation; no client credential fallback. An unconfigured backend rejects staff sign-in safely. | Preserve the login form, redirect, route guard, session, and logout flow; keep `STAFF_PIN` server-only | Verify valid and invalid credentials, missing configuration, logout, and route protection. |
| Protected routes | `ProtectedRoute.tsx`; `App.tsx` | Client-side guard wraps `/reception`, `/admin`, `/analytics`. It trusts localStorage and backend queue endpoints do not enforce auth. | Yes; strengthen only in planned security phase | Direct-load protected routes and call protected APIs with no/invalid session. |
| Reception dashboard | `App.tsx` `/reception`; `src/pages/AdminDashboard.tsx` | `/reception` renders the same dashboard component as `/admin`; there is no distinct reception implementation. | Yes | Verify both aliases render all intended queue controls and preserve redirects. |
| Admin dashboard | `src/pages/AdminDashboard.tsx`; `/admin` | KPIs, queue/history tabs, quick actions, queue ledger, search/filter, simulator, QR and reset controls. | Yes | Walk all dashboard actions and confirm current/history views and KPI totals. |
| Walk-in creation | `AdminDashboard.tsx`; `queueStore.addToQueue` | Modal adds a named guest with one selected service and stylist to the same queue store. | Yes | Add walk-in and verify it appears in token, stylist, display, and admin views. |
| Queue search and filtering | `AdminDashboard.tsx` | Filters ledger by text and stylist; tabs separate live queue and completed history. | Yes | Check matching/nonmatching names/tokens, stylist filters and history state. |
| Customer simulator | `AdminDashboard.tsx` | Manual injection and Play/Pause interval toggle exist; toggle state is component-local and interval is about 20 seconds. | Yes; retain enable/disable control | Enable, confirm periodic entry, disable, confirm no more simulated entries; navigate away/back and verify agreed persistence behavior. |
| QR code | `src/components/ui/QRCode.tsx`; `AdminDashboard.tsx`; `LiveDisplay.tsx` | Admin and display can show a QR code for the `/join` URL. | Yes | Scan both QR surfaces and verify they open the correct deployment origin and join route. |
| Sample-data reset | `queueStore.resetToSampleData`; `POST /api/database/reset` | Clears browser keys and resets local data/Node JSON to defaults. It does not reset Supabase tables or necessarily synchronize all layers. | Yes; retain reset function with appropriate access | Reset in a controlled test and verify each configured persistence layer returns to the same sample state. |
| Owner settings | No settings route/component found; current admin page only has queue operations, simulator and reset | Service management, queue open/closed controls, and operating-hours settings are specified in older guidance but not implemented as an owner-settings feature. | Preserve existing admin controls; no current settings feature to regress | Confirm future requirements/UI before adding; verify each setting persists and affects the documented flow. |

## Lounge display

| Feature | Existing implementation location | Current behavior and evidence | Preserve? | Future verification method |
|---|---|---|---|---|
| Stylist columns | `src/pages/LiveDisplay.tsx` | Station cards are generated from the stylist collection, currently in a three-column layout at wide sizes. | Yes | Verify all three stations appear at desktop/TV and adapt on mobile. |
| Currently serving | `LiveDisplay.tsx`; queue selector | Shows serving customer/token for each station and animated visualizer. | Yes | Call a customer and verify the correct station updates. |
| Upcoming customers | `LiveDisplay.tsx`; queue selectors | Shows each stylist's waiting entries with tokens and wait details. | Yes | Add/call/complete entries and verify order and estimates. |
| Live queue updates | Zustand store and realtime listeners | Display consumes shared store updates; end-to-end cross-device consistency is partial. | Yes | Change state in a different device/session and verify display updates without refresh. |
| QR access | `LiveDisplay.tsx`; `QRCode.tsx` | Interactive QR popover points to `/join`. | Yes | Scan from lounge screen and verify URL/route. |

## Analytics

| Feature | Existing implementation location | Current behavior and evidence | Preserve? | Future verification method |
|---|---|---|---|---|
| Today/week/month filters | `src/pages/BarberAnalytics.tsx` | Time-range selector recalculates local analytics. Data completeness depends on the active store. | Yes | Seed records in each range and compare inclusion boundaries. |
| Stylist filters | `BarberAnalytics.tsx` | All-stylist and individual-stylist filters are present. | Yes | Verify each stylist filter changes every relevant metric/chart. |
| KPIs | `BarberAnalytics.tsx` | Served, durations, utilization and review-related summary values derive from current queue/reviews. | Yes | Compare each KPI with a controlled data set and document formula. |
| Hourly histogram | `BarberAnalytics.tsx` | Hourly distribution derives from join timestamps. | Yes | Use entries at known hours and verify bucket/count/scale. |
| Service distribution | `BarberAnalytics.tsx` | Distribution derives from service strings in queue records. | Yes | Include single and multi-service records and verify grouping behavior. |
| CSV export | `BarberAnalytics.tsx` | Export action downloads a CSV from current analytics data. | Yes | Export and inspect headers, escaping, row count and selected filters. |

## General application behavior

| Feature | Existing implementation location | Current behavior and evidence | Preserve? | Future verification method |
|---|---|---|---|---|
| Routes | `src/App.tsx`; `vercel.json` | `/`, `/join`, `/token/:id`, `/status/:id`, `/display`, `/barber/:id`, `/login`, `/reception`, `/admin`, `/analytics`, `/feedback/:token`, `/closed`, and wildcard route. | Yes; keep paths and aliases | Direct-load and refresh each route in local and deployed environments; verify intended guard behavior. |
| 404 page | `src/pages/NotFound.tsx`; wildcard route | Invalid paths render a branded not-found page with a return action. | Yes | Open unknown URL and use return action. |
| Responsive layouts | Page/component Tailwind classes and `src/index.css` | Responsive classes are present throughout, but no automated viewport suite is defined. | Yes | Manually inspect customer, stylist, admin, analytics and TV views at mobile/tablet/desktop sizes. |
| Toast notifications | `src/components/ui/LiveToast.tsx`; BroadcastChannel | Global toasts listen for browser broadcast events. | Yes | Trigger each supported broadcast action and verify message, duration and dismissal. |
| Audio notifications | `src/lib/audio.ts`; token/display pages | Chime is procedurally synthesized with Web Audio. | Yes | Verify trigger and mute/sound controls under browser audio restrictions. |
| Confetti | `src/lib/confetti.ts`; `CustomerFeedback.tsx` | Canvas particle effect is invoked for high customer rating submission. | Yes | Submit a five-star review and verify one animation, cleanup and reduced-motion/accessibility considerations. |
| Realtime synchronization | `queueStore.ts`; `server/server.js`; `src/lib/supabase.ts` | localStorage + BroadcastChannel, optional Node/SSE and optional Supabase Realtime all exist. Writes are optimistic and layers are not a single source of truth. | Yes; preserve user-visible cross-screen behavior while consolidating safely | Run multi-tab/device integration scenarios with backend and Supabase independently enabled/disabled; check duplicates and stale writes. |
| Queue business rules | `queueStore.ts`; `server/server.js`; `docs/03-flows-rules.md` | Intended FCFS per stylist, stylist isolation, available-stylist balancing, one serving chair, terminal statuses and wait estimates are documented. Several invariants are not enforced uniformly in code. | Yes; do not silently alter semantics | Build rule-focused tests for ordering, status transitions, concurrency, break routing, wait calculations and cancellation/no-show behavior. |

## Cross-cutting verification gates

- Capture baseline behavior before implementation; existing checklist items marked `[x]` in `docs/03-flows-rules.md` are historical claims, not proof of current automated test coverage.
- Verify all routes and workflows against one authoritative queue record across browser, Node.js and Supabase when each is configured.
- Retain stylist IDs `zara`, `marcus`, and `dev` during identity conversion unless a reviewed migration proves otherwise; preserve legacy queue references.
- Preserve service IDs, selection behavior and existing durations while using the latest approved LateCuts names and prices from `src/lib/utils.ts`. Legacy queue/review values must remain readable and display with current catalog names; do not rewrite persisted records as part of this UI update.
- Keep the simulator available with a clear enable/disable control.
- Treat owner settings, secure authentication, production API routing, and reliable persistence as future implementation work, not current verified capabilities.
