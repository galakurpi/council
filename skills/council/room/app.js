// Council: the seats debating one decision in a group chat. It replays one real /council run (data.js, written by
// `council.py page` from the session folder): every bubble is a seat's own SAYS line or a Chair line from chat.md, turn
// by turn in the order they came. The run plays as the page opens; each message keeps time to read.
// ?speed=5 replay speed · ?t=95 | ?t=end freeze at that second of the run
const D = window.DATA, $ = s => document.querySelector(s), P = new URLSearchParams(location.search);
const KEYS = Object.keys(D.seats), SPEED = +P.get('speed') || 5, K = 5 / SPEED, CAP = 1.6;
const Q = D.question, RN = Object.keys(D.rounds).map(Number).sort(), LAST = RN[RN.length - 1], OPTS = Object.keys(D.options).sort();
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const seatName = k => D.seats[k]?.short || '';
const BY_NAME = Object.fromEntries(KEYS.map(k => [seatName(k).toLowerCase(), k]));
const fmt = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
  .replace(/@([A-Za-z]+)/g, (m, n) => BY_NAME[n.toLowerCase()] ? `<span class="at" style="--c:${D.seats[BY_NAME[n.toLowerCase()]].color}">${m}</span>` : m)
  .replace(/\s*\(([A-Z]{1,2}\d+(?:,\s*[A-Z]{1,2}\d+)*)\)/g, '');  // principle ids stay in the card, not the chat
