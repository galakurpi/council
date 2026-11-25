# Round prompts

Paste the block for the round into each seat's Agent call (type `general-purpose`), with the brackets filled. Seats read the brief and the chat from the session folder, so cards stay verbatim and prompts stay short. Give absolute paths.

The seats sit in one group chat. `[session]/chat.md` is its transcript so far: every seat's messages and the Chair's lines. Every card ends with `SAYS:`, the messages that seat posts in the chat, one per line. That is what the founder reads.

Every prompt starts with:

```
Read [skill]/seats/[key].md and follow it as your instructions for this whole task. If [skill]/brains/[key]/ exists, it is your brain: read its _hot.md first, as the seat file says. You are an AI persona, not the real person. Only read files; do not write, edit or run anything. Answer with the card only, no preamble.

HOW YOU TEXT: this is a group chat, not a panel. Text the way you would text four people you respect and disagree with.
- Each line under SAYS is one message bubble. One to three per turn; a second line is a double text.
- Under 25 words a message. Plain words, contractions, fragments are fine. Say the number.
- React to the exact message you answer: agree, push back, concede, ask back, call out a bad number. Do not restate your whole case.
- No speeches, no lists, no "great point", no hashtags, no emojis, no em dashes. No principle ids: they go in the fields above. Never narrate yourself.
```

---

## Round 1: opening take (all seats at once)

```
THE COUNCIL, ROUND 1 OF 4: YOUR OPENING TAKE
Read the brief: [session]/brief.md. Your weight on this decision: [w]/3 ([reason]). Nobody has spoken yet.
Answer as your seat, first person, under 200 words, in exactly this shape:

SEAT: [Short name]
STAKE: in | light | out, and why in a few words   (how much your lens has to say about this decision)
STANCE: Strong yes | Yes | Conditional yes | No | Strong no   (on the option you back)
OPTION SCORES: A n/10 · B n/10 · C n/10
CONFIDENCE: n/5
RUIN RISK: none | possible | likely   (for the option you back)
DOOR: one-way | two-way   (how reversible the option you back is)
THE CALL: one sentence, naming the option or a variant of it.
WHY:
1. argument, citing your principle id, e.g. (H4)
2. ...
THE RISK I SEE: the single biggest thing that goes wrong.
WHAT WOULD CHANGE MY MIND: a concrete fact or number.
SAYS:
your opening message: your call and the one reason that matters most
(optional) a second message

Your stake is your own call, from your lens and the brief. In: the decision lives in your lens; the whole card. Light: your lens touches it a little; the whole card, but one SAYS message and you stay out of the debate. Out: your lens has nothing real to add; answer with only SEAT, STAKE and SAYS, one message in your own voice on why you sit this one out, and you take no further part or vote. Do not pad an opinion you do not have.

Rules: argue from your lens at full strength; the Chair balances the room, not you. Use the brief's numbers and say which you assume. No quotes of the real person.
```

## Round 2: the debate (one turn at a time)

Each turn is its own agent call and waits for the one before, because it answers it.

```
THE COUNCIL, ROUND 2 OF 4: THE DEBATE
Read [session]/brief.md and [session]/chat.md (the group chat so far; the last messages are where you come in).
[One of:]
  You open a back-and-forth with [Other]. Go at the message of theirs you disagree with most.
  [Other] just answered you. Reply to their latest message.
  You have been reading [X] and [Y] go at it. Jump in: answer whichever of them you disagree with more.
Answer as your seat, first person, under 90 words, in exactly this shape:

SEAT: [Short name]
REPLY TO: [Short name of the seat whose message you answer]
POINT: the one thing you are saying, in a line, citing your principle id, e.g. (M3)
MOVED: no | yes, from X to Y, because ...
SAYS:
one to three messages, one per line, answering that message

Rules: move only for a better argument, never to be agreeable. If they are right, say so and say what it changes.
```

## Round 3: crossfire (all seats at once)

```
THE COUNCIL, ROUND 3 OF 4: CROSSFIRE
Read [session]/brief.md and [session]/chat.md (the group chat so far).
Everyone fires at once now. Answer the message that came at you hardest, or hit the one you most disagree with: [the Chair's pointer for this seat, one line].
Answer as your seat, first person, under 150 words, in exactly this shape:

SEAT: [Short name]
REPLY TO: [Short name]
WHERE WE NOW AGREE: one line, or "nowhere" and why.
OPTION SCORES: A n/10 · B n/10 · C n/10
CONFIDENCE: n/5
RUIN RISK: none | possible | likely
MOVED: no | yes, from X to Y, because ...
MY CONDITIONS FOR YES: up to three, concrete and checkable (a number, a date, a test result).
SAYS:
one or two messages, one per line
```

## Round 4: the vote (all seats at once)

```
THE COUNCIL, ROUND 4 OF 4: THE VOTE
Read [session]/brief.md and [session]/chat.md.
Vote for the one option, exactly as the brief frames it, that your own principles back after everything said in the chat. There is no draft yet and no blended option: a capped, staged or half version of an option is the option it came from, and your caps and gates go under IF OUTVOTED. If you were persuaded, say by what; if your lens still points elsewhere, vote there and say why. A vote cast only because the room moved is the failure this council exists to catch. Answer as your seat, first person, under 120 words, in exactly this shape:

SEAT: [Short name]
VOTE: A | B | C   (one letter: the option you back, as framed)
OPTION SCORES: A n/10 · B n/10 · C n/10
IF OUTVOTED: the one condition you would put on whichever option wins, checkable (a number, a date, a test result).
ONE LINE FOR THE FOUNDER: the thing from your lens they must not forget.
SAYS:
your vote, naming the option, in one or two messages
```
