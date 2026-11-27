#!/usr/bin/env python3
"""The Council's arithmetic and replay page. Stdlib only.

  python3 council.py score <session>   weighted option scores, verdict band, spread, confidence -> <session>/score.json
  python3 council.py check <session>   every principle id a seat cites exists in its seat file; no long quotes
  python3 council.py page  <session>   session.json + a replay page in <session>/room/, opened in the browser
  python3 council.py seats             who is on the council, and whether every seat is complete
  python3 council.py add   <folder>    seat the person /newcouncil staged in <folder> (checked first, then copied in)

A session folder holds council.json (written by the Chair), round-1.md .. round-4.md (the seats' cards, one `## <Seat>`
heading per card; the debate has one per turn, in turn order), chat.md (the group chat, a `## Round <n>` section per round)
and verdict.md. The Chair computes nothing by hand: it runs `score` and copies the numbers. A seat whose round 1
STAKE is `out` has no scores and casts no vote, so it counts nowhere.

The five seats below ship with the skill. /newcouncil adds a person: it stages <key>/seat.md, <key>/seat.json
({name, short, lens, question, color}) and <key>/brain/ in the project, and `add` copies them to seats/<key>.md,
brains/<key>/ and seats/roster.json, which is read on top of the five.
"""
import json, os, re, shutil, sys, webbrowser
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent
ROSTER = {  # key: (name, short heading, lens, the question the seat owns, colour)
    "hormozi": ("Alex Hormozi", "Hormozi", "Offer & money", "Does the money math work, and is the offer strong enough to carry it?", "#e0895c"),
    "musk": ("Elon Musk", "Musk", "First principles & 10x", "What is the real constraint, and which step can we delete?", "#c9c2b6"),
    "buffett": ("Warren Buffett", "Buffett", "Cash, risk & long-term value", "What does this do to cash, risk and long-term value?", "#8cbd9a"),
    "zuckerberg": ("Mark Zuckerberg", "Zuckerberg", "Distribution", "What will Meta's feed and ads actually reward here?", "#93aaea"),
    "mrbeast": ("MrBeast", "MrBeast", "Attention", "Will people click, and will they keep watching?", "#e4c25e"),
}
EXTRA = SKILL / "seats" / "roster.json"   # seats added with /newcouncil
if EXTRA.exists():
    ROSTER |= {k: tuple(v.get(f, "") for f in ("name", "short", "lens", "question", "color")) for k, v in json.loads(EXTRA.read_text()).items()}
BRAIN = ("_hot.md", "frameworks.md", "principles.md", "positions.md", "stories.md", "voice.md", "books.md", "sources.md")
PID = r"^\*\*([A-Z]{1,2})(\d+)\b"   # a principle line in a seat file: **H4** ...
ROUNDS = {1: "Opening", 2: "The debate", 3: "Crossfire", 4: "The vote"}
FIELDS = ["SEAT", "STAKE", "STANCE", "OPTION SCORES", "CONFIDENCE", "RUIN RISK", "DOOR", "THE CALL", "WHY", "THE RISK I SEE",
          "WHAT WOULD CHANGE MY MIND", "WHAT I'D DO THIS WEEK", "QUESTION FOR THE FOUNDER", "I DISAGREE MOST WITH",
          "I CONCEDE", "ON THE CRUXES", "MOVED", "REPLY TO", "POINT", "ON THE DRAFT", "WHERE WE NOW AGREE", "MY CONDITIONS FOR YES", "VOTE",
          "FINAL SCORE", "IF OUTVOTED", "AMENDMENT OR DISSENT", "ONE LINE FOR THE FOUNDER", "SAYS",
          # verdict.md, written by the Chair
          "LABEL", "THE VERDICT", "NEXT STEP THIS WEEK", "CONDITIONS", "KILL IT IF", "MINORITY REPORT", "SHARPEST CLASH"]
