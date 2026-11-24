# LateCuts — Salon Queue Management

> Historical project notes are retained for context. Current LateCuts decisions and preservation requirements are documented under `docs/`.

**Live demo:** https://salon-queue-management-six.vercel.app/  
**Hosted on:** Vercel (frontend) + Render / Node.js (backend) + Supabase (database)  
**Staff username:** `staff` — staff authentication requires a private backend `STAFF_PIN`.

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

## ⚡ Multi-Tier Real-Time & Database Architecture

1. **Node.js HTTP Server (`server/server.js`) on Port 3001:**
   - Persistent file-based JSON storage saved at `server/data/database.json`.
   - **Server-Sent Events (SSE)** endpoint at `/api/events` broadcasting state changes in real time across all displays and stations.
   - RESTful endpoints for token booking, stylist calls, completion, absence marking, stylist status, and database resets.
2. **Supabase PostgreSQL Cloud Integration (Optional):**
   - Direct integration via `@supabase/supabase-js`.
   - Schema, row-level security (RLS), and sample seeds included in [`supabase-schema.sql`](./supabase-schema.sql).
3. **Cross-Tab Web BroadcastChannel Engine:**
   - Zero-configuration real-time sync across multiple browser tabs and windows even if running completely offline.

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
npm install
cp .env.example .env
# Set a unique private numeric STAFF_PIN in .env before starting the backend.
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 2. Standalone Commands
- **Frontend only:** `npm run dev:client` (starts Vite on `http://localhost:5173`)
- **Backend server only:** `npm run server` (starts Node.js API on `http://localhost:3001`)
- **Production build:** `npm run build` (type-checks and bundles to `/dist`)

---

## Environment variables

- `STAFF_PIN` is required for staff sign-in and is read only by the Node backend. Use a unique private 6-digit PIN; never prefix it with `VITE_`.
- For local development, copy `.env.example` to `.env` and replace placeholders. `.env` and `.env.local` are ignored by Git.
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are optional public client settings when Supabase is configured. Never use a service-role key in frontend configuration.
- `PORT` is optional; the backend defaults to port 3001.

## 📡 Backend REST API Endpoints

- `GET /api/health` — Server health check and active queue stats
- `GET /api/events` — Server-Sent Events (SSE) live data stream
- `POST /api/auth/login` — Authenticate concierge session
- `GET /api/queue` — Fetch full current queue and stylist rosters
- `POST /api/queue/join` — Check in a new patron
- `POST /api/queue/call-next` — Stylist station calls next waiting customer
- `POST /api/queue/mark-done` — Complete current haircut / spa session
- `POST /api/queue/mark-absent` — Mark customer as absent / canceled
- `POST /api/barbers/status` — Set stylist status (`available`, `busy`, `break`, `off`)
- `POST /api/database/reset` — Restore database to initial default sample state

---

## 📁 Repository Structure

```
salon-queue-management/
├── AGENTS.md                   # AI Agent and Developer working rules
├── README.md                   # Project overview, credentials, routes, API docs
├── prompts.md                  # Complete log of prompts used during development
├── reflection.md               # Half-page reflection on vibe coding process
├── supabase-schema.sql         # PostgreSQL DDL schema & seed data
├── vercel.json                 # Vercel deployment configuration
├── package.json                # Project dependencies and concurrent scripts
├── vite.config.ts              # Vite config with API proxy
├── tailwind.config.js          # Blue & White design system configuration
├── docs/
│   ├── 01-brief.md             # Project brief, scope, users, features
│   ├── 02-screens.md           # Full 9-screen specifications
│   └── 03-flows-rules.md       # Queue logic, business invariants, test checklist
├── server/
│   ├── server.js               # Node.js HTTP + SSE backend server
│   └── data/database.json      # Persistent local database store
└── src/
    ├── App.tsx                 # Master routing, ambient orbs, protected routes
    ├── index.css               # Design system variables and living animations
    ├── components/             # Reusable UI, QR Code, and Live Toasts
    ├── pages/                  # All 9 screens
    ├── stores/                 # Zustand queueStore & authStore
    └── lib/                    # Audio synthesizer, confetti engine, Supabase client
```
