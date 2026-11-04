'use strict';

/* =====================================================================
   Siłownia — plan Upper / Lower × 2, dziennik, postęp, pomiary.
   Wszystkie dane zapisują się lokalnie (localStorage) na tym urządzeniu.
   ===================================================================== */

const STORAGE_KEY = 'silownia.v1';

/* ----------------------------- Dane planu ----------------------------- */

const LIFTS = {
  bench: { name: 'Wyciskanie na ławce płaskiej', short: 'Ławka' },
  squat: { name: 'Przysiad ze sztangą', short: 'Przysiad' },
  sumo: { name: 'Martwy ciąg sumo', short: 'Sumo' },
  ohp: { name: 'Wyciskanie żołnierskie stojąc (OHP)', short: 'OHP' },
};

const SCHEME = [
  { sets: 4, reps: 6, rpe: '7', label: 'Kalibracja' },
  { sets: 4, reps: 6, rpe: '7–8', label: 'Akumulacja' },
  { sets: 4, reps: 5, rpe: '8', label: 'Akumulacja' },
  { sets: 4, reps: 5, rpe: '8', label: 'Akumulacja' },
  { sets: 5, reps: 4, rpe: '8', label: 'Intensyfikacja' },
  { sets: 4, reps: 4, rpe: '8–9', label: 'Intensyfikacja' },
  { sets: 3, reps: 3, rpe: '9', label: 'Szczyt' },
  { sets: 3, reps: 5, rpe: '5–6', label: 'Deload' },
];
const DEFAULT_PCT = [0.72, 0.75, 0.78, 0.8, 0.82, 0.84, 0.87, 0.6];

const SESSIONS = [
  {
    id: 'UA', name: 'Upper A', day: 'Pn', focus: 'Siła: klatka i plecy w poziomie',
    ex: [
      { id: 'ua1', name: 'Wyciskanie sztangi na ławce płaskiej', main: 'bench', rest: 180, tip: 'Łopatki ściągnięte, nogi wbite w podłogę, sztanga do dolnej części klatki.' },
      { id: 'ua2', name: 'Wiosłowanie sztangą w opadzie', sets: '4×6–8', rest: 120, start: '70–80 kg', tip: 'Tułów ok. 45°, ciągnij do pępka, bez szarpania biodrami.' },
      { id: 'ua3', name: 'Wyciskanie hantli na skosie 30°', sets: '3×8–10', rest: 120, start: '30–34 kg / rękę', tip: 'Pełny zakres, łokcie ok. 45° od tułowia.' },
      { id: 'ua4', name: 'Ściąganie drążka wyciągu szeroko', sets: '3×8–10', rest: 90, start: '60–70 kg', tip: 'Do górnej części klatki, łokcie w dół i do tyłu.' },
      { id: 'ua5', name: 'Wznosy bokiem na wyciągu jednorącz', sets: '3×12–15', rest: 60, start: '5–7,5 kg', tip: 'Napięcie przez cały ruch. Szersze barki optycznie zwężają talię.' },
      { id: 'ua6', name: 'Uginanie sztangi łamanej', sets: '3×8–10', rest: 0, ss: true, start: '30–35 kg', tip: 'Superseria z następnym ćwiczeniem. Bez bujania.' },
      { id: 'ua7', name: 'Wyciskanie francuskie sztangą łamaną', sets: '3×8–10', rest: 75, start: '30–35 kg', tip: 'Opuszczaj za głowę, łokcie stabilne.' },
    ],
  },
  {
    id: 'LA', name: 'Lower A', day: 'Wt', focus: 'Siła: przysiad i core',
    ex: [
      { id: 'la1', name: 'Przysiad ze sztangą', main: 'squat', rest: 180, tip: 'Głębokość min. do równoległej, brzuch napięty przed zejściem.' },
      { id: 'la2', name: 'Rumuński martwy ciąg', sets: '3×8', rest: 120, start: '90–100 kg', tip: 'Biodra do tyłu, sztanga blisko nóg, plecy proste.' },
      { id: 'la3', name: 'Wykroki chodzone z hantlami', sets: '3×10 / nogę', rest: 90, start: '20–24 kg / rękę', tip: 'Długi krok, tułów prosto.' },
      { id: 'la4', name: 'Prostowanie nóg na maszynie', sets: '3×12–15', rest: 60, start: 'dobierz', tip: 'Pauza 1 s na górze.' },
      { id: 'la5', name: 'Wspięcia na palce stojąc', sets: '4×10–12', rest: 60, start: 'dobierz', tip: 'Pełne rozciągnięcie na dole, pauza na górze.' },
      { id: 'la6', name: 'Ab wheel (kółko) z kolan', sets: '3×8–12', rest: 60, start: 'ciało', tip: 'Wracasz brzuchem, nie biodrami. Lędźwia nie wyginają się.' },
      { id: 'la7', name: 'Pallof press na wyciągu', sets: '3×10 / str.', rest: 45, start: '15–20 kg', tip: 'Skośne brzucha: nie daj się obrócić.' },
    ],
  },
  {
    id: 'UB', name: 'Upper B', day: 'Czw', focus: 'Barki i plecy w pionie, więcej objętości',
    ex: [
      { id: 'ub1', name: 'Wyciskanie żołnierskie stojąc (OHP)', main: 'ohp', rest: 150, tip: 'Pośladki i brzuch spięte, głowa do przodu, gdy sztanga minie twarz.' },
      { id: 'ub2', name: 'Podciąganie nachwytem', sets: '4×6–10', rest: 120, start: 'ciało / guma', tip: '4×10 czystych powtórzeń, potem +2,5 kg na pasie.' },
      { id: 'ub3', name: 'Dipy na poręczach', sets: '3×8–10', rest: 90, start: 'ciało', tip: 'Lekko pochylony tułów = więcej klatki.' },
      { id: 'ub4', name: 'Wiosłowanie hantlem jednorącz', sets: '3×8–10 / str.', rest: 90, start: '36–40 kg', tip: 'Łokieć blisko ciała, ciągnij do biodra.' },
      { id: 'ub5', name: 'Wznosy bokiem hantlami', sets: '3×12–15', rest: 60, start: '10–12 kg', tip: 'Ostatnia seria: dropset −30% do upadku.' },
      { id: 'ub6', name: 'Face pull na linie', sets: '2×15', rest: 60, start: '20–25 kg', tip: 'Ciągnij do twarzy, łokcie wysoko.' },
      { id: 'ub7', name: 'Uginanie młotkowe', sets: '2×10–12', rest: 0, ss: true, start: '14–16 kg / rękę', tip: 'Superseria z następnym ćwiczeniem. Kciuki do góry.' },
      { id: 'ub8', name: 'Prostowanie ramion na wyciągu z liną', sets: '2×10–12', rest: 60, start: '25–30 kg', tip: 'Rozciągnij linę na dole.' },
    ],
  },
  {
    id: 'LB', name: 'Lower B', day: 'Pt', focus: 'Sumo, pośladki i tył uda',
    ex: [
      { id: 'lb1', name: 'Martwy ciąg sumo', main: 'sumo', rest: 180, tip: 'Kolana na zewnątrz, biodra blisko sztangi, „wypchnij podłogę”.' },
      { id: 'lb2', name: 'Wypychanie nóg na suwnicy', sets: '3×8–10', rest: 120, start: '180–220 kg', tip: 'Pełny zakres, nie odrywaj miednicy, nie blokuj kolan.' },
      { id: 'lb3', name: 'Hip thrust ze sztangą', sets: '3×8–10', rest: 90, start: '120–140 kg', tip: 'Pauza 1 s na górze, broda do klatki.' },
      { id: 'lb4', name: 'Uginanie nóg siedząc', sets: '3×10–12', rest: 60, start: 'dobierz', tip: '3 s w dół.' },
      { id: 'lb5', name: 'Wspięcia na palce siedząc', sets: '3×12–15', rest: 60, start: 'dobierz', tip: 'Pełny zakres ruchu.' },
      { id: 'lb6', name: 'Unoszenie nóg w zwisie', sets: '3×10–15', rest: 60, start: 'ciało', tip: 'Zwijaj miednicę, bez bujania.' },
      { id: 'lb7', name: 'Spacer z hantlem w jednej ręce', sets: '3×30 m / str.', rest: 60, start: '28–32 kg', unit: 'm', tip: 'Idź prosto, nie przechylaj się. W polu powtórzeń wpisz metry.' },
    ],
  },
];
const SESSION_BY_ID = Object.fromEntries(SESSIONS.map((s) => [s.id, s]));
const EX_BY_ID = Object.fromEntries(SESSIONS.flatMap((s) => s.ex.map((e) => [e.id, { ...e, session: s.id }])));

const METRICS = {
  weight: { label: 'Waga', unit: 'kg', lowerIsBetter: true },
  waist: { label: 'Talia', unit: 'cm', lowerIsBetter: true },
  flanks: { label: 'Boczki', unit: 'cm', lowerIsBetter: true },
  chest: { label: 'Klatka', unit: 'cm', lowerIsBetter: false },
  thigh: { label: 'Udo', unit: 'cm', lowerIsBetter: false },
  calf: { label: 'Łydka', unit: 'cm', lowerIsBetter: false },
  biceps: { label: 'Biceps', unit: 'cm', lowerIsBetter: false },
  steps: { label: 'Kroki', unit: '', lowerIsBetter: false, decimals: 0 },
};

const MEALS = [
  { name: 'Śniadanie', items: [
    ['Jajecznica z 3 jajek', 'omlet z 2 jaj i 100 g białek', 210, 18, 15, 1],
    ['Chleb żytni, 2 kromki (80 g)', 'bułka grahamka', 200, 6, 2, 38],
    ['Pomidor, ogórek, papryka', 'dowolne warzywa', 30, 1, 0, 6],
  ] },
  { name: 'Drugie śniadanie', items: [
    ['Płatki owsiane 80 g', 'płatki jaglane lub ryżowe', 300, 10, 6, 48],
    ['Mleko 2%, 250 ml', 'napój sojowy', 125, 8, 5, 12],
    ['Odżywka białkowa 30 g', 'skyr 200 g', 120, 24, 2, 3],
    ['Banan', 'inny owoc ok. 120 g', 100, 1, 0, 23],
  ] },
  { name: 'Obiad (przed lub po treningu)', items: [
    ['Pierś z kurczaka 200 g', 'indyk, schab', 330, 62, 7, 0],
    ['Ryż 125 g (suchy)', 'kasza 125 g, ziemniaki 550 g', 437, 9, 1, 98],
    ['Warzywa 200 g', 'mrożony mix, brokuł', 60, 3, 0, 10],
    ['Oliwa, 1 łyżka', 'masło 10 g', 90, 0, 10, 0],
  ] },
  { name: 'Kolacja', items: [
    ['Wołowina mielona 5%, 150 g', 'indyk mielony', 250, 32, 13, 0],
    ['Makaron 100 g (suchy)', 'ryż 100 g, 2 tortille', 356, 12, 1, 72],
    ['Passata 200 g z czosnkiem', 'pomidory z puszki', 60, 3, 0, 10],
    ['Mozzarella light 50 g', 'ser żółty light 30 g', 80, 9, 5, 1],
  ] },
  { name: 'Przekąska', items: [
    ['Orzechy 30 g', 'masło orzechowe, 2 łyżeczki', 190, 5, 17, 4],
    ['Owoc 150 g', 'jabłko, borówki', 90, 1, 0, 21],
  ] },
];

