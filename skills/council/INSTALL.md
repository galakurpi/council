# Install /council

Needs Claude Code and Python 3 (standard library only). No API keys, no MCP server, nothing to pip install.

1. Copy this `council` folder into a skills folder:
   - every project: `cp -r council ~/.claude/skills/council`
   - one project: `cp -r council <your-project>/.claude/skills/council`
2. Optional: put a `business.md` in the project root with what you sell, monthly revenue, margin, team, where leads come
   from and the cash in the bank. Without it the Chair asks up to three questions, or marks what it assumed.
3. In Claude Code, from that project:
   ```
   /council "Should I replace my account managers with AI or hire a salesperson?"
   ```
   Add `--quick` for three seats, the opening, one debate thread and the vote (cheaper and faster).

You get `council/<date>-<slug>/` in the project: the brief, every round's cards, `score.json`, `verdict.md`,
and `room/index.html`, a page that replays the table (open it in a browser); its **Verdict PDF** link builds the report:
the call, the weighted scores with their sums, how each seat scored it, and what each seat said round by round.

The seats are AI personas built from each person's public principles, not the real people. MIT licence, see `LICENSE`.
