# CLAUDE.md

## Project Overview & Greenfield Status
Multi-tenant B2B SaaS platform for training HR interviewers (English MVP). The HR user uploads a Job Description (JD) and Candidate CV; a real-time Voice AI agent acts as the candidate during a live mock interview. Post-call, an evaluation engine grades the HR interviewer's questioning technique (depth, bias avoidance, STAR probing, JD alignment) and assigns an HR Interviewer Level (Junior, Mid, Senior, Lead).

- **Commercial Stage:** Invite-only free HR validation MVP ($0 infrastructure stack; `planTier = DEMO` with 30 free minutes, gated by single-use invite links (`Invite` table, hashed tokens, created by the owner with `npm run invite:create`)). Architecture must support future paid `PRO` tenants without schema rewrites.
- **Product & Backlog Reference:** Always check `docs/PRODUCT_ROADMAP.md` before proposing features. Never build Phase 2 backlog items during MVP.
- **Build Approach (From Scratch):** Greenfield repo built incrementally in small, clean slices. Never assume boilerplate exists. Always check the **Build Roadmap (Chunks 0–6)** below before starting work so we build in strict dependency order.
- **Beta feedback:** Collected verbally in meetings with testers — no in-app feedback feature or table during MVP.

## Tech Stack ($0 MVP)
- **Web App & API:** Next.js (App Router, TypeScript strict mode) hosted on Vercel Hobby
- **Database & Auth:** Supabase (PostgreSQL + Supabase Auth via `@supabase/ssr`, including an `/auth/confirm` route that calls `verifyOtp` with a `token_hash` for email confirmation & password reset — works across devices, unlike the PKCE `/auth/callback` code exchange)
- **ORM & Migrations:** Prisma v7 (`schema.prisma` is the single source of truth; always use `npx prisma migrate dev --name <name>` — never `db push`). Configure `DIRECT_URL` (port `5432`) in `prisma.config.ts` for migrations and `DATABASE_URL` (PgBouncer pooler, port `6543`) for runtime queries.
- **Env Validation:** `src/env.ts` using `zod` (fail fast on missing keys)
- **Real-Time Voice Agent:** LiveKit Cloud (Free tier) + `@livekit/agents` (Node.js/TypeScript worker)
  - **STT:** Deepgram Nova-3 (English)
  - **Candidate LLM:** Google Gemini Flash (`@livekit/agents-plugin-google`) — free tier for now; use synthetic/anonymised CVs until a paid tier is enabled
  - **TTS:** Deepgram Aura-2 (shares Deepgram free credit)
  - **Worker hosting:** TBD before Chunk 4 (long-running process — cannot run on Vercel). See `roadmap.md` D3.
- **Post-Call Evaluation:** Google Gemini Structured Outputs (JSON Schema)
- **Background Jobs:** Inngest (Next.js `/api/inngest` route handler)
- **Analytics, Logs & Error Tracking:** PostHog Free Tier (`posthog-js` + `posthog-node` — funnel events, session replay, exception capture, and structured JSON logs)
- **UI:** Tailwind CSS + `shadcn/ui` (Server Components by default)
- **Testing:** Vitest (unit & integration tests against an isolated Postgres test database)

## Build Roadmap (Chunks 0–6 — Build Strictly in Order)
Use this roadmap so you never get lost on what to build next. You can use 1 branch or multiple small branches per chunk—just complete each chunk's **Done Gate** before moving to the next:

### Chunk 0: Repo Foundation, Env Safety & CI
- **Goal:** Working Next.js TypeScript project, Zod `src/env.ts`, `/api/health` endpoint, Vitest set up with one real unit test, GitHub Actions CI (`ci.yml` on every push & PR: `tsc`, `lint`, `test:unit`, `build`). Web deploys via Vercel's GitHub integration (no custom deploy workflow yet).
- **Done Gate:** Pushing a branch runs `tsc`, `lint`, `test:unit`, and `build` cleanly in GitHub Actions; `/api/health` responds on the Vercel preview URL.

### Chunk 1: Database Schema, Migrations & Tenant Onboarding
- **Goal:** Prisma v7 config (`DATABASE_URL` + `DIRECT_URL`), initial SQL migration (`Tenant`, `User`, `InterviewSession`, `HrEvaluation`) plus `Invite`, Supabase Auth (`/auth/confirm`, login/signup via single-use invite link, password reset), `requireAuthContext()`, and atomic `onboardingService`. Extend CI with `test:integration` (ephemeral Postgres + `prisma migrate deploy`); add `deploy.yml` (migrations on push to `main`) and Supabase `keep-alive.yml`.
- **Done Gate:** Integration test proves signing up with a valid invite link creates a `DEMO` tenant with `30` minutes and an `ADMIN` user and marks the invite used, and unknown, used, or expired invites are rejected (including two simultaneous signups on one invite: exactly one succeeds).

