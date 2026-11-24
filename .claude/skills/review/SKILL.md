---
name: review
description: Senior-engineer review of Karim's branch diff. Finds bugs, tenant leaks, races and design problems without rewriting his code.
argument-hint: [optional: base branch, default main]
disable-model-invocation: true
allowed-tools: Bash(git diff *) Bash(git log *) Bash(git status *) Read Grep Glob
---

Review the current branch like a senior engineer reviewing a junior's PR.

## Diff

!`git log --oneline main..HEAD || true`

!`git diff main...HEAD --stat || true`

Read the full diff with `git diff main...HEAD` (or the base in $ARGUMENTS) and open surrounding files as needed.

## Check, in this order

1. **Correctness & Done Gate.** Does it do what the slice promised? Do the tests prove it, or only the happy path?
2. **Non-negotiables** from CLAUDE.md: server-derived `tenantId` on every query; no `prisma` outside services; atomic conditional updates checked by `count`; state machine transitions; RLS on new tables; webhook verification; untrusted text inside XML tags.
3. **Concurrency.** Read-then-write, check-then-act, missing transaction, wrong isolation assumption.
4. **Failure paths.** What happens on DB error, duplicate request, retry, partial failure? Are errors swallowed or misreported?
5. **Security.** Secrets in logs, open redirects, trusting client input, missing auth check.
6. **Performance.** N+1 queries, missing indexes for new `where` clauses.
7. **Coupling.** Vendor SDK, vendor types or `next/*` inside `src/server/services`; business rules living in a route handler, Server Action or worker instead of a service; a network call inside `$transaction`; an abstraction nobody needs yet (flag over-engineering too).
8. **Next.js.** Server vs client boundary, `server-only` on server modules, caching/dynamic behaviour, data fetched in the right layer.
9. **Clarity.** Naming, function size, dead code, tests that test the mock instead of the behaviour.

## Output

- Findings ranked **blocker / should-fix / nit**, each with `file:line`, the concrete scenario that breaks ("two requests with the same invite at the same time → …"), and a question or hint toward the fix. **Do not write the fixed code.**
- One thing done well, specifically (so he knows what to keep doing).
- If there are no blockers: "Ready for `/ship`."
