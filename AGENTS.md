# AGENTS.md — LUXE CUTS Architecture Rules
> **Historical baseline instructions:** This file records the original LUXE CUTS blue/white, English/Hindi and Zara/Marcus/Dev requirements. For LateCuts work, use `docs/LATECUTS_PROJECT_SPECIFICATION.md` for confirmed product decisions and `docs/LATECUTS_PRESERVATION_CHECKLIST.md` for preservation requirements. Do not treat superseded identity choices below as current LateCuts requirements; retain the underlying feature and queue behavior.

## Instructions for AI Agents & Developers

### Project Overview
LUXE CUTS is a production-grade, real-time salon queue orchestration platform built with React + Vite + TypeScript + Tailwind CSS + Node.js.

### Core Working Rules
1. **Design System:**
   - Preserve LateCuts' premium dark luxury direction and existing screen behavior.
   - Avoid broad, unrelated redesigns during backend and deployment work.
2. **State Management & Storage:**
   - Zustand `src/stores/queueStore.ts` is the frontend state cache, not the source of truth.
   - Persistent queue and catalog reads/writes go through `server/server.js` to Supabase PostgreSQL.
   - `/api/events` sends redacted SSE notices. BroadcastChannel messages are invalidation notices only; never put customer records in them.
   - `server/data/database.json` is legacy local data. Keep it untouched and ignored; do not restore JSON fallback behavior.
3. **Audio & Sensory Feedback:**
   - Web Audio API pure synthesizer (528 Hz / 1056 Hz harmonic tone) for chime alerts.
   - Canvas physics engine for feedback confetti.
4. **Security & Routes:**
   - Client route guards are usability only; protected API actions must verify the signed staff session in the Node backend.
   - Staff username is `staff`; credentials come only from backend `STAFF_PIN` and `STAFF_SESSION_SECRET` environment variables.
   - `SUPABASE_SERVICE_ROLE_KEY` stays on the Node host. Never expose it through Vite, `VITE_*`, source code, logs, or docs.
   - Supabase RLS must not grant anonymous/authenticated access to customer queue data. Public API projections must omit other customers' names and contact details.
   - Configure explicit `CORS_ALLOWED_ORIGINS`; never use wildcard CORS.
