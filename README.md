# Council

**Five AI business minds argue your decision in Claude Code, then vote.**

`/council "Should I replace my account managers with AI or hire a salesperson?"`

Hormozi (offer and money), Musk (first principles), Buffett (cash and risk), Zuckerberg (distribution) and MrBeast
(attention) sit in one group chat. Each reads your numbers and gives an opening take. Then they argue back and forth,
change their minds when someone lands a point, and vote. You get:

- **Brains**: every seat reads its own folder of notes first (`skills/council/brains/<seat>/`: hot sheet, frameworks, principles, positions, stories, voice, books, sources), built from that person's own words: about 70 long interviews transcribed, Buffett's 47 shareholder letters, Hormozi's books, Musk's master plans and company emails, Zuckerberg's letters and earnings remarks, MrBeast's production handbook. Every quote is checked against its source.
- **A verdict**: GO, WAIT or DON'T, the one thing to do this week, the conditions, and when to kill it.
- **Weighted scores**: every seat scores every option from 1 to 10, weighted by how much its area matters to this decision.
- **A page that replays the whole table**: talking faces, the chat, the vote board and the ruling.
- **A verdict PDF** (one click on that page): the call, the scores with their sums, how each seat scored it, and what each
  seat said, round by round.

Live demo: https://os.yekar-ai.com/artifacts/council/ · Example report: [example/verdict.pdf](example/verdict.pdf)

## Install

Needs Claude Code and Python 3 (standard library only). No API keys, no MCP server, nothing to pip install.

```bash
git clone https://github.com/galakurpi/council.git
cp -r council/skills/council ~/.claude/skills/council
```

Then, in Claude Code, from your project:

```
/council "Should I spend $20k on ads or hire a closer?"
```

Add `--quick` for three seats and a shorter debate. Put a `business.md` in the project root (what you sell, revenue,
margin, team, cash, what you're leaning toward) so the council argues your real numbers; without it, the Chair asks up
to three questions. See [example/business.md](example/business.md).

Each council is saved in `council/<date>-<slug>/` in your project: the brief, every round's cards, the chat,
`score.json`, `verdict.md`, and `room/index.html` (open it in a browser to replay the table and get the PDF).

## The example

[example/council/2026-11-23-ams-ai-or-salesperson/](example/council/2026-11-23-ams-ai-or-salesperson/) is a full run on
an example agency (representative numbers, not a real client): 18 clients, margin down from 31% to 16%, $70k in the bank.
The founder leaned toward replacing the account managers with AI. The vote went 3 to 2 for keeping the cash, and nobody
voted for AI. Open `room/index.html` to watch it.

## Credits

The seats are **AI personas built from each person's public principles, in our words. They are not the real people, and
none of them took part in or endorses this.**

The PDF is built with [jsPDF](https://github.com/parallax/jsPDF) (MIT, licence in
`skills/council/room/vendor/`). Face credits: `skills/council/room/assets/CREDITS.md`. Code licence: [MIT](LICENSE).

Made by Jon Yekar.