/* ----------------------------- Pomocnicze ----------------------------- */

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const toNum = (v) => {
  if (v === '' || v == null) return null;
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};
const fmt = (n, d = 1) => (n == null || !Number.isFinite(n) ? '–' : n.toLocaleString('pl-PL', { maximumFractionDigits: d }));
const fmtSigned = (n, d = 1) => (n == null || !Number.isFinite(n) ? '–' : (n > 0 ? '+' : n < 0 ? '−' : '') + fmt(Math.abs(n), d));
const round25 = (x) => Math.round(x / 2.5) * 2.5;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const e1rm = (kg, reps) => (kg > 0 && reps > 0 ? kg * (1 + reps / 30) : 0);
const firstNum = (s) => toNum(String(s).match(/\d+/)?.[0]);

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
const parseISO = (s) => new Date(`${s}T12:00:00`);
const daysBetween = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 86400000);
const MONTHS = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];
const dShort = (iso) => { const d = parseISO(iso); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; };
const dLong = (iso) => parseISO(iso).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const restLabel = (s) => (s >= 60 ? `${fmt(s / 60, 1)} min` : `${s} s`);

const ICON = {
  chev: '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
};

/* ------------------------------- Stan -------------------------------- */

function defaults() {
  return {
    version: 1,
    settings: {
      startDate: todayISO(),
      lifts: {
        bench: { kg: 90, reps: 8 },
        squat: { kg: 120, reps: 5 },
        sumo: { kg: 130, reps: 7 },
        ohp: { kg: 60, reps: 5 },
      },
      pct: DEFAULT_PCT.slice(),
      nutrition: { weight: 106, height: 188, age: 24, act: 1.5, deficit: 250, protein: 1.9, fat: 0.8, trainPlus: 150 },
      // mode: 'off' | 'button' | 'auto' (minutnik w Zegarze przez Skróty)
      clock: { mode: 'button', name: 'Przerwa' },
    },
    workouts: [],
    measurements: [
      { id: 'start', date: '2026-11-03', weight: 106, waist: 96, flanks: 104, chest: 111, thigh: 71, calf: 44, biceps: 40, steps: null, note: 'Start (waga po jedzeniu)' },
    ],
    drafts: {},
    timer: null,
  };
}

function loadState() {
  const base = defaults();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const s = JSON.parse(raw);
    return {
      ...base,
      ...s,
      settings: {
        ...base.settings,
        ...(s.settings || {}),
        lifts: { ...base.settings.lifts, ...(s.settings?.lifts || {}) },
        nutrition: { ...base.settings.nutrition, ...(s.settings?.nutrition || {}) },
        clock: { ...base.settings.clock, ...(s.settings?.clock || {}) },
        pct: Array.isArray(s.settings?.pct) && s.settings.pct.length === 8 ? s.settings.pct : base.settings.pct,
      },
      workouts: Array.isArray(s.workouts) ? s.workouts : [],
      measurements: Array.isArray(s.measurements) ? s.measurements : base.measurements,
      drafts: s.drafts && typeof s.drafts === 'object' ? s.drafts : {},
      timer: s.timer && Number.isFinite(s.timer.end) ? s.timer : null,
    };
  } catch (e) {
    console.warn('Nie udało się wczytać danych', e);
    return base;
  }
}

let state = loadState();
let saveTimer = null;
function saveNow() {
  clearTimeout(saveTimer);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    toast('Nie udało się zapisać danych na urządzeniu');
  }
}
function saveSoon() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 350);
}

/* ---------------------------- Obliczenia ----------------------------- */

function currentWeek() {
  const days = daysBetween(state.settings.startDate, todayISO());
  const raw = days < 0 ? 1 : Math.floor(days / 7) + 1;
  return { week: Math.min(raw, 8), over: raw > 8, raw };
}

function liftE1RM(lift) {
  const l = state.settings.lifts[lift];
  return e1rm(toNum(l.kg) || 0, toNum(l.reps) || 0);
}

function mainTarget(lift, week) {
  const sc = SCHEME[week - 1];
  const pct = state.settings.pct[week - 1];
  const sets = lift === 'sumo' ? Math.max(sc.sets - 1, 2) : sc.sets;
  return { sets, reps: sc.reps, kg: round25(liftE1RM(lift) * pct), rpe: sc.rpe, label: sc.label, pct };
}

function nutrition() {
  const n = state.settings.nutrition;
  const w = toNum(n.weight) || 0;
  const bmr = Math.round(10 * w + 6.25 * (toNum(n.height) || 0) - 5 * (toNum(n.age) || 0) + 5);
  const tdee = Math.round(bmr * (toNum(n.act) || 1));
  const avg = tdee - (toNum(n.deficit) || 0);
  const plus = toNum(n.trainPlus) || 0;
  const trn = Math.round(avg + plus);
  const rst = Math.round(avg - (plus * 4) / 3);
  const protein = Math.round(w * (toNum(n.protein) || 0));
  const fat = Math.round(w * (toNum(n.fat) || 0));
  const carbs = (k) => Math.max(0, Math.round((k - protein * 4 - fat * 9) / 4));
  return { bmr, tdee, avg, trn, rst, protein, fat, carbAvg: carbs(avg), carbTrn: carbs(trn), carbRst: carbs(rst), rate: ((toNum(n.deficit) || 0) * 7) / 7700 };
}

const sortedWorkouts = () => state.workouts.slice().sort((a, b) => (a.date === b.date ? (a.createdAt || 0) - (b.createdAt || 0) : a.date < b.date ? -1 : 1));

function lastEntry(exId, beforeDate) {
  const ws = sortedWorkouts().reverse();
  for (const w of ws) {
    if (beforeDate && w.date > beforeDate) continue;
    const e = w.entries.find((x) => x.exId === exId);
    if (e && e.sets.length) return { date: w.date, entry: e };
  }
  return null;
}

const workoutTonnage = (w) => w.entries.reduce((t, e) => (EX_BY_ID[e.exId]?.unit === 'm' ? t : t + e.sets.reduce((s, x) => s + (x.kg || 0) * (x.reps || 0), 0)), 0);
const entryBest = (e) => e.sets.reduce((m, x) => Math.max(m, e1rm(x.kg || 0, x.reps || 0)), 0);

function liftHistory(lift) {
  const pts = [];
  for (const w of sortedWorkouts()) {
    for (const e of w.entries) {
      const ex = EX_BY_ID[e.exId];
      if (ex && ex.main === lift) {
        const best = entryBest(e);
        if (best > 0) pts.push({ date: w.date, v: Math.round(best * 10) / 10, sets: e.sets, workoutId: w.id });
      }
    }
  }
  return pts;
}

function nextSessionId() {
  const ws = sortedWorkouts();
  if (!ws.length) return 'UA';
  const order = SESSIONS.map((s) => s.id);
  const i = order.indexOf(ws[ws.length - 1].session);
  return order[(i + 1) % order.length];
}

function weekWorkoutsCount() {
  const d = parseISO(todayISO());
  const dow = (d.getDay() + 6) % 7; // pon = 0
  const monday = new Date(d); monday.setDate(d.getDate() - dow);
  const mondayISO = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
  return state.workouts.filter((w) => w.date >= mondayISO && w.date <= todayISO()).length;
}

/* ------------------------------ Szkice ------------------------------- */

function setCount(ex, week) {
  if (ex.main) return mainTarget(ex.main, week).sets;
  if (week === 8) return 2;
  return firstNum(ex.sets) || 3;
}

function buildDraft(sessionId, week) {
  const s = SESSION_BY_ID[sessionId];
  const entries = {};
  for (const ex of s.ex) {
    const n = setCount(ex, week);
    let kg = '';
    if (ex.main) kg = mainTarget(ex.main, week).kg;
    else {
      const last = lastEntry(ex.id);
      const lastKg = last?.entry.sets[0]?.kg;
      if (lastKg) kg = week === 8 ? round25(lastKg * 0.7) : lastKg;
    }
    entries[ex.id] = { sets: Array.from({ length: n }, () => ({ kg: kg === '' ? '' : fmt(kg), reps: '', done: false })), rpe: '', note: '' };
  }
  return { session: sessionId, week, date: todayISO(), entries, touched: false };
}

function getDraft(sessionId, week) {
  let d = state.drafts[sessionId];
  if (!d) {
    d = buildDraft(sessionId, week);
    state.drafts[sessionId] = d;
  } else if (!d.touched && (d.week !== week || d.date !== todayISO())) {
    d = buildDraft(sessionId, week);
    state.drafts[sessionId] = d;
  }
  return d;
}

function changeDraftWeek(sessionId, week) {
  const d = state.drafts[sessionId];
  if (!d || !d.touched) {
    state.drafts[sessionId] = buildDraft(sessionId, week);
    return;
  }
  d.week = week;
  for (const ex of SESSION_BY_ID[sessionId].ex) {
    if (!ex.main) continue;
    const t = mainTarget(ex.main, week);
    const e = d.entries[ex.id];
    while (e.sets.length < t.sets) e.sets.push({ kg: '', reps: '', done: false });
    for (const set of e.sets) if (!set.reps) set.kg = fmt(t.kg);
  }
}

/* ------------------------------- Widoki ------------------------------ */

const ui = {
  tab: 'trening',
  session: null,
  week: null,
  lift: 'bench',
  metric: 'waist',
  open: new Set(['boje']),
};

