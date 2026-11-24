# 03 — Flows, Rules & Test Checklist
> **Historical baseline:** This document records the original LUXE CUTS flow/rule specification. Its `[x]` checklist marks are historical claims, not current automated test evidence. Retain the original rules for comparison; current LateCuts decisions and unresolved rule questions are in `LATECUTS_PROJECT_SPECIFICATION.md`.

## LUXE CUTS | Business Logic & Verification Protocols

---

## 1. Primary User Flows

### Flow A: Mobile Patron Remote Check-In
1. Patron arrives at `/join` via smartphone browser or QR code.
2. Selects 1 or more services (duration and price update dynamically).
3. Selects preferred stylist (Zara, Marcus, Dev) or "Any Stylist (Fastest)".
4. Enters name, chooses language (EN / हिंदी), and clicks "Confirm".
5. App generates token (`LX-XX`), records timestamp, and transitions to `/token/:id`.
6. Live token screen animates progress ring and displays live ordinal position and estimated minutes.
7. When the stylist calls their token, the screen flashes green ("It's Your Turn!"), sound chime plays, and status updates across all connected devices.

### Flow B: Walk-In Patron (Receptionist Entry)
1. Concierge opens `/admin` and clicks "+ Walk-In".
2. Enters guest name, chooses service and stylist.
3. Guest is inserted into the real-time queue ledger and assigned the next sequential token.

### Flow C: Stylist Chair Workflow
1. Stylist opens `/barber/:id`.
2. Taps "Call Next Guest". Earliest waiting guest assigned to them transitions to `serving`.
3. Live elapsed chair timer runs with a visual pace bar.
4. When finished, stylist clicks "✅ Complete Service".
5. Patron status transitions to `completed`, incrementing the stylist's daily counter.
6. If patron doesn't show up after 10 minutes, stylist clicks "❌ Mark Absent".

---

## 2. Business Rules & Invariants

1. **State Machine Invariant:**
   - Allowed transitions: `waiting` → `serving` → `completed`
   - Cancellation transitions: `waiting` → `absent`
   - *Status can NEVER move backwards (e.g., `completed` cannot revert to `waiting`).*
2. **First-Come, First-Served Ordering:**
   - Within each stylist's line, customers are ordered chronologically by `timestamp_joined`.
3. **Stylist Preference Lock:**
   - If a customer selects Zara, they are placed only in Zara's queue and are never auto-dispatched to Marcus or Dev.
   - If "Any Stylist" is selected, the customer is assigned to the active stylist with the shortest current waiting list.
4. **Single Chair Concurrency:**
   - Each stylist station can have at most ONE customer in `serving` status at any moment.
5. **Wait Time Calculation:**
   - `estimated_wait = position_in_queue * stylist_avg_duration`
   - Re-evaluated dynamically whenever someone joins, finishes, or cancels.
6. **Station Break Logic:**
   - When a stylist toggles "On Break", their existing line remains queued, but new "Any Stylist" walk-ins are routed to other available stylists.
7. **Cross-Screen Real-Time Sync:**
   - Any state change dispatched from any device (Mobile, Tablet, TV, Cockpit) broadcasts via SSE and BroadcastChannel, synchronizing all screens in < 500ms.

---

## 3. Test Checklist

- [x] **TC-01 Multi-Service Selection:** Selecting multiple services sums total price and minutes correctly.
- [x] **TC-02 Stylist Queue Isolation:** Calling next on Marcus does not affect Zara's waiting list.
- [x] **TC-03 Turn Announcement:** Customer token screen updates to `serving` and triggers chime within 1 second of call.
- [x] **TC-04 Station Timer:** Chair elapsed timer increments accurately every second.
- [x] **TC-05 TV Display Contrast:** Text on `/display` is high contrast and readable from 5+ meters.
- [x] **TC-06 Walk-In Injection:** Adding walk-in from `/admin` appears instantly on TV and barber screen.
- [x] **TC-07 Multi-Tab Sync:** Opening `/join` and `/display` in two side-by-side tabs synchronizes instantly without reload.
- [x] **TC-08 Admin Auth Protection:** Direct navigation to `/admin` without auth redirects to `/login`.
- [x] **TC-09 CSV Export:** Clicking Export CSV in `/analytics` downloads a well-formatted `.csv` file.
- [x] **TC-10 Confetti Celebration:** Submitting a 5-star review triggers a canvas physics confetti animation.