FIELD_RE = re.compile(r"^\**(" + "|".join(re.escape(f) for f in sorted(FIELDS, key=len, reverse=True)) + r")\**\s*:\**\s*(.*)$")
SCORE_RE = re.compile(r"\b([A-E])\s*[:=]?\s*(\d+(?:\.\d+)?)\s*/\s*10")
BANDS = [(7.5, "GO"), (6.0, "GO WITH CONDITIONS"), (4.5, "RESHAPE"), (0, "DON'T DO IT")]


def card(text):
    """One seat's card -> {FIELD: value}. A value runs until the next known field label."""
    out, cur = {}, None
    for line in text.splitlines():
        m = FIELD_RE.match(line.strip())
        if m:
            cur = m.group(1); out[cur] = m.group(2).strip()
        elif cur and line.strip():
            out[cur] = (out[cur] + "\n" + line.strip()).strip()
    if "SAYS" in out:  # a chat message carries no principle id; ids belong in the fields above
        out["SAYS"] = re.sub(r"[ \t]*\((?:[A-Z]{1,2}\d+(?:,\s*)?)+\)", "", out["SAYS"])
    if "OPTION SCORES" in out:
        out["scores"] = {k: float(v) for k, v in SCORE_RE.findall(out["OPTION SCORES"])}
    for f in ("CONFIDENCE", "FINAL SCORE"):
        n = re.search(r"\d+(?:\.\d+)?", out.get(f, ""))
        if n: out[f.lower().replace(" ", "_")] = float(n.group())
    for f in ("I DISAGREE MOST WITH", "REPLY TO"):  # who this card answers
        tgt = seat_named(out.get(f, ""))
        if tgt: out["target"] = tgt
    if m := re.match(r"\W*([A-E])\b", out.get("VOTE", "")): out["pick"] = m[1]  # the option this seat votes for
    if m := re.match(r"\W*(in|light|out)\b", out.get("STAKE", ""), re.I): out["stake"] = m[1].lower()  # out: sits the rest out
    return out


def seat_named(text):
    head = text[:40].lower()
    hits = [(head.find(r[1].lower()), k) for k, r in ROSTER.items() if r[1].lower() in head]
    return min(hits)[1] if hits else None


def round_cards(path):
    """round-N.md -> ({seat key: its last card}, chair notes, [every turn in order]). Headings are `## <Short name>`, one
    per card (the debate has several per seat); a `## Chair ...` section is kept as notes."""
    turns, notes = [], ""
    for block in re.split(r"(?m)^##\s+", path.read_text())[1:]:
        head, _, body = block.partition("\n")
        key = seat_named(head)
        if head.strip().lower().startswith("chair"): notes += body.strip()
        elif key: turns.append({"seat": key, "card": card(body) | {"raw": body.strip()}})
    return {t["seat"]: t["card"] for t in turns}, notes, turns


def load(session):
    s = Path(session)
    meta = json.loads((s / "council.json").read_text())
    rounds = {}
    for n in ROUNDS:
        p = s / f"round-{n}.md"
        if p.exists():
            cards, notes, turns = round_cards(p)
            rounds[n] = {"title": ROUNDS[n], "cards": cards, "notes": notes, "turns": turns}
    return s, meta, rounds