function render() {
  const view = $('#view');
  const fn = { trening: viewTrening, historia: viewHistoria, postep: viewPostep, pomiary: viewPomiary, plan: viewPlan }[ui.tab] || viewTrening;
  view.innerHTML = fn();
  document.querySelectorAll('.tab').forEach((t) => {
    if (t.dataset.tab === ui.tab) t.setAttribute('aria-current', 'page');
    else t.removeAttribute('aria-current');
  });
  syncWakeLock();
}

function head(title, sub) {
  return `<header class="page-head"><h1 class="page-title">${esc(title)}</h1>${sub ? `<p class="page-sub">${sub}</p>` : ''}</header>`;
}

function seg(items, current, action, label) {
  return `<div class="segmented glass" role="group" aria-label="${esc(label)}">${items
    .map(([v, t]) => `<button class="seg" data-action="${action}" data-value="${esc(v)}" aria-pressed="${String(v) === String(current)}">${esc(t)}</button>`)
    .join('')}</div>`;
}

/* ---- Trening ---- */
function viewTrening() {
  const cw = currentWeek();
  if (!ui.session) {
    const touched = SESSIONS.find((s) => state.drafts[s.id]?.touched);
    ui.session = touched ? touched.id : nextSessionId();
  }
  const existing = state.drafts[ui.session];
  if (!ui.week) ui.week = existing?.touched ? existing.week : cw.week;
  const draft = getDraft(ui.session, ui.week);
  const week = draft.week;
  const s = SESSION_BY_ID[ui.session];
  const sc = SCHEME[week - 1];
  const mainEx = s.ex.find((e) => e.main);
  const t = mainTarget(mainEx.main, week);
  const done = weekWorkoutsCount();

  let html = head('Trening', `Tydzień ${week} z 8, ${sc.label.toLowerCase()}. W tym tygodniu ${done} z 4 treningów.`);

  if (cw.over) {
    html += `<div class="callout warn">Cykl 8 tygodni się skończył. W zakładce Plan wpisz nowe wyniki głównych bojów i zacznij nowy cykl.
      <div style="margin-top:10px"><button class="btn btn-small" data-action="goto" data-value="plan">Otwórz plan</button></div></div>`;
  }

  html += `<div class="stack">${seg(SESSIONS.map((x) => [x.id, x.name]), ui.session, 'set-session', 'Wybierz trening')}
    ${seg(SCHEME.map((_, i) => [i + 1, `T${i + 1}`]), week, 'set-week', 'Tydzień cyklu')}</div>`;

  html += `<section class="hero glass" style="margin-top:14px" aria-label="Bój główny">
    <div class="hero-lift">${esc(s.name)}: ${esc(LIFTS[mainEx.main].name)}</div>
    <div class="hero-weight"><span class="num">${fmt(t.kg)}</span><span class="unit">kg</span></div>
    <div class="hero-scheme">${t.sets} × ${t.reps}</div>
    <div class="hero-meta">
      <span class="pill amber">RPE ${esc(t.rpe)}</span>
      <span class="pill">${Math.round(t.pct * 100)}% maksu</span>
      <span class="pill teal">Szacowany maks ${fmt(liftE1RM(mainEx.main))} kg</span>
    </div>
  </section>`;

  html += `<p class="muted small" style="margin:0 4px 12px">${esc(s.focus)}. ${week === 8 ? 'Tydzień lżejszy: ćwiczenia pomocnicze 2 serie, ok. 70% ciężaru, bez upadku.' : 'Ćwiczenia pomocnicze: podwójna progresja na RPE 7–8.'}</p>`;

  s.ex.forEach((ex, i) => {
    const e = draft.entries[ex.id] || { sets: [], rpe: '', note: '' };
    const last = lastEntry(ex.id);
    let target;
    let repsPh;
    if (ex.main) {
      target = `${t.sets} × ${t.reps} @ ${fmt(t.kg)} kg`;
      repsPh = String(t.reps);
    } else {
      target = week === 8 ? `2 serie, ok. 70% ciężaru (plan: ${ex.sets})` : ex.sets;
      repsPh = String(firstNum(ex.sets.split('×')[1]) || '');
    }
    const lastTxt = last ? `Ostatnio, ${dShort(last.date)}: ${last.entry.sets.map((x) => `${fmt(x.kg)}×${fmt(x.reps, 0)}`).join(', ')}` : ex.start ? `Start: ${ex.start}` : '';
    html += `<article class="card glass ${ex.main ? 'ex-main' : ''}" data-ex="${ex.id}">
      <div class="ex-head">
        <div class="ex-index">${i + 1}</div>
        <div class="grow">
          <div class="ex-name">${esc(ex.name)}</div>
          <div class="ex-target">Cel: <b>${esc(target)}</b>${ex.rest ? `, przerwa ${restLabel(ex.rest)}` : ''}</div>
          ${ex.ss ? '<div class="badge-ss">Superseria z następnym ćwiczeniem</div>' : ''}
          ${lastTxt ? `<div class="ex-last">${esc(lastTxt)}</div>` : ''}
          <div class="ex-tip">${esc(ex.tip)}</div>
        </div>
      </div>
      <div class="sets">
        ${e.sets
          .map((set, si) => {
            const ph = last?.entry.sets[si]?.reps ?? repsPh;
            return `<div class="set-row ${set.done ? 'is-done' : ''}">
              <div class="set-no">${si + 1}</div>
              <div class="set-cell"><input class="field" inputmode="decimal" enterkeyhint="next" aria-label="Seria ${si + 1}, ciężar w kg" data-ex="${ex.id}" data-i="${si}" data-k="kg" value="${esc(set.kg)}" placeholder="kg"><span class="suffix">kg</span></div>
              <div class="set-cell"><input class="field" inputmode="numeric" enterkeyhint="done" aria-label="Seria ${si + 1}, ${ex.unit === 'm' ? 'metry' : 'powtórzenia'}" data-ex="${ex.id}" data-i="${si}" data-k="reps" value="${esc(set.reps)}" placeholder="${esc(ph)}"><span class="suffix">${ex.unit === 'm' ? 'm' : 'powt.'}</span></div>
              <button class="done-btn" data-action="toggle-done" data-ex="${ex.id}" data-i="${si}" aria-pressed="${set.done}" aria-label="Seria ${si + 1} zrobiona">${ICON.check}</button>
            </div>`;
          })
          .join('')}
      </div>
      <div class="ex-actions">
        <button class="btn btn-small" data-action="add-set" data-ex="${ex.id}">Dodaj serię</button>
        ${e.sets.length > 1 ? `<button class="btn btn-small" data-action="remove-set" data-ex="${ex.id}">Usuń serię</button>` : ''}
        <select class="field rpe" data-ex="${ex.id}" data-k="rpe" aria-label="RPE ostatniej serii">
          <option value="">RPE</option>
          ${['6', '6,5', '7', '7,5', '8', '8,5', '9', '9,5', '10'].map((r) => `<option ${e.rpe === r ? 'selected' : ''}>${r}</option>`).join('')}
        </select>
      </div>
      <input class="field" style="margin-top:8px" data-ex="${ex.id}" data-k="note" value="${esc(e.note)}" placeholder="Notatka (np. łatwo, dołożyć następnym razem)" aria-label="Notatka do ćwiczenia">
    </article>`;
  });

  html += `<div class="card glass">
    <label class="lbl" for="w-date">Data treningu</label>
    <input id="w-date" class="field" type="date" data-k="date" value="${esc(draft.date)}">
    <button class="btn btn-primary btn-block" style="margin-top:14px" data-action="save-workout">Zapisz trening</button>
    <button class="btn btn-block btn-danger" style="margin-top:8px;background:none;border-color:transparent" data-action="reset-draft">Wyczyść wpisy</button>
  </div>`;
  return html;
}

/* ---- Historia ---- */
function viewHistoria() {
  const ws = sortedWorkouts().reverse();
  let html = head('Historia', ws.length ? `${ws.length} ${plural(ws.length, 'zapisany trening', 'zapisane treningi', 'zapisanych treningów')}` : '');
  if (!ws.length) {
    return html + `<div class="card glass empty"><h3>Tu pojawią się Twoje treningi</h3>
      <p class="muted">Wpisz serie w zakładce Trening i zapisz pierwszy trening.</p>
      <button class="btn btn-primary" data-action="goto" data-value="trening">Przejdź do treningu</button></div>`;
  }
  let curWeek = null;
  let open = false;
  for (const w of ws) {
    const label = `Tydzień ${w.week}`;
    if (label !== curWeek) {
      if (open) html += '</div>';
      html += `<h2 class="section-title">${label}</h2><div class="list glass">`;
      curWeek = label;
      open = true;
    }
    const d = parseISO(w.date);
    const ton = workoutTonnage(w);
    html += `<button class="list-item" data-action="open-workout" data-id="${w.id}">
      <div class="date-chip"><div class="d">${d.getDate()}</div><div class="m">${MONTHS[d.getMonth()]}</div></div>
      <div class="grow"><div style="font-weight:650">${esc(SESSION_BY_ID[w.session]?.name || w.session)}</div>
      <div class="muted small">Tonaż ${fmt(ton, 0)} kg, ${w.entries.length} ${plural(w.entries.length, 'ćwiczenie', 'ćwiczenia', 'ćwiczeń')}</div></div>
      ${ICON.chev}</button>`;
  }
  if (open) html += '</div>';
  return html;
}

function plural(n, one, few, many) {
  if (n === 1) return one;
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 >= 2 && m10 <= 4 && !(m100 >= 12 && m100 <= 14)) return few;
  return many;
}

function workoutSheet(id) {
  const w = state.workouts.find((x) => x.id === id);
  if (!w) return;
  const s = SESSION_BY_ID[w.session];
  const rows = w.entries
    .map((e) => {
      const ex = EX_BY_ID[e.exId];
      const unit = ex?.unit === 'm' ? ' m' : '';
      const sets = e.sets.map((x) => `${fmt(x.kg)}×${fmt(x.reps, 0)}${unit}`).join(', ');
      const best = ex?.main ? `<div class="small" style="color:var(--teal)">Szacowany maks ${fmt(entryBest(e))} kg</div>` : '';
      return `<tr><td><b>${esc(e.name || ex?.name)}</b>${best}${e.note ? `<div class="faint small">${esc(e.note)}</div>` : ''}</td>
        <td class="n">${sets}${e.rpe ? `<div class="faint small">RPE ${esc(e.rpe)}</div>` : ''}</td></tr>`;
    })
    .join('');
  openSheet(`<h2 id="sheet-title">${esc(s?.name || w.session)}</h2>
    <p class="muted" style="margin:0 0 8px">${esc(dLong(w.date))}, tydzień ${w.week}. Tonaż ${fmt(workoutTonnage(w), 0)} kg.</p>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Ćwiczenie</th><th>Serie (kg × powt.)</th></tr></thead><tbody>${rows}</tbody></table></div>
    <button class="btn btn-block btn-danger" style="margin-top:16px" data-action="delete-workout" data-id="${w.id}">Usuń trening</button>`);
}

