# LateCuts — Salon Queue Management

**Live demo:** https://salon-queue-management-final.vercel.app/
**Hosted on:** Vercel (frontend) + Render (backend)

## ✂️ About LateCuts

- **GitHub repository:** https://github.com/jainik15/salon-queue-management-final
- **Database:** Supabase PostgreSQL
- **Staff demo access:** Pending — the submission guide asks for test access. Use a separate demo environment with synthetic data and a temporary PIN configured privately; never publish the production PIN.

**LateCuts** is a same-day salon queue and floor-management application for guest check-in, digital passes, stylist stations, reception operations, lounge display, analytics, and feedback.

The current product direction is premium dark luxury. The application uses React, TypeScript and Vite with a Node.js API, Supabase PostgreSQL storage, Server-Sent Events, and server-validated staff sessions. The ignored local JSON file is not an API fallback or production data source.

> Historical project notes are retained for context. Current LateCuts decisions and preservation requirements are documented under `docs/`.

**Deployment:** The owner confirms the live demo above is the current Vercel frontend. The Node.js API runs on Render and uses Supabase PostgreSQL. Production credentials and environment values are not stored in this repository. See [`docs/LATECUTS_PRODUCTION_BACKEND.md`](./docs/LATECUTS_PRODUCTION_BACKEND.md) for architecture and verification limits.

### Active service catalog

| Service | Price |
| --- | ---: |
| Classic Cut | ₹199 |
| Beard Style | ₹149 |
| Fade | ₹299 |
| Kids Cut | ₹149 |
| Hair Spa | ₹149 |
| D-Tan | ₹499 |

---

## 🎨 LateCuts Design Direction

- **Palette:** Obsidian `#171512`, espresso `#29241E`, copper gold `#C78B43`, warm ivory `#F3EBDD`, and muted taupe `#887B68`.
- **Typography:** Playfair Display headings, DM Sans controls and body copy, and Noto Sans Gujarati for Gujarati text.
- **Queue feedback:** Web Audio chimes, token progress, and feedback confetti remain part of the application.
- **Zero-Dependency Web Audio Chime:**
  - Harmonics synthesized in pure browser code (528 Hz + 1056 Hz Solfeggio tones) without any external audio asset files.
- **Canvas Physics Confetti:**
  - Interactive multi-particle celebration burst on 5-star customer feedback submissions.

---

## ⚡ LateCuts Backend Architecture

1. **Node.js API (`server/server.js`):** Persistent REST API and SSE, intended for a Render web service. It uses Supabase as the authoritative store and no longer reads or writes the legacy JSON file.
2. **Supabase PostgreSQL:** The server-only service-role client handles data access; the browser does not connect directly. The owner reports that production health and queue flows use the Supabase-backed API. The exact migration version is not independently confirmed in this audit; check Supabase migration history before applying any SQL. The root `supabase-schema.sql` is historical, inert and must not be applied.
3. **Frontend state:** Zustand hydrates from the API. Cross-tab BroadcastChannel messages only request a refresh and contain no customer records.

---

## 🧭 Complete Screen Directory

| Route | Target User | Description |
| :--- | :--- | :--- |
| `/` | Public | Redirects to `/join` |
| `/join` | Guest | Check-in, service selection, and stylist preference |
| `/token/:id` | Guest | Private digital pass, status, wait estimate, and cancellation |
| `/status/:id` | Guest | Alias for the customer pass route |
| `/display` | Lounge | Public lounge board with redacted customer names |
| `/barber/:id` | Staff | Stylist station; existing IDs `zara`, `marcus`, and `dev` display as Ramesh, Vinod, and Arjun |
| `/login` | Staff | Backend-validated staff sign-in |
| `/reception` | Staff | Reception queue operations |
| `/admin` | Staff | Queue management and simulator controls |
| `/analytics` | Staff | Filters, performance summaries, charts, and CSV export |
| `/feedback/:token` | Guest | Private completed-pass feedback |
| `/closed` | Public | Salon hours and closure screen |
| `*` | Public | Not-found screen |

---

## 🚀 Quickstart & Running Locally

### 1. Unified Concurrent Startup (Frontend + Backend Server)
Both the Node.js API server (`localhost:3001`) and the Vite development server (`localhost:5173`) start concurrently with one single command:

