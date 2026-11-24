# LateCuts — Salon Queue Management

> Historical project notes are retained for context. Current LateCuts decisions and preservation requirements are documented under `docs/`.

**Deployment status:** Production deployment has not been performed by this repository change. See [`docs/LATECUTS_PRODUCTION_BACKEND.md`](./docs/LATECUTS_PRODUCTION_BACKEND.md) for prepared deployment steps.
**Staff username:** `staff` — staff authentication requires a private backend `STAFF_PIN`.

Links below point to the inherited preview deployment and may not represent the current local LateCuts code or backend configuration.

---

## 🔗 Direct Live Links (Click to Open Any Screen)

| Role / Experience | Direct Clickable URL | Key Features |
| :--- | :--- | :--- |
| 📱 **Guest Check-In** | [https://salon-queue-management-six.vercel.app/join](https://salon-queue-management-six.vercel.app/join) | Multi-service selector, live price & wait ticker, stylist matcher, English / Hindi toggle |
| 🎫 **Live Digital Token** | [https://salon-queue-management-six.vercel.app/token/1](https://salon-queue-management-six.vercel.app/token/1) | Animated circular wait ring, elapsed minutes counter, dynamic status stepper, cancel modal |
| 🎫 **My Status (`/status/:id`)** | [https://salon-queue-management-six.vercel.app/status/1](https://salon-queue-management-six.vercel.app/status/1) | Handout route alias for customer live status and turn alerts |
| 📺 **Lounge TV Calling Board** | [https://salon-queue-management-six.vercel.app/display](https://salon-queue-management-six.vercel.app/display) | Marine Navy 3-column wall display, animated audio visualizer, live clock, sound test switch |
| ✂️ **Stylist Cockpit — Zara** | [https://salon-queue-management-six.vercel.app/barber/zara](https://salon-queue-management-six.vercel.app/barber/zara) | Zara's station (Bridal & Head Spa), active chair pace bar, overtime alerts, break toggle |
| ✂️ **Stylist Cockpit — Marcus** | [https://salon-queue-management-six.vercel.app/barber/marcus](https://salon-queue-management-six.vercel.app/barber/marcus) | Marcus's station (Royal Fade & Classic), live chair timer, call next, no-show marker |
| ✂️ **Stylist Cockpit — Dev** | [https://salon-queue-management-six.vercel.app/barber/dev](https://salon-queue-management-six.vercel.app/barber/dev) | Dev's station (Beard & Kids), queue switcher, one-click service completion |
| 🔐 **Staff Login** | [Open `/login`](https://salon-queue-management-six.vercel.app/login) | Backend-validated PIN or username/PIN sign-in; no demo credentials |
| 📋 **Reception Dashboard (`/reception`)** | [https://salon-queue-management-six.vercel.app/reception](https://salon-queue-management-six.vercel.app/reception) | Receptionist floor dashboard, walk-in injector, call next, no-show handling |
| 👑 **Concierge Command Center (`/admin`)** | [https://salon-queue-management-six.vercel.app/admin](https://salon-queue-management-six.vercel.app/admin) | Real-time queue ledger, walk-in injector, live search, QR popover, auto-simulator engine |
| 📊 **Floor Analytics & Reports** | [https://salon-queue-management-six.vercel.app/analytics](https://salon-queue-management-six.vercel.app/analytics) | Hourly traffic histogram, service distribution bar chart, one-click CSV export |
| ⭐ **Customer Feedback & Review** | [https://salon-queue-management-six.vercel.app/feedback/1](https://salon-queue-management-six.vercel.app/feedback/1) | 5-star interactive rating with physics-based canvas confetti explosion |
| 🌙 **Lounge Closure Screen** | [https://salon-queue-management-six.vercel.app/closed](https://salon-queue-management-six.vercel.app/closed) | Evening closing view with operating schedule & morning countdown |

---

## ✂️ About LUXE CUTS

**LUXE CUTS** is a production-grade, real-time queue orchestration and salon floor management platform designed to replace paper token slips, eliminate walkouts, and streamline stylist workflows.

Built with a bespoke **Dynamic Blue & White Design System**, zero-dependency Web Audio Solfeggio frequency chime alerts, live Server-Sent Events (SSE) data streaming, persistent JSON/PostgreSQL databases, and role-based concierge authentication.

---

## 🎨 Aesthetic & Design System

- **Color Palette (Blue & White):**
  - **Pure & Ice Whites:** `#FFFFFF`, `#F8FAFC`, `#F0F7FF`, `#EBF4FC`
  - **Royal Sapphire:** `#1D4ED8`, `#2563EB`, `#3B82F6`
  - **Sky Blue Accents:** `#0284C7`, `#38BDF8`, `#06B6D4`
  - **Deep Marine Navy:** `#0A192F`
- **Living Dynamic Elements:**
  - Dynamic ambient glowing orbs (`.ambient-bg`, keyframes `float-slow`, `blob`)
  - Elevated dynamic interactive cards with soft blue glow on hover (`.dynamic-card`)
  - Animated SVG circular progress rings tracking elapsed wait time
  - Global floating real-time event toasts (`LiveToast.tsx`)
- **Typography:**
  - Display titles: *Playfair Display* (luxury editorial serif)
  - Interface text & numbers: *Inter* (crisp, high-legibility grotesque sans)
- **Zero-Dependency Web Audio Chime:**
  - Harmonics synthesized in pure browser code (528 Hz + 1056 Hz Solfeggio tones) without any external audio asset files.
- **Canvas Physics Confetti:**
  - Interactive multi-particle celebration burst on 5-star customer feedback submissions.

---

## ⚡ LateCuts Backend Architecture

1. **Node.js API (`server/server.js`):** Persistent REST API and SSE, intended for a Render web service. It uses Supabase as the authoritative store and no longer reads or writes the legacy JSON file.
2. **Supabase PostgreSQL:** The server-only service-role client handles data access; the browser does not connect directly. Apply the reviewed migration in `supabase/migrations/` only after a verified backup and explicit approval. The root `supabase-schema.sql` is historical, inert and must not be applied.
3. **Frontend state:** Zustand hydrates from the API. Cross-tab BroadcastChannel messages only request a refresh and contain no customer records.

---

## 🧭 Complete Screen Directory

| URL Path | Live Direct Link | Target User | Description |
| :--- | :--- | :--- | :--- |
| `/join` | [Open `/join`](https://salon-queue-management-six.vercel.app/join) | Patron | Mobile self check-in, multi-service pricing, stylist matcher |
| `/token/:id` | [Open `/token/1`](https://salon-queue-management-six.vercel.app/token/1) | Patron | Live digital token, circular progress ring, audio chime alert |
| `/display` | [Open `/display`](https://salon-queue-management-six.vercel.app/display) | Lounge TV | High-contrast TV board, animated audio visualizer, live clock |
| `/barber/zara` | [Open `/barber/zara`](https://salon-queue-management-six.vercel.app/barber/zara) | Stylist | Zara's cockpit (Bridal & Head Spa), pace timer, call next |
| `/barber/marcus` | [Open `/barber/marcus`](https://salon-queue-management-six.vercel.app/barber/marcus) | Stylist | Marcus's cockpit (Royal Fade & Classic), active chair bar |
| `/barber/dev` | [Open `/barber/dev`](https://salon-queue-management-six.vercel.app/barber/dev) | Stylist | Dev's cockpit (Beard & Kids), station break toggle |
| `/login` | Staff sign-in | Staff | PIN or username/PIN access validated by the Node backend |
| `/admin` | [Open `/admin`](https://salon-queue-management-six.vercel.app/admin) | Manager | Concierge command, walk-in modal, auto-patron simulator |
| `/analytics` | [Open `/analytics`](https://salon-queue-management-six.vercel.app/analytics) | Manager | Hourly traffic histogram, service share, CSV export |
| `/feedback/:token` | [Open `/feedback/1`](https://salon-queue-management-six.vercel.app/feedback/1) | Patron | 5-star review with physics canvas confetti celebration |
| `/closed` | [Open `/closed`](https://salon-queue-management-six.vercel.app/closed) | Public | Evening salon closure schedule & morning return timer |

---

## 🚀 Quickstart & Running Locally

### 1. Unified Concurrent Startup (Frontend + Backend Server)
Both the Node.js API server (`localhost:3001`) and the Vite development server (`localhost:5173`) start concurrently with one single command:

```bash
npm ci
cp .env.example .env
# Configure a Supabase project, backend-only key, STAFF_PIN and STAFF_SESSION_SECRET.
# Apply the reviewed migration only after backup and explicit approval.
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.
Without Supabase and secure staff credentials configured, API data and sign-in fail closed; the legacy JSON file is not used as a fallback.

### 2. Standalone Commands
- **Frontend only:** `npm run dev:client` (starts Vite on `http://localhost:5173`)
- **Backend server only:** `npm run server` (starts Node.js API on `http://localhost:3001`)
- **Production build:** `npm run build` (type-checks and bundles to `/dist`)

---

## Environment variables

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STAFF_PIN`, `STAFF_SESSION_SECRET`, and `CORS_ALLOWED_ORIGINS` are backend-only variables. Configure them in Render; do not use a `VITE_` prefix.
- `STAFF_PIN` is a private six-digit PIN. `STAFF_SESSION_SECRET` must be at least 32 bytes.
- `VITE_API_BASE_URL` is public frontend configuration: local development may use `http://localhost:3001`; Vercel must use the Render HTTPS origin.
- For local development, copy `.env.example` to `.env` and replace placeholders. `.env` and `.env.local` are ignored by Git.
- `PORT` is optional locally; Render supplies it. Keep `ENABLE_SAMPLE_DATA_RESET` disabled in production (production API blocks it regardless).

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
├── README.md                   # Project overview, credentials, routes, API docs
├── prompts.md                  # Complete log of prompts used during development
├── reflection.md               # Half-page reflection on vibe coding process
├── supabase-schema.sql         # Inert historical schema; do not apply
├── supabase/migrations/        # Reviewed LateCuts PostgreSQL migration
├── vercel.json                 # Vercel deployment configuration
├── package.json                # Project dependencies and concurrent scripts
├── vite.config.ts              # Vite config with API proxy
├── tailwind.config.js          # Blue & White design system configuration
├── docs/
│   ├── 01-brief.md             # Project brief, scope, users, features
│   ├── 02-screens.md           # Full 9-screen specifications
│   └── 03-flows-rules.md       # Queue logic, business invariants, test checklist
├── server/
│   ├── server.js               # Node.js HTTP + SSE API for Supabase
│   └── data/database.json      # Ignored legacy local data; preserved, not read by API
└── src/
    ├── App.tsx                 # Master routing, ambient orbs, protected routes
    ├── index.css               # Design system variables and living animations
    ├── components/             # Reusable UI, QR Code, and Live Toasts
    ├── pages/                  # All 9 screens
    ├── stores/                 # Zustand queueStore & authStore
    └── lib/                    # API client, audio synthesizer, confetti engine
```
