# Envision — Build Plan (Chunks 0–6)

Build strictly in order. A chunk is done when its **Done Gate** passes. Progress lives in `roadmap.md`.

## Chunk 0: Repo foundation, env safety & CI

- **Goal:** Next.js TS project, Zod `src/env.ts`, `/api/health`, Vitest with one real unit test, GitHub Actions `ci.yml` on every push & PR (`format:check`, `typecheck`, `lint`, `test:unit`, `build`). Web deploys via Vercel GitHub integration.
- **Done Gate:** Pushing a branch runs CI cleanly; `/api/health` responds on the Vercel preview URL.

## Chunk 1: Schema, migrations & tenant onboarding

- **Goal:** Prisma v7 config (`DATABASE_URL` pooler :6543 runtime, `DIRECT_URL` :5432 migrations), init migration (`Tenant`, `User`, `InterviewSession`, `HrEvaluation`, `Invite`), Supabase Auth (`/auth/confirm` via `verifyOtp` + `token_hash`, invite signup, login, password reset), `requireAuthContext()`, atomic `onboardingService`. CI gains `test:integration` (Postgres service + `migrate deploy`); add `deploy.yml` (migrations on push to `main`) and `keep-alive.yml` (ping production `/api/health` every 3 days).
- **Done Gate:** Integration test: signup with a valid invite creates a `DEMO` tenant (30 min) + `ADMIN` user and marks the invite used; unknown, used and expired invites are rejected; two simultaneous signups on one invite → exactly one succeeds.

## Chunk 2: Session lifecycle & minute guardrail (finalize-once)

- **Goal:** `billingService`: atomic minute deduction (conditional `updateMany`) and state transitions `PENDING → IN_PROGRESS → COMPLETED → GRADED | GRADING_FAILED`. Repeat finalize calls match 0 rows and deduct nothing.
- **Open question to settle in `/decide` before coding:** a call may start with `minutesBalance > 0` but run up to 10 min. What happens at finalize if `cost > minutesBalance`? (Options: cap call length at `min(planCap, balance)` when issuing the token; clamp deduction to the balance; or both.) The transcript must never be lost because the deduction failed.
- **Done Gate:** 10 concurrent `Promise.all` finalize calls for one session deduct once and `minutesBalance` never goes negative.

## Chunk 3: Document parsing & candidate persona

- **Goal:** In-memory parser (`documentParserService`, max 5 MB, reject `< 100` extracted chars); XML-delimited persona prompt builder (`<candidate_cv>`, `<job_description>`). See roadmap D6 (PDF-only first?).
- **Done Gate:** Unit tests cover scanned-PDF rejection, prompt-injection containment, strict persona instructions.

## Chunk 4: Mic check, LiveKit rooms & voice worker

- **Goal:** Pre-call mic permission + level check UI; `POST /api/livekit/token` (balance > 0, max 1 active session per user, `emptyTimeout: 60`, `maxParticipants: 2`); countdown UI with 1-min warning before the 10-min `DEMO` cutoff (45 min `PRO`); `POST /api/webhooks/livekit` (signature verified); `@livekit/agents` worker. Decide worker hosting first (roadmap D3).
- **Done Gate:** Complete a live mock interview in the browser, watch the countdown, hang up (or hit cutoff), verify transcript + minute deduction in Postgres.

## Chunk 5: Async grading & report UI

- **Goal:** Inngest `interview/completed` job → Gemini structured-output rubric grader → `HrEvaluation`, or `GRADING_FAILED` with a UI retry; shadcn report page.
- **Done Gate:** Ending a call grades it in the background and renders the level with per-dimension feedback.

## Chunk 6: Observability & beta launch

- **Goal:** 6 funnel events (`tenant_created`, `documents_uploaded`, `mic_check_completed`, `interview_started`, `interview_ended`, `grading_completed`) + structured logs `{ level, event, tenantId, sessionId, roomSid }` in PostHog.
- **Done Gate:** All 6 events and server exceptions appear during an end-to-end run; invite the first 5–10 HR testers.
