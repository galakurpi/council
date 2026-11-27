---
name: newcouncil
description: Add a person to the Council (the /council skill). Give it a name; it researches the person's own words (books, letters, long interviews), reads them, writes the person's brain and seat, and puts them at the table for the next /council. Use for "/newcouncil <name>", "add <name> to the council", "put <name> on the council".
argument-hint: "<the person's name> [a folder with your own material on them]"
---

# New council seat

You add one person to the Council as an **AI persona built from their public words, not the real person**. Say so once when you start and once when you finish.

`<council>` below is the council skill's folder: the `council` folder next to this skill's base directory. If it is not there, look in `~/.claude/skills/council`, then `.claude/skills/council` in the project. If you find none, stop and tell the user to install `/council` first.

Read these before you write anything, they are the shapes you copy:
- `<council>/seats/hormozi.md` (a seat)
- `<council>/brains/hormozi/` (a brain: read `_hot.md` in full and the headings of the other seven files)
- the first lines of every other file in `<council>/seats/` (who already sits, and through which lens)

## 1. Who, and through which lens

- **Key**: lowercase letters and digits, usually the surname (`ravikant`). **Short name**: the one word the room calls them (`Naval`). It must not be part of another seat's short name.
- Run `python3 <council>/scripts/council.py seats`. If the person is already there, say so and stop.
- **Lens**: the two to five words this person adds that no seat covers yet (`Leverage & judgment`). If their best-known lens is taken, take the angle only they bring.
- **The question the seat owns**: one sentence, the question this person asks of every decision.

## 2. Research: their own words

Sources, in this order: files the user gave you, books they wrote, their letters, memos and essays, long interviews and talks (an hour or more) with a transcript, then profiles written by others. Search the web for them and open the pages. Aim for eight sources or more, three of them long.

- Read one source per agent, all in one message, in parallel (type `general-purpose`, description `Brain <Short name> <n>`). Give each one link or file and ask for notes only, in the agent's own words: the frameworks with their steps and numbers, where the person stands on hiring, firing, pricing, cash, debt, risk, speed, focus and AI, the stories they tell with their numbers, and how they talk (cadence, how they open, push back and concede, the kind of phrase they coin). Agents read; they write no files. If you cannot spawn agents, read the sources yourself, one at a time.
- **Notes, not quotes.** The persona never quotes the person, so the brain needs what they think and how they talk, not their exact lines. Write it in your own words, each point with its source id. A line goes in quotes only if you read it as raw text (a file, or a page you downloaded); never from a summary, never from memory.
- A web fetch often returns a summary of the page. That counts as a read: mark it `summary` in `sources.md`. A fact with no source behind it is left out or marked `(unchecked)`.
- A page that will not open is not a source. Swap it for another (the same interview on another site, a different talk) and list the ones that failed.
- **Finish the job.** Do not stop half-way to ask the user. With fewer than four sources, write the seat anyway from what you read, and say at the top of `_hot.md` and in your last message that the brain is thin and what would fix it (a folder of transcripts or books after the name).
- A private person (a mentor, a co-founder) has no public record: build only from what the user gives you, and never search for them.

## 3. Write the brain

Work in a staging folder in the project, `council-new-seat/<key>/`. You do not write inside the skills folder yourself: the script in step 5 checks the seat and copies it in.

Create `council-new-seat/<key>/brain/` with the same eight files and the same headings as Hormozi's:

- `sources.md`: every source with an id (`B1` for books, `S01` for talks and interviews, `L1` for letters and essays), title, link, date, type, and how you read it (`whole`, `part` or `summary`). Then the ones that failed.
- `frameworks.md`: their decision tools, each with its steps, its numbers and the ids it comes from.
- `principles.md`: the rules they repeat, each in one or two sentences with its id.
- `positions.md`: where they stand, by topic (hiring, firing, AI replacing people, sales and marketing, pricing, spending or keeping cash, debt, risk, speed, focus). Where they have said nothing, write "no known view".
- `stories.md`: the stories they tell, with the numbers, the lesson and the id.
- `voice.md`: cadence, how they open, how they push back, how they concede, what they avoid, and how that sounds in a group chat.
- `books.md`: the books they wrote, and the people and books they name as influences.
- `_hot.md`: one page, written last: the seat, the worldview in one paragraph, the eight rules they decide by, and the first frameworks to reach for.

## 4. Write the seat

Create `council-new-seat/<key>/seat.md` in the shape of `hormozi.md`, about 50 lines:

- the title line `# Seat: <Name> (<lens>)` and the paragraph that says this is an AI persona, never the person, and never quotes them
- `**The question you own:**`
- `## Your brain`: the path `[skill]/brains/<key>/` (where the brain will live) and what it was built from, in numbers
- `## Your principles`: eight to twelve, one line each, ending with its source. Ids use one new prefix of two capital letters no seat has (their initials, like `**NR1**`).
- `## How you talk`, `## Who you clash with` (one line per seat already at the table: what you disagree on, and when you concede), `## How you score options`, `## Never`

## 5. Seat them

Write `council-new-seat/<key>/seat.json`:

```json
{"name": "<Full name>", "short": "<Short name>", "lens": "<Lens>", "question": "<The question the seat owns>", "color": "#7fc4c9"}
```

Pick a colour no seat uses (taken: `#e0895c`, `#c9c2b6`, `#8cbd9a`, `#93aaea`, `#e4c25e`, and any in `<council>/seats/roster.json`).

Run `python3 <council>/scripts/council.py add council-new-seat/<key>`. It checks the seat, copies it into the council (`seats/<key>.md`, `brains/<key>/`, `seats/roster.json`) and removes the staging folder. If it lists problems, nothing was copied: fix them and run it again until it prints `OK`.

## 6. Tell the user

Under 100 words: who you added and their lens, how many sources you read (books, long interviews, the rest), what is thin or failed, and that they sit at the table from the next `/council`. They show as initials on the replay page; four images in `<council>/room/assets/faces/` (`<key>-base.webp`, `-mid`, `-open`, `-blink`) give them a face. Say again that the seat is an AI persona built from public material, not the person, and that they did not take part.

## Rules

- You build from sources, not from what you remember about the person.
- Never put a line in quotes as theirs unless you read it as raw text. Never invent a number or a story about them.
- Change nothing in the other seats, their brains or the council's scripts.
- Your own writing is plain English, with no em dashes.
