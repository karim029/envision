---
name: status
description: "Where am I? Reorients Karim when he is lost or resuming work. Reads the branch, commits, uncommitted changes and roadmap, then says what is done, what is left on this branch, and the single next step."
disable-model-invocation: true
allowed-tools: Bash(git status *) Bash(git diff *) Bash(git log *) Bash(git branch *) Read Grep Glob
---

Karim is lost or resuming. Give him a clear picture of where he stands. Don't start new work.

## Context

!`git branch --show-current; git status --short || true`

Commits on this branch that aren't on main:
!`git log --oneline main..HEAD || true`

Size of the branch so far:
!`git diff --shortstat main...HEAD || true`

Uncommitted changes:
!`git diff --stat || true`

Roadmap:
!`cat docs/roadmap.md 2>/dev/null || cat roadmap.md 2>/dev/null || true`

Read `docs/BUILD_PLAN.md` and open the changed files as needed.

## Answer in this shape (short)

1. **You are here:** chunk, slice and branch, and what this branch is _for_ in one line (infer from its name, commits and the roadmap).
2. **Done on this branch:** what the commits and code actually do, checked against the code rather than just the commit messages.
3. **In progress:** what the uncommitted changes are, and whether they're a finished step worth committing now (give the `git add` + commit if so).
4. **Left for this branch:** the remaining pieces to finish this slice, including anything the code points to that doesn't exist yet (e.g. a redirect to a page nobody has built).
5. **PR check:** non-test lines changed vs the ~400-line budget (tests, lockfiles, generated excluded), whether it mixes concerns (the main rule), and whether it's time to open a PR, split the branch, or keep going.
6. **Next step:** exactly one concrete thing to do next. If it's new learn-zone work, suggest `/kickoff <slice>`.