/* ---- Postęp ---- */
function viewPostep() {
  const lift = ui.lift;
  const start = Math.round(liftE1RM(lift) * 10) / 10;
  const hist = liftHistory(lift);
  const best = hist.reduce((m, p) => Math.max(m, p.v), 0);
  const shown = Math.max(best, start);
  let html = head('Postęp', 'Szacowany maks liczony z Twoich serii (wzór Epleya).');
  html += seg(Object.entries(LIFTS).map(([k, v]) => [k, v.short]), lift, 'set-lift', 'Wybierz bój');
  let note;
  if (!best) note = 'Wartość startowa z zakładki Plan. Zapisz trening z tym bojem, żeby zobaczyć postęp.';
  else if (best > start) note = `Nowy rekord: <b class="delta good">${fmtSigned(best - start)} kg</b> od startu cyklu (${fmt(start)} kg).`;
  else note = `Najlepsza seria w aplikacji daje ${fmt(best)} kg. Ciężary z planu są poniżej maksa, więc szacunek wychodzi niżej. Rekord pojawi się w tygodniach 5–7.`;

  html += `<section class="hero glass" style="margin-top:14px">
    <div class="hero-lift">${esc(LIFTS[lift].name)}</div>
    <div class="hero-weight"><span class="num">${fmt(shown)}</span><span class="unit">kg</span></div>
    <div class="muted">${note}</div>
    ${lineChart(hist.map((p) => ({ label: dShort(p.date), v: p.v })), 'kg')}
  </section>`;

  const top = hist.flatMap((p) => p.sets.map((x) => ({ date: p.date, kg: x.kg, reps: x.reps, v: e1rm(x.kg, x.reps) }))).sort((a, b) => b.v - a.v).filter((x, i, arr) => arr.findIndex((y) => y.date === x.date && y.kg === x.kg && y.reps === x.reps) === i).slice(0, 3);
  if (top.length) {
    html += `<h2 class="section-title">Najlepsze serie</h2><div class="list glass">${top
      .map((x) => `<div class="list-item"><div class="grow"><b class="num">${fmt(x.kg)} kg × ${x.reps}</b><div class="muted small">${dShort(x.date)}</div></div><div class="num" style="color:var(--amber);font-weight:700">${fmt(x.v)} kg</div></div>`)
      .join('')}</div>`;
  }

  const ws = sortedWorkouts();
  const recent = ws.slice(-12);
  html += `<h2 class="section-title">Treningi</h2>
    <div class="stats">
      <div class="stat glass"><div class="label">Łącznie</div><div class="value">${ws.length}</div></div>
      <div class="stat glass"><div class="label">Ten tydzień</div><div class="value">${weekWorkoutsCount()}<span class="faint" style="font-size:16px">/4</span></div></div>
      <div class="stat glass"><div class="label">Ostatni tonaż</div><div class="value">${recent.length ? fmt(workoutTonnage(recent[recent.length - 1]) / 1000, 1) : '–'}<span class="faint" style="font-size:14px"> t</span></div></div>
    </div>
    <div class="card glass"><h3>Tonaż ostatnich treningów</h3><p class="muted small" style="margin:0">Suma kg × powtórzenia na trening.</p>
    ${barChart(recent.map((w) => ({ label: `${SESSION_BY_ID[w.session]?.name.replace('pper ', '').replace('ower ', '') || ''}`, v: workoutTonnage(w) })))}</div>`;
  return html;
}