def score(meta, rounds):
    """Weighted option scores from the last round that has scores, the band, overrides, spread and confidence."""
    w = {k: float(v) for k, v in meta["weights"].items()}
    last = max(n for n, r in rounds.items() if any(c.get("scores") for c in r["cards"].values()))
    cards = rounds[last]["cards"]
    opts = sorted(meta["options"])
    seats = [k for k in w if k in cards and cards[k].get("scores")]
    tot = sum(w[k] for k in seats)
    by_opt, math = {}, {}
    for o in opts:
        v = sum(w[k] * cards[k]["scores"].get(o, 0) for k in seats) / tot
        by_opt[o] = round(v, 1)
        math[o] = "(" + " + ".join(f"{w[k]:g}x{cards[k]['scores'].get(o, 0):g}" for k in seats) + f") / {tot:g} = {v:.1f}"
    top = max(opts, key=lambda o: by_opt[o])
    label = next(b for cut, b in BANDS if by_opt[top] >= cut)
    overrides = []
    if top == meta.get("hold"):
        label = "DON'T DO IT"; overrides.append(f"{top} is the hold option ({meta['options'][top]}), so the council says don't spend.")
    pts = [cards[k]["scores"].get(top, 0) for k in seats]
    spread = max(pts) - min(pts)
    ruin = [k for k in seats if "likely" in cards[k].get("RUIN RISK", "").lower()]
    if ruin and label in ("GO", "GO WITH CONDITIONS"):
        label = "RESHAPE"; overrides.append(f"Ruin cap: {', '.join(ROSTER[k][1] for k in ruin)} at ruin risk likely.")
    r1 = rounds.get(1, {"cards": {}})["cards"]
    r1 = [c for c in r1.values() if c.get("scores")]  # a seat that sat out has no say on the door
    one_way = sum("one-way" in c.get("DOOR", "").lower() for c in r1)
    if one_way * 2 > len(r1) and spread >= 4 and label == "GO":
        label = "GO WITH CONDITIONS"; overrides.append("One-way door with a split room: cheapest test first.")
    conf_cards = [c for r in sorted(rounds) for c in [rounds[r]["cards"]] if any(x.get("confidence") for x in c.values())]
    confs = [c["confidence"] for c in (conf_cards[-1].values() if conf_cards else []) if c.get("confidence")]
    confidence = round(sum(confs) / len(confs) * 2) - (1 if spread >= 5 else 0) if confs else None
    votes = {k: cards[k].get("VOTE", "") for k in seats if cards[k].get("VOTE")}
    picks = {k: cards[k]["pick"] for k in seats if cards[k].get("pick")}
    support = None
    fin = [k for k in seats if cards[k].get("final_score") is not None]
    if fin:
        support = round(sum(w[k] * cards[k]["final_score"] for k in fin) / sum(w[k] for k in fin), 1)
    return {"round": last, "options": by_opt, "math": math, "top": top, "label": label, "overrides": overrides,
            "spread": spread, "confidence": confidence, "votes": votes, "picks": picks, "support": support}


def check(session):
    """Problems: a cited principle id missing from that seat's file, or a long quoted passage."""
    rounds = load(session)[2]
    ids = [m for f in (SKILL / "seats").glob("*.md") for m in re.findall(PID, f.read_text(), re.M)]
    known = {a + n for a, n in ids}
    cite = re.compile(r"\b(?:" + "|".join(sorted({a for a, _ in ids}, key=len, reverse=True)) + r")\d+\b")  # the seats' own prefixes
    problems = []
    for n, r in rounds.items():
        for k, c in ((t["seat"], t["card"]) for t in r.get("turns") or [{"seat": k, "card": c} for k, c in r["cards"].items()]):
            cited = {i for par in re.findall(r"\(([^)]*)\)", c["raw"]) for i in cite.findall(par)}
            for pid in sorted(cited - known): problems.append(f"round {n} {ROSTER[k][1]}: cites {pid}, which no seat file has")
            for f, v in c.items():  # REPLY TO / SAYS quote another seat, MOVED the seat's own old and new position, by design
                if f in ("raw", "REPLY TO", "I DISAGREE MOST WITH", "SAYS", "MOVED") or not isinstance(v, str): continue
                for q in re.findall(r"[\"“]([^\"”]+)[\"”]", v):
                    if len(q.split()) >= 12: problems.append(f"round {n} {ROSTER[k][1]}: long quote \"{q[:50]}...\"")
    return problems


