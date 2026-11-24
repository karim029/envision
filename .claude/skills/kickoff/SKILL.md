---
name: kickoff
description: Start a new slice of Envision work. Orients to the current chunk and Done Gate, teaches the new concepts, splits the work into learn zone and delegate zone, gets Karim's plan, then writes contracts and failing tests.
argument-hint: [what we're building, e.g. "billing finalize-once"]
disable-model-invocation: true
---

Kick off this slice: $ARGUMENTS

## Context

Current branch and state:
!`git branch --show-current; git status --short || true`

Progress tracker:
!`cat docs/roadmap.md 2>/dev/null || cat roadmap.md 2>/dev/null || true`

Learning tracker:
!`cat docs/LEARNING.md || true`

Read `docs/BUILD_PLAN.md` for the chunk's goal and Done Gate.

## Steps (stop and wait for Karim where marked)

1. **Orient (3 lines max).** Which chunk, which part of it, and the Done Gate this slice moves toward. If the slice is out of order or is a backlog item, say so and push back.
2. **Concepts.** For each concept this slice needs that `docs/LEARNING.md` does not mark `owned`, give 3–6 bullets of _why_, tied to Envision's code. Skip owned ones entirely. Link one official doc page per concept.
3. **Branch.** Give the exact command, e.g. `git checkout -b feat/billing-finalize-once`.
4. **Split the work** in a short table: _Karim writes_ (learn zone) · _Claude may write_ (delegate zone) · _contracts Claude provides_. Keep the learn-zone part as small as possible while still covering what this slice teaches. Speed comes from delegating the plumbing, not from shrinking the learning.
5. **Ask for Karim's plan.** Ask him to describe, in plain English, the steps of the core function(s) and the failure cases. **Stop and wait.**
6. **Critique the plan.** Name the edge cases he missed (concurrency, tenant leaks, partial failure, retries, idempotency), as questions where possible, so he finds the fix. Give the simplest alternative if his plan is heavier than the Done Gate needs. Iterate until the plan is sound.
7. **Design check** (a short note, ~5 lines, agreed before any code):
   - **Data flow:** which layer does what (app glue → service → adapter/Prisma).
   - **Transactions:** what's inside each `$transaction`, and that no network call is.
   - **Concurrency:** what two simultaneous requests could break, and which conditional update or constraint stops it.
   - **Queries:** how many per request (no N+1), and any index the new `where` clauses need.
   - **Vendor boundary:** does this touch a vendor? If so, which adapter, and do we need a port (per CLAUDE.md "Architecture rules")?
8. **Contracts.** Write types / Zod schemas / signatures with `throw new Error("TODO: implement")` and failing Vitest tests that encode the Done Gate and the edge cases from steps 6–7. Do the delegate-zone work now, explaining each piece in 2–3 lines.
9. Hand over: "Your move: make these tests pass. `/hint` if stuck, `/review` when done."