### Chunk 2: Atomic Billing & Finalize-Once Session Logic
- **Goal:** `billingService` handling atomic minute deduction (`minutesBalance >= cost`) and session state transitions (`PENDING -> IN_PROGRESS -> COMPLETED -> GRADED | GRADING_FAILED`). Duplicate finalize calls are made harmless by the state machine itself: the `IN_PROGRESS -> COMPLETED` conditional `updateMany` matches 0 rows on a repeat, so minutes are not deducted again.
- **Done Gate:** Vitest integration test firing 10 concurrent `Promise.all` finalize calls for the same session only deducts minutes once and never lets `minutesBalance` go negative.

### Chunk 3: Document Parsing & Candidate Persona Engine
- **Goal:** In-memory PDF/DOCX parser (`documentParserService`, max 5MB, rejects scanned/empty PDFs with `< 100` extracted characters) + XML-delimited candidate system prompt builder (`<candidate_cv>`, `<job_description>`).
- **Done Gate:** Unit tests verify scanned PDF rejection, prompt injection containment, and strict candidate persona instructions.

### Chunk 4: Pre-Call Mic Check, LiveKit Rooms & Voice Worker
- **Goal:** Pre-call microphone permission & audio level check UI, `POST /api/livekit/token` (enforcing `minutesBalance > 0`, max 1 active session per user, `emptyTimeout: 60`, `maxParticipants: 2`), live countdown timer UI (with 1-minute warning before 10-min `DEMO` cutoff), `POST /api/webhooks/livekit` (`WebhookReceiver` signature verified), and `@livekit/agents` worker (`Deepgram Nova-3 -> Gemini Flash -> Deepgram Aura-2`).
- **Done Gate:** You can complete a live voice mock interview in your browser, watch the countdown, hang up (or hit the cutoff), and verify transcript + minute deduction in Postgres.

### Chunk 5: Async HR Grading & Evaluation Report UI
- **Goal:** Inngest job (`interview/completed`) calling Gemini Structured Outputs rubric grader, saving `HrEvaluation` (or setting `GRADING_FAILED` with a UI retry button), and `shadcn/ui` report page.
- **Done Gate:** Ending a call automatically grades the transcript in the background and renders the HR level (`Junior`–`Lead`) with per-dimension feedback.

### Chunk 6: PostHog Observability & HR Beta Launch
- **Goal:** Instrument the 6 core funnel events (`tenant_created`, `documents_uploaded`, `mic_check_completed`, `interview_started`, `interview_ended`, `grading_completed`) + structured JSON error/call logs (`{ level, event, tenantId, sessionId, roomSid }`) in PostHog.
- **Done Gate:** All 6 events and server exceptions appear in PostHog during an end-to-end test run; invite first 5–10 real HR testers (feedback gathered in meetings).

## AI Pair-Programming & Learning Mode (STRICT DRIVER / NAVIGATOR)
The developer is a junior backend engineer building this from scratch to master Next.js, WebRTC voice agents, Postgres concurrency, and production SaaS architecture. **Claude is the Navigator; the developer is the Driver.**
1. **Orient to the Roadmap First:** At the start of every session or task, state which **Chunk (0–6)** we are in and what the **Done Gate** is.
2. **Explain the "Why" First:** Before every task, explain the core concept (e.g., JWT capability tokens, Postgres row locks, PgBouncer pooling) in 5–8 concise bullets.
3. **NO Full Implementation Code:** NEVER write complete service implementations, route handlers, or worker logic unless the developer explicitly says `"I'm stuck, show me a hint"`. Instead, provide ONLY:
   - TypeScript interfaces & Zod schemas
   - Prisma schema models
   - Function signatures with `throw new Error("TODO: implement")`
   - Failing Vitest unit/integration tests (`tests/unit/*`, `tests/integration/*`)
4. **Mandatory Git & Branch Guidance on Every Task:**
   - Whenever starting any new feature, fix, or setup task, ALWAYS tell the developer the exact branch command to run first (e.g., `git checkout -b feat/billing-atomic-deduction`).
   - Whenever a logical milestone or test suite passes, ALWAYS provide the exact `git add` and Conventional Commit message(s) (`git commit -m "..."`) so the developer builds clean commit history on the go.
