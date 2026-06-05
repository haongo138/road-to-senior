---
title: Communication & Whiteboard
description: How to talk through a problem and present code under observation.
tags: [interview, communication]
category: technical
status: draft
---

# Communication & Whiteboard

Writing correct code is only half the job. Interviewers evaluate whether you can reason, adapt, and collaborate under pressure. These habits turn a silent session into a conversation.

## While Solving

**Think out loud.** Don't go quiet for five minutes then produce an answer. Narrate what you're doing — even "I'm not sure about this part yet, let me think through the constraint" is better than silence.

Before writing any code, state your plan in plain English. Something like: "I'll use a hash map to track the complement, then do a single pass — O(n) time and O(n) space." This gives the interviewer a chance to redirect you before you've invested time in the wrong direction.

Keep checking in: "Does this approach make sense?" or "Shall I proceed with this?" creates a collaborative feel and avoids surprises.

## After Finishing

Once you have a working solution, don't stop — close the loop:

- **Walk through the main example** line by line to show the code does what you said.
- **Test edge cases explicitly:** empty input, single-element array, maximum constraint value. Call them out by name, don't wait to be asked.
- **State complexity explicitly:** "Time is O(n log n) because the sort dominates; space is O(1) extra since I sort in place."
- **Proactively suggest optimizations** without being asked: "If we received many queries against the same array, we could precompute a prefix sum in O(n) and answer each query in O(1)."

## Demeanor

**Don't argue.** If the interviewer flags a bug or nudges you in a new direction, validate it first. Run a small example to confirm their point before responding — this shows you prioritize correctness over ego.

**Don't pretend.** If you haven't seen a pattern before, say so: "I haven't encountered this specific variant — may I reason from first principles?" That is far more impressive than bluffing and getting stuck.

**Close gracefully.** At the end, thank the interviewer and ask: "Is there anything in my approach you'd like me to revisit?" This signals self-awareness and leaves a good impression.

Further reading: EngineerPro — Coding DSA Interview at Big Tech (https://engineerpro-team.github.io/coding-book/)