```bash
npm ci
# Create a private, ignored root .env with the backend variables listed below.
# Do not place real secrets in VITE_* variables or commit them.
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.
Without Supabase and secure staff credentials configured, API data and sign-in fail closed; the legacy JSON file is not used as a fallback. Local Vite proxies `/api` to `http://localhost:3001`, so leave `VITE_API_BASE_URL` unset during local development.

### 2. Standalone Commands
- **Frontend only:** `npm run dev:client` (starts Vite on `http://localhost:5173`)
- **Backend server only:** `npm run server` (starts Node.js API on `http://localhost:3001`)
- **Production build:** `npm run build` (type-checks and bundles to `/dist`)

---

## Environment variables

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STAFF_PIN`, `STAFF_SESSION_SECRET`, and `CORS_ALLOWED_ORIGINS` are backend-only variables. Configure them privately on Render; do not use a `VITE_` prefix.
- `STAFF_PIN` is a private six-digit PIN. `STAFF_SESSION_SECRET` must be at least 32 bytes.
- `VITE_API_BASE_URL` is public frontend configuration. Leave it unset for local Vite proxying; set it to the Render HTTPS API origin in Vercel.
- `.env` and `.env.local` are ignored by Git. Use placeholders in examples; never publish operational credentials.
- `PORT` is optional locally; Render supplies it. Keep `ENABLE_SAMPLE_DATA_RESET` disabled in production (production API blocks it regardless).

### Storage and synchronization

Supabase PostgreSQL is the authoritative persistent store. The Node.js API uses the service-role key server-side; the browser never connects directly to Supabase. Zustand holds a client-side view cache, SSE notifies connected clients of changes, and BroadcastChannel messages only request a refresh. `server/data/database.json` is legacy local data and is not read as a fallback. The root `supabase-schema.sql` is deprecated historical material; use the reviewed files under `supabase/migrations/` only after verifying the target project and migration history.

## 📡 Backend REST API Endpoints

- `GET /api/health` — API and Supabase connectivity; no customer counts.
- `GET /api/events` — Redacted Server-Sent Events stream.
- `POST /api/auth/login` — Verify backend staff credentials and issue a signed session.
- `GET /api/queue` — Anonymous active-queue projection, or full staff data with a valid bearer session.
- `GET /api/services` — Active database service catalog.
- `GET /api/queue/entry/:accessToken` — One customer's private queue pass.
- `POST /api/queue/join`, `POST /api/queue/cancel` — Public check-in and access-token-limited cancellation.
- `GET /api/feedback/:accessToken`, `POST /api/feedback` — Completed-pass review flow.
- `POST /api/queue/walk-in`, `/call-next`, `/mark-done`, `/mark-absent`, `/api/barbers/status` — Staff-authenticated operations.
- `POST /api/database/reset` — Staff-authenticated non-production sample reset; disabled in production.

---

## 📁 Repository Structure

```
salon-queue-management/
├── AGENTS.md                   # AI Agent and Developer working rules
├── README.md                   # Project overview, local setup, routes, API docs
├── prompts.md                  # Prompt history for the Vibe Coding Lab submission
├── reflection.md               # Reflection on the vibe coding process
├── supabase-schema.sql         # Inert historical schema; do not apply
├── supabase/migrations/        # Reviewed LateCuts PostgreSQL migration
├── vercel.json                 # Vercel deployment configuration
├── public/
│   └── latecuts-mark.svg        # LateCuts browser tab icon
├── package.json                # Project dependencies and concurrent scripts
├── vite.config.ts              # Vite config with API proxy
├── tailwind.config.js          # Tailwind configuration for the LateCuts UI
├── docs/
│   ├── 01-brief.md             # Historical baseline brief
│   ├── 02-screens.md           # Historical screen specifications
│   ├── 03-flows-rules.md       # Historical queue rules and test checklist
│   └── LATECUTS_PROJECT_SPECIFICATION.md # Current LateCuts decisions and target architecture
├── server/
│   ├── server.js               # Node.js HTTP + SSE API for Supabase
│   └── data/database.json      # Ignored legacy local data; preserved, not read by API
└── src/
    ├── App.tsx                 # Master routing, ambient orbs, protected routes
    ├── index.css               # Design system variables and living animations
    ├── components/             # Reusable UI, QR Code, and Live Toasts
    ├── pages/                  # Existing route screen components
    ├── stores/                 # Zustand queueStore & authStore
    └── lib/                    # API client, audio synthesizer, confetti engine
```
