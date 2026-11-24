# 01 — Project Brief & Scope
> **Historical baseline:** This brief describes LUXE CUTS, English/Hindi, the blue/white design and Zara/Marcus/Dev. Preserve it as evidence of the original product scope. Current LateCuts decisions are recorded in `LATECUTS_PROJECT_SPECIFICATION.md`; preservation requirements are in `LATECUTS_PRESERVATION_CHECKLIST.md`.

## LUXE CUTS | Luxury Salon Queue Management System

### Problem Statement
On busy days and weekends, salon patrons frequently wait 45 to 90 minutes without knowing when they will be served. Customers grow anxious, some walk out, and others dispute who arrived first at the reception desk. Stylists lose valuable service time manually checking customer queues and shouting ticket numbers over ambient salon noise.

### Target Personas & Users
1. **Patron / Guest:** Scans a lounge QR code or opens the app on mobile, selects bespoke services (single or multi-select), chooses their preferred stylist or selects "Any Stylist (Fastest)", and monitors their real-time ordinal position with live circular progress rings and auditory chime alerts.
2. **Stylist (Zara, Marcus, Dev):** Operates their dedicated station cockpit (`/barber/:id`), tracks chair time with a live elapsed pace bar, triggers overtime warnings, toggles break status, calls the next customer in line, or marks no-shows.
3. **Lounge Concierge / Admin:** Oversees the master real-time queue ledger, adds manual walk-in patrons, filters by stylist, uses live search, triggers automated patron simulations, checks floor analytics, and can sign out securely.

### Must-Have Features
1. **Bilingual Mobile Check-In:** Full English & Hindi (हिंदी) localization toggle.
2. **Dynamic Multi-Service Picker:** Real-time calculation of total duration and price with dynamic stylist recommendation matching service tags.
3. **Live Digital Token:** Animated SVG circular progress ring, elapsed minutes counter, dynamic status stepper (`waiting` → `serving` → `completed`), and cancellation modal.
4. **Marine Navy Lounge TV Board (`/display`):** High-contrast wall monitor display with animated audio visualizer bars, live station cards, up-next lists, and time display.
5. **Harmonic Web Audio Chime:** Pure browser-synthesized Solfeggio 528 Hz + 1056 Hz chime alert (zero external audio files).
6. **Admin Concierge Command (`/admin`):** Walk-in modal, live search, automated patron simulator, check-in QR code modal, and full queue ledger.
7. **Staff Authentication (`/login`):** Backend-validated staff PIN with protected routes through `ProtectedRoute.tsx`; no client-side credential fallback.
8. **Real-Time Data Engine:** Node.js HTTP Server (`server/server.js`) on port 3001 with persistent JSON DB (`database.json`), Server-Sent Events (`/api/events`), optional Supabase PostgreSQL, and BroadcastChannel multi-tab sync.
9. **Floor Performance Analytics (`/analytics`):** Hourly footfall histogram, service demand distribution bar chart, and CSV export.
10. **Customer Review (`/feedback/:token`):** 5-star interactive rating with physics-based canvas confetti explosion.
11. **Lounge Closure Screen (`/closed`):** Evening closing view with operating hours.

### Out of Scope (What NOT to Build)
- Direct online credit card payment processing (handled at physical concierge counter).
- Multi-branch salon franchise switching.
- SMS / WhatsApp carrier integrations (handled via live browser state, SSE, and Web Audio chimes).
- Future-date appointment calendar booking (app is dedicated to day-of walk-in queue management).

### Design & Atmospheric Language
- **Theme:** Dynamic Blue & White with shades of blue:
  - Pure White (`#FFFFFF`) & Ice Blue (`#F0F7FF`, `#EBF4FC`)
  - Royal Sapphire (`#1D4ED8`, `#2563EB`)
  - Sky Blue (`#0284C7`, `#38BDF8`)
  - Deep Marine Navy (`#0A192F`)
- **Living Ambient UI:** Floating glowing blue background orbs (`.ambient-bg`), dynamic elevated cards (`.dynamic-card`), and real-time floating activity toasts (`LiveToast.tsx`).
- **Typography:** Serif `Playfair Display` for bold titles paired with `Inter` for clean tabular numbers.
