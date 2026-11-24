---
name: ship
description: Finish a slice. Runs the full CI check locally, proposes commits for Karim to run, updates roadmap.md, and runs a short teach-back that updates docs/LEARNING.md.
disable-model-invocation: true
allowed-tools: Bash(npm run format:check) Bash(npm run lint) Bash(npm run typecheck) Bash(npm run test:unit) Bash(npm run test:integration) Bash(npm run build) Bash(git status *) Bash(git diff *) Bash(git log *)
---

Wrap up the current slice.

!`git branch --show-current; git status --short || true`

1. **Run the full check**, in this order, stopping at the first failure: `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run test:integration`, `npm run build`. On failure, show the error and treat it as a `/hint` level 1 for learn-zone code (fix it yourself only if it's delegate zone).
2. **Commits.** Group any uncommitted changes into logical Conventional Commits. Give Karim the exact `git add <paths>` + `git commit -m "type(scope): imperative summary"` commands to run. Don't run them.
3. **PR check.** Run `git diff --shortstat main...HEAD` and `git log --oneline main..HEAD`. If the branch is over ~300 changed lines (lockfiles/generated excluded) or mixes concerns, say so and suggest how to split it next time (or now, if it's cheap). Otherwise say "time to open a PR" and give `git push -u origin <branch>`, a PR title in Conventional Commit form, and a 3–5 line description (what, why, how it was tested, anything the reviewer should look at first). After merge: `git switch main && git pull && git branch -d <branch>`.
4. **Roadmap.** Propose the `docs/roadmap.md` edits: chunk status/notes, plus a decisions-log entry for any decision made in this slice that isn't logged yet. Apply them once Karim says ok.
5. **Teach-back.** Ask 3 short questions about what was built this slice: one _why_, one _what breaks if_, one _how would you change it for X_. Wait for his answers, then correct or confirm each in 1–2 lines.
6. **Learning tracker.** Propose status changes in `docs/LEARNING.md` (`new → practiced`; suggest `owned` only if his teach-back answer was solid without help) and add 1 line per question to the teach-back log. Karim confirms promotions.
