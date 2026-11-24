# 💜 Vibe Coding Lab — Salon Queue Management System
> **Historical project guide:** This guide documents the original LUXE CUTS assignment and its sample design, language and stylist choices. Keep it as project history; current LateCuts requirements are in `docs/LATECUTS_PROJECT_SPECIFICATION.md` and `docs/LATECUTS_IMPLEMENTATION_ROADMAP.md`.

## LUXE CUTS | Premium Barbershop & Salon

> **Course:** Introduction to Programming (IT603)  
> **Lab Type:** Vibe Coding Lab (AI-Assisted Development)  
> **Project:** Queue Management System for a Modern Luxury Salon  
> **Tech Stack:** React + Vite + Tailwind CSS + Zustand + Supabase

---

```
╔══════════════════════════════════════════════════════════════╗
║           L U X E   C U T S   —   Queue System              ║
║      Where Precision Meets Luxury. Token: LX-14 ✂️          ║
╚══════════════════════════════════════════════════════════════╝
```

---

## 📋 Table of Contents

1. [Why Documents Come Before Prompts](#1-why-documents-come-before-prompts)
2. [The 4 Documents You Must Write](#2-the-4-documents-you-must-write)
   - 2.5 [Real-time Sync Strategy](#25-real-time-sync-strategy)
3. [Sample Document Content](#3-sample-document-content)
4. [Build Plan — 8 Steps to Launch](#4-build-plan--8-steps-to-launch)
   - 4.5 [State Management Architecture](#45-state-management-architecture)
5. [Writing Effective Prompts](#5-writing-effective-prompts)
6. [Using AI Tools — Antigravity & Codex](#6-using-ai-tools--antigravity--codex)
7. [Common Mistakes (All 10)](#7-common-mistakes-all-10)
   - 7.5 [AI Prompt Debugging Lab](#75-ai-prompt-debugging-lab)
8. [Pre-Prompt Checklist](#8-pre-prompt-checklist)
9. [Hosting Your Project](#9-hosting-your-project)
10. [What to Submit](#10-what-to-submit)
11. [Advanced Features](#11-advanced-features)
12. [Troubleshooting Reference](#12-troubleshooting-reference)

---

## 1. Why Documents Come Before Prompts

> **The Golden Rule of Vibe Coding: A well-prepared developer gets 10× better AI output.**

Most students open an AI tool and immediately type something like:
> *"Build me a salon app"*

Then they get frustrated when the AI produces a generic, unusable mess. Here's why this always fails — and how to fix it.

### 🧠 How AI Models Actually Work

AI language models are powerful **pattern completers**. They don't know your project. They don't know your professor's requirements. They don't know your barbers are named Zara, Marcus, and Dev. They will fill every gap with the most statistically common answer — which is usually wrong for your specific case.

When you write documents first, you give the AI:
- A **bounded problem space** (it can't hallucinate features you didn't ask for)
- **Specific vocabulary** to use (tokens like `LX-14`, not random IDs)
- **Business rules** to enforce (a customer can only join one queue at a time)
- **Visual references** to match (deep plum `#1A0A2E` backgrounds, not plain white)

### 📊 Time Investment Reality

| Approach | Documents Written | Prompting Time | Usable Code Output | Rework Time |
|---|---|---|---|---|
| Jump straight in | None | 2 hrs | ~20% usable | 6+ hrs |
| Write docs first | 4 documents (3–4 hrs) | 90 min | ~80% usable | 1–2 hrs |

**The math is obvious. Write the documents.**

### 🏗️ The Architecture Metaphor

Building a web app without documentation is like asking a contractor to "build a house" with no blueprints. They'll give you walls and a roof. But is it 2 bedrooms or 5? Ground floor or multi-story? Where does the bathroom go?

Your 4 documents ARE your blueprints. The AI is your contractor.

---

## 2. The 4 Documents You Must Write

Before writing a single line of code or pasting a single prompt, create these four files in your project root:

```
luxe-cuts/
├── docs/
│   ├── brief.md          ← What the app is & who uses it
│   ├── screens.md        ← Every screen with layout description
│   ├── flows-rules.md    ← Business logic & user flows
│   └── AGENTS.md         ← Instructions specifically for the AI
├── src/
└── ...
```

### Document 1: `brief.md` — The Project Brief

**Purpose:** Answers *what*, *who*, and *why*.

Must include:
- [ ] App name and one-line description
- [ ] The problem it solves
- [ ] Who the users are (and their different roles)
- [ ] Tech stack with version numbers
- [ ] Color palette with hex codes
- [ ] Typography choices
- [ ] The 3–5 core features
- [ ] Out-of-scope list (what this app does NOT do)

### Document 2: `screens.md` — Screen Inventory

**Purpose:** Describes every single page or view the user sees.

For each screen, document:
- [ ] Screen name and URL route
- [ ] Who can access it (customer / barber / admin)
- [ ] Layout description (what's on screen, in order, top to bottom)
- [ ] All interactive elements (buttons, forms, dropdowns)
- [ ] What each button does
- [ ] What data is displayed (and where it comes from)
- [ ] Loading and empty states

### Document 3: `flows-rules.md` — Flows & Business Rules

**Purpose:** Answers *how* the app behaves in every situation.

Must include:
- [ ] User journey flows (step-by-step, numbered)
- [ ] All business rules (numbered, unambiguous)
- [ ] Edge cases (what if the queue is empty? What if a barber goes offline?)
- [ ] Data validation rules
- [ ] Error states

### Document 4: `AGENTS.md` — AI Instructions

**Purpose:** A file the AI reads at the start of every session to understand your project context.

Must include:
- [ ] Project summary (2–3 sentences)
- [ ] Strict do's and don'ts for code style
- [ ] Component and file naming conventions
- [ ] Which libraries to use (and which to avoid)
- [ ] Database schema or data structure
- [ ] The token format and ID conventions

---

## 2.5 Real-time Sync Strategy

> **This section is critical for queue systems.** A queue that doesn't update in real-time is not a queue — it's a snapshot. You must decide how customers and barbers see live updates.

### The Three Approaches

#### Option A: Supabase Realtime (⭐ Recommended for this project)

Supabase provides built-in WebSocket-based real-time subscriptions using PostgreSQL's `LISTEN/NOTIFY` mechanism.

```javascript
// How it works in your app:
import { supabase } from './lib/supabase'

// Subscribe to all queue changes
const channel = supabase
  .channel('queue-updates')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'queue_entries' },
    (payload) => {
      console.log('Queue changed:', payload)
      // Update your Zustand store here
      useQueueStore.getState().handleRealtimeUpdate(payload)
    }
  )
  .subscribe()

// Always clean up on unmount:
// channel.unsubscribe()
```

**Pros:**
- Zero extra backend code — Supabase handles the WebSocket server
- Scales automatically
- Works with your existing Supabase database
- Free tier is generous (500 concurrent connections)

**Cons:**
- Tied to Supabase infrastructure
- Slightly less flexible than raw Socket.io for complex events

**Use when:** Your data lives in Supabase (which it should for this project).

---

#### Option B: Socket.io (Custom WebSocket Server)

Requires a separate Node.js backend server with Express + Socket.io.

```javascript
// server.js (Node backend)
const io = require('socket.io')(server, { cors: { origin: '*' } })

io.on('connection', (socket) => {
  socket.on('join-queue', (data) => {
    // Add to DB, then broadcast to all clients
    io.emit('queue-updated', updatedQueue)
  })
})

// React frontend
import { io } from 'socket.io-client'
const socket = io('http://localhost:3001')
socket.on('queue-updated', (queue) => setQueue(queue))
```

**Pros:** Maximum flexibility, custom events, rooms, namespaces  
**Cons:** You must host a separate server (adds Render/Railway complexity)

**Use when:** You need custom real-time logic beyond what a database can handle.

---

#### Option C: Polling (Simple but Primitive)

```javascript
// Every 5 seconds, fetch the queue
useEffect(() => {
  const interval = setInterval(() => {
    fetchQueue()
  }, 5000)
  return () => clearInterval(interval)
}, [])
```

**Pros:** Simple to implement, works everywhere  
**Cons:** Stale data (up to 5s lag), wastes bandwidth, doesn't scale

**Use when:** You're stuck and need something working fast (prototype only).

---

### Decision Table

| Factor | Supabase Realtime | Socket.io | Polling |
|---|---|---|---|
| Setup complexity | Low | High | Very Low |
| Hosting cost | Free (Supabase) | Need server | Free |
| Data freshness | Instant | Instant | 3–10s lag |
| Recommended for this project | ✅ Yes | ⚠️ Advanced only | ❌ Avoid |

> **TIP:** Start with Supabase Realtime. If you hit limitations (like needing to send targeted notifications to a single customer), you can add Socket.io as a secondary layer later.

---

## 3. Sample Document Content

Here are complete, ready-to-use sample files for the LUXE CUTS project. **Copy these into your `docs/` folder and customize them.**

---

### 📄 `docs/brief.md` — Full Sample

```markdown
# LUXE CUTS — Queue Management System
## Project Brief v1.0

### One-Line Description
A real-time digital queue management system for LUXE CUTS, a modern premium 
barbershop and salon, replacing paper token slips with a live web dashboard.

### The Problem
LUXE CUTS currently manages walk-in customers with handwritten token slips and 
a whiteboard. This causes:
- Customers leaving because they don't know how long the wait is
- Barbers wasting time manually calling numbers
- No data on average service time, busiest hours, or barber performance
- Angry customers who feel the queue is unfair

### Users & Roles

| Role | Who They Are | What They Need |
|------|-------------|----------------|
| Customer | Walk-in client at the salon | Join queue, see position, get token |
| Barber | Zara, Marcus, or Dev | See their queue, call next, mark done |
| Admin | Salon manager | View all queues, analytics, manage barbers |

### Tech Stack
- **Frontend:** React 18 + Vite 5
- **Styling:** Tailwind CSS 3.4 + custom CSS variables
- **State Management:** Zustand 4.5
- **Backend / Database:** Supabase (PostgreSQL + Auth + Realtime)
- **Routing:** React Router DOM v6
- **Hosting:** Vercel (frontend) + Supabase Cloud (backend)
- **Notifications:** Browser Notifications API + Tone.js for sounds

### Brand & Design

**Salon Name:** LUXE CUTS  
**Tagline:** Where Precision Meets Luxury  
**Token Format:** LX-[number] (e.g., LX-01, LX-14, LX-99)

**Color Palette:**
| Token | Hex | Usage |
|-------|-----|-------|
| `--plum-deep` | `#1A0A2E` | Main background |
| `--violet-electric` | `#7C3AED` | Primary buttons, active states |
| `--rose-gold` | `#E8967A` | Highlights, accents, secondary actions |
| `--pearl-white` | `#F9F5FF` | Body text |
| `--emerald-status` | `#059669` | "Serving" status, success states |
| `--amber-wait` | `#D97706` | "Waiting" status, warnings |
| `--crimson-cancel` | `#DC2626` | Cancel, error, absent states |

**Typography:**
- Headings: `Playfair Display` (Google Fonts) — serif, luxury feel
- Body: `Inter` (Google Fonts) — clean, readable

### Services Offered
| Service | Approx. Duration |
|---------|-----------------|
| Classic Cut | 25 min |
| Beard Sculpt | 20 min |
| Royal Fade | 35 min |
| Kids Cut | 20 min |
| Head Spa Treatment | 45 min |
| Bridal Styling | 90 min |

### Barbers
- **Zara** — specializes in Bridal Styling, Head Spa Treatment
- **Marcus** — specializes in Royal Fade, Classic Cut
- **Dev** — specializes in Beard Sculpt, Kids Cut

### Core Features (MVP)
1. Customer self-service: enter name, select service, pick barber → get token
2. Live queue display: real-time position counter on a TV/monitor screen
3. Barber dashboard: see queue, call next, mark served, mark absent
4. Admin dashboard: global view of all 3 queues + analytics summary
5. Customer token screen: shows LX-XX token, estimated wait, current status

### Out of Scope (Do NOT build these)
- Online booking / appointment scheduling
- Payment processing
- SMS notifications (use browser notifications instead)
- Customer accounts / login (customers are anonymous)
- Multi-location / multi-branch support
```

---

### 📄 `docs/screens.md` — Full Sample

```markdown
# LUXE CUTS — Screen Inventory
## All 9 Screens Documented

---

## Screen 1: Home / Join Queue (/join)
**Access:** Public (any customer on the salon WiFi or QR scan)

### Layout (top to bottom)
1. **Header bar** — LUXE CUTS logo (left), language toggle EN|हिंदी (right)
2. **Hero section** — Large headline: "Skip the Wait. Own the Moment."
   Sub-headline shows live queue summary: "3 people waiting · Avg wait: 18 min"
3. **Service Selection** — Grid of 6 cards, each showing:
   - Service name
   - Approximate duration badge
   - Icon (scissors, beard, crown, child, spa leaf, bridal veil)
   - Clicking a card selects it (highlighted in violet `#7C3AED`)
4. **Barber Selection** — 3 cards side by side showing:
   - Barber photo (placeholder avatar with initials)
   - Barber name
   - Current queue length ("2 waiting")
   - Status badge: Available / Busy / On Break
   - "Any Barber" option (auto-assigns to shortest queue)
5. **Customer Name Input** — Single text field, placeholder "Your first name..."
   Character limit: 30 chars. No other personal data collected.
6. **Language Preference** — Toggle: English | हिंदी
7. **Join Queue Button** — Full-width, violet background, text "Join Queue →"
   Disabled until: service selected + name entered
8. **Footer** — "Powered by LUXE CUTS Technology"

### Empty/Loading States
- If a barber is offline, their card shows greyed out with "Unavailable" badge
- If all barbers are on break, show banner: "All barbers are on a short break. 
  You can still join — you'll be next when they return."

### On Submit
- Validate: name is not empty, service is selected
- POST to Supabase: create queue_entries row
- Navigate to: /token/:id

---

## Screen 2: Customer Token Screen (/token/:id)
**Access:** Public — customer sees this after joining

### Layout
1. **Top bar** — LUXE CUTS logo, small "Need help?" link
2. **Token display** — Giant card in center:
   - Token number: **LX-14** (huge, 96px font, rose-gold color)
   - Customer name: "Welcome, Priya!"
   - Service: "Royal Fade"
   - Barber: "Marcus"
3. **Queue Position** — Live updating badge:
   - "You are #3 in queue"
   - Animated dots when status changes
4. **Status Indicator** — Color-coded pill:
   - 🟡 Waiting (amber) — your turn hasn't come
   - 🟢 It's Your Turn! (emerald) — barber is ready for you
   - 🔵 Currently Being Served (blue) — actively in chair
   - ⚫ Completed (grey) — service done
5. **Estimated Wait** — "~18 minutes" (calculated from avg service times)
6. **Live Queue Scroll** — Shows other tokens in queue (names hidden, 
   just token number + service type)
7. **Cancel Button** — Small, bottom of screen, text "Leave Queue"
   Opens confirmation modal before canceling

### Real-time Behavior
- Position number updates live via Supabase Realtime subscription
- When status changes to "It's Your Turn", play a chime sound
- Request browser notification permission on load; send notification on turn

---

## Screen 3: Live Queue Display (/display)
**Access:** Public — meant for a TV/large monitor mounted in the salon

### Layout
- **Full-screen, no scrolling**
- Background: deep plum `#1A0A2E`
- Split into 3 columns (one per barber):
  ```
  ┌─────────────┬─────────────┬─────────────┐
  │    ZARA     │   MARCUS    │     DEV     │
  │  ──────────  │  ──────────  │  ──────────  │
  │ [LX-02] ✂️  │ [LX-07] 👑  │ [LX-11] 🧒  │
  │  Serving:   │  Serving:   │  Serving:   │
  │   Aisha     │   Rohan     │   Kabir     │
  │  ──────────  │  ──────────  │  ──────────  │
  │ NEXT: LX-05 │ NEXT: LX-09 │ NEXT: LX-14 │
  │ THEN: LX-08 │ THEN: LX-12 │             │
  └─────────────┴─────────────┴─────────────┘
  ```
- **Bottom ticker** — scrolling text: salon announcements, promotions
- **Top right** — Live clock
- Auto-refreshes with Supabase Realtime (no manual refresh needed)
- When a token changes to "serving", animate it with a brief pulse effect

---

## Screen 4: Barber Dashboard (/barber/:id)
**Access:** Barbers only (login with Supabase Auth email/password)

### Layout
1. **Header** — "Welcome back, Marcus ✂️" | Logout button
2. **Status Toggle** — Large switch: 
   - 🟢 Available (green) — I'm ready to serve
   - 🔴 On Break (red) — Pause my queue temporarily
3. **Currently Serving Card** — Prominent card at top showing:
   - Token: LX-07
   - Customer: Rohan
   - Service: Royal Fade (~35 min)
   - Timer: 00:12:45 (how long they've been in the chair)
   - Buttons: [✅ Mark as Done] [❌ No-Show / Skip]
4. **Queue List** — Scrollable list of upcoming customers:
   Each item shows: token, name, service, wait time
   Top item is always "NEXT"
5. **Call Next Button** — Large violet button: "Call Next Customer →"
   Only enabled when current seat is empty
6. **Quick Stats Bar** — Small row at bottom: 
   "Served today: 8 | Avg time: 28 min | Currently waiting: 3"

---

## Screen 5: Admin Dashboard (/admin)
**Access:** Admin only (separate admin login)

### Layout
1. **Header** — "LUXE CUTS Admin" | Today's date | Logout
2. **Summary Cards Row** — 4 cards:
   - Total customers served today
   - Customers currently waiting (all queues combined)
   - Average wait time (across all barbers)
   - Busiest hour today
3. **All Queues Panel** — 3 columns (Zara / Marcus / Dev), each showing 
   their full queue in real-time
4. **Quick Actions** — 
   - [Add Walk-in Manually] — bypass the join screen
   - [Broadcast Announcement] — push text to the display screen ticker
   - [Toggle Barber Status] — mark a barber available/break/offline
5. **Recent Activity Log** — Timestamped list of all events:
   "14:32 — LX-11 served by Dev (Royal Fade, 31 min)"
   "14:28 — LX-10 marked no-show by Zara"

---

## Screen 6: Queue Empty / Salon Closed (/join when closed)
**Access:** Public — shown when salon is not operating

### Layout
- Full-screen centered message
- Salon logo large at top
- "We're Closed Right Now 🌙"
- Operating hours: "Open daily 9:00 AM – 8:00 PM"
- "Come back tomorrow or scan to book a time slot"
- QR code (future feature placeholder)

---

## Screen 7: 404 Not Found (/*)
**Access:** Public

### Layout  
- Centered content
- Large scissors icon (404)
- "Looks like this page got a bad haircut."
- Link back to /join

---

## Screen 8: Barber Analytics Dashboard (/analytics)
**Access:** Admin only (or barber viewing own stats)

### Layout
1. **Date Range Selector** — Today / Last 7 days / Last 30 days / Custom
2. **Barber Selector Tabs** — All | Zara | Marcus | Dev
3. **Performance Cards** per barber:
   - Customers served
   - Average service duration (actual vs. estimated)
   - No-show rate (%)
   - Busiest hour
   - Most popular service
4. **Charts Section:**
   - Bar chart: Customers per hour (hourly breakdown)
   - Line chart: Average wait time over selected period
   - Pie chart: Service type distribution
5. **Top Customers** (optional future) — Not in MVP

> **Implementation Note:** Use Recharts or Chart.js for charts. 
> All data from Supabase `queue_entries` table with timestamps.

---

## Screen 9: Customer Feedback Screen (/feedback/:token)
**Access:** Public — customer receives this link after service is marked done

### Layout
1. **Thank You Header** — "Thanks for visiting LUXE CUTS, [Name]! ✨"
2. **Service Summary Card:**
   - Token: LX-07
   - Barber: Marcus
   - Service: Royal Fade
   - Date & Time
3. **Star Rating** — Large 5-star selector (tap/click to select)
   Label updates as you hover: "1 - Poor" / "3 - Good" / "5 - Exceptional"
4. **Optional Comment** — Textarea: "Tell us more..." (max 280 chars)
5. **Specific Ratings** (optional follow-up if 4+ stars selected):
   - Wait time: 👍 👎
   - Barber skill: 👍 👎
   - Cleanliness: 👍 👎
6. **Submit Button** — "Share your feedback →"
7. **Post-submit** — Confetti animation + "See you next time! 💜"

> **Note:** Feedback token is a one-time-use UUID appended to the link, 
> generated when service is marked complete. Prevents duplicate submissions.
```

---

### 📄 `docs/flows-rules.md` — Full Sample

```markdown
# LUXE CUTS — Flows & Business Rules

---

## User Flow 1: Customer Joining the Queue

**Trigger:** Customer scans QR code or visits the join URL

```
Step 1: Customer arrives at /join
Step 2: Browses services → selects one (required)
Step 3: Browses barbers → selects one OR picks "Any Barber"
Step 4: Enters first name (required, 1–30 chars)
Step 5: Optionally toggles language to हिंदी
Step 6: Taps "Join Queue"
Step 7: System creates a queue entry with:
        - Unique token: LX-[padded number, e.g., LX-14]
        - Status: "waiting"
        - timestamp_joined: now()
        - assigned_barber: chosen barber (or auto-assigned)
        - service: chosen service
        - customer_name: entered name
Step 8: Customer is redirected to /token/:entry_id
Step 9: Customer sees live position and estimated wait
```

## User Flow 2: Barber Serving a Customer

```
Step 1: Barber logs in at /barber/:id
Step 2: Sets status to "Available"
Step 3: Queue shows all waiting customers
Step 4: Barber taps "Call Next Customer"
Step 5: System:
        - Changes top queue entry status → "serving"
        - Records timestamp_called: now()
        - Sends real-time update to all subscribers
        - Customer token screen updates to "It's Your Turn! 💜"
Step 6: Customer arrives at chair, service begins
Step 7: When done, barber taps "Mark as Done"
Step 8: System:
        - Changes status → "completed"
        - Records timestamp_completed: now()
        - Calculates actual_duration = completed - called
        - Generates feedback link: /feedback/:uuid
        - Triggers next customer notification
Step 9: If customer doesn't arrive: barber taps "No-Show"
        System marks status → "absent", moves to next
```

## User Flow 3: Admin Override

```
Admin can at any time:
- Manually add a customer to any barber's queue
- Remove any customer from the queue
- Reorder queue entries (drag & drop)
- Change a barber's status (Available / Break / Offline)
- Clear an entire barber's queue in emergency
```

---

## Business Rules

**BR-001:** A customer can only appear in ONE queue at a time.  
Check: Before creating a new entry, query for any active entries 
with the same phone/device fingerprint (use localStorage flag as 
simple check for MVP).

**BR-002:** Token numbers are global and sequential within a day.  
LX-01 is the first customer of the day across all barbers.  
Reset to LX-01 at midnight.

**BR-003:** "Any Barber" auto-assignment picks the barber with the 
fewest current "waiting" entries. Ties broken alphabetically.

**BR-004:** A barber can only have ONE customer in "serving" status 
at a time. The "Call Next" button is disabled while serving.

**BR-005:** Estimated wait time calculation:  
`estimated_wait = (position_in_queue - 1) × avg_service_duration`  
Where avg_service_duration = rolling average of last 10 completed 
services for that barber, defaulting to the service's standard 
duration if fewer than 3 completed.

**BR-006:** Customers who have been waiting > 60 minutes receive 
a "priority bump" notification to admin.

**BR-007:** A barber marked "On Break" keeps their queue frozen — 
no new customers are auto-assigned to them, but existing customers 
stay in their queue.

**BR-008:** A barber marked "Offline" has their waiting customers 
redistributed to available barbers using BR-003 logic.

**BR-009:** Feedback links expire after 24 hours.

**BR-010:** The /display screen auto-refreshes without user action. 
It should work if left running on a TV for 12+ hours without memory leak.

---

## Data Validation Rules

| Field | Rule |
|-------|------|
| customer_name | Required, 1–30 characters, letters/spaces only |
| service | Must be one of 6 defined services |
| barber_id | Must be a valid barber UUID from barbers table |
| token | Auto-generated, never user-input |
| rating | Integer 1–5 only |
| feedback_comment | Optional, max 280 chars |

---

## Edge Cases

**EC-001: Queue is empty when barber calls next**  
Show message: "Your queue is empty. Great work today! 🎉"

**EC-002: Internet drops on customer token screen**  
Show "Reconnecting..." banner. Resume subscription on reconnect.  
Do NOT clear the token data — read from localStorage cache.

**EC-003: Two customers submit join form simultaneously**  
Supabase handles this with row-level locking. Tokens are assigned 
server-side, so no duplicates possible.

**EC-004: Customer navigates away from token screen**  
If they come back (same browser), restore their token from localStorage.  
Show: "Welcome back! You're still in queue at position #X."

**EC-005: Salon closes mid-queue**  
Admin can trigger "End of Day" which marks all waiting entries as 
"expired" and shows a custom message on the display screen.
```

---

### 📄 `AGENTS.md` — Full Sample

```markdown
# AGENTS.md — LUXE CUTS Queue System
## AI Assistant Instructions

---

## Project Summary
You are helping build a real-time queue management system for LUXE CUTS, a 
modern premium barbershop. The system uses React + Vite + Tailwind + Zustand 
+ Supabase. There are 3 user roles: Customer, Barber (Zara/Marcus/Dev), Admin.
The token format is LX-01 through LX-99 (reset daily).

---

## ALWAYS DO

- Use TypeScript for all new components and utilities
- Use Tailwind CSS utility classes for all styling — no inline style objects
- Use Zustand for all shared state — do NOT use useState for queue data
- Use Supabase client from `src/lib/supabase.ts` — never reinitialize it
- Name components in PascalCase: `TokenDisplay`, `BarberCard`, `QueueRow`
- Name files in kebab-case: `token-display.tsx`, `barber-card.tsx`
- Use CSS custom properties for brand colors:
  `var(--plum-deep)`, `var(--violet-electric)`, `var(--rose-gold)`,
  `var(--pearl-white)`, `var(--emerald-status)`
- Use React Router `<Link>` for navigation, never `window.location.href`
- Unsubscribe from Supabase Realtime channels in useEffect cleanup
- Handle loading states with a skeleton UI, not just "Loading..."
- Handle error states with a user-friendly message + retry button
- Write JSDoc comments for all utility functions

---

## NEVER DO

- Never use `any` as a TypeScript type — always define interfaces
- Never put business logic inside JSX — extract to custom hooks
- Never use `px` units in Tailwind — use the spacing scale (4, 8, 12...)
- Never call `supabase.auth.signIn` from a component — use the auth store
- Never use `Math.random()` for token generation — tokens are assigned by DB
- Never commit `.env` files or hardcode Supabase keys
- Never use `document.getElementById` — use React refs
- Never put API calls directly in components — use custom hooks or stores

---

## File Structure

```
src/
├── components/
│   ├── ui/              ← Reusable atoms (Button, Card, Badge, Spinner)
│   ├── queue/           ← Queue-specific components
│   ├── barber/          ← Barber dashboard components
│   └── admin/           ← Admin-only components
├── hooks/               ← Custom React hooks (useQueue, useBarber, useAuth)
├── stores/              ← Zustand stores (queueStore, barberStore, authStore)
├── pages/               ← Route-level page components
├── lib/
│   ├── supabase.ts      ← Supabase client (singleton)
│   └── utils.ts         ← Pure utility functions
└── types/               ← TypeScript interfaces and types
```

---

## Database Schema

```sql
-- barbers
id UUID PRIMARY KEY
name TEXT ('Zara' | 'Marcus' | 'Dev')
status TEXT ('available' | 'break' | 'offline')
avatar_url TEXT

-- queue_entries
id UUID PRIMARY KEY
token TEXT (e.g., 'LX-14')
customer_name TEXT
service TEXT
barber_id UUID REFERENCES barbers(id)
status TEXT ('waiting' | 'serving' | 'completed' | 'absent' | 'expired')
timestamp_joined TIMESTAMPTZ
timestamp_called TIMESTAMPTZ
timestamp_completed TIMESTAMPTZ
actual_duration_minutes INTEGER
feedback_token UUID (one-time use, generated on completion)
feedback_rating INTEGER (1–5)
feedback_comment TEXT

-- announcements
id UUID PRIMARY KEY
message TEXT
created_at TIMESTAMPTZ
expires_at TIMESTAMPTZ
```

---

## Component Conventions

When creating a new component, always follow this structure:

```typescript
// 1. Imports
import { FC } from 'react'
import type { QueueEntry } from '@/types'

// 2. Props interface
interface TokenDisplayProps {
  entry: QueueEntry
  position: number
}

// 3. Component
const TokenDisplay: FC<TokenDisplayProps> = ({ entry, position }) => {
  // 4. Hooks first
  // 5. Derived state / calculations
  // 6. Event handlers
  // 7. JSX return
  return (
    <div className="...tailwind classes...">
      {/* content */}
    </div>
  )
}

// 8. Default export
export default TokenDisplay
```

---

## When Asked to Fix a Bug

1. First, read the relevant component and its types
2. Identify the root cause (not just the symptom)
3. Fix the root cause
4. Add a code comment explaining what was wrong
5. Do not add new dependencies unless absolutely necessary

---

## Supabase Realtime Pattern

Always use this pattern for real-time subscriptions:

```typescript
useEffect(() => {
  const channel = supabase
    .channel('unique-channel-name')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'queue_entries' },
      handleUpdate
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)  // ← ALWAYS clean up
  }
}, [])
```
```

---

## 4. Build Plan — 8 Steps to Launch

Follow these steps in order. **Do not skip ahead.** Each step depends on the previous.

---

### Step 1: Project Setup & Configuration (Day 1)

**Goal:** Have a running Vite + React + Tailwind app connected to Supabase.

**Prompt to use:**
```
I'm starting a React + Vite project for a salon queue system called LUXE CUTS.
Set up the project with:
- Vite 5 + React 18 + TypeScript
- Tailwind CSS 3.4 configured with custom CSS variables for these colors:
  --plum-deep: #1A0A2E
  --violet-electric: #7C3AED  
  --rose-gold: #E8967A
  --pearl-white: #F9F5FF
  --emerald-status: #059669
- React Router DOM v6 with these routes: /join, /token/:id, /display, 
  /barber/:id, /admin, /analytics, /feedback/:token
- Zustand 4.5 installed
- Supabase JS client installed and configured from environment variables
- Google Fonts: Playfair Display + Inter
- A basic layout with the deep plum background and pearl white text

Do not create any real page content yet — just the shell, routing, and config.
Show me the complete file structure you'll create.
```

---

### Step 2: Database Schema & Supabase Setup (Day 1)

**Goal:** Create the Supabase tables and seed initial barber data.

**Prompt to use:**
```
Using the LUXE CUTS database schema below, generate the SQL to:
1. Create all tables with proper constraints
2. Set up Row Level Security (RLS) policies:
   - queue_entries: anyone can INSERT (join queue), 
     only barbers/admin can UPDATE
   - barbers: anyone can SELECT, only admin can UPDATE
3. Create a Supabase Edge Function or trigger that:
   - Auto-generates the token (LX-01, LX-02...) sequentially per day
   - Resets the counter at midnight
4. Seed the barbers table with: Zara, Marcus, Dev (all starting as 'available')

[Paste your schema from AGENTS.md here]
```

---

### Step 3: Join Queue Screen (Day 2)

**Goal:** Build the customer-facing queue joining screen.

**Prompt to use:**
```
Build the /join screen for LUXE CUTS queue system. Read the component 
conventions in AGENTS.md. The screen should:

SERVICES (display as cards with icons):
- Classic Cut (✂️, 25 min), Beard Sculpt (🧔, 20 min), 
  Royal Fade (👑, 35 min), Kids Cut (🧒, 20 min),
  Head Spa Treatment (🌿, 45 min), Bridal Styling (💍, 90 min)

BARBERS (fetch live from Supabase):
- Zara, Marcus, Dev — show each barber's current queue length live
- Include "Any Barber" option

FORM BEHAVIOR:
- Submit button disabled until service + name filled
- On submit: INSERT to queue_entries, redirect to /token/:id
- Use useQueueStore (Zustand) for selected state

DESIGN:
- Background: var(--plum-deep) #1A0A2E
- Selected service card: border-2 border-violet-electric bg-violet-electric/10
- Font: Playfair Display for headings, Inter for body
- Full responsive layout (mobile-first)
- Language toggle button (EN | हिंदी) — Hindi strings placeholder for now
```

---

### Step 4: Customer Token Screen (Day 2)

**Goal:** Build the live-updating token display screen.

**Prompt to use:**
```
Build the /token/:id screen for LUXE CUTS. This is what customers see 
after joining the queue.

FETCH: Load the queue entry by ID from Supabase on mount.
REALTIME: Subscribe to changes on this specific entry AND all entries 
for the same barber (to calculate position).

DISPLAY:
- Token in large Playfair Display font, rose-gold color: LX-14
- Customer name: "Welcome, [Name]!"  
- Status pill: color-coded (amber=waiting, emerald=your turn, blue=serving)
- Position in queue: "#3 in queue" — recalculate on every realtime update
- Estimated wait: (position - 1) × barber's avg service time

NOTIFICATIONS:
- On mount: request browser notification permission
- When status changes to 'serving': 
  play a chime (use Tone.js, freq: 528Hz, duration: 0.8s)
  AND send browser notification: "It's your turn at LUXE CUTS! 💜"

PERSISTENCE:
- Save entry ID to localStorage on load
- On return visit: restore from localStorage, show "Welcome back!"

CANCEL:
- "Leave Queue" button opens a modal to confirm
- On confirm: UPDATE entry status to 'absent'
```

---

### Step 5: Live Display Screen (Day 3)

**Goal:** Build the TV-mounted queue display.

**Prompt to use:**
```
Build the /display screen — a full-screen queue board for a wall-mounted 
TV or monitor at LUXE CUTS.

LAYOUT:
- 3-column grid (one column per barber: Zara | Marcus | Dev)
- Each column has a barber name header with a colored status indicator
- Shows: currently serving token + customer name at top
- Shows: next 2–3 waiting tokens below
- Bottom: scrolling marquee with today's promotions text

DESIGN RULES:
- Full viewport height, no scrollbar
- Background: #1A0A2E (deep plum)
- Column dividers: 1px solid #7C3AED (violet)
- Serving token: highlighted in #E8967A (rose gold), large text
- Waiting tokens: pearl white, smaller text
- Animate with a brief pulse when a token changes status

REALTIME:
- Subscribe to ALL queue_entries changes
- Subscribe to ALL barbers status changes  
- No manual refresh. Must be stable for 12+ hours (no memory leaks)

PERFORMANCE:
- Virtualize the queue list if more than 20 entries
- Do not re-render columns that haven't changed
```

---

### Step 6: Barber Dashboard (Day 3)

**Goal:** Build the authenticated barber-facing control panel.

**Prompt to use:**
```
Build the /barber/:id page for LUXE CUTS barbers (Zara, Marcus, or Dev).

AUTH: Use Supabase Auth. If not logged in, redirect to /login.
Barbers sign in with their email. After login, load their barber profile 
using the authenticated user's ID.

FEATURES:
1. Status toggle (Available / On Break) — updates barbers table in real-time
2. Currently serving card:
   - Shows current entry if status = 'serving'
   - Countdown timer from when they were called
   - [Mark Done] button → sets status='completed', records timestamp
   - [No-Show] button → sets status='absent', auto-calls next
3. Queue list:
   - Shows all 'waiting' entries for this barber, ordered by timestamp_joined
   - First item labeled "NEXT"
4. [Call Next Customer] button:
   - Disabled when currently serving someone
   - Sets next waiting entry to 'serving', records timestamp_called
   - Sends realtime update (triggers customer notification)
5. Stats bar: served today, avg service time, waiting now

Use useBarberStore (Zustand) for all state. Subscribe to realtime changes 
for this barber's queue only.
```

---

### Step 7: Admin Dashboard & Analytics (Day 4)

**Goal:** Build the admin overview and the analytics screen.

**Prompt to use:**
```
Build two admin screens for LUXE CUTS:

SCREEN 1: /admin — Global Queue Overview
- Requires admin role (check Supabase user metadata for role: 'admin')
- Summary cards: total served today, currently waiting, avg wait time, 
  busiest hour
- 3-column queue view (all barbers, live)
- Quick actions: add walk-in, change barber status, clear queue
- Activity log: last 20 events from queue_entries with timestamps

SCREEN 2: /analytics — Barber Performance Analytics
- Date range selector: Today / Last 7 days / Last 30 days
- Barber filter tabs: All | Zara | Marcus | Dev
- Per-barber cards: customers served, avg duration (vs. estimated), 
  no-show rate, busiest hour, most popular service
- Charts using Recharts:
  - BarChart: customers per hour (x=hour, y=count)
  - LineChart: avg wait time per day over selected range
  - PieChart: service distribution
- All data queried from Supabase with appropriate filters and aggregations
- Export to CSV button (optional, bonus)
```

---

### Step 8: Feedback Screen & Polish (Day 4–5)

**Goal:** Add customer feedback and final polish.

**Prompt to use:**
```
Build the /feedback/:token screen and do a final polish pass.

FEEDBACK SCREEN:
- Validate the feedback token against Supabase (UUID, not expired, not used)
- Show service summary: token, barber, service, date/time
- 5-star rating component (custom, not a library — build it with Tailwind)
- Optional text comment (280 char limit with live counter)
- If 4+ stars: show quick thumbs up/down for wait time, skill, cleanliness
- On submit: UPDATE queue_entry with rating + comment, mark token as used
- Post-submit: confetti animation (use canvas-confetti library)

POLISH PASS:
- Add page transitions (fade in) using CSS transitions on route change
- Add a loading skeleton for all data-fetching screens
- Ensure all screens work on mobile (iPhone 12 viewport minimum)
- Test all Supabase Realtime subscriptions unsubscribe correctly
- Add a simple /404 page with the scissors icon and witty message
- Check all colors match the design system (run a grep for any hardcoded hex)
```

---

## 4.5 State Management Architecture

> **Why Zustand?** React's built-in `useState` is great for local component state, but queue data needs to be shared across many components simultaneously. Zustand gives you a global store with minimal boilerplate and perfect TypeScript support.

### Store Structure

You'll need three Zustand stores:

```typescript
// src/stores/queueStore.ts
interface QueueState {
  // Data
  entries: QueueEntry[]
  myEntry: QueueEntry | null
  
  // Derived
  getPositionForEntry: (entryId: string) => number
  getWaitTimeForEntry: (entryId: string) => number
  
  // Actions
  joinQueue: (data: JoinQueueInput) => Promise<QueueEntry>
  cancelMyEntry: () => Promise<void>
  handleRealtimeUpdate: (payload: RealtimePayload) => void
}
```

```typescript
// src/stores/barberStore.ts
interface BarberState {
  // Data
  barbers: Barber[]
  myBarber: Barber | null
  myQueue: QueueEntry[]
  currentlyServing: QueueEntry | null
  
  // Actions
  setStatus: (status: BarberStatus) => Promise<void>
  callNext: () => Promise<void>
  markDone: () => Promise<void>
  markNoShow: () => Promise<void>
}
```

```typescript
// src/stores/authStore.ts
interface AuthState {
  user: User | null
  role: 'barber' | 'admin' | null
  isLoading: boolean
  
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}
```

### How Stores Interact with Realtime

```
Supabase Realtime Event
        ↓
  (arrives in hook)
        ↓
  store.handleRealtimeUpdate(payload)
        ↓
  Store updates its state
        ↓
  All subscribed components re-render automatically
```

### The Golden Rule of Zustand

> **Never put async logic in components.** Components call store actions. Stores talk to Supabase. This keeps components dumb and stores testable.

```typescript
// ❌ WRONG — API call in component
const handleJoin = async () => {
  const { data } = await supabase.from('queue_entries').insert(...)
  setMyEntry(data)
}

// ✅ RIGHT — component calls store action
const handleJoin = async () => {
  await useQueueStore.getState().joinQueue(formData)
  // store handles DB + state update
}
```

---

## 5. Writing Effective Prompts

### The Anatomy of a Great Prompt

Every effective AI prompt for coding has 5 parts:

```
1. CONTEXT   — What project, what file, what tech stack
2. TASK      — Exactly what to build or fix
3. SPEC      — The specific requirements (data, behavior, design)
4. CONSTRAINTS — What NOT to do, what already exists
5. OUTPUT FORMAT — How you want the code delivered
```

### Bad vs. Good Prompt Examples

---

#### ❌ Bad Prompt #1 — Too Vague
> "Make the queue update in real time"

**Why it fails:** No context (what framework? what database?), no spec (which screen? which data?), no constraints (what already exists?).

#### ✅ Good Prompt #1 — Specific & Contextual
> "In my LUXE CUTS React app (Vite + Supabase), add a Supabase Realtime 
> subscription to the `/token/:id` page. It should subscribe to changes on 
> the `queue_entries` table filtered by `barber_id = currentEntry.barber_id` 
> and `status = 'waiting'`. When an update arrives, recalculate the customer's 
> position in queue and update the `position` state. Use the existing 
> `supabase` client from `src/lib/supabase.ts`. Clean up the subscription 
> in the useEffect return."

---

#### ❌ Bad Prompt #2 — No Design Spec
> "Style the token card to look nice"

**Why it fails:** "Nice" means nothing to an AI. Without hex codes and font names, you get generic white cards.

#### ✅ Good Prompt #2 — Full Design Spec
> "Style the token display card in the `/token/:id` page with:
> - Background: `#1A0A2E` (--plum-deep)
> - Card container: `bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-violet-500/20`
> - Token number (LX-14): `font-['Playfair_Display'] text-8xl font-bold` in `#E8967A` (--rose-gold)
> - Customer name: `text-2xl text-[#F9F5FF]` (--pearl-white)
> - Status pill for 'waiting': `bg-amber-500/20 text-amber-400 rounded-full px-4 py-1 text-sm`
> - Status pill for 'serving': `bg-emerald-500/20 text-emerald-400`
> Do not use any external UI libraries. Pure Tailwind only."

---

#### ❌ Bad Prompt #3 — Ignores Existing Code
> "Create a Zustand store for the queue"

**Why it fails:** If you already have a partial store, the AI will create a conflicting duplicate.

#### ✅ Good Prompt #3 — Builds on Existing Code
> "Here is my current `src/stores/queueStore.ts`:
> [paste the file]
> 
> Add a new action called `handleRealtimeUpdate` that takes a Supabase 
> `RealtimePostgresChangesPayload<QueueEntry>` and:
> - If event is 'INSERT': adds the entry to the `entries` array
> - If event is 'UPDATE': finds the entry by ID and replaces it
> - If event is 'DELETE': removes the entry by ID
> 
> Keep all existing actions untouched. Only add the new function."

---

#### ❌ Bad Prompt #4 — No Error Handling Spec
> "Build the join queue form"

**Why it fails:** AI will build a happy-path form with no loading state, no error handling, no validation feedback.

#### ✅ Good Prompt #4 — With Full Error Cases
> "Build the join queue form for LUXE CUTS `/join` page. Include:
> VALIDATION: Show inline error if name is empty on submit. 
>   Show error if name > 30 chars (live char counter).
> LOADING: When submitting, disable the button and show a spinner inside it.
>   Button text changes from 'Join Queue →' to 'Joining...'
> ERROR: If Supabase insert fails, show a toast notification: 
>   'Something went wrong. Please try again.' (red, bottom-center)
> SUCCESS: Navigate to /token/:id only after the insert succeeds and 
>   the token ID is confirmed.
> Do not use any toast library — build a simple Toast component."

---

## 6. Using AI Tools — Antigravity & Codex

### Working with Antigravity (This AI Assistant)

Antigravity works best when you treat it like a senior developer who needs context. Here's your session startup ritual:

**Step 1: Start every session by giving context**
```
I'm working on a React + Supabase project called LUXE CUTS — a salon queue 
management system. The docs are in /docs/ (brief.md, screens.md, 
flows-rules.md, AGENTS.md). I'll paste relevant files as needed.

Today I'm working on: [specific task]
```

**Step 2: Paste the relevant file(s) before asking**
```
Here's my current queueStore.ts:
[paste file]

Now add...
```

**Step 3: Review before accepting**
Before hitting "Accept All Changes":
- Check that it used the right color variables (not hardcoded hex)
- Check that it imported from the right paths
- Check that TypeScript interfaces match your types
- Check that it didn't introduce a new library you didn't ask for

**Step 4: Ask for explanation if confused**
```
Explain what the useEffect cleanup function does in the subscription 
you just wrote. Why do we need to call supabase.removeChannel()?
```

### Useful Antigravity Slash Commands

| Command | When to Use |
|---|---|
| `/plan` | Before starting a complex feature — get a step-by-step plan |
| `/boost` | When stuck on a hard bug or architectural decision |
| `/goal` | For overnight runs — "build the entire barber dashboard" |

---

### Working with Codex / GitHub Copilot

Codex excels at **autocompleting patterns** you've established. After you write your first Zustand store, it will autocomplete the next one perfectly. Tips:

- Write detailed JSDoc comments before your function — Copilot reads them
- Write the function signature with TypeScript types — it fills the body
- Write the test description — it fills the test

---

## 7. Common Mistakes (All 10)

### Mistake #1: Starting Without Documents
**What happens:** You build a home screen in a random color scheme. Two days later you rebuild it.  
**Fix:** Write all 4 documents first. No exceptions.

---

### Mistake #2: One Giant Component File
**What happens:** `App.tsx` becomes 600 lines. No one can find anything.  
**Fix:** Every visual section is its own component. Every page is its own file.

```
❌ App.tsx (600 lines with everything inside)

✅ pages/JoinQueue.tsx (uses <ServiceGrid/>, <BarberPicker/>, <JoinForm/>)
   components/queue/ServiceGrid.tsx
   components/queue/BarberPicker.tsx
   components/queue/JoinForm.tsx
```

---

### Mistake #3: Forgetting to Unsubscribe from Realtime

**What happens:** Every time the customer navigates between screens, a new Supabase channel is created but never destroyed. After 10 minutes: 50 active channels, app slows to a crawl.

```typescript
// ❌ WRONG — no cleanup
useEffect(() => {
  supabase.channel('queue').on(...)subscribe()
}, [])

// ✅ RIGHT — always return cleanup
useEffect(() => {
  const channel = supabase.channel('queue').on(...)subscribe()
  return () => { supabase.removeChannel(channel) }  // ← this line!
}, [])
```

---

### Mistake #4: Hardcoding Colors Instead of Using Variables

**What happens:** You get a design review and need to change the accent from violet to teal. You have to find and replace 47 hex values across 20 files.

```css
/* ❌ WRONG */
background-color: #7C3AED;
color: #F9F5FF;

/* ✅ RIGHT */
background-color: var(--violet-electric);
color: var(--pearl-white);
```

---

### Mistake #5: Storing Sensitive Data in localStorage

**What happens:** You store the barber's login token in localStorage. A customer opens DevTools and finds it. Disaster.

**Fix:** Let Supabase Auth manage sessions (it uses httpOnly cookies internally). Never put JWTs or admin flags in localStorage.  
✅ You CAN store: the customer's queue entry ID, language preference, non-sensitive UI state.

---

### Mistake #6: Not Handling the Loading State

**What happens:** The queue screen flashes empty for 300ms before data loads. Users think the queue is empty and try to rejoin.

```typescript
// ❌ WRONG
if (!entries.length) return <div>No one in queue</div>

// ✅ RIGHT
if (isLoading) return <QueueSkeleton />
if (error) return <ErrorMessage retry={refetch} />
if (!entries.length) return <EmptyQueueMessage />
return <QueueList entries={entries} />
```

---

### Mistake #7: Not Testing on Mobile

**What happens:** Your app looks great on your laptop. On the demo day phone, all the text is tiny and buttons overlap.

**Fix:** Use Chrome DevTools mobile emulator from day 1. Build mobile-first with Tailwind: start with `className="text-sm md:text-base"`, not the reverse.

---

### Mistake #8: Letting AI Generate Fake Data as Real Data

**What happens:** You ask AI to "show me how the barber dashboard looks" and it generates mock data. You copy-paste the entire file, ship it, and your demo shows hardcoded names like "John Doe" instead of real queue data.

**Fix:** Always replace mock data with real Supabase queries before demo. Search your codebase for `"John Doe"`, `"mock"`, `"TODO"`, `"fake"` before submitting.

---

### Mistake #9: Pushing to GitHub with `.env` Exposed

**What happens:** Your Supabase service role key is in a `.env` file that you forgot to add to `.gitignore`. Your database gets scraped within hours by bots that scan public repos.

**Checklist:**
- [ ] `.env` and `.env.local` are in `.gitignore`
- [ ] Never use the **service role key** in frontend code — only the **anon key**
- [ ] Environment variables in Vercel are set through the dashboard, not committed

---

### Mistake #10: Building All Screens Before Testing Any

**What happens:** You build all 9 screens, then try to connect them to Supabase, and discover the data structure doesn't match what you assumed. Everything needs to be rebuilt.

**Fix:** Build vertically (full slice), not horizontally (all UI first). Complete flow: Join Queue → Token Screen → Barber Dashboard → Mark Done. All connected to real data. Then add more screens.

---

## 7.5 AI Prompt Debugging Lab

> **Exercise:** Each prompt below is broken. Read it, identify what's wrong, then write an improved version.

---

### 🔴 Broken Prompt 1

> *"Make my app look better with some nice colors"*

**Why it failed:**
- No specific screen mentioned
- "Nice" is subjective — AI has no reference
- No color palette provided
- No design system mentioned
- No constraints on what already works

**Write your improved version here:**
```
_____________________________________________
_____________________________________________
_____________________________________________
```

**Example fix:**
> *"Apply the LUXE CUTS design system to the `/join` page. Use CSS variable `var(--plum-deep)` as the page background, `var(--pearl-white)` for all body text, and `var(--violet-electric)` for the primary CTA button. The font for all H1 and H2 elements should be `'Playfair Display', serif`. Do not change any existing component logic."*

---

### 🔴 Broken Prompt 2

> *"The realtime isn't working. Fix it."*

**Why it failed:**
- Doesn't describe what "not working" means (error? stale data? crash?)
- Doesn't share the relevant code
- Doesn't describe expected behavior vs. actual behavior
- Too short for the AI to diagnose anything

**Write your improved version here:**
```
_____________________________________________
_____________________________________________
_____________________________________________
```

**Example fix:**
> *"My Supabase Realtime subscription in `src/pages/TokenScreen.tsx` (pasted below) is not updating the queue position when other customers are served. The `entries` state never changes after the initial load. Expected: when a barber calls next, the position number on-screen decreases by 1. Here is the useEffect: [paste code]. What's wrong?"*

---

### 🔴 Broken Prompt 3

> *"Add Hindi language support"*

**Why it failed:**
- No scope defined (all screens? just join screen?)
- No strings to translate provided
- No decision on how to store translations (i18n library? JSON file? inline?)
- No toggle mechanism described

**Write your improved version here:**
```
_____________________________________________
_____________________________________________
_____________________________________________
```

**Example fix:**
> *"Add Hindi language support to the `/join` screen only. Use a simple JSON translation approach (no i18n library needed). Create `src/locales/en.json` and `src/locales/hi.json`. The strings to translate are: Page title, service names, barber section header, name input placeholder, join button text, and language toggle label. The existing language toggle button (top-right) should switch between EN and हिंदी. Store language preference in localStorage key `'luxe-lang'`. Do not add any new libraries."*

---

### 🔴 Broken Prompt 4

> *"Create a component"*

**Why it failed:**
- No component name
- No props defined
- No visual description
- No behavior defined
- No context (which screen? which user role?)
- 100% of the spec is missing

**Write your improved version here:**
```
_____________________________________________
_____________________________________________
_____________________________________________
```

**Example fix:**
> *"Create a `StatusPill` component in `src/components/ui/StatusPill.tsx`. Props: `status: 'waiting' | 'serving' | 'completed' | 'absent'`. It renders a small rounded-full pill with appropriate color and label: waiting=amber/Waiting, serving=emerald/Serving, completed=grey/Done, absent=red/No-Show. Export as default. Include the TypeScript props interface. Use only Tailwind classes, no inline styles."*

---

### 🔴 Broken Prompt 5

> *"Make it faster"*

**Why it failed:**
- No baseline — faster than what? How is "slow" being measured?
- No identified bottleneck
- No specific screen or operation
- Could mean: render speed, load time, Supabase query speed, animation FPS

**Write your improved version here:**
```
_____________________________________________
_____________________________________________
_____________________________________________
```

**Example fix:**
> *"The `/display` screen re-renders all 3 barber columns every time any queue entry changes, even if only one barber's queue was affected. Optimize it so that each barber column is a separate memoized component (`React.memo`) that only re-renders when its own barber's queue data changes. The queue data for each barber comes from filtering `useQueueStore(s => s.entries)` by barber_id. Here is the current Display.tsx: [paste code]."*

---

## 8. Pre-Prompt Checklist

Before you paste any prompt into an AI tool, run through this checklist:

### ✅ Document Checklist
- [ ] `docs/brief.md` written and saved
- [ ] `docs/screens.md` written — the screen I'm building is documented
- [ ] `docs/flows-rules.md` written — the flows for this screen are documented
- [ ] `AGENTS.md` written and I've told the AI to read it

### ✅ Context Checklist
- [ ] I've told the AI what tech stack I'm using (React + Vite + Supabase + Zustand)
- [ ] I've told the AI which file I'm working in
- [ ] I've pasted the relevant existing code the AI needs to build on
- [ ] I've specified the brand colors using hex codes AND variable names
- [ ] I've specified which fonts to use

### ✅ Spec Checklist
- [ ] I've described the happy path (normal behavior)
- [ ] I've described at least one error state (what if data doesn't load?)
- [ ] I've described the loading state
- [ ] I've specified what happens after the user action (navigate to X, show Y)

### ✅ Constraint Checklist
- [ ] I've told the AI what NOT to use (no extra libraries, no inline styles)
- [ ] I've told the AI what already works (don't touch the auth logic)
- [ ] I've told the AI the naming conventions (kebab-case files, PascalCase components)

### ✅ Output Checklist
- [ ] I've asked for complete files, not snippets (or vice versa, as appropriate)
- [ ] I've asked for TypeScript interfaces if adding new data types
- [ ] After receiving: I checked for hardcoded colors, paths, and mock data

---

## 9. Hosting Your Project

### Frontend: Vercel (Free Tier)

**Step 1:** Push your project to GitHub (make sure `.env` is in `.gitignore`)

**Step 2:** Go to [vercel.com](https://vercel.com) → "Add New Project" → Import from GitHub

**Step 3:** Configure build settings:
```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
```

**Step 4:** Add environment variables in Vercel dashboard:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

> **WARNING:** Never set `VITE_SUPABASE_SERVICE_ROLE_KEY` as a Vercel env var. That key belongs only on a trusted backend server, never in the browser.

**Step 5:** Deploy. Every push to `main` auto-deploys.

---

### Backend: Supabase Cloud (Free Tier)

Your Supabase project is already hosted when you create it at [supabase.com](https://supabase.com). No extra deployment needed.

Free tier limits (more than enough for this project):
- 500 MB database
- 5 GB bandwidth
- 1 GB file storage
- 50,000 monthly active users

---

### Setting Up Supabase Realtime for Production

Enable Realtime for your tables in the Supabase dashboard:
1. Go to **Database** → **Replication**
2. Enable Realtime for: `queue_entries`, `barbers`
3. Set `REPLICA IDENTITY = FULL` for `queue_entries` (needed for UPDATE events):

```sql
ALTER TABLE queue_entries REPLICA IDENTITY FULL;
ALTER TABLE barbers REPLICA IDENTITY FULL;
```

---

### Live Demo URL Format

Your submission should include:
```
Live URL:    https://luxe-cuts-[your-name].vercel.app
GitHub Repo: https://github.com/[your-username]/luxe-cuts
```

---

## 10. What to Submit

Your final submission must include all of the following:

### 📁 Repository Structure

```
luxe-cuts/
├── docs/
│   ├── brief.md                  ✅ Required
│   ├── screens.md                ✅ Required
│   ├── flows-rules.md            ✅ Required
│   └── AGENTS.md                 ✅ Required
├── src/
│   ├── components/               ✅ Required
│   ├── pages/                    ✅ Required
│   ├── stores/                   ✅ Required
│   ├── hooks/                    ✅ Required
│   ├── lib/supabase.ts           ✅ Required
│   └── types/                    ✅ Required
├── .env.example                  ✅ Required (with placeholder values)
├── .gitignore                    ✅ Required (.env must be listed)
├── README.md                     ✅ Required
└── PROMPT_LOG.md                 ✅ Required (see below)
```

### 📝 PROMPT_LOG.md

Create this file and log every significant AI prompt you used. Format:

```markdown
# PROMPT LOG — LUXE CUTS

## Session 1 — Project Setup (Date)

### Prompt 1.1
**Goal:** Set up the initial Vite + React project
**Tool:** Antigravity
**Prompt:** [paste your full prompt]
**Result:** Created 12 files, all working
**Changes made after:** Had to fix the Tailwind config — 
it used `content: []` instead of the correct glob pattern

---

## Session 2 — Join Queue Screen (Date)
...
```

> **Why:** Demonstrating your prompting process IS part of the assessment. Good prompts = higher marks.

### 📋 README.md Must Include

```markdown
# LUXE CUTS — Queue Management System

## Live Demo
[URL here]

## Features Implemented
- [ ] Join Queue screen (Screen 1)
- [ ] Token display screen (Screen 2)
- [ ] Live queue display (Screen 3)
- [ ] Barber dashboard (Screen 4)
- [ ] Admin dashboard (Screen 5)
- [ ] Analytics dashboard (Screen 8)
- [ ] Feedback screen (Screen 9)

## Tech Stack
[List with versions]

## Setup Instructions
[Steps to run locally]

## Database Schema
[Paste your SQL or link to Supabase schema screenshot]

## Known Issues
[Honest list of what doesn't work yet]
```

---

## 11. Advanced Features

> **Go beyond the minimum to earn top marks and build something genuinely impressive.**

### 🔔 Sound Notifications with Tone.js

```typescript
import * as Tone from 'tone'

// When it's a customer's turn — play a luxurious chime
const playTurnChime = async () => {
  await Tone.start()
  const synth = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.1, decay: 0.3, sustain: 0.4, release: 1.0 }
  }).toDestination()
  
  // Play ascending notes for a premium feel
  synth.triggerAttackRelease('C5', '0.3', Tone.now())
  synth.triggerAttackRelease('E5', '0.3', Tone.now() + 0.35)
  synth.triggerAttackRelease('G5', '0.5', Tone.now() + 0.70)
}
```

**What it adds:** When a customer's status changes to "serving", a soft chime plays. No more customers missing their turn because they were on their phone.

---

### 🌐 Hindi Language Support (i18n)

```typescript
// src/locales/hi.json
{
  "join.title": "कतार में शामिल हों",
  "join.selectService": "सेवा चुनें",
  "join.yourName": "आपका नाम",
  "join.joinButton": "कतार में जुड़ें →",
  "token.welcome": "स्वागत है, {name}!",
  "token.position": "आप #{position} नंबर पर हैं",
  "token.waiting": "प्रतीक्षारत",
  "token.yourTurn": "आपकी बारी है! 💜",
  "services.classicCut": "क्लासिक कट",
  "services.royalFade": "रॉयल फेड"
}
```

Implement with a simple custom hook:
```typescript
const { t, lang, toggleLang } = useTranslation()
// Usage: {t('join.title')}
```

---

### 📊 Barber Performance Analytics

Go beyond basic charts. Add:
- **Efficiency score:** actual duration / estimated duration (1.0 = perfect)
- **Customer satisfaction correlation:** avg rating by barber
- **Peak hour prediction:** "Marcus is usually busiest between 2–4 PM"
- **Service specialization:** which services each barber completes fastest

---

### 🎯 Estimated Wait Accuracy Improvements

The basic formula `(position - 1) × avg_duration` is too simplistic. Improve it:

```typescript
const calculateSmartWait = (
  position: number,
  barber: Barber,
  service: Service,
  timeOfDay: number  // hour, 0-23
): number => {
  // 1. Use service-specific avg duration (not global avg)
  const serviceAvg = getBarberServiceAvg(barber.id, service)
  
  // 2. Apply time-of-day multiplier (lunch rush, etc.)
  const rushMultiplier = getRushMultiplier(timeOfDay)
  
  // 3. Account for the barber's current pace today
  const todayPaceMultiplier = getTodayPaceMultiplier(barber.id)
  
  return (position - 1) * serviceAvg * rushMultiplier * todayPaceMultiplier
}
```

---

### 📱 QR Code for Join Queue

Add a QR code that customers can scan to open the join screen directly on their phone. This eliminates the need to type a URL.

```typescript
import QRCode from 'qrcode.react'

// In your admin screen or display screen:
<QRCode 
  value="https://luxe-cuts.vercel.app/join"
  size={256}
  bgColor="#1A0A2E"
  fgColor="#E8967A"  // rose-gold QR pattern
  level="H"         // High error correction
/>
```

Print and laminate this QR code at the reception desk.

---

### ⭐ Smart Queue Priority

Add an optional "Priority" flag for customers:
- Senior citizens (asked at join time)
- Customers who have been waiting > 45 minutes
- VIP members (future feature with account system)

Display priority customers with a small crown icon in the barber dashboard queue.

---

## 12. Troubleshooting Reference

### Error: "supabase is not defined"
**Cause:** Supabase client not imported, or `.env` variables missing.  
**Fix:**
```bash
# Check your .env file exists and has these variables:
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Check import in your component:
import { supabase } from '@/lib/supabase'
```

---

### Error: "Cannot read properties of null (reading 'id')"
**Cause:** You're trying to access `.id` on data that hasn't loaded yet.  
**Fix:**
```typescript
// ❌ WRONG — entry might be null during loading
const position = entries.filter(e => e.barber_id === entry.barber_id)

// ✅ RIGHT — guard with optional chaining
const position = entry ? entries.filter(e => e.barber_id === entry?.barber_id) : 0
```

---

### Error: Realtime updates not received

**Checklist:**
- [ ] Is Realtime enabled for the table in Supabase Dashboard → Database → Replication?
- [ ] Did you run `ALTER TABLE queue_entries REPLICA IDENTITY FULL;`?
- [ ] Is your channel name unique? (Two channels with the same name conflict)
- [ ] Did you call `.subscribe()` after `.on()`?
- [ ] Are you on the Supabase free tier? Check if you've hit the connection limit.

```typescript
// Debug: log subscription status
const channel = supabase.channel('debug-channel')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_entries' }, 
    (payload) => console.log('✅ Received:', payload))
  .subscribe((status) => {
    console.log('Subscription status:', status) 
    // Should log: SUBSCRIBED
  })
```

---

### Error: Tailwind classes not applying

**Cause:** The class name contains a dynamic variable that Tailwind can't detect at build time.

```typescript
// ❌ WRONG — Tailwind can't see this at build time
const color = status === 'waiting' ? 'amber' : 'emerald'
return <div className={`bg-${color}-500`}>...</div>

// ✅ RIGHT — Use complete class names in a lookup object
const statusClasses = {
  waiting: 'bg-amber-500 text-amber-900',
  serving: 'bg-emerald-500 text-emerald-900',
  completed: 'bg-gray-500 text-gray-900',
}
return <div className={statusClasses[status]}>...</div>
```

---

### Error: "Row Level Security policy violation"

**Cause:** Your Supabase RLS policies are blocking the operation.  
**Fix:**
1. Go to Supabase Dashboard → Authentication → Policies
2. Find the table that's being blocked
3. Check: does the anon role have permission for this operation (INSERT/UPDATE/SELECT)?

```sql
-- Allow anyone to read queue entries (for the display screen)
CREATE POLICY "Anyone can read queue entries"
ON queue_entries FOR SELECT
TO anon
USING (true);

-- Allow anyone to insert (join queue)
CREATE POLICY "Anyone can join queue"
ON queue_entries FOR INSERT
TO anon
WITH CHECK (true);

-- Only barbers can update (mark done, etc.)
CREATE POLICY "Barbers can update their queue"
ON queue_entries FOR UPDATE
TO authenticated
USING (
  barber_id = (SELECT id FROM barbers WHERE auth_user_id = auth.uid())
);
```

---

### Error: Page is blank after deploying to Vercel

**Cause 1:** Environment variables not set in Vercel.  
**Fix:** Go to Vercel project → Settings → Environment Variables → Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

**Cause 2:** React Router routes return 404 on direct navigation.  
**Fix:** Add `vercel.json` to your project root:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

---

### Error: Build fails with TypeScript errors

**Common fixes:**
```typescript
// Error: 'event' is of type 'unknown'
// Fix: type the event parameter
onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}

// Error: Type 'string | undefined' not assignable to type 'string'
// Fix: use nullish coalescing
const name = entry?.customer_name ?? 'Guest'

// Error: Property 'X' does not exist on type 'Y'
// Fix: update your interface in src/types/index.ts
```

---

### Performance: App feels sluggish with many queue entries

**Fixes in order of impact:**
1. Add `React.memo()` to list items so they don't re-render unnecessarily
2. Use `useMemo()` for expensive derived calculations (filtered lists, sorted arrays)
3. Implement windowing for lists > 50 items using `react-window`
4. Narrow your Supabase Realtime subscription filter to only the data you need

---

```
╔══════════════════════════════════════════════════════════════╗
║  Good luck, and remember: the best apps are built on         ║
║  great documentation. Write your docs, then write           ║
║  your prompts. LUXE CUTS is waiting for you to build it.    ║
║                                                              ║
║                    — IT603 Lab Team                          ║
╚══════════════════════════════════════════════════════════════╝
```

---

*LUXE CUTS Vibe Coding Lab Guide v2.0 — IT603 Introduction to Programming*  
*Doon University of Applied Sciences | Sem 1*