/* ---- Pomiary ---- */
function sortedMeasures() {
  return state.measurements.slice().sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

function measureSeries(key) {
  return sortedMeasures().filter((m) => toNum(m[key]) != null).map((m) => ({ date: m.date, v: toNum(m[key]) }));
}

function coachHint() {
  const s = measureSeries('waist');
  if (s.length < 2) return 'Mierz talię i boczki co tydzień, rano na czczo, na wydechu. Pierwsze wnioski po 2–3 tygodniach.';
  const last = s[s.length - 1];
  const ref = [...s].reverse().find((p) => daysBetween(p.date, last.date) >= 26);
  if (!ref) {
    const d = last.v - s[0].v;
    return d < 0 ? `Talia ${fmtSigned(d)} cm od startu. Dobry kierunek, trzymaj plan.` : 'Za wcześnie na wnioski. Pierwsza ocena po 4 tygodniach pomiarów.';
  }
  const d = last.v - ref.v;
  if (d <= -0.5) return `Talia ${fmtSigned(d)} cm w ostatnich 4 tygodniach. Rekompozycja działa, nic nie zmieniaj.`;
  return `Talia stoi od 4 tygodni (${fmtSigned(d)} cm). Dodaj 2000 kroków dziennie albo zabierz 150 kcal. Jedna zmiana naraz.`;
}

function viewPomiary() {
  const ms = sortedMeasures();
  let html = head('Pomiary', 'Co tydzień: waga, talia, boczki. Co 4 tygodnie: reszta obwodów.');
  const statFor = (key) => {
    const s = measureSeries(key);
    const m = METRICS[key];
    if (!s.length) return `<div class="stat glass"><div class="label">${m.label}</div><div class="value">–</div></div>`;
    const last = s[s.length - 1].v;
    const d = s.length > 1 ? last - s[0].v : null;
    const good = d == null || d === 0 ? 'flat' : (d < 0) === m.lowerIsBetter ? 'good' : 'bad';
    return `<div class="stat glass"><div class="label">${m.label}</div><div class="value">${fmt(last)}<span class="faint" style="font-size:14px"> ${m.unit}</span></div>
      <div class="delta ${good}">${d == null ? 'start' : `${fmtSigned(d)} ${m.unit}`}</div></div>`;
  };
  html += `<div class="stats">${statFor('weight')}${statFor('waist')}${statFor('flanks')}</div>`;
  html += `<div class="callout good">${esc(coachHint())}</div>`;
  html += `<button class="btn btn-primary btn-block" style="margin:6px 0 4px" data-action="add-measure">Dodaj pomiar</button>`;

  html += `<h2 class="section-title">Wykres</h2>${seg(Object.entries(METRICS).map(([k, v]) => [k, v.label]), ui.metric, 'set-metric', 'Wybierz pomiar')}`;
  const series = measureSeries(ui.metric);
  html += `<div class="card glass" style="margin-top:12px">${lineChart(series.map((p) => ({ label: dShort(p.date), v: p.v })), METRICS[ui.metric].unit, METRICS[ui.metric].decimals)}</div>`;

  html += `<h2 class="section-title">Wpisy</h2>`;
  if (!ms.length) html += '<div class="card glass empty"><p class="muted">Brak pomiarów.</p></div>';
  else {
    html += `<div class="list glass">${ms
      .slice()
      .reverse()
      .map((m) => {
        const d = parseISO(m.date);
        const parts = ['weight', 'waist', 'flanks'].filter((k) => toNum(m[k]) != null).map((k) => `${METRICS[k].label.toLowerCase()} ${fmt(toNum(m[k]))}`);
        return `<button class="list-item" data-action="open-measure" data-id="${m.id}">
          <div class="date-chip"><div class="d">${d.getDate()}</div><div class="m">${MONTHS[d.getMonth()]}</div></div>
          <div class="grow"><div style="font-weight:600">${esc(parts.join(', ') || 'Pomiar')}</div>${m.note ? `<div class="muted small">${esc(m.note)}</div>` : ''}</div>${ICON.chev}</button>`;
      })
      .join('')}</div>`;
  }
  return html;
}

function measureForm(m) {
  const last = sortedMeasures().slice(-1)[0] || {};
  const field = (k) => `<div><label class="lbl" for="m-${k}">${METRICS[k].label}${METRICS[k].unit ? ` (${METRICS[k].unit})` : ''}</label>
    <input id="m-${k}" class="field num" inputmode="${k === 'steps' ? 'numeric' : 'decimal'}" name="${k}" value="${esc(m?.[k] ?? '')}" placeholder="${esc(last[k] != null ? fmt(toNum(last[k]), METRICS[k].decimals ?? 1) : '')}"></div>`;
  openSheet(`<h2 id="sheet-title">${m ? 'Pomiar' : 'Nowy pomiar'}</h2>
    <p class="muted small" style="margin:0 0 14px">Rano, na czczo, po toalecie. Talia na wysokości pępka, boczki w najszerszym miejscu, oba na wydechu.</p>
    <form id="measure-form" class="form-grid" data-id="${m ? esc(m.id) : ''}">
      <div class="full"><label class="lbl" for="m-date">Data</label><input id="m-date" class="field" type="date" name="date" value="${esc(m?.date || todayISO())}" required></div>
      ${['weight', 'waist', 'flanks', 'chest', 'thigh', 'calf', 'biceps', 'steps'].map(field).join('')}
      <div class="full"><label class="lbl" for="m-note">Notatka</label><input id="m-note" class="field" name="note" value="${esc(m?.note || '')}" placeholder="np. po weekendzie, słabo spałem"></div>
      <button class="btn btn-primary btn-block full" type="submit">${m ? 'Zapisz zmiany' : 'Zapisz pomiar'}</button>
      ${m ? `<button class="btn btn-block btn-danger full" type="button" data-action="delete-measure" data-id="${esc(m.id)}">Usuń pomiar</button>` : ''}
    </form>`);
}

/* ---- Plan ---- */
function acc(id, title, sub, body) {
  return `<details class="acc glass" data-acc="${id}" ${ui.open.has(id) ? 'open' : ''}>
    <summary><span><span>${title}</span>${sub ? `<span class="sum-sub">${sub}</span>` : ''}</span>${ICON.chev}</summary>
    <div class="acc-body">${body}</div></details>`;
}

function viewPlan() {
  const cw = currentWeek();
  const n = nutrition();
  const st = state.settings;
  let html = head('Plan', 'Wszystko o planie, kaloriach i regeneracji w jednym miejscu.');

  html += acc('ocena', 'Ocena i cel', 'Rekompozycja przy lekkim deficycie', `
    <div class="tbl-wrap"><table class="tbl"><tbody>
      <tr><td><b>Waga</b></td><td>106 kg po jedzeniu, 188 cm. Rano na czczo realnie ok. 104–105 kg.</td></tr>
      <tr><td><b>Talia</b></td><td>96 cm, czyli 0,51 wzrostu. Pierwszy cel: poniżej 94 cm.</td></tr>
      <tr><td><b>Boczki</b></td><td>104 cm. Razem z talią to Twoje główne liczby postępu.</td></tr>
      <tr><td><b>Klatka, ramię, udo</b></td><td>111, 40, 71 cm. Mają stać lub rosnąć, gdy talia spada.</td></tr>
      <tr><td><b>Ławka</b></td><td>90 kg × 8, szacowany maks ok. 114 kg. Prawie dawny rekord 117,5.</td></tr>
      <tr><td><b>Przysiad</b></td><td>120 kg w serii, maks ok. 140 kg. Nogi dostają teraz 2 treningi.</td></tr>
      <tr><td><b>Martwy</b></td><td>Przechodzimy na sumo. Lepiej Ci leży i w nim miałeś 200 kg.</td></tr>
    </tbody></table></div>
    <div class="callout good">Siła wraca szybciej niż schodzi tłuszcz z talii. Plan: lekki deficyt ok. 250 kcal, 4 treningi i 8–10 tys. kroków. Jeśli po 6 tygodniach talia nie spadnie o min. 2 cm, robimy krótki mini-cut na 4–6 tygodni i wracamy do rekompozycji.</div>`);

  html += acc('cykl', 'Tydzień i cykl', `Teraz tydzień ${cw.week} z 8${cw.over ? ', cykl zakończony' : ''}`, `
    <label class="lbl" for="s-start">Pierwszy dzień cyklu</label>
    <input id="s-start" class="field" type="date" data-setting="startDate" value="${esc(st.startDate)}">
    <p>Tydzień liczy się sam od tej daty. W zakładce Trening możesz też ręcznie wybrać tydzień.</p>
    <button class="btn" data-action="new-cycle">Zacznij nowy cykl od dziś</button>
    <p class="small faint">Przed nowym cyklem wpisz w „Główne boje” najlepszą serię z tygodnia 6–7. Ciężary pójdą w górę.</p>`);

  const liftRows = Object.entries(LIFTS)
    .map(([k, v]) => {
      const l = st.lifts[k];
      return `<tr><td><b>${esc(v.short)}</b></td>
        <td><input class="field num" style="width:76px;padding:7px" inputmode="decimal" data-setting="lifts.${k}.kg" value="${esc(fmt(toNum(l.kg)))}" aria-label="${esc(v.short)} ciężar"></td>
        <td><input class="field num" style="width:56px;padding:7px" inputmode="numeric" data-setting="lifts.${k}.reps" value="${esc(l.reps)}" aria-label="${esc(v.short)} powtórzenia"></td>
        <td class="n"><b>${fmt(liftE1RM(k))}</b></td></tr>`;
    })
    .join('');
  const weekRows = SCHEME.map((sc, i) => {
    const w = i + 1;
    const cells = Object.keys(LIFTS).map((k) => { const t = mainTarget(k, w); return `<td class="n">${t.sets}×${t.reps}<br><b>${fmt(t.kg)}</b></td>`; }).join('');
    return `<tr class="${w === cw.week ? 'current' : ''} ${w === 8 ? 'deload' : ''}"><td><b>T${w}</b><div class="faint small">${Math.round(st.pct[i] * 100)}%, RPE ${sc.rpe}</div></td>${cells}</tr>`;
  }).join('');
  html += acc('boje', 'Główne boje', 'Twoje maksy i ciężary na 8 tygodni', `
    <p>Wpisz ciężar i powtórzenia z ostatniej ciężkiej serii. Aplikacja liczy szacowany maks (wzór Epleya) i z niego ciężary na każdy tydzień, zaokrąglone do 2,5 kg.</p>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Bój</th><th>kg</th><th>powt.</th><th>Maks</th></tr></thead><tbody>${liftRows}</tbody></table></div>
    <div class="callout warn">Przysiad (założone 5 powt.), sumo (szacunek z klasycznego 130 kg) i OHP (szacunek) popraw po pierwszym treningu.</div>
    <h4>Plan 8 tygodni</h4>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Tydzień</th>${Object.values(LIFTS).map((v) => `<th>${v.short}</th>`).join('')}</tr></thead><tbody>${weekRows}</tbody></table></div>
    <p class="small faint">Sumo ma zawsze o 1 serię mniej, żeby mniej męczyć plecy.</p>
    <h4>Autoregulacja</h4>
    <ul>
      <li>Pierwsza seria lżejsza niż RPE z planu (2+ powt. zapasu): kolejne serie +2,5 kg (ławka, OHP) lub +5 kg (przysiad, sumo).</li>
      <li>Technika się sypie albo RPE 9,5+: −5% na resztę serii.</li>
      <li>Dwa tygodnie z rzędu za lekko lub za ciężko: popraw wpis wyżej, cały plan przeliczy się sam.</li>
    </ul>`);

  html += acc('treningi', 'Treningi', 'Upper A, Lower A, Upper B, Lower B', SESSIONS.map((s) => `
    <h4>${esc(s.name)} (${s.day}), ${esc(s.focus.toLowerCase())}</h4>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Ćwiczenie</th><th>Serie</th><th>Przerwa</th><th>Start</th></tr></thead><tbody>
    ${s.ex.map((e) => `<tr><td>${esc(e.name)}${e.ss ? ' <span class="badge-ss">superseria</span>' : ''}</td><td class="n">${e.main ? 'wg tabeli' : esc(e.sets)}</td><td class="n">${e.rest ? restLabel(e.rest) : '–'}</td><td class="n">${e.main ? `${fmt(mainTarget(e.main, cw.week).kg)} kg` : esc(e.start || '')}</td></tr>`).join('')}
    </tbody></table></div>`).join('') + `
    <h4>Układ tygodnia</h4>
    <ul><li><b>Pn</b> Upper A, <b>Wt</b> Lower A, <b>Śr</b> wolne, <b>Czw</b> Upper B, <b>Pt</b> Lower B, weekend wolny i aktywny.</li>
    <li>Może też być Pn, Wt, Czw, Sob. Nie rób więcej niż 2 treningi z rzędu.</li></ul>
    <h4>Rozgrzewka (8–10 min)</h4>
    <p>5 min rower lub orbitrek, krążenia ramion i bioder. Przed bojem głównym: pusty gryf ×10, 50% ×5, 70% ×3, 85% ×1.</p>`);

  const num = (k, label, step, help) => `<div><label class="lbl" for="n-${k}">${label}</label><input id="n-${k}" class="field num" inputmode="decimal" data-setting="nutrition.${k}" value="${esc(fmt(toNum(st.nutrition[k]), 2))}" step="${step}">${help ? `<div class="faint small" style="margin-top:3px">${help}</div>` : ''}</div>`;
  html += acc('kalorie', 'Kalorie i makro', `${fmt(n.trn, 0)} kcal w dni treningowe, ${fmt(n.rst, 0)} kcal w wolne`, `
    <div class="kv">
      <span>Dzień treningowy (4× w tygodniu)</span><span class="v">${fmt(n.trn, 0)} kcal</span>
      <span>Dzień wolny (3× w tygodniu)</span><span class="v">${fmt(n.rst, 0)} kcal</span>
      <span>Białko</span><span class="v">${n.protein} g</span>
      <span>Tłuszcze</span><span class="v">${n.fat} g</span>
      <span>Węglowodany w dzień treningowy</span><span class="v">${n.carbTrn} g</span>
      <span>Węglowodany w dzień wolny</span><span class="v">${n.carbRst} g</span>
    </div>
    <p class="small faint">Metabolizm spoczynkowy ${fmt(n.bmr, 0)} kcal, zapotrzebowanie ${fmt(n.tdee, 0)} kcal, średnio ${fmt(n.avg, 0)} kcal na dzień. Orientacyjny spadek ${fmt(n.rate, 2)} kg na tydzień.</p>
    <h4>Dane do wyliczeń</h4>
    <div class="form-grid">
      ${num('weight', 'Waga (kg)', 0.1, 'Aktualizuj co 3–4 kg')}
      ${num('height', 'Wzrost (cm)', 1)}
      ${num('age', 'Wiek', 1)}
      ${num('act', 'Aktywność', 0.05, 'Biuro + 4 treningi = 1,5')}
      ${num('deficit', 'Deficyt (kcal)', 10, 'Rekompozycja: 200–300')}
      ${num('trainPlus', 'Dzień treningowy: +kcal', 10)}
      ${num('protein', 'Białko (g / kg)', 0.1)}
      ${num('fat', 'Tłuszcze (g / kg)', 0.1)}
    </div>
    <h4>Zasady</h4>
    <ul>
      <li>Dzień treningowy i wolny różnią się tylko węglowodanami. Białko i tłuszcze stałe.</li>
      <li>Białko na 4–5 posiłków po 40–50 g. Węgle głównie przed i po treningu.</li>
      <li>Talia stoi 4 tygodnie: −150 kcal albo +2000 kroków. Siła spada 2 tygodnie przy dobrym śnie: +150 kcal z węgli.</li>
    </ul>`);

  let tot = [0, 0, 0, 0];
  const meals = MEALS.map((m) => `<h4>${esc(m.name)}</h4><div class="tbl-wrap"><table class="tbl"><tbody>${m.items
    .map((it) => {
      tot = tot.map((v, i) => v + it[2 + i]);
      return `<tr><td>${esc(it[0])}<div class="faint small">albo: ${esc(it[1])}</div></td><td class="n">${it[2]} kcal<div class="faint small">B ${it[3]}, T ${it[4]}, W ${it[5]}</div></td></tr>`;
    })
    .join('')}</tbody></table></div>`).join('');
  html += acc('jadlospis', 'Jadłospis', 'Przykładowy dzień treningowy, bez ryb', `
    <p>Gramatury suchych produktów przed gotowaniem. W dzień wolny zmniejsz ryż i makaron mniej więcej o połowę porcji.</p>
    ${meals}
    <div class="callout">Razem: <b>${tot[0]} kcal</b>, białko ${tot[1]} g, tłuszcze ${tot[2]} g, węgle ${tot[3]} g. Twój cel w dzień treningowy: ${fmt(n.trn, 0)} kcal, ${n.protein} g, ${n.fat} g, ${n.carbTrn} g.</div>
    <h4>Proste zasady</h4>
    <ul>
      <li>Meal prep 2× w tygodniu: upiecz 1–1,2 kg kurczaka (200°C, 20–25 min), ugotuj ryż na 3 dni.</li>
      <li>Mielone z passatą, czosnkiem i oregano to sos na 2–3 kolacje.</li>
      <li>Za ryby: orzechy włoskie, siemię lniane i omega-3 w kapsułkach.</li>
      <li>Woda 3–3,5 l dziennie. Słodkie napoje zamień na wersje zero.</li>
    </ul>`);

  html += acc('progresja', 'Progresja', 'Jak podnosić ciężary w ćwiczeniach pomocniczych', `
    <h4>RPE, czyli ile zostało w zapasie</h4>
    <div class="tbl-wrap"><table class="tbl"><tbody>
      <tr><td class="n"><b>7</b></td><td>3 powtórzenia zapasu. Pracujesz spokojnie, technika idealna.</td></tr>
      <tr><td class="n"><b>8</b></td><td>2 w zapasie. Ostatnie powtórzenia wyraźnie wolniejsze. Główny zakres planu.</td></tr>
      <tr><td class="n"><b>9</b></td><td>1 w zapasie. Tylko tydzień 6–7 na bojach głównych.</td></tr>
      <tr><td class="n"><b>10</b></td><td>Upadek. Tylko ostatnia seria izolacji: wznosy, ramiona, łydki.</td></tr>
    </tbody></table></div>
    <h4>Podwójna progresja</h4>
    <ul>
      <li>Ten sam ciężar, dokładasz powtórzenia, np. 8, 7, 7, 6, a potem 8, 8, 7, 7.</li>
      <li>Wszystkie serie na górnej granicy przy RPE 8 lub lżej: następnym razem więcej kg.</li>
      <li>Po dołożeniu ciężaru powtórzenia spadają. To normalne, znowu je dokładasz.</li>
    </ul>
    <h4>Ile dokładać</h4>
    <div class="tbl-wrap"><table class="tbl"><tbody>
      <tr><td>Sztanga, nogi (RDL, hip thrust)</td><td class="n">+5 kg</td></tr>
      <tr><td>Sztanga, góra (wiosłowanie, łamana)</td><td class="n">+2,5 kg</td></tr>
      <tr><td>Hantle</td><td class="n">następna para</td></tr>
      <tr><td>Wyciągi, maszyny</td><td class="n">+1 płytka</td></tr>
      <tr><td>Suwnica</td><td class="n">+10 kg</td></tr>
      <tr><td>Podciąganie, dipy</td><td class="n">+2,5 kg na pasie</td></tr>
    </tbody></table></div>
    <h4>8 tygodni</h4>
    <ul>
      <li><b>T1</b> kalibracja: dobierz ciężary pomocniczych na RPE 7.</li>
      <li><b>T2–T4</b> akumulacja: 4×6 do 4×5 na bojach głównych.</li>
      <li><b>T5–T6</b> intensyfikacja: 5×4 i 4×4.</li>
      <li><b>T7</b> szczyt: 3×3 przy RPE 9. W pomocniczych utrzymaj ciężary.</li>
      <li><b>T8</b> deload: 60% na bojach, 2 serie w pomocniczych.</li>
    </ul>
    <h4>Zamienniki</h4>
    <div class="tbl-wrap"><table class="tbl"><tbody>
      <tr><td>Wiosłowanie sztangą</td><td>maszyna z podparciem klatki, T-bar</td></tr>
      <tr><td>Hantle na skosie</td><td>sztanga na skosie 3×6–8, maszyna</td></tr>
      <tr><td>Wykroki chodzone</td><td>przysiad bułgarski, wykroki w tył</td></tr>
      <tr><td>Dipy</td><td>wyciskanie wąsko 3×8, maszyna do dipów</td></tr>
      <tr><td>Podciąganie</td><td>ściąganie podchwytem, ściąganie jednorącz</td></tr>
      <tr><td>Suwnica</td><td>hack squat, przysiad przedni 3×6–8</td></tr>
      <tr><td>Hip thrust</td><td>maszyna do hip thrust, pull-through</td></tr>
    </tbody></table></div>
    <h4>Siła stoi</h4>
    <ul>
      <li>2 treningi bez postępu: sprawdź sen i białko.</li>
      <li>3 treningi: −10% ciężaru i odbuduj w 2–3 tygodnie albo użyj zamiennika.</li>
      <li>Na lekkim deficycie utrzymanie siły przy spadającej talii to też dobry wynik.</li>
    </ul>`);

  html += acc('boczki', 'Boczki, kroki i cardio', '8–10 tys. kroków dziennie', `
    <h4>Prawda o boczkach</h4>
    <ul>
      <li>Ćwiczenia na brzuch nie spalają boczków. Tłuszcz schodzi z całego ciała, u mężczyzn z boczków zwykle na końcu.</li>
      <li>Działają: lekki deficyt utrzymany też w weekendy, kroki, białko, sen i mniej alkoholu.</li>
      <li>Pallof press i spacer z hantlem wzmacniają talię. Unikaj ciężkich skłonów bocznych, bo mogą ją poszerzyć.</li>
      <li>Szerokie barki i plecy optycznie zwężają talię. Stąd dużo wznosów i ściągań w planie.</li>
    </ul>
    <h4>Kroki</h4>
    <ul>
      <li>Cel: 8–10 tys. dziennie, liczy się średnia tygodniowa.</li>
      <li>Talia stoi 4 tygodnie: +2000 kroków, zanim zabierzesz kalorie.</li>
    </ul>
    <h4>Zamienniki 10 tys. kroków (ok. 400 kcal)</h4>
    <div class="tbl-wrap"><table class="tbl"><tbody>
      <tr><td>Rower na dworze, spokojnie</td><td class="n">50–60 min</td></tr>
      <tr><td>Rower stacjonarny</td><td class="n">40–45 min</td></tr>
      <tr><td>Bieżnia pod górę, 8–12%, 5 km/h</td><td class="n">40–45 min</td></tr>
      <tr><td>Orbitrek</td><td class="n">35–45 min</td></tr>
      <tr><td>Wioślarz</td><td class="n">30–35 min</td></tr>
    </tbody></table></div>
    <h4>Cardio na siłowni</h4>
    <ul>
      <li>Nieobowiązkowe, jeśli robisz kroki. Opcjonalnie 2× w tygodniu po 20 min.</li>
      <li>Po treningu Upper albo w dzień wolny, nie przed nogami.</li>
      <li>Spokojne tempo, tętno ok. 120–140 uderzeń na minutę. Interwały max 1× w tygodniu po 10–15 min.</li>
    </ul>`);

  html += acc('suple', 'Suplementacja', 'Kreatyna, D3, omega-3, białko', `
    <div class="tbl-wrap"><table class="tbl"><tbody>
      <tr><td><b>Kreatyna</b></td><td>5 g dziennie, także w dni wolne. Już bierzesz, zostaw.</td></tr>
      <tr><td><b>Odżywka białkowa</b></td><td>1–2 porcje, gdy brakuje do ok. 200 g białka.</td></tr>
      <tr><td><b>Witamina D3</b></td><td>2000–4000 IU rano z posiłkiem. Od listopada do kwietnia niedobory są bardzo częste.</td></tr>
      <tr><td><b>Omega-3</b></td><td>1–2 g EPA i DHA z posiłkiem, bo nie jesz ryb.</td></tr>
      <tr><td>Kofeina</td><td>Opcjonalnie 100–200 mg 30 min przed treningiem, nie po 15:00.</td></tr>
      <tr><td>Magnez</td><td>Opcjonalnie 200–400 mg wieczorem.</td></tr>
    </tbody></table></div>
    <p>Nie kupuj: spalaczy tłuszczu, BCAA, boosterów testosteronu, L-karnityny ani glutaminy.</p>`);

  const ck = st.clock;
  html += acc('zegar', 'Timer w Zegarze', ck.mode === 'off' ? 'Wyłączony' : ck.mode === 'auto' ? 'Uruchamia się sam po serii' : 'Przycisk przy timerze', `
    <p>Strona nie może pokazać się w Dynamic Island, ale systemowy minutnik tak. Aplikacja uruchamia go przez skrót z aplikacji Skróty. Minutnik zadzwoni także przy zablokowanym telefonie.</p>
    <label class="lbl" for="c-mode">Kiedy uruchamiać minutnik</label>
    <select id="c-mode" class="field" data-clock="mode">
      ${[['off', 'Nigdy'], ['button', 'Po stuknięciu przycisku ⏱ przy timerze'], ['auto', 'Sam, po każdej odhaczonej serii']]
        .map(([v, l]) => `<option value="${v}" ${ck.mode === v ? 'selected' : ''}>${l}</option>`).join('')}
    </select>
    <label class="lbl" for="c-name">Nazwa skrótu</label>
    <input id="c-name" class="field" data-clock="name" value="${esc(ck.name)}" autocapitalize="off" autocomplete="off">
    <h4>Jak zrobić skrót (raz, ok. 1 minuty)</h4>
    <ol>
      <li>Otwórz aplikację <b>Skróty</b> i stuknij <b>+</b>.</li>
      <li>Dodaj akcję <b>Pobierz liczby z danych wejściowych</b>.</li>
      <li>Dodaj akcję <b>Uruchom minutnik</b>. Stuknij w czas, wybierz zmienną <b>Liczby</b> i jednostkę <b>sekundy</b>.</li>
      <li>Nazwij skrót dokładnie tak jak wyżej (<b>${esc(ck.name || 'Przerwa')}</b>) i zapisz.</li>
    </ol>
    <button class="btn" data-action="clock-test">Test: minutnik na 10 s</button>
    <p class="small faint">Po uruchomieniu na chwilę otworzą się Skróty. Wróć gestem lub stuknij „Siłownia” w lewym górnym rogu. Timer w aplikacji liczy dalej.</p>`);

  html += acc('dane', 'Kopia zapasowa', 'Dane są tylko na tym urządzeniu', `
    <p>Treningi i pomiary zapisują się w pamięci tej przeglądarki na tym telefonie. Nie trafiają na żaden serwer.</p>
    <div class="callout warn">Na iPhonie aplikacja dodana do ekranu początkowego ma osobną pamięć niż Safari. Rób kopię co kilka tygodni i przed zmianą telefonu.</div>
    <div class="row wrap" style="margin-top:12px">
      <button class="btn" data-action="export">Pobierz kopię (JSON)</button>
      <button class="btn" data-action="import">Wczytaj kopię</button>
    </div>
    <input type="file" id="import-file" accept="application/json,.json" hidden>
    <p class="small faint">Zapisanych treningów: ${state.workouts.length}, pomiarów: ${state.measurements.length}.</p>
    <button class="btn btn-danger" style="margin-top:8px" data-action="reset-all">Usuń wszystkie dane</button>`);

  return html;
}

/* ------------------------------ Wykresy ------------------------------ */

function lineChart(pts, unit = '', decimals = 1) {
  if (pts.length < 2) {
    return `<p class="muted small" style="margin:12px 0 0">${pts.length ? `Jeden wpis: ${fmt(pts[0].v, decimals)} ${unit}. Wykres pojawi się po drugim.` : 'Brak danych. Wykres pojawi się po dwóch wpisach.'}</p>`;
  }
  const W = 340, H = 170, L = 36, R = 14, T = 16, B = 26;
  const vs = pts.map((p) => p.v);
  let min = Math.min(...vs), max = Math.max(...vs);
  if (min === max) { min -= 1; max += 1; }
  const pad = (max - min) * 0.12;
  min -= pad; max += pad;
  const x = (i) => L + (i * (W - L - R)) / (pts.length - 1);
  const y = (v) => T + ((max - v) * (H - T - B)) / (max - min);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
  const gid = `g${Math.random().toString(36).slice(2, 8)}`;
  const area = `${line} L${x(pts.length - 1).toFixed(1)},${H - B} L${x(0).toFixed(1)},${H - B} Z`;
  const bestV = Math.max(...vs);
  const lastI = pts.length - 1;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Wykres: od ${fmt(pts[0].v, decimals)} do ${fmt(pts[lastI].v, decimals)} ${unit}">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--blue)" stop-opacity="0.35"/><stop offset="1" stop-color="var(--blue)" stop-opacity="0"/></linearGradient></defs>
    <line class="axis" x1="${L}" y1="${H - B}" x2="${W - R}" y2="${H - B}"/>
    <text x="${L - 6}" y="${y(max - pad) + 4}" text-anchor="end">${fmt(max - pad, decimals)}</text>
    <text x="${L - 6}" y="${y(min + pad) + 4}" text-anchor="end">${fmt(min + pad, decimals)}</text>
    <path d="${area}" fill="url(#${gid})"/>
    <path class="line" d="${line}"/>
    ${pts.map((p, i) => `<circle class="dot ${p.v === bestV && unit === 'kg' && i === vs.indexOf(bestV) ? 'best' : ''}" cx="${x(i).toFixed(1)}" cy="${y(p.v).toFixed(1)}" r="${i === lastI ? 5 : 3.5}"/>`).join('')}
    <text x="${x(0)}" y="${H - 8}" text-anchor="start">${esc(pts[0].label)}</text>
    <text x="${x(lastI)}" y="${H - 8}" text-anchor="end">${esc(pts[lastI].label)}</text>
  </svg>`;
}

function barChart(pts) {
  if (!pts.length) return '<p class="muted small" style="margin:12px 0 0">Brak treningów.</p>';
  const W = 340, H = 150, L = 6, R = 6, T = 14, B = 22;
  const max = Math.max(...pts.map((p) => p.v), 1);
  const bw = (W - L - R) / pts.length;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Tonaż ostatnich treningów">
    ${pts.map((p, i) => {
      const h = ((H - T - B) * p.v) / max;
      const x = L + i * bw + bw * 0.18;
      return `<rect class="bar" x="${x.toFixed(1)}" y="${(H - B - h).toFixed(1)}" width="${(bw * 0.64).toFixed(1)}" height="${Math.max(h, 1).toFixed(1)}" rx="5"/>
        <text x="${(x + bw * 0.32).toFixed(1)}" y="${H - 6}" text-anchor="middle">${esc(p.label)}</text>`;
    }).join('')}
  </svg>`;
}

/* ------------------------------ Sheet / toast / timer ----------------- */

function openSheet(html) {
  $('#sheet-body').innerHTML = html;
  $('#sheet').hidden = false;
  document.body.style.overflow = 'hidden';
  setTimeout(() => $('#sheet .sheet').focus?.(), 50);
}
function closeSheet() {
  $('#sheet').hidden = true;
  $('#sheet-body').innerHTML = '';
  document.body.style.overflow = '';
}

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
}

