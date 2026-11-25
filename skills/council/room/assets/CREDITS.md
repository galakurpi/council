# Credits

## Seat busts (`faces/<seat>-<base|mid|open|blink>.webp`)

All five seats are 3D animated-film-style renders in one look, made for this demo on 2026-11-22 with OpenAI
`gpt-image-2.6-sunburst`. Each base is drawn from a text likeness of the person plus two style portraits (of other people,
not our seats) used only as the style and framing reference. No photo of
anyone was used as input for four of them. Hormozi's base was redrawn the same day from a photo Jon supplied as the
likeness reference (`data/faces-raw/hormozi-likeness.png`, a third-party photo of unknown licence, kept out of the page;
the bust is a new render, not the photo). `mid`, `open` and `blink` are edits of our own
base, and only the mouth or eye region of each edit is pasted back onto the base, so the frames never drift. Script and
prompts: `tools/faces.py`; full-size originals and the style references: `data/faces-raw/`.

| Seat | Who it depicts | Made by | Licence |
|---|---|---|---|
| hormozi | Alex Hormozi | AI render (gpt-image), Yekar AI | Ours; likeness of a public figure, used to label an AI persona, not to imply endorsement |
| musk | Elon Musk | same | same |
| buffett | Warren Buffett | same | same |
| zuckerberg | Mark Zuckerberg | same | same |
| mrbeast | MrBeast (Jimmy Donaldson) | same | same |

The seats are AI personas built from each person's public principles, not the real people. None of them took part in or endorses this.

