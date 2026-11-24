---
name: decide
description: Debate an architecture or design decision for Envision (library, table, service boundary, hosting, data flow) and record it as a decisions-log entry once Karim chooses.
argument-hint: [the question, e.g. "where does the LiveKit worker run?"]
disable-model-invocation: true
---

Design question: $ARGUMENTS

Open decisions and past decisions:
!`cat docs/roadmap.md 2>/dev/null || cat roadmap.md 2>/dev/null || true`

1. **Restate the problem** in one sentence, and the constraint that matters most right now (Done Gate, $0 stack, 5–10 testers, learning value).
2. **Options (2–4)**, always including the simplest thing that could pass the Done Gate. For each: how it works in one line, cost now, cost to change later, what Karim would learn.
3. **Strongest argument against** Karim's preferred option (or against the current CLAUDE.md approach if that's what's on the table). Make it the case a skeptical senior engineer would make.
4. **Recommendation** with the deciding reason, and what would make you change it (a "revisit when…" trigger).
5. **Ask Karim to decide.** Stop and wait. If he picks differently, check his reason: agree if it's a better reason, hold your position if it isn't, but it's his call.
6. Once decided, draft the entry for `roadmap.md` in the existing format:
   `- YYYY-MM-DD — **<decision>.** <detail> — <why>. <revisit trigger>.`
   and say whether CLAUDE.md or `docs/BUILD_PLAN.md` needs a one-line update. Offer to write those edits (docs are delegate zone).

If the decision is to defer something, add it to the roadmap backlog with its trigger instead of building it.