/* Timer przerwy. Stan siedzi w state.timer, więc przeżyje zminimalizowanie
   i ubicie aplikacji przez iOS: liczymy od godziny końca, nie od ticków. */
const timer = { iv: null, html: '' };

function startTimer(seconds, label) {
  if (!seconds) return;
  state.timer = { end: Date.now() + seconds * 1000, total: seconds, label, finishedAt: 0 };
  saveNow();
  primeAudio();
  runTimer();
  if (state.settings.clock.mode === 'auto') launchClock(seconds);
}
function runTimer() {
  clearInterval(timer.iv);
  timer.iv = setInterval(tickTimer, 250);
  tickTimer();
  syncWakeLock();
}
function stopTimer() {
  clearInterval(timer.iv);
  timer.iv = null;
  timer.html = '';
  if (state.timer) { state.timer = null; saveNow(); }
  $('#timer').hidden = true;
  syncWakeLock();
}
const mmss = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
const clockBtn = () => (state.settings.clock.mode === 'off' ? '' : `<button class="btn btn-icon" data-action="timer-clock" aria-label="Uruchom minutnik w Zegarze">
  <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9.5 2.5h5"/></svg></button>`);
function tickTimer() {
  const t = state.timer;
  if (!t) return stopTimer();
  const el = $('#timer');
  const left = Math.ceil((t.end - Date.now()) / 1000);
  let html;
  if (left <= 0) {
    if (!t.finishedAt) {
      t.finishedAt = Date.now();
      saveSoon();
      // sygnał tylko, gdy koniec przerwy dzieje się teraz, a nie kiedy wracasz po kwadransie
      if (Date.now() - t.end < 10000) restOverAlert();
    }
    const over = Math.floor((Date.now() - t.end) / 1000);
    el.className = 'timer glass finished';
    html = `<span class="t-time">0:00</span><span class="grow"><b>Czas na serię</b><span class="t-label t-over">${over >= 5 ? `+${mmss(over)} po przerwie` : esc(t.label)}</span></span>
      <button class="btn btn-primary" data-action="timer-skip">OK</button>`;
  } else {
    el.className = 'timer glass';
    html = `<span class="t-time">${mmss(left)}</span><span class="grow t-label">Przerwa</span>
      ${clockBtn()}
      <button class="btn" data-action="timer-add" aria-label="Dodaj 15 sekund">+15 s</button>
      <button class="btn" data-action="timer-skip">Pomiń</button>`;
  }
  // przepisujemy tylko przy zmianie, żeby nie podmieniać przycisku pod palcem
  if (html !== timer.html) { el.innerHTML = html; timer.html = html; }
  el.hidden = false;
}