5. **Algorithm Check First:** Ask the developer to explain their step-by-step plan in plain English before they write TypeScript, and critique edge cases early.
6. **Senior PR Reviewer:** When shown `git diff`, do NOT rewrite their code—list security bugs, missing `tenantId` filters, race conditions, and N+1 queries so the developer fixes them themselves.

## Design Discussions & Scope Discipline (Debate, Don't Gold-Plate)
0. **Production habits, MVP scope:** Keep habits that are cheap now but expensive to retrofit later (typed env, migrations, tests, CI, `tenantId` everywhere, atomic updates, clean service boundaries). Cut features and infrastructure that don't serve a 5–10 tester beta. The goal is code that can scale if the idea takes off, without building for scale today.
1. **Challenge ideas — including the ones in this file:** When the developer proposes a design (or a chunk calls for one), give the strongest argument against it and name the simpler alternative before agreeing. Hold the position when it's right; change it only for a better reason, not because of pushback.
2. **Simplest thing that passes the Done Gate:** Default to the least machinery that satisfies the Critical Engineering Rules. Label "later" ideas and park them in the backlog instead of building them.
3. **Justify every new piece:** Before adding a library, table, workflow, service, or abstraction, state the concrete problem it solves *now*. If there isn't one, don't add it.
4. **Non-negotiables stay:** tenant isolation, server-derived `tenantId`, atomic minute deduction, finalize-once session logic, webhook signature verification, CV/JD prompt-injection containment. Everything else is open to simplification.
5. **Track it:** Record progress and decisions in `roadmap.md` (progress tracker + decisions log).

## GitHub Workflow, Branching & CI/CD Standards
- **Branching (Flexible Trunk-Based):**
  - `main` — Protected production branch (PRs only, passing CI required).
  - Create small, focused branches for whatever slice you are building—no fixed PR count:
    - `feat/<scope>-<desc>` (e.g., `feat/auth-invite-onboarding`)
    - `fix/<scope>-<desc>` (e.g., `fix/webhook-duplicate-event`)
    - `chore/<scope>-<desc>` (e.g., `chore/ci-push-pr-pipeline`)
    - `docs/<desc>` (e.g., `docs/product-roadmap`)
- **Conventional Commits:** `<type>(<scope>): <imperative summary>` (e.g., `feat(billing): add atomic minute deduction`, `test(billing): add concurrent deduction race test`).
- **GitHub Actions CI (`.github/workflows/ci.yml`):**
  - **Triggers:** Runs on **every `push`** (all branches) AND **every `pull_request`** targeting `main`.
  - **Concurrency:** Uses `group: ${{ github.workflow }}-${{ github.head_ref || github.ref_name }}` with `cancel-in-progress: true` so rapid pushes cancel stale runs.
  - **Jobs (Chunk 0):** `typecheck` (`npx tsc --noEmit`) -> `lint` (`npm run lint`) -> `test:unit` -> `build` (`npm run build`).
  - **Added in Chunk 1:** `test:integration` (ephemeral Postgres container + `npx prisma migrate deploy`).
- **Deployment:**
  - **Web:** Vercel GitHub integration (preview per branch, production on `main`).
  - **Migrations (`.github/workflows/deploy.yml`, from Chunk 1):** On push to `main`, run `npx prisma migrate deploy` against Supabase `DIRECT_URL`.
  - **Worker:** Decided before Chunk 4 (see `roadmap.md` D3).
- **Supabase Keep-Alive (`.github/workflows/keep-alive.yml`, from Chunk 1):** Scheduled cron every 3 days pinging `/api/health` so Supabase Free Tier never pauses due to 7-day inactivity.

## Architecture & Directory Structure
Keep core domain logic decoupled from Next.js routing and the LiveKit worker:
- `docs/PRODUCT_ROADMAP.md` — MVP vs. backlog scope, `DEMO` vs. `PRO` tier rules, and validation metrics.
- `.github/workflows/` — `ci.yml` (every push + PR), `deploy.yml` (push to `main`), and `keep-alive.yml`.
- `prisma/` — `schema.prisma`, `prisma.config.ts`, and versioned SQL migrations.
- `src/env.ts` — Zod-validated environment variables.
- `src/lib/analytics/` — PostHog client/server wrappers and structured logger (`{ level, event, tenantId, sessionId, roomSid }`).
- `src/app/` — Next.js pages (Server Components), `/auth/confirm`, Server Actions, and `/api` Route Handlers (`/api/health`, `/api/livekit/token`, `/api/webhooks/livekit`, `/api/inngest`).
- `src/server/auth/` — `requireAuthContext()` resolving `{ userId, tenantId, role }` from Supabase Auth.
- `src/server/db/` — Prisma client singleton & transaction helpers.
- `src/server/services/` — Pure TypeScript services (`onboardingService`, `interviewService`, `billingService`, `documentParserService`, `hrGradingService`).
- `src/server/prompts/` — XML-delimited candidate persona builder & HR rubric evaluator.
- `src/worker/` — LiveKit Voice Agent worker (`@livekit/agents`) importing `src/server/services/*` directly.
- `tests/unit/` & `tests/integration/` — Vitest test suites.

