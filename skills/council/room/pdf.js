// The council's verdict as a PDF, built in the browser with a vendored jsPDF (MIT, vendor/), so the room still needs
// nothing installed. Laid out as a verdict report: the call, the weighted scores with their sum, how each advisor
// scored it, what to do; then what each advisor said, round by round. Reads window.DATA, the same data the page replays.
(() => {
const C = {
  ink: [33, 25, 18], soft: [78, 68, 56], mute: [132, 119, 100], rule: [226, 219, 206], tint: [248, 244, 236],
  track: [233, 227, 215], brass: [176, 136, 62], white: [255, 255, 255],
};
const LABEL = { go: [72, 170, 110], wait: [214, 150, 52], no: [196, 84, 68] };
const labelColor = l => /DON'T|NO\b|KILL/i.test(l) ? LABEL.no : /WAIT|RESHAPE/i.test(l) ? LABEL.wait : LABEL.go;

// loaded on the first click, not with the page: the PDF library, and faces.js (the shipped faces as ready-made JPEGs)
let lib = null;
const script = src => new Promise((res, rej) => {
  const s = document.createElement('script'); s.src = src; s.onload = res;
  s.onerror = () => rej(new Error('could not load ' + src)); document.head.append(s);
});
const loadLib = () => lib ??= Promise.all([
  window.jspdf || script('vendor/jspdf.umd.min.js').catch(() => { throw new Error('could not load the PDF library'); }),
  window.FACES || script('faces.js').catch(() => {}),
]);

// the PDF's built-in Times speaks WinAnsi only: map what it lacks, drop the principle ids (H5) the cards cite
const MAP = { '→': '->', '←': '<-', '≥': '>=', '≤': '<=', '≈': '~', '−': '-', '‑': '-', ' ': ' ', ' ': ' ' };
const KEEP = new Set('‘’“”–—•…€™');
const clean = t => String(t ?? '').replace(/\s*\((?:[A-Z]{1,2}\d+[a-z]?(?:,\s*)?)+\)/g, '').replace(/\*\*/g, '')
  .replace(/[^\x00-\xff]/g, c => MAP[c] ?? (KEEP.has(c) ? c : '')).replace(/[ \t]+/g, ' ').trim();

// a face as a round JPEG on the page's white. The shipped ones come ready-made in faces.js, because a room opened from
// disk may not read an image back from the page; renders you add yourself are drawn here, and are null from disk.
async function face(k) {
  if (window.DATA.seats[k].face === false) return null;  // a seat added with /newcouncil has no render
  if (window.FACES?.[k]) return window.FACES[k];
  try {
    const im = new Image(); im.src = `assets/faces/${k}-base.webp`; await im.decode();
    const cv = document.createElement('canvas'); cv.width = cv.height = 160; const g = cv.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, 160, 160);
    g.beginPath(); g.arc(80, 80, 80, 0, 7); g.clip(); g.fillStyle = 'rgb(240,232,218)'; g.fillRect(0, 0, 160, 160);
    g.drawImage(im, 106, 30, 300, 300, 0, 0, 160, 160);
    return cv.toDataURL('image/jpeg', .9);
  } catch { return null; }
}

window.councilPdf = async function () {
  await loadLib();
  const D = window.DATA, s = D.score, v = D.verdict, seats = Object.keys(D.seats), opts = Object.keys(D.options);
  const RN = Object.keys(D.rounds).map(Number).sort((a, b) => a - b), LAST = RN[RN.length - 1];
  const turns = n => D.rounds[n]?.turns || Object.entries(D.rounds[n]?.cards || {}).map(([seat, card]) => ({ seat, card }));
  const fin = D.rounds[LAST]?.cards || {};
  const faces = Object.fromEntries(await Promise.all(seats.map(async k => [k, await face(k)])));
  const name = k => D.seats[k]?.short || k, optName = o => clean(D.options[o]);

  const doc = new window.jspdf.jsPDF({ unit: 'pt', format: 'letter', compress: true });
  const W = 612, H = 792, M = 54, CW = W - M * 2;
  let y = M;
  const font = (size, style = 'normal', color = C.ink, fam = 'times') => { doc.setFont(fam, style); doc.setFontSize(size); doc.setTextColor(...color); };
  const lines = (t, w, size, style = 'normal', fam = 'times') => { font(size, style, C.ink, fam); return doc.splitTextToSize(clean(t), w); };
  const lh = size => size * 1.38;
  const ensure = h => { if (y + h > H - 64) { doc.addPage(); y = M; return true; } };
  const para = (t, { size = 11, style = 'normal', color = C.soft, x = M, width = CW, gap = 6, fam = 'times' } = {}) => {
    if (!t) return;
    const ls = lines(t, width, size, style, fam); ensure(ls.length * lh(size));
    font(size, style, color, fam); doc.text(ls, x, y + size, { lineHeightFactor: 1.38 }); y += ls.length * lh(size) + gap;
  };
  const kicker = (t, x = M) => { font(7.5, 'bold', C.brass, 'helvetica'); doc.setCharSpace(1.4); doc.text(t.toUpperCase(), x, y + 8); doc.setCharSpace(0); y += 15; };
  const section = (t, keep = 70) => {
    ensure(46 + keep); y += 10;
    doc.setDrawColor(...C.rule); doc.setLineWidth(.75); doc.line(M, y, W - M, y); y += 15;
    font(15, 'bold'); doc.text(t, M, y + 12); y += 24;
  };
  // a bold label, then its text; a long label gets its own line
  const item = (label, text, x = M, width = CW) => {
    if (!text) return;
    const pre = `${label}: `; font(10.5, 'bold', C.ink, 'helvetica');
    const preW = doc.getTextWidth(pre);
    const body = lines(text, width - 12 - preW, 11);
    const rest = body.length > 1 ? lines(body.slice(1).join(' '), width - 12, 11) : [];
    ensure((1 + rest.length) * lh(11) + 4);
    doc.setFillColor(...C.brass); doc.circle(x + 3, y + 7, 2, 'F');
    font(10.5, 'bold', C.ink, 'helvetica'); doc.text(pre, x + 12, y + 11);
    font(11, 'normal', C.soft); doc.text(body[0] || '', x + 12 + preW, y + 11);
    if (rest.length) doc.text(rest, x + 12, y + 11 + lh(11), { lineHeightFactor: 1.38 });
    y += (1 + rest.length) * lh(11) + 5;
  };

  // ------------------------------------------------------------ header
  font(22, 'bold'); doc.text('Council', M, y + 16);
  font(9, 'normal', C.mute, 'helvetica');
  const when = new Date((D.run?.started || D.slug || '').slice(0, 10) + 'T12:00');
  doc.text(`Verdict report · ${isNaN(when) ? '' : when.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, W - M, y + 15, { align: 'right' });
  y += 28; doc.setDrawColor(...C.ink); doc.setLineWidth(1.2); doc.line(M, y, W - M, y); y += 24;

  // ------------------------------------------------------------ the decision
  kicker('The decision');
  const q = lines(D.question, CW, 23, 'bold'); font(23, 'bold'); doc.text(q, M, y + 20, { lineHeightFactor: 1.15 }); y += q.length * 23 * 1.15 + 8;
  const tally = opts.map(o => [o, seats.filter(k => s.votes?.[k] === o).length]);
  para(`${seats.length} AI advisors · ${RN.length} rounds · vote ${tally.map(([o, n]) => `${o} ${n}`).join(', ')}`, { size: 9.5, color: C.mute, fam: 'helvetica', gap: 3 });
  para(D.business, { size: 11, gap: 4 });
  para(opts.map(o => `${o}: ${optName(o)}`).join('   ·   '), { size: 10, color: C.mute, fam: 'helvetica', gap: 10 });

  // ------------------------------------------------------------ the call
  const raw = clean(v.LABEL || s.label), label = (raw.match(/^[^(.:,]+/) || [raw])[0].trim().toUpperCase();
  const cond = clean(raw.slice(label.length).replace(/^[,\s]+/, ''));
  font(13, 'bold', C.ink, 'helvetica'); const bw = doc.getTextWidth(label) + 24;
  const head = `Option ${s.top} · ${optName(s.top)}`;
  const callL = lines(v['THE VERDICT'], CW - 32, 12.5, 'bold'), condL = cond ? lines(cond[0].toUpperCase() + cond.slice(1), CW - 32, 10, 'normal', 'helvetica') : [];
  const boxH = 16 + 28 + 12 + 20 + callL.length * lh(12.5) + (condL.length ? condL.length * lh(10) + 6 : 0) + 30;
  ensure(boxH + 10);
  doc.setFillColor(...C.tint); doc.roundedRect(M, y, CW, boxH, 10, 10, 'F');
  doc.setFillColor(...labelColor(label)); doc.roundedRect(M + 16, y + 16, bw, 28, 7, 7, 'F');
  font(13, 'bold', C.white, 'helvetica'); doc.text(label, M + 28, y + 35);
  font(7.5, 'bold', C.mute, 'helvetica'); doc.setCharSpace(1.4); doc.text("THE COUNCIL'S CALL", M + 28 + bw, y + 33.5); doc.setCharSpace(0);
  let by = y + 56;
  font(15, 'bold'); doc.text(clean(head), M + 16, by + 13); by += 20;
  font(12.5, 'bold', C.ink); doc.text(callL, M + 16, by + 12.5, { lineHeightFactor: 1.38 }); by += callL.length * lh(12.5) + 6;
  if (condL.length) { font(10, 'normal', C.soft, 'helvetica'); doc.text(condL, M + 16, by + 10, { lineHeightFactor: 1.38 }); by += condL.length * lh(10) + 6; }
  font(9, 'normal', C.mute, 'helvetica');
  doc.text(`Confidence ${s.confidence ?? '-'}/10 · score gap ${s.spread ?? '-'} · ${tally.map(([o, n]) => `${n} for ${o}`).join(', ')}`, M + 16, by + 10);
  y += boxH + 6;

  // ------------------------------------------------------------ weighted scores
  section('Weighted scores', 3 * 44);
  const wsum = seats.reduce((a, k) => a + (D.weights?.[k] || 0), 0);
  for (const o of opts) {
    const sc = s.options?.[o], best = o === s.top;
    ensure(44);
    doc.setFillColor(...(best ? C.ink : C.track)); doc.roundedRect(M, y, 20, 20, 5, 5, 'F');
    font(10, 'bold', best ? C.white : C.soft, 'helvetica'); doc.text(o, M + 10, y + 14, { align: 'center' });
    font(12, best ? 'bold' : 'normal', C.ink); doc.text(optName(o), M + 30, y + 14);
    if (best) { const nw = doc.getTextWidth(optName(o)); font(7, 'bold', C.brass, 'helvetica'); doc.setCharSpace(1); doc.text('RECOMMENDED', M + 40 + nw, y + 13); doc.setCharSpace(0); }
    const bx = W - M - 190, bwid = 140;
    doc.setFillColor(...C.track); doc.roundedRect(bx, y + 8, bwid, 6, 3, 3, 'F');
    if (typeof sc === 'number') { doc.setFillColor(...(best ? C.brass : [205, 185, 150])); doc.roundedRect(bx, y + 8, Math.max(6, bwid * sc / 10), 6, 3, 3, 'F'); }
    font(16, 'bold', C.ink, 'helvetica'); doc.text(typeof sc === 'number' ? sc.toFixed(1) : '-', W - M, y + 16, { align: 'right' });
    // the sum itself, seat by seat: score x weight
    const sum = seats.filter(k => fin[k]?.scores?.[o] != null).map(k => `${name(k)} ${fin[k].scores[o]}×${D.weights[k]}`).join(' + ');
    font(8.5, 'normal', C.mute, 'helvetica'); doc.text(clean(`(${sum}) / ${wsum} = ${typeof sc === 'number' ? sc.toFixed(1) : '-'}`), M + 30, y + 30);
    y += 42;
  }
  para(`Each advisor scores every option from 1 to 10 in the final round. Each score is multiplied by that advisor's weight (how much their area matters to this decision, 1 to 3), and the sum is divided by the total weight, ${wsum}.`, { size: 9, color: C.mute, fam: 'helvetica', gap: 0 });

  // ------------------------------------------------------------ the table
  section('How each advisor scored it', 24 + seats.length * 30);
  const cols = [{ t: 'Advisor', w: 196 }, { t: 'Weight', w: 56, c: 1 }, ...opts.map(o => ({ t: o, w: 50, c: 1, o })), { t: 'Vote', w: 60, c: 1 }];
  let x = M; font(7.5, 'bold', C.mute, 'helvetica');
  for (const c of cols) { doc.text(c.t.toUpperCase(), c.c ? x + c.w / 2 : x, y + 8, c.c ? { align: 'center' } : undefined); x += c.w; }
  y += 13; doc.setDrawColor(...C.rule); doc.setLineWidth(.75); doc.line(M, y, W - M, y); y += 3;
  for (const k of seats) {
    const f = fin[k] || {}; x = M;
    if (faces[k]) doc.addImage(faces[k], 'JPEG', x, y + 2, 22, 22);
    font(11.5, 'bold'); doc.text(name(k), x + 30, y + 12);
    font(8, 'normal', C.mute, 'helvetica'); doc.text(clean(D.seats[k].lens), x + 30, y + 22); x += cols[0].w;
    font(11, 'normal', C.soft, 'helvetica'); doc.text(`×${D.weights?.[k] ?? '-'}`, x + cols[1].w / 2, y + 16, { align: 'center' }); x += cols[1].w;
    for (const o of opts) {
      const top = f.pick === o; if (top) { doc.setFillColor(...C.tint); doc.roundedRect(x + 13, y + 4, 24, 18, 4, 4, 'F'); }
      font(11, top ? 'bold' : 'normal', C.ink, 'helvetica'); doc.text(f.scores?.[o] != null ? String(f.scores[o]) : '-', x + 25, y + 16.5, { align: 'center' }); x += 50;
    }
    font(11, 'bold', f.pick === s.top ? C.brass : C.soft, 'helvetica'); doc.text(f.pick || (D.rounds[RN[0]]?.cards?.[k]?.stake === 'out' ? 'sat out' : '-'), x + 30, y + 16, { align: 'center' });
    y += 27; doc.setDrawColor(...C.rule); doc.line(M, y, W - M, y); y += 2;
  }

  // ------------------------------------------------------------ what to do
  section('What to do');
  item('This week', v['NEXT STEP THIS WEEK']);
  String(v.CONDITIONS || '').split('\n').map(l => l.replace(/^\d+\.\s*/, '')).filter(Boolean).forEach((l, i) => item(`Condition ${i + 1}`, l));
  item('Kill it if', v['KILL IT IF']);
  section('Where they disagreed');
  item('Sharpest clash', v['SHARPEST CLASH']);
  item('Minority report', v['MINORITY REPORT']);

  // ------------------------------------------------------------ what each advisor said
  doc.addPage(); y = M;
  font(20, 'bold'); doc.text('What each advisor said', M, y + 16); y += 26;
  para('Their own words from each round of the group chat: the opening call, the debate, the crossfire and the vote.', { size: 9.5, color: C.mute, fam: 'helvetica', gap: 6 });
  const said = (k, n, ...fs) => turns(n).filter(t => t.seat === k).map(t => fs.map(f => t.card[f]).find(Boolean)).filter(Boolean);
  for (const k of seats) {
    const o = D.rounds[RN[0]]?.cards?.[k] || {}, f = fin[k] || {};
    ensure(120); y += 8;
    doc.setDrawColor(...C.rule); doc.setLineWidth(.75); doc.line(M, y, W - M, y); y += 12;
    if (faces[k]) doc.addImage(faces[k], 'JPEG', M, y, 40, 40);
    font(15, 'bold'); doc.text(clean(D.seats[k].name), M + 52, y + 15);
    font(9, 'normal', C.mute, 'helvetica');
    doc.text(clean(`${D.seats[k].lens} · weight ×${D.weights?.[k] ?? '-'} · ${f.pick ? `voted ${f.pick}` : o.stake === 'out' ? 'sat this one out' : ''}`), M + 52, y + 29);
    y += 50;
    if (D.seats[k].question) para(`Asks: ${D.seats[k].question}`, { size: 10, style: 'italic', color: C.mute, gap: 5 });
    item('Opening call', o['THE CALL']);
    item('Why', o.WHY);
    item('The risk they see', o['THE RISK I SEE']);
    item('What would change their mind', o['WHAT WOULD CHANGE MY MIND']);
    for (const n of RN.slice(1, -1)) {
      for (const t of turns(n).filter(t => t.seat === k)) {
        const c = t.card, to = c.target && c.target !== k ? ` (to ${name(c.target)})` : '';
        const moved = /^yes/i.test(c.MOVED || '') ? ' Changed their mind.' : '';
        item(`${D.rounds[n].title}${to}`, (c.POINT || c['WHERE WE NOW AGREE'] || c.SAYS) + moved);
        if (c['MY CONDITIONS FOR YES']) item('Conditions for yes', c['MY CONDITIONS FOR YES'].replace(/^\s*-\s*/, '').replace(/\s+-\s+/g, '; '));
      }
    }
    item('Final word', f['ONE LINE FOR THE FOUNDER']);
    item('If outvoted', f['IF OUTVOTED']);
  }

  // ------------------------------------------------------------ footer on every page
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p); doc.setDrawColor(...C.rule); doc.setLineWidth(.75); doc.line(M, H - 46, W - M, H - 46);
    font(7.5, 'bold', C.mute, 'helvetica'); const tag = `Council · ${p} of ${pages}`; doc.text(tag, W - M, H - 34, { align: 'right' });
    font(7.5, 'normal', C.mute, 'helvetica');
    doc.text(doc.splitTextToSize("AI personas built from each person's public principles, in our words. Not the real people; none of them took part or endorses this.", CW - doc.getTextWidth(tag) - 24), M, H - 34, { lineHeightFactor: 1.35 });
  }
  const file = `Council - ${clean(D.question).replace(/[\\/:*?"<>|]+/g, '').slice(0, 80)}.pdf`;
  doc.setProperties({ title: file.replace(/\.pdf$/, '') });
  return { doc, file };
};
})();