// Skrót „Przerwa” w aplikacji Skróty uruchamia systemowy minutnik (Dynamic Island, ekran blokady).
function launchClock(seconds) {
  const name = state.settings.clock.name.trim() || 'Przerwa';
  location.href = `shortcuts://run-shortcut?name=${encodeURIComponent(name)}&input=text&text=${Math.max(1, Math.round(seconds))}`;
}

/* Dźwięk i haptyka. Safari na iOS nie ma navigator.vibrate, ale od iOS 18
   kliknięcie w przełącznik <input switch> daje systemowy „tik”. */
let audioCtx = null;
function primeAudio() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state !== 'running') audioCtx.resume();
  } catch (e) { audioCtx = null; }
}
function beep(at, freq) {
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'sine';
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(0.35, at + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.28);
  o.connect(g).connect(audioCtx.destination);
  o.start(at);
  o.stop(at + 0.3);
}
function haptic() {
  if (navigator.vibrate) { try { navigator.vibrate(40); } catch (e) { /* brak wibracji */ } return; }
  $('#haptic')?.click();
}
function restOverAlert() {
  if (navigator.vibrate) { try { navigator.vibrate([220, 120, 220, 120, 220]); } catch (e) { /* brak */ } }
  else [0, 180, 360].forEach((ms) => setTimeout(haptic, ms));
  try {
    if (audioCtx) {
      audioCtx.resume();
      const now = audioCtx.currentTime + 0.05;
      beep(now, 880); beep(now + 0.32, 880); beep(now + 0.64, 1175);
    }
  } catch (e) { /* bez dźwięku */ }
}

