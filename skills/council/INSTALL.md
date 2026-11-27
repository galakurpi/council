# Install /council

Five AI advisors argue one decision from your business, vote on it and give you a verdict.

## What you need

- Claude Code. It comes with a paid Claude plan. No API keys.
- Python 3, with nothing to install on top. Check it with `python3 --version` (on Windows, `python --version`). If it is
  missing, get it from python.org.

## Steps

1. Put the `council` and `newcouncil` folders in your skills folder, side by side. From the folder you unzipped:
   - Mac, Linux: `mkdir -p ~/.claude/skills && cp -r council newcouncil ~/.claude/skills/`
   - Windows (PowerShell): `New-Item -ItemType Directory -Force $HOME\.claude\skills; Copy-Item council, newcouncil $HOME\.claude\skills -Recurse -Force`
2. Close Claude Code, open it again in the folder you work in, and type your decision:
   ```
   /council "Should I replace my account managers with AI or hire a salesperson?"
   ```
3. The first time, it asks what you sell and who buys it. Answer in a few lines, or give it your website. It keeps your
   answer in `council/business.md`, and you can edit it.
4. 5 to 8 minutes later the table opens in your browser: the debate, the vote and the verdict. **Verdict PDF** on that
   page is the full report: the call, the scores, each advisor's vote and what each one said.

Each run stays in `council/<date>-<name>/` in that folder; the page is `room/index.html` in it. For a faster run, add
`--quick` after the question: three advisors and one debate, about 2 minutes.

## Add a person

```
/newcouncil Naval Ravikant
```

Claude looks up the person's books, letters and long interviews, reads them, writes their brain (`council/brains/<key>/`)
and their seat (`council/seats/<key>.md`), and they sit at the table from the next `/council`. It uses web search, so it
takes a few minutes. Add a folder path after the name to build from your own material instead. An added seat shows as
initials on the page.

The seats are AI personas built from each person's public principles, not the real people. None of them took part or
endorses this, and that holds for anyone you add. The faces are AI renders made for this skill, used to label the
personas. MIT licence, see `LICENSE`.
