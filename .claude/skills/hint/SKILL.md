---
name: hint
description: Graduated hint when Karim is stuck on learn-zone code. Climbs one level per call, from a nudge question up to code only at the last level.
argument-hint: [optional: what I'm stuck on, or a level 1-5]
disable-model-invocation: true
---

Karim is stuck: $ARGUMENTS

Look at the relevant code, the failing test output and the conversation, and figure out which level of hint he's already had in this conversation. Give the **next** level only (start at 1; if he passed a number, use that level). Never skip ahead unless he asks.

1. **Nudge.** One question that points at the gap ("What does `updateMany` return when the `where` matches nothing?").
2. **Concept.** Name the concept or API that solves it, why it fits, and one official doc link.
3. **Shape.** Pseudocode or numbered steps for the algorithm, with no TypeScript.
4. **Skeleton.** TypeScript with the structure in place and the key lines left as `// TODO:` comments that say what each line must do.
5. **Worked code.** The real implementation of the stuck part only (not the whole file), each non-obvious line explained. Then ask him to retype it himself rather than paste it, and to explain it back in one sentence.

If the problem is a bug, first ask what he expected vs what happened and what he's already tried. Debugging the hypothesis is the lesson.

End with: "Next `/hint` gives level N+1."