// Ekran nie gaśnie, gdy leci przerwa albo trwa rozpoczęty trening.
let wakeLock = null;
async function syncWakeLock() {
  const want = document.visibilityState === 'visible'
    && (!!state.timer || (ui.tab === 'trening' && Object.values(state.drafts).some((d) => d?.touched)));
  try {
    if (want && !wakeLock && navigator.wakeLock) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } else if (!want && wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch (e) { wakeLock = null; }
}

/* ------------------------------ Akcje -------------------------------- */

function setByPath(obj, path, value) {
  const keys = path.split('.');
  let o = obj;
  for (let i = 0; i < keys.length - 1; i++) o = o[keys[i]];
  o[keys[keys.length - 1]] = value;
}

function saveWorkout() {
  const d = state.drafts[ui.session];
  if (!d) return;
  const s = SESSION_BY_ID[ui.session];
  const entries = [];
  for (const ex of s.ex) {
    const e = d.entries[ex.id];
    if (!e) continue;
    const sets = e.sets
      .map((x) => ({ kg: toNum(x.kg) ?? 0, reps: toNum(x.reps) ?? 0 }))
      .filter((x) => x.reps > 0);
    if (sets.length) entries.push({ exId: ex.id, name: ex.name, sets, rpe: e.rpe || '', note: (e.note || '').trim() });
  }
  if (!entries.length) {
    toast('Wpisz powtórzenia w co najmniej jednej serii');
    return;
  }
  // rekordy na bojach głównych
  const prs = [];
  for (const e of entries) {
    const ex = EX_BY_ID[e.exId];
    if (!ex.main) continue;
    const prev = liftHistory(ex.main).reduce((m, p) => Math.max(m, p.v), liftE1RM(ex.main));
    const now = entryBest(e);
    if (now > prev + 0.05) prs.push(`${LIFTS[ex.main].short}: szacowany maks ${fmt(now)} kg`);
  }
  const w = { id: uid(), date: d.date || todayISO(), week: d.week, session: ui.session, entries, createdAt: Date.now() };
  state.workouts.push(w);
  delete state.drafts[ui.session];
  stopTimer();
  const doneSession = s.name;
  ui.session = nextSessionId();
  ui.week = currentWeek().week;
  saveNow();
  render();
  window.scrollTo({ top: 0 });
  openSheet(`<h2 id="sheet-title">Zapisano ${esc(doneSession)}</h2>
    <p class="muted">Tonaż ${fmt(workoutTonnage(w), 0)} kg, ${entries.length} ${plural(entries.length, 'ćwiczenie', 'ćwiczenia', 'ćwiczeń')}.</p>
    ${prs.length ? `<div class="callout good"><b>Nowy rekord.</b> ${esc(prs.join(', '))}.</div>` : ''}
    <p class="muted">Następny trening: <b>${esc(SESSION_BY_ID[ui.session].name)}</b>.</p>
    <button class="btn btn-primary btn-block" data-action="close-sheet">Gotowe</button>`);
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const name = `silownia-kopia-${todayISO()}.json`;
  const file = typeof File === 'function' ? new File([blob], name, { type: 'application/json' }) : null;
  if (file && navigator.canShare?.({ files: [file] }) && /iPhone|iPad|Android/i.test(navigator.userAgent)) {
    navigator.share({ files: [file], title: 'Kopia danych Siłownia' }).catch(() => {});
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  toast('Kopia pobrana');
}

function importData(file) {
  const r = new FileReader();
  r.onload = () => {
    try {
      const data = JSON.parse(r.result);
      if (!data || !Array.isArray(data.workouts) || !Array.isArray(data.measurements)) throw new Error('format');
      if (!confirm(`Wczytać kopię? Zastąpi obecne dane (${data.workouts.length} treningów, ${data.measurements.length} pomiarów w kopii).`)) return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      state = loadState();
      ui.session = null; ui.week = null;
      render();
      toast('Kopia wczytana');
    } catch (e) {
      toast('To nie jest plik kopii z tej aplikacji');
    }
  };
  r.readAsText(file);
}

function onClick(e) {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const a = el.dataset.action;
  const v = el.dataset.value;
  switch (a) {
    case 'goto': location.hash = v; break;
    case 'set-session': ui.session = v; ui.week = state.drafts[v]?.touched ? state.drafts[v].week : ui.week; render(); break;
    case 'set-week': ui.week = Number(v); changeDraftWeek(ui.session, ui.week); saveSoon(); render(); break;
    case 'toggle-done': {
      const d = state.drafts[ui.session];
      const set = d.entries[el.dataset.ex].sets[Number(el.dataset.i)];
      set.done = !set.done;
      d.touched = true;
      haptic();
      if (set.done) {
        const row = el.closest('.set-row');
        const repsInput = row.querySelector('[data-k="reps"]');
        if (!set.reps && repsInput.placeholder) set.reps = repsInput.placeholder;
        const ex = EX_BY_ID[el.dataset.ex];
        startTimer(ex.rest, ex.name);
      }
      saveSoon();
      render();
      break;
    }
    case 'add-set': {
      const d = state.drafts[ui.session];
      const sets = d.entries[el.dataset.ex].sets;
      const last = sets[sets.length - 1];
      sets.push({ kg: last ? last.kg : '', reps: '', done: false });
      d.touched = true;
      saveSoon(); render(); break;
    }
    case 'remove-set': {
      const d = state.drafts[ui.session];
      const sets = d.entries[el.dataset.ex].sets;
      if (sets.length > 1) sets.pop();
      d.touched = true;
      saveSoon(); render(); break;
    }
    case 'save-workout': saveWorkout(); break;
    case 'reset-draft':
      if (confirm('Wyczyścić wszystkie wpisy w tym treningu?')) {
        state.drafts[ui.session] = buildDraft(ui.session, ui.week);
        saveNow(); render();
      }
      break;
    case 'open-workout': workoutSheet(el.dataset.id); break;
    case 'delete-workout':
      if (confirm('Usunąć ten trening? Tego nie da się cofnąć.')) {
        state.workouts = state.workouts.filter((w) => w.id !== el.dataset.id);
        saveNow(); closeSheet(); render(); toast('Trening usunięty');
      }
      break;
    case 'set-lift': ui.lift = v; render(); break;
    case 'set-metric': ui.metric = v; render(); break;
    case 'add-measure': measureForm(null); break;
    case 'open-measure': measureForm(state.measurements.find((m) => m.id === el.dataset.id)); break;
    case 'delete-measure':
      if (confirm('Usunąć ten pomiar?')) {
        state.measurements = state.measurements.filter((m) => m.id !== el.dataset.id);
        saveNow(); closeSheet(); render(); toast('Pomiar usunięty');
      }
      break;
    case 'new-cycle':
      if (confirm('Zacząć nowy cykl od dziś? Tydzień wróci do 1. Historia zostaje.')) {
        state.settings.startDate = todayISO();
        state.drafts = {};
        ui.week = 1;
        saveNow(); render(); toast('Nowy cykl od dziś');
      }
      break;
    case 'export': exportData(); break;
    case 'import': $('#import-file').click(); break;
    case 'reset-all':
      if (confirm('Usunąć wszystkie treningi, pomiary i ustawienia?') && confirm('Na pewno? Bez kopii tych danych nie da się odzyskać.')) {
        localStorage.removeItem(STORAGE_KEY);
        state = loadState();
        ui.session = null; ui.week = null;
        render(); toast('Dane usunięte');
      }
      break;
    case 'close-sheet': closeSheet(); break;
    case 'timer-add':
      if (state.timer) { state.timer.end += 15000; state.timer.finishedAt = 0; saveSoon(); tickTimer(); }
      break;
    case 'timer-clock':
      if (state.timer) launchClock((state.timer.end - Date.now()) / 1000);
      break;
    case 'clock-test': launchClock(10); break;
    case 'timer-skip': stopTimer(); break;
    default: break;
  }
}

function onInput(e) {
  const t = e.target;
  if (t.dataset.k && ui.tab === 'trening') {
    const d = state.drafts[ui.session];
    if (!d) return;
    if (t.dataset.k === 'date') d.date = t.value;
    else if (t.dataset.k === 'rpe' || t.dataset.k === 'note') d.entries[t.dataset.ex][t.dataset.k] = t.value;
    else {
      const sets = d.entries[t.dataset.ex].sets;
      const i = Number(t.dataset.i);
      sets[i][t.dataset.k] = t.value;
      if (t.dataset.k === 'kg') {
        // ten sam ciężar w kolejnych, jeszcze pustych seriach
        for (let j = i + 1; j < sets.length; j++) {
          if (sets[j].reps || sets[j].done || (sets[j].kg && !sets[j].auto)) break;
          sets[j].kg = t.value;
          sets[j].auto = true;
          const inp = document.querySelector(`input[data-ex="${t.dataset.ex}"][data-i="${j}"][data-k="kg"]`);
          if (inp) inp.value = t.value;
        }
        delete sets[i].auto;
      }
    }
    d.touched = true;
    saveSoon();
  }
}

function onChange(e) {
  const t = e.target;
  if (t.dataset.clock) {
    state.settings.clock[t.dataset.clock] = t.value;
    saveNow();
    render();
    if (state.timer) { timer.html = ''; tickTimer(); }
    return;
  }
  if (t.id === 'import-file' && t.files?.[0]) {
    importData(t.files[0]);
    t.value = '';
    return;
  }
  if (t.dataset.setting) {
    const path = t.dataset.setting;
    if (path === 'startDate') {
      if (!t.value) return;
      setByPath(state.settings, path, t.value);
      ui.week = null;
    } else {
      const n = toNum(t.value);
      if (n == null) { toast('Wpisz liczbę'); render(); return; }
      setByPath(state.settings, path, n);
      // szkice bez wpisów przeliczą się z nowymi ciężarami
      for (const id of Object.keys(state.drafts)) if (!state.drafts[id].touched) delete state.drafts[id];
    }
    saveNow();
    render();
  }
}

function onSubmit(e) {
  if (e.target.id !== 'measure-form') return;
  e.preventDefault();
  const fd = new FormData(e.target);
  const id = e.target.dataset.id;
  const m = { id: id || uid(), date: fd.get('date') || todayISO(), note: String(fd.get('note') || '').trim() };
  let any = false;
  for (const k of Object.keys(METRICS)) {
    const v = toNum(fd.get(k));
    m[k] = v;
    if (v != null) any = true;
  }
  if (!any) { toast('Wpisz co najmniej jeden pomiar'); return; }
  if (id) state.measurements = state.measurements.map((x) => (x.id === id ? m : x));
  else state.measurements.push(m);
  saveNow();
  closeSheet();
  render();
  toast(id ? 'Pomiar zaktualizowany' : 'Pomiar zapisany');
}

/* ------------------------------ Start -------------------------------- */

function route() {
  const tab = (location.hash || '#trening').slice(1);
  ui.tab = ['trening', 'historia', 'postep', 'pomiary', 'plan'].includes(tab) ? tab : 'trening';
  closeSheet();
  render();
  window.scrollTo({ top: 0 });
}

document.addEventListener('click', onClick);
document.addEventListener('input', onInput);
document.addEventListener('change', onChange);
document.addEventListener('submit', onSubmit);
document.addEventListener('toggle', (e) => {
  const d = e.target;
  if (d.matches?.('details[data-acc]')) {
    if (d.open) ui.open.add(d.dataset.acc);
    else ui.open.delete(d.dataset.acc);
  }
}, true);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#sheet').hidden) closeSheet(); });
document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => {
  if (location.hash === `#${t.dataset.tab}`) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
  location.hash = t.dataset.tab;
}));
window.addEventListener('hashchange', route);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') { saveNow(); return; }
  // po powrocie od razu właściwy czas (iOS wstrzymuje JS w tle) i ponowna blokada wygaszania
  if (state.timer) tickTimer();
  syncWakeLock();
});
window.addEventListener('pagehide', saveNow);

if (!localStorage.getItem(STORAGE_KEY)) saveNow();
navigator.storage?.persist?.().catch(() => {});
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
route();
// timer sprzed zamknięcia aplikacji; skończony ponad 15 min temu już nikomu się nie przyda
if (state.timer && Date.now() - state.timer.end < 15 * 60000) runTimer();
else if (state.timer) stopTimer();
