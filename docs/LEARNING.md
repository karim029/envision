# Learning tracker

Claude reads this to decide what to explain (skip **owned** concepts) and what it may write for you (a pattern marked **owned** moves to the delegate zone).

Status: `new` (not done yet) · `practiced` (done once, with help) · `owned` (done it, can explain it without notes; set by Karim after a teach-back in `/ship`)

Seeded from the decisions log. Adjust the statuses honestly; only you can promote something to `owned`.

| Concept / pattern                                               | Status    | Evidence (file, PR or commit)             |
| --------------------------------------------------------------- | --------- | ----------------------------------------- |
| Zod env validation, fail at build                               | practiced | `src/env.ts`                              |
| Route Handler (`app/api/*/route.ts`)                            | practiced | `/api/health`, `/auth/confirm`            |
| Prisma migrations (`migrate dev` / `deploy`), RLS by hand       | practiced | init migration                            |
| Vitest integration harness (`_test` guard, truncate, serial)    | practiced | `tests/integration/`                      |
| Interactive `$transaction` + conditional `updateMany` claim     | practiced | `onboardTenant`                           |
| READ COMMITTED visibility / "on conflict, re-read"              | practiced | `onboardTenant`                           |
| Supabase SSR auth: `getClaims`, `verifyOtp` + `token_hash`      | practiced | `/auth/confirm`                           |
| Server Component page (data loaded on the server)               | practiced | `signup/page.tsx` (invite check on load)  |
| Server Actions + `useActionState` forms                         | practiced | `signup/actions.ts`, `login/actions.ts`   |
| Proxy (`src/proxy.ts`, formerly middleware) session refresh     | practiced | `src/proxy.ts`, `lib/supabase/proxy.ts`   |
| Adapter pattern: wrap a vendor SDK, unit-test the mapping       | practiced | `log-in-adapter.ts`, `sign-up-adapter.ts` |
| Ports & adapters: inject vendor capabilities into services      | practiced | `signUpWithInvite(fields, { signUp })`    |
| Expand → migrate → contract migrations on live data             | new       | after beta data exists                    |
| Protected pages (`requireAuthContext` in a layout/page), logout | new       | 1d                                        |
| Postgres concurrency under load (`Promise.all` races)           | new       | Chunk 2                                   |
| LiveKit tokens, rooms, webhooks                                 | new       | Chunk 4                                   |
| Voice agent pipeline (STT → LLM → TTS)                          | new       | Chunk 4                                   |
| Background jobs / retries (Inngest)                             | new       | Chunk 5                                   |
| LLM structured outputs                                          | new       | Chunk 5                                   |

## Teach-back log

Short answers you gave in `/ship`, kept so you can see progress. Newest first.