const img = (k, s = 'base') => `assets/faces/${k}-${s}.webp`;
// a seat added with /newcouncil has no renders (data.js says face: false): its initials on its colour stand in
const ini = k => esc(D.seats[k].name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase());
const noFace = k => D.seats[k].face === false;
const av = k => noFace(k) ? `<span class="av ini" style="--c:${D.seats[k].color}">${ini(k)}</span>` : `<span class="av"><img src="${img(k)}" alt=""></span>`;
const optName = o => D.options[o].replace(/\s*\(.*$/, '');
const words = s => s.split(/\s+/).length;
const hold = s => Math.min(2.8, Math.max(1.1, words(s) * .1)) * K;  // how long a message stays the newest one
const turnsOf = n => D.rounds[n].turns || Object.entries(D.rounds[n].cards).map(([seat, card]) => ({ seat, card }));
const lines = c => (c.SAYS || c['THE CALL'] || c['ONE LINE FOR THE FOUNDER'] || c.VOTE || '').split('\n').map(s => s.trim()).filter(Boolean);
const pick = c => c.pick || (c.scores && Object.keys(c.scores).sort((a, b) => c.scores[b] - c.scores[a])[0]);

// the run's timeline when data.js carries one, else an even one built from the rounds
function synthetic() {
  const tl = [{ t: 1, kind: 'file', name: 'brief.md' }]; let t = 3;
  for (const n of RN) {
    const ts = turnsOf(n);
    if (ts.length > new Set(ts.map(x => x.seat)).size) ts.forEach(x => { tl.push({ t, kind: 'spawn', round: n, seat: x.seat }, { t: t + 6, kind: 'card', round: n, seat: x.seat }); t += 7; });
    else { ts.forEach((x, i) => tl.push({ t: t + i, kind: 'spawn', round: n, seat: x.seat }, { t: t + 8 + i * 2, kind: 'card', round: n, seat: x.seat })); t += 10 + ts.length * 2; }
  }
  return [...tl.sort((a, b) => a.t - b.t), { t: t + 3, kind: 'file', name: 'verdict.md' }, { t: t + 5, kind: 'done' }];
}
const RAW = D.timeline || synthetic(), T_END = RAW[RAW.length - 1].t;

// the replay: each card becomes its SAYS bubbles; each Chair line goes where chat.md has it (before turn `at` of its
// round, or after the round's last card); the vote board goes up before the first vote
const X = [];
{
  const CH = D.chair || [], said = new Set(), spawned = {}, cardsSeen = {}, lastCard = {};
  RAW.forEach((e, i) => { if (e.kind == 'card') lastCard[e.round] = i; });
  const chairs = (n, t, ok) => CH.forEach((c, j) => { if (!said.has(j) && c.round === n && ok(c)) { said.add(j); X.push({ kind: 'chair', t, round: n, text: c.text }); } });
  chairs(0, 0, () => true);
  RAW.forEach((e, i) => {
    const n = e.round, k = e.seat;
    if (e.kind == 'spawn') {
      const j = spawned[n] = (spawned[n] ?? -1) + 1;
      chairs(n, e.t, c => c.at === j);
      if (n == LAST && j == 0 && n != RN[0]) X.push({ kind: 'board', t: e.t, round: n });
      X.push(e);
    } else if (e.kind == 'card') {
      const o = cardsSeen[n + k] = (cardsSeen[n + k] ?? -1) + 1, turn = turnsOf(n).filter(x => x.seat == k)[o];
      if (!turn) return;
      const ls = lines(turn.card).length ? lines(turn.card) : [''];
      ls.forEach((text, li) => X.push({ kind: 'line', t: e.t, round: n, seat: k, card: turn.card, text, first: li == 0, last: li == ls.length - 1 }));
      if (i == lastCard[n]) chairs(n, e.t, () => true);
    } else if (e.kind == 'file' && e.name == 'verdict.md') X.push({ kind: 'verdict', t: e.t });
    else if (e.kind == 'done') X.push({ kind: 'verdict', t: e.t }, e);
  });
  let rt = 0, prev = 0, free = 0, owe = 0;  // free: when the newest message has been read
  for (const e of X) {
    const gap = Math.min(Math.max(e.t - prev, 0) / SPEED, CAP); prev = e.t;
    if (e.kind == 'spawn') { rt += gap; e.rt = rt; continue; }  // "typing" shows while you read
    if (e.kind == 'line' && !e.first) { rt += .9 * K; free = rt + hold(e.text) + owe; owe = 0; e.rt = rt; continue; }  // a double text
    rt = Math.max(rt + gap, free); e.rt = rt;
    const h = e.kind == 'line' || e.kind == 'chair' ? hold(e.text) : e.kind == 'board' ? .8 * K : .4;
    if (e.kind == 'line' && !e.last) { owe = Math.max(0, h - .9 * K); free = rt; } else free = rt + h;
  }
  // a seat speaks until the next message lands (at least its hold, at most 7 s)
  const spoken = X.filter(e => e.kind == 'line' || e.kind == 'chair' || e.kind == 'verdict');
  spoken.forEach((e, i) => { const h = hold(e.text || ''); e.dur = Math.min(7, Math.max(h, (spoken[i + 1]?.rt ?? e.rt + h) - e.rt)); });
}

// the cast, seated round the far side of one oval table: x along it, d = how far down its edge runs there (an ellipse
// 1.1x the room's width), so the head of the table sits highest and the end seats nearer, a little bigger, in front
const cast = Object.fromEntries(KEYS.map((k, i) => {
  const el = document.createElement('div'), s = D.seats[k], x = (i + .5) / KEYS.length, u = (x - .5) / .55, d = 1 - Math.sqrt(1 - u * u);
  el.className = 'm'; el.style.cssText = `--c:${s.color};--x:${x};--d:${d.toFixed(3)};--s:${(1 + .35 * d).toFixed(3)};--z:${1 + Math.round(Math.abs(u) * 4)}`;
  el.innerHTML = `<span class="bub"><i></i><i></i><i></i></span><div class="face"><div class="bust" data-shape="base">${noFace(k) ? `<span class="ini">${ini(k)}</span>` : ['base', 'mid', 'open', 'blink'].map(f => `<img class="${f}" src="${img(k, f)}" alt="${f == 'base' ? esc(s.name) : ''}">`).join('')}</div></div><div class="plate"><b>${esc(seatName(k))}</b><span>${esc(s.lens)}</span></div>`;
  el.onclick = () => S.last[k] && openCard(...S.last[k], k);
  $('#cast').append(el);
  return [k, el];
}));

// faces: one clock for every mouth. A seat talks while its message is the newest one (until the next one lands), the
// others keep their mouths shut and blink now and then, each seat on its own blink clock
const MOUTH = ['mid', 'open', 'mid', 'base', 'open', 'open', 'mid', 'base', 'mid', 'open', 'mid', 'base'];
let talkUntil = {};
const beat = {}, blinkAt = Object.fromEntries(KEYS.map(k => [k, performance.now() + 800 + Math.random() * 4000]));
setInterval(() => {
  const now = performance.now();
  for (const k of KEYS) {
    const el = cast[k], talk = talkUntil[k] > now, b = beat[k] = (beat[k] || 0) + 1;
    let f = 'base';
    if (talk) f = MOUTH[b % MOUTH.length];
    else if (now > blinkAt[k]) { f = 'blink'; blinkAt[k] = now + 2400 + Math.random() * 4200; }
    el.classList.toggle('talk', talk);
    el.querySelector('.bust').dataset.shape = f;
  }
}, 110);
const talk = (k, s) => { for (const o of KEYS) if (o != k) talkUntil[o] = 0; talkUntil[k] = performance.now() + s * 1000; };

// state. `hooks` hear every change of it ('reset', 'play', 'done'): the two links under the chat, and a page's own controls
let S, raf = 0;
const chat = $('#chat'), hooks = [], changed = what => hooks.forEach(f => f(what));
function reset() {
  cancelAnimationFrame(raf); talkUntil = {};
  S = { round: 0, typing: [], last: {}, said: {}, busy: false, done: false, verdict: false };
  KEYS.forEach(k => cast[k].className = 'm');
  chat.innerHTML = `<div class="hint">${['Two', 'Three', 'Four', 'Five', 'Six', 'Seven'][KEYS.length - 2] || KEYS.length} AI seats argue your decision in one group chat,<br>then the Chair gives you a verdict.</div>`;
  $('#round').textContent = ''; $('#round').className = 'round'; $('#typing').innerHTML = '';
  changed('reset');
}

function post(html, cls) {
  chat.querySelector('.hint')?.remove();
  const el = document.createElement('div'); el.className = 'msg ' + cls; el.innerHTML = html; chat.append(el);
  chat.scrollTo({ top: chat.scrollHeight, behavior: S.busy ? 'smooth' : 'auto' });
  return el;
}
const chair = text => post(`<div class="b"><div class="who"><b>Chair</b></div><div class="txt">${fmt(text)}</div></div>`, 'chair');
const you = () => post(`<div class="b"><div class="who"><b>You</b></div><div class="txt">${esc(Q)}</div></div>`, 'me');
function enterRound(n) {
  S.round = n; const i = RN.indexOf(n) + 1, title = D.rounds[n].title;
  chat.insertAdjacentHTML('beforeend', `<div class="sep">${esc(title)}</div>`);
  $('#round').textContent = `Round ${i} of ${RN.length} · ${title}`;
}
function typing() {
  const w = S.typing.map(seatName), el = $('#typing');
  el.innerHTML = !w.length ? '' : '<span><i></i><i></i><i></i></span>' + esc(w.length == 1 ? `${w[0]} is typing…` : w.length == 2 ? `${w[0]} and ${w[1]} are typing…` : `${w[0]}, ${w[1]} and ${w.length - 2} more are typing…`);
}
function tag(n, c) {
  const o = pick(c);
  if (c.stake == 'out') return '<span class="tag out">sits this one out</span>';
  if (n == RN[0] && o) return `<span class="tag">for ${o} · ${esc(optName(o))}</span>${c.stake == 'light' ? ' <span class="tag out">light touch</span>' : ''}`;
  if (n == LAST && c.pick) return `<span class="tag vote">votes ${c.pick}</span>`;
  return /^yes/i.test(c.MOVED || '') ? '<span class="tag">changed mind</span>' : '';
}

// one bubble. A seat's next bubble in a row is a double text: no face or name again. A reply quotes what it answers.
function say(e, anim) {
  const k = e.seat, c = e.card, n = e.round;
  if (e.text) {
    const prev = chat.lastElementChild, cont = prev?.dataset.k == k;
    const rq = e.first && c.target && c.target != k && S.said[c.target] ? `<div class="rq" style="--c:${D.seats[c.target].color}"><b>${esc(seatName(c.target))}</b>${fmt(S.said[c.target])}</div>` : '';
    const el = post(`${av(k)}<div class="b">${cont ? '' : `<div class="who"><b>${esc(seatName(k))}</b><span>${esc(D.seats[k].lens)}</span></div>`}${rq}<div class="txt">${fmt(e.text)}</div>${e.last ? tag(n, c) : ''}</div>`, 'seat' + (cont ? ' cont' : ''));
    el.dataset.k = k; el.style.setProperty('--c', D.seats[k].color); el.onclick = () => openCard(n, c, k);
    S.said[k] = e.text; S.last[k] = [n, c];
    if (anim) talk(k, e.dur);
    if (e.first && n == LAST && pick(c)) vote(k, pick(c));
    if (c.stake == 'out') cast[k].classList.add('out');  // its own call in round 1: no more turns, no vote
  }
  if (e.last) { cast[k].classList.remove('writing'); S.typing = S.typing.filter(x => x != k); typing(); }
}

// the vote: one column per option, and each seat's face drops into the one it votes for. It sticks to the top of the
// chat while the votes come in, then moves into the verdict.
function board() {
  const out = KEYS.filter(k => D.rounds[RN[0]].cards[k]?.stake == 'out').map(seatName);
  chat.insertAdjacentHTML('beforeend', `<div class="board live" id="board" style="--n:${OPTS.length}">${OPTS.map(o => `<div class="col" data-o="${o}"><b>${o}</b><span>${esc(optName(o))}</span><div class="faces"></div></div>`).join('')}${out.length ? `<div class="sat">Sat out: ${esc(out.join(', '))}</div>` : ''}</div>`);
}
const vote = (k, o) => $(`#board .col[data-o="${o}"] .faces`)?.insertAdjacentHTML('beforeend', `<span class="vf">${av(k)}<em>${esc(seatName(k))}</em></span>`);

function verdict() {
  if (S.verdict) return; S.verdict = true;
  const v = D.verdict, s = D.score, raw = v.LABEL || s.label, label = (raw.match(/^[^(.:,]+/) || [raw])[0].trim();
  const until = /^WAIT$/i.test(label) && raw.slice(label.length).replace(/^[,\s]+(until\s+)?/i, '');  // WAIT's trigger goes behind See more
  const el = post(`<div class="b">
    <div class="v-k">The council's ruling</div>
    <h2 class="v-h">${esc(optName(s.top))}</h2>
    <div class="v-label">${esc(label)}</div>
    <p class="v-main">${fmt((v['THE VERDICT'] || '').replace(/\s*\([^)]*\bscored\b[^)]*\)/g, ''))}</p>
    <div class="v-slot"></div>
    <dl class="v-do">${v['NEXT STEP THIS WEEK'] ? `<dt>This week</dt><dd>${fmt(v['NEXT STEP THIS WEEK'])}</dd>` : ''}${v['KILL IT IF'] ? `<dt>Walk away if</dt><dd>${fmt(v['KILL IT IF'])}</dd>` : ''}</dl>
    <div class="v-links"><a class="v-pdf" href="#">Verdict PDF</a><a class="v-more" href="#">See more</a></div>
  </div>`, 'verdict');
  const b = $('#board');
  if (b) { b.classList.remove('live'); b.querySelector(`.col[data-o="${s.top}"]`)?.classList.add('win'); el.querySelector('.v-slot').append(b); }
  $('#round').textContent = 'Verdict in'; $('#round').className = 'round done';
  chat.scrollTo({ top: Math.min(chat.scrollHeight - chat.clientHeight, el.offsetTop - 12), behavior: S.busy ? 'smooth' : 'auto' });  // a tall verdict opens at its top
  el.querySelector('.v-pdf').onclick = ev => { ev.preventDefault(); verdictPdf(ev.currentTarget); };
  el.querySelector('.v-more').onclick = ev => {
    ev.preventDefault();
    const fin = D.rounds[LAST]?.cards || {};
    openFields('The ruling', label, {
      'The verdict': v['THE VERDICT'], 'Wait until': until, 'Conditions': v.CONDITIONS, 'Minority report': v['MINORITY REPORT'], 'Sharpest clash': v['SHARPEST CLASH'],
      'Weighted scores': OPTS.map(o => `${o} · ${optName(o)}: ${s.options[o] != null ? s.options[o].toFixed(1) : '–'}`).join('\n'),
      'How each seat voted': KEYS.filter(k => fin[k]).map(k => `${seatName(k)}: ${fin[k].VOTE}` + (fin[k]['IF OUTVOTED'] ? `. If outvoted: ${fin[k]['IF OUTVOTED']}` : '')).join('\n'),
    });
  };
}

function apply(e, anim) {
  if (e.round && e.round != S.round) enterRound(e.round);
  if (e.kind == 'spawn') { cast[e.seat].classList.add('writing'); if (!S.typing.includes(e.seat)) S.typing.push(e.seat); typing(); }
  else if (e.kind == 'line') say(e, anim);
  else if (e.kind == 'chair') chair(e.text);
  else if (e.kind == 'board') board();
  else if (e.kind == 'verdict') verdict();
  else if (e.kind == 'done') { S.done = true; S.busy = false; changed('done'); }
}

// the verdict PDF (pdf.js, loaded on the first click): opens in a new tab, or downloads when the tab is blocked
let pdfLib = null;
async function verdictPdf(btn) {
  const was = btn.textContent; btn.textContent = 'Making the PDF…';
  try {
    pdfLib ??= new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'pdf.js'; s.onload = res; s.onerror = rej; document.head.append(s); });
    await pdfLib;
    const { doc, file } = await window.councilPdf();
    if (!window.open(doc.output('bloburl'), '_blank')) doc.save(file);
  } catch (e) { console.error(e); } finally { btn.textContent = was; }
}

