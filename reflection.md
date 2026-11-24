# Half-Page Reflection
## Salon Queue Management System — Vibe Coding Lab Reflection


---

### Student Reflection

**Context & Objective:**  
In this lab, we built a modern salon queue orchestration platform (**LUXE CUTS**) using AI-assisted vibe coding. Rather than relying on generic prompts that produce standard templates, we prepared architectural documents beforehand (`AGENTS.md`, `docs/01-brief.md`, `docs/02-screens.md`, and `docs/03-flows-rules.md`) to guide the assistant toward a production-grade, bespoke application.

---

### One Major Thing the Agent Got Wrong & How It Was Resolved

#### 1. The Issue: Real-Time Sync Strategy and Environment Brittleness
When initially asked to make the app "connected to a database and real-time", the agent initially defaulted to a pure Supabase cloud configuration requiring environment variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`). 

**How I Noticed It:**  
During manual testing across different devices and private browsing windows, I observed that if external Supabase credentials were not immediately provided, the app fell back to basic browser `localStorage`. While `localStorage` saved state within a single tab, it did not broadcast state changes in real time to the lounge TV screen (`/display`) or the stylist cockpits (`/barber/:id`) across different devices or separate sessions. 

#### 2. Root Cause Analysis:
The agent assumed that cloud PostgreSQL real-time was the only required solution. It did not anticipate that an evaluator or local user might test the project without creating an external Supabase account, leading to broken synchronization expectations.

#### 3. How the Prompt & Architecture Were Fixed:
I instructed the agent to implement a **resilient multi-tier data engine**:
1. An embedded, zero-configuration **Node.js HTTP Server (`server/server.js`) on port 3001** with a persistent JSON file database (`server/data/database.json`) and **Server-Sent Events (SSE)** at `/api/events`.
2. A browser **BroadcastChannel engine** for instantaneous cross-tab synchronization with zero latency.
3. Keeping the **Supabase PostgreSQL** client available as a plug-and-play cloud tier with SQL migration files (`supabase-schema.sql`).

By revising the architectural prompt to mandate local persistence and SSE streaming alongside cloud options, the app works flawlessly out of the box with zero external configuration (`npm run dev`), while still supporting enterprise PostgreSQL scaling.

---

### Key Takeaway on Vibe Coding
Clear constraints and boundary setting in documentation save hours of debugging. When prompts specify concrete technical mechanisms (such as SSE, Web Audio API synthesis, and exact hex colors) rather than vague requests like "make it real-time" or "make it look nice", the AI assistant functions as a highly accurate implementer rather than a guessing engine.
