# Envision — Progress Tracker

The roadmap itself lives in `claude.md` (Chunks 0–6). This file only tracks **where we are** and **what we decided**, so any new chat can resume.

Status key: ⬜ not started · 🟨 in progress · ✅ done gate passed

## Chunk status

| Chunk | Goal (short)                                             | Status | Branch(es)              | Notes                                                                                          |
| ----- | -------------------------------------------------------- | ------ | ----------------------- | ---------------------------------------------------------------------------------------------- |
| 0     | Repo, `env.ts`, `/api/health`, CI                        | 🟨     | `chore/repo-foundation` | src layout, Node pin, env + tests, Prettier, `/api/health`, CI done; next: Vercel preview + PR |
| 1     | Schema, Supabase Auth, invite onboarding, integration CI | ⬜     |                         |                                                                                                |
| 2     | Atomic billing + finalize-once state machine             | ⬜     |                         |                                                                                                |
| 3     | CV/JD parsing + persona prompt                           | ⬜     |                         |                                                                                                |
| 4     | Mic check, LiveKit token, worker, webhook                | ⬜     |                         |                                                                                                |
| 5     | Inngest grading + report UI                              | ⬜     |                         |                                                                                                |
| 6     | PostHog + beta launch                                    | ⬜     |                         |                                                                                                |

## Open decisions (challenge before building)

| #   | Question                                                                                                                                    | Options                                                                                                                                       | Lean                                                                                                                                | Decide by |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------- |
| D3  | Where does the LiveKit worker run? It's a long-running process (stays connected to LiveKit, handles whole calls) so it can't run on Vercel. | Your laptop during scheduled demos (`npm run worker:dev`) · small always-on host (Railway / Render / Fly / VPS) · LiveKit Cloud agent hosting | Laptop for first demos, then a cheap always-on host before testers use it unsupervised. Check current free tiers when we get there. | Chunk 4   |
| D6  | PDF + DOCX parsing?                                                                                                                         | Both · PDF-only + paste-text fallback                                                                                                         | PDF-only first, DOCX if testers ask                                                                                                 | Chunk 3   |

## Decisions log

- 2026-11-15 — **Guiding principle:** production-grade habits, MVP-sized scope; build so it can scale, don't build for scale. — Learn real practices without over-engineering a 5–10 tester beta.
- 2026-11-15 — **Dropped `IdempotencyKey` table.** Finalize-once is enforced by the `IN_PROGRESS → COMPLETED` conditional `updateMany` (`count === 0` → already processed → `200 OK`). — The state machine already guarantees once-only; a second mechanism adds a table without adding safety. Revisit if an event type appears that has no state transition to guard it.
- 2026-11-15 — **Slimmed Chunk 0 CI** to `tsc`, `lint`, `test:unit`, `build`; web deploys via Vercel GitHub integration. Integration tests in CI, migration `deploy.yml` and Supabase keep-alive moved to Chunk 1. — Nothing to migrate or keep alive before the database exists.
- 2026-11-15 — **No in-app feedback** (`SessionFeedback` table and widget removed; `feedback_submitted` event dropped → 6 funnel events). — Beta feedback is collected verbally in meetings.
- 2026-11-15 — **Gemini Flash free tier** for candidate LLM and grading. — $0 stack. Caveat: free-tier content may be used by Google to improve products, so use synthetic/anonymised CVs until switching to a paid tier for real HR data.
- 2026-11-15 — **`src/` layout + Node 26 pin via `engines`.** Moved `app/` → `src/app/`, alias `@/*` → `./src/*`; `engines.node: 26.x`, no `.nvmrc`. — CLAUDE.md architecture is `src/`-rooted (server, worker, env live beside the app) and the move was free before imports existed. Vercel and `setup-node` both read `engines`, so it's one source of truth.
- 2026-11-15 — **Env validated at build time.** `parseEnv` uses `safeParse`, then throws one error listing every bad key as `key: message` (never the value). `src/env.ts` is imported in `next.config.ts`, so bad env fails `next build`. Rule: add a key in the same PR that first reads it. — A broken config should block the deploy, not surface as `undefined` in production; one error with all issues means one fix per redeploy; values may be secrets, so they never reach logs.
- 2026-11-15 — **Prettier with defaults** (`.prettierrc.json` is `{}`), `format` / `format:check` scripts; `format:check` runs in CI. No `eslint-config-prettier`: the Next ESLint config has no formatting rules, so there's nothing to conflict with. — Consistent style and diffs that show logic, not whitespace. Defaults already match the create-next-app style (double quotes, semicolons, 2 spaces).
- 2026-11-15 — **LF line endings enforced** via `.gitattributes` (`* text=auto eol=lf`). — CI and Vercel run on Linux; stops Windows `core.autocrlf` from producing CRLF churn.