def seats():
    """(the roster as lines, problems). A seat is complete when it has a seat file with principles under a prefix no
    other seat uses, a whole brain folder, a short name no other seat's contains, a lens, a question and a colour."""
    lines, problems, prefixes = [], [], {}
    for k, (name, short, lens, question, color) in ROSTER.items():
        f, brain = SKILL / "seats" / f"{k}.md", SKILL / "brains" / k
        lines.append(f"{k}: {name} ({lens})")
        if not re.fullmatch(r"[a-z][a-z0-9]*", k): problems.append(f"{k}: the key is lowercase letters and digits only")
        for field, v in (("name", name), ("short", short), ("lens", lens), ("question", question)):
            if not v.strip(): problems.append(f"{k}: roster.json has no {field}")
        if not re.fullmatch(r"#[0-9a-fA-F]{6}", color): problems.append(f"{k}: color must be a hex like #93aaea")
        for o, r in ROSTER.items():
            if o != k and short and short.lower() in r[1].lower(): problems.append(f"{k}: short name {short!r} is inside {r[1]!r}, cards would be filed under the wrong seat")
        if not f.exists(): problems.append(f"{k}: seats/{k}.md is missing"); continue
        pre = {a for a, _ in re.findall(PID, f.read_text(), re.M)}
        if len(pre) != 1: problems.append(f"{k}: seats/{k}.md needs principles under one id prefix, like **H1**; found {sorted(pre) or 'none'}")
        for a in pre:
            if a in prefixes: problems.append(f"{k}: principle prefix {a} is already {prefixes[a]}'s")
            prefixes.setdefault(a, k)
        for b in BRAIN:
            if not (brain / b).exists() or not (brain / b).read_text().strip(): problems.append(f"{k}: brains/{k}/{b} is missing or empty")
    for f in sorted((SKILL / "seats").glob("*.md")):
        if f.stem not in ROSTER: problems.append(f"{f.stem}: seats/{f.name} has no entry in seats/roster.json")
    return lines, problems


def add(folder):
    """Seat the person staged in <folder> (its name is the key). Returns the problems; with none, the seat is in and the
    staging folder is gone. With any, the council is left exactly as it was."""
    src = Path(folder).resolve(); k = src.name
    seat, brain = SKILL / "seats" / f"{k}.md", SKILL / "brains" / k
    missing = [n for n in ["seat.md", "seat.json"] + [f"brain/{b}" for b in BRAIN] if not (src / n).is_file()]
    if missing: return [f"{k}: {folder} has no " + ", ".join(missing)]
    if k in ROSTER or seat.exists() or brain.exists(): return [f"{k}: already on the council"]
    try: info = {f: str(json.loads((src / "seat.json").read_text()).get(f, "")) for f in ("name", "short", "lens", "question", "color")}
    except (ValueError, AttributeError): return [f"{k}: seat.json is not a JSON object"]
    before = EXTRA.read_text() if EXTRA.exists() else None
    shutil.copy(src / "seat.md", seat); shutil.copytree(src / "brain", brain)
    EXTRA.write_text(json.dumps(json.loads(before or "{}") | {k: info}, indent=1, ensure_ascii=False) + "\n")
    ROSTER[k] = tuple(info.values())
    problems = [p for p in seats()[1] if p.startswith(k + ":")]
    if problems:
        seat.unlink(); shutil.rmtree(brain); del ROSTER[k]
        EXTRA.write_text(before) if before is not None else EXTRA.unlink()
    else:
        shutil.rmtree(src)
        if not any(src.parent.iterdir()): src.parent.rmdir()
    return problems


def chat_lines(text):
    """chat.md -> [{who, text, round}], one per `**Name:** message` line; round is its `## Round <n>` section (0 before
    round 1, None under `## Verdict`)."""
    out, rnd = [], 0
    for line in text.splitlines():
        if h := re.match(r"##\s+(?:Round\s+(\d)|(Verdict))", line.strip(), re.I): rnd = int(h[1]) if h[1] else None
        elif m := re.match(r"\*\*([^*:]+):?\*\*:?\s*(.+)", line.strip()): out.append({"who": m[1].strip(), "text": m[2].strip(), "round": rnd})
    return out