## Critical Engineering Rules

### 1. Multi-Tenancy & Data Isolation
- Every tenant-owned table (`User`, `InterviewSession`, `HrEvaluation`) MUST have `tenantId` indexed via `@@index([tenantId])`.
- NEVER call `prisma` directly in UI pages, Server Actions, or Route Handlers—always route through `src/server/services/*` requiring an explicit `tenantId`.
- Resolve `tenantId` exclusively via `requireAuthContext()` on the server; never trust client-supplied `tenantId`.
- **Platform-level tables** (currently only `Invite`) have no `tenantId` because they exist before any tenant. They are written only by owner tooling (`scripts/`, a future owner admin) and by `onboardTenant`—never readable or writable by tenants.
- **Every new table gets RLS:** each migration that creates a table must add `ALTER TABLE "<Table>" ENABLE ROW LEVEL SECURITY;` by hand (`migrate dev --create-only`, edit, apply). `tests/integration/rls.test.ts` fails if one is missed.
- **Owner ≠ tenant `ADMIN`:** tenant `ADMIN` is a customer's role and only ever sees its own tenant. Platform-owner powers (invites, granting minutes, cross-tenant views) must come from a separate owner check, never from `role = ADMIN`.

### 2. Idempotency, Concurrency & Cost Guardrails
- **Invite Claims:** A tenant is created only by atomically claiming an unused, unexpired invite (conditional `updateMany` with `count === 1`) in the same `$transaction` as the `Tenant` + `User` inserts. Store only `SHA-256(token)`, never the token.
- **Session & Room Limits:** `tenant.minutesBalance > 0`, max 1 active (`PENDING`/`IN_PROGRESS`) session per user, `emptyTimeout: 60`, `maxParticipants: 2`, and max call duration enforced (`10 min` for `DEMO`, `45 min` for `PRO`) with a 1-minute UI warning.
- **Webhook Verification & Idempotency:** Verify LiveKit `WebhookReceiver` signatures. Finalize-once is enforced by the state machine: inside one `$transaction`, the `IN_PROGRESS -> COMPLETED` conditional `updateMany` must return `count === 1` before saving the transcript and deducting minutes. If `count === 0`, the event was already processed — return `200 OK` and do nothing. (No separate idempotency table during MVP.)
- **Atomic Minute Deduction:** Deduct `minutesBalance` in a single atomic conditional update (`minutesBalance >= cost`) inside `$transaction`—never read-then-write in two queries.
- **State Machine:** Enforce `PENDING -> IN_PROGRESS -> COMPLETED -> GRADED | GRADING_FAILED` via conditional `updateMany` checks.

### 3. Prompt Safety & Async Grading
- **Prompt Injection Defense:** Parse PDF/DOCX in-memory (max 5MB, reject if extracted text `< 100` chars) and wrap untrusted CV/JD text in `<candidate_cv>` and `<job_description>` XML tags. Lock the LiveKit agent strictly into the candidate persona (2–4 sentences max per turn).
- **Async Post-Call Grading:** Persist transcript, deduct minutes, and emit an Inngest event (`interview/completed`) immediately on room close. Never block webhooks on LLM grading.

## Common Commands
- `npm run dev` — Start Next.js dev server
- `npm run worker:dev` — Start local LiveKit Voice Agent worker
- `npx prisma migrate dev --name <name>` — Create & apply migration
- `npm run test:unit` / `npm run test:integration` — Run Vitest suites (integration needs `docker compose up -d`)
- `npm run typecheck` — Route typegen + strict TypeScript check (`next typegen && tsc --noEmit`)
- `npm run format` / `npm run format:check` — Prettier
- `npm run invite:create -- "<who it is for>"` — Create a single-use signup invite link (owner only; `--yes` required for a non-local DB)
- `docker compose up -d` — Start the local Postgres 17 (dev DB `envision`, test DB `envision_test`, port 5433)