const SKIP = new Set(['raw', 'scores', 'confidence', 'final_score', 'target', 'pick', 'SEAT', 'SAYS']);
function openFields(head, sub, fields, k) {
  $('#mBody').innerHTML = `<div class="m-seat">${k ? av(k) : ''}<div><b>${esc(head)}</b><span class="muted">${esc(sub)}</span></div></div>`
    + Object.entries(fields).filter(([f, x]) => !SKIP.has(f) && typeof x == 'string' && x).map(([f, x]) => `<div class="m-f"><label>${esc(f.toLowerCase())}</label><div>${esc(x).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')}</div></div>`).join('');
  $('#modal').hidden = false;
}
function openCard(n, c, k) { openFields(D.seats[k].name + ' (AI persona)', `${D.rounds[n].title} · ${D.seats[k].lens}`, c, k); }
$('#close').onclick = () => $('#modal').hidden = true;
$('#modal').onclick = e => e.target.id == 'modal' && ($('#modal').hidden = true);
addEventListener('keydown', e => e.key == 'Escape' && ($('#modal').hidden = true));

function play() {
  reset(); S.busy = true; changed('play'); you();
  const t0 = performance.now(); let i = 0;
  const tick = () => {
    const r = (performance.now() - t0) / 1000;
    while (i < X.length && X[i].rt <= r) apply(X[i++], true);
    if (i < X.length) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
}
function seek(t) { reset(); changed('play'); you(); for (const e of X) if (e.t <= t) apply(e, false); }
window.council = { play, seek, reset, question: Q, on: f => hooks.push(f), busy: () => S.busy, done: () => S.done, events: X, end: T_END, length: X[X.length - 1].rt };

// under the chat: skip to the verdict while the run replays, play it again once it is over, and the PDF at any time
const skip = $('#skip'), again = $('#again');
if (skip) {
  skip.onclick = e => { e.preventDefault(); seek(Infinity); };
  again.onclick = e => { e.preventDefault(); play(); };
  $('#pdf').onclick = e => { e.preventDefault(); verdictPdf(e.currentTarget); };
  hooks.push(() => { skip.hidden = S.done; again.hidden = !S.done; });
}

const at = P.get('t');
reset();
if (at) seek(at == 'end' ? Infinity : +at);
else if (skip) play();