def chair_lines(chat):
    """The Chair's lines in a round, each placed where it was said: `at` = how many seat turns of that round came before
    it (a seat's messages in a row are one turn), or None when it closes the round. The replay says it as that round's
    turn number `at` starts (or when the round is saved), so a debate thread's intro lands before its first turn."""
    out, turns, prev = [], {}, None
    for i, m in enumerate(chat):
        n = m["round"]
        if m["who"].lower() != "chair":
            if (n, m["who"]) != prev: turns[n] = turns.get(n, 0) + 1
            prev = (n, m["who"]); continue
        prev = None
        later = any(x["round"] == n and x["who"].lower() != "chair" for x in chat[i + 1:])
        out.append({"round": n, "text": m["text"], "at": turns.get(n, 0) if later and n else None})
    return out


def face(k):
    """Whether the room has renders for this seat; an added seat shows its initials unless you add the four images."""
    return all((SKILL / "room/assets/faces" / f"{k}-{f}.webp").exists() for f in ("base", "mid", "open", "blink"))


def session_json(session):
    s, meta, rounds = load(session)
    verdict = card((s / "verdict.md").read_text()) if (s / "verdict.md").exists() else {}
    chat = (s / "chat.md").read_text() if (s / "chat.md").exists() else ""
    return {"slug": s.resolve().name, "question": meta["question"], "options": meta["options"], "hold": meta.get("hold"), "weights": meta["weights"],
            "business": meta.get("business", ""),
            "seats": {k: dict(zip(("name", "short", "lens", "question", "color"), ROSTER[k])) | ({} if face(k) else {"face": False}) for k in meta["weights"]},
            "rounds": rounds, "verdict": verdict, "score": score(meta, rounds), "chat": chat_lines(chat),
            "chair": chair_lines(chat_lines(chat))}


def page(session):
    """Copy the replay page next to the session and point it at this session's data."""
    s = Path(session)
    data = session_json(s)
    (s / "session.json").write_text(json.dumps(data, indent=1, ensure_ascii=False))
    room = s / "room"
    shutil.rmtree(room, ignore_errors=True)          # always the shipped page, never a stale older one
    shutil.copytree(SKILL / "room", room)
    (room / "data.js").write_text("window.DATA = " + json.dumps(data, ensure_ascii=False) + ";\n")
    return room / "index.html"


if __name__ == "__main__":
    if sys.argv[1:] == ["seats"]:
        lines, p = seats()
        print("\n".join(lines + (p or [f"OK: {len(lines)} seats, every one complete"])))
        sys.exit(1 if p else 0)
    if len(sys.argv) != 3 or sys.argv[1] not in ("score", "check", "page", "add"):
        sys.exit(__doc__)
    cmd, ses = sys.argv[1:]
    if cmd == "add":
        p = add(ses)
        print("\n".join(p) or f"OK: {ROSTER[Path(ses).resolve().name][0]} sits on the council ({len(ROSTER)} seats)")
        sys.exit(1 if p else 0)
    if cmd == "score":
        _, meta, rounds = load(ses)
        sc = score(meta, rounds)
        (Path(ses) / "score.json").write_text(json.dumps(sc, indent=1))
        for o, m in sc["math"].items(): print(f"{o} {m}")
        print(f"TOP {sc['top']} {sc['options'][sc['top']]} -> {sc['label']} | spread {sc['spread']:g} | confidence {sc['confidence']}/10"
              + (f" | support {sc['support']}" if sc["support"] is not None else ""))
        for o in sc["overrides"]: print("OVERRIDE", o)
    elif cmd == "check":
        p = check(ses)
        print("\n".join(p) or "OK: every cited principle exists, no long quotes")
        sys.exit(1 if p else 0)
    else:
        index = page(ses)
        print(index)
        if os.environ.get("COUNCIL_OPEN") != "0":   # the table opens by itself; with no browser, the path above is enough
            try: webbrowser.open(index.resolve().as_uri())
            except Exception: pass
