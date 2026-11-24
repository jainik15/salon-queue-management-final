# 02 — Screens & Features Specifications
> **Historical baseline:** This screen specification uses the original LUXE CUTS identity, English/Hindi, blue/white design and Zara/Marcus/Dev. Keep it as the original behavior reference. Current LateCuts decisions are in `LATECUTS_PROJECT_SPECIFICATION.md`; preservation requirements are in `LATECUTS_PRESERVATION_CHECKLIST.md`.

## LUXE CUTS | Complete Screen Inventory

---

### Screen 1: Guest Check-In & Service Configurator (`/join`)
- **Access:** Public (QR code scan on patron smartphone or lounge kiosk).
- **Layout:**
  - Dynamic ambient blue glowing orbs in background.
  - Header with LUXE CUTS emblem, live open badge, and English / Hindi (हिंदी) language switcher.
  - Multi-service selector cards (Royal Fade, Classic Cut, Head Spa Treatment, Beard Sculpt, Bridal & Styling, Kids Cut) with live duration & price badges.
  - Real-time ticker calculating total duration, estimated wait time, and total cost.
  - Dynamic Stylist Recommendation tag (e.g., recommends Zara for Spa/Bridal, Marcus for Fades).
  - Stylist selector: "Any Stylist (Fastest)" or specific stylist cards (Zara, Marcus, Dev) showing queue lengths and status.
  - Guest name input with real-time character counter.
  - Primary CTA: "Confirm & Receive Priority Token".

---

### Screen 2: Live Digital Token (`/token/:id`)
- **Access:** Public (guest's personal digital pass).
- **Layout:**
  - Token header with status pill and share button.
  - Huge central token badge (e.g., `LX-08`) with deep sapphire accent.
  - **Dynamic Animated SVG Circular Progress Ring:** Animates remaining queue progress.
  - Live elapsed wait time counter with live minute tick.
  - 4-step dynamic status stepper: `Registered` → `In Queue` → `In Chair` → `Completed`.
  - Service breakdown and assigned stylist card.
  - "Cancel Spot" action with confirmation modal.
  - Audio chime triggers automatically when status changes to `serving`.

---

### Screen 3: Wall-Mounted Lounge TV Display (`/display`)
- **Access:** Public (mounted on 55"+ lounge TV displays).
- **Layout:**
  - Deep Marine Navy background (`#0A192F`) engineered for high contrast and viewing from 5+ meters.
  - Header with LUXE CUTS gold-blue monogram, live local time, and audio sound test trigger button.
  - 3-column split view for each stylist station (Zara, Marcus, Dev).
  - "NOW SERVING" spotlight card with animated audio visualizer bars when chair is occupied.
  - "UP NEXT" chronological queue list showing upcoming tokens and estimated wait times.
  - Interactive QR popover: allows lounge guests to scan directly from the TV to join the queue.

---

### Screen 4: Stylist Cockpit (`/barber/:id`)
- **Access:** Stylists (`/barber/zara`, `/barber/marcus`, `/barber/dev`).
- **Layout:**
  - Stylist header with avatar, specialty, station status (`Available` / `On Break`), and quick station switcher.
  - **Active Chair Panel:** Displays current patron name, token, service details, and a dynamic elapsed progress bar comparing chair time against expected duration.
  - Overtime warning banner if service exceeds estimated duration.
  - Action buttons: "✅ Complete Service" and "❌ Mark Absent / No-Show".
  - "CALL NEXT GUEST" primary button (enabled when chair is vacant).
  - Upcoming queue list with individual call/skip controls.

---

### Screen 5: Admin Concierge Authentication (`/login`)
- **Access:** Concierge & management staff.
- **Layout:**
  - Branded luxury blue-and-white card with floating lock icon.
  - PIN entry and username/PIN modes; both submit to server-side validation and expose no credential defaults.
   - PIN and username/PIN entry, both validated by the Node backend.
  - Error state handling with animated shake effect.
  - Automatic redirect to intended protected destination after successful login.

---

### Screen 6: Master Concierge Command Center (`/admin`)
- **Access:** Protected (requires admin authentication).
- **Layout:**
  - Real-time KPI summary cards: Currently in Line, Active in Chair, Served Today, and No-Shows.
  - Action toolbar: "+ Walk-In" modal trigger, "Scan QR" popover, "Analytics" link, and "Floor TV" shortcut.
  - **Dynamic Automated Patron Simulator:** Toggle button (`Play`/`Pause`) that automatically injects realistic guests every 20 seconds for floor stress testing.
  - Real-time search input and stylist dropdown filter.
  - Master Queue Ledger table: Token, Guest Name, Service, Assigned Stylist, Status badge, Wait time, and action buttons (`Call Next`, `Mark Done`, `Cancel`).
  - Emergency database reset button (`Reset to Sample Data`).
  - Secure "Sign Out" button in header.

---

### Screen 7: Stylist Performance & Floor Analytics (`/analytics`)
- **Access:** Protected (requires admin authentication).
- **Layout:**
  - Time range toggle (`Today`, `This Week`, `This Month`).
  - Stylist filter tabs (`All Stylists`, `Zara`, `Marcus`, `Dev`).
  - Operational KPIs: Total Guests Served, Average Service Duration, Chair Utilization %, Customer Satisfaction Score (4.9★).
  - **Hourly Traffic Histogram:** Visual bar chart depicting peak hours (1 PM peak).
  - **Service Demand Share:** Percentage distribution of all services.
  - **One-Click CSV Data Export:** Downloads full ledger report formatted for Excel/Google Sheets.
  - Back to Concierge & Sign Out controls.

---

### Screen 8: Customer Review & Feedback (`/feedback/:token`)
- **Access:** Public (sent to guest upon service completion).
- **Layout:**
  - Personalized thank-you banner with customer name and stylist avatar.
  - Interactive 5-star rating selector with hover preview labels.
  - Optional feedback comments box.
  - **Zero-Dependency Canvas Physics Confetti:** Launches an animated celebration burst across the viewport upon submission.

---

### Screen 9: Lounge Closed Notice (`/closed`)
- **Access:** Public (shown during off-hours or when queue is closed).
- **Layout:**
  - Elegant twilight illustration with moonlight badge.
  - "Salon is Currently Closed" title and message.
  - Operating schedule table (Monday – Sunday: 9:00 AM – 9:00 PM).
  - Morning return countdown timer.

---

### Screen 10: 404 Error Screen (`/*`)
- **Access:** Public (handles invalid URLs).
- **Layout:**
  - "Looks like this page got a bad haircut."
  - Return to Lounge Check-In button.
