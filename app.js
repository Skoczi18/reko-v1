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
      { id: 'ua1', bar: true, name: 'Wyciskanie sztangi na ławce płaskiej', main: 'bench', rest: 180, tip: 'Łopatki ściągnięte, nogi wbite w podłogę, sztanga do dolnej części klatki.' },
      { id: 'ua2', bar: true, name: 'Wiosłowanie sztangą w opadzie', sets: '4×6–8', rest: 120, start: '70–80 kg', tip: 'Tułów ok. 45°, ciągnij do pępka, bez szarpania biodrami.' },
      { id: 'ua3', inc: 2, name: 'Wyciskanie hantli na skosie 30°', sets: '3×8–10', rest: 120, start: '30–34 kg / rękę', tip: 'Pełny zakres, łokcie ok. 45° od tułowia.' },
      { id: 'ua4', name: 'Ściąganie drążka wyciągu szeroko', sets: '3×8–10', rest: 90, start: '60–70 kg', tip: 'Do górnej części klatki, łokcie w dół i do tyłu.' },
      { id: 'ua5', inc: 1.25, name: 'Wznosy bokiem na wyciągu jednorącz', sets: '3×12–15', rest: 60, start: '5–7,5 kg', tip: 'Napięcie przez cały ruch. Szersze barki optycznie zwężają talię.' },
      { id: 'ua6', name: 'Uginanie sztangi łamanej', sets: '3×8–10', rest: 0, ss: true, start: '30–35 kg', tip: 'Superseria z następnym ćwiczeniem. Bez bujania.' },
      { id: 'ua7', name: 'Wyciskanie francuskie sztangą łamaną', sets: '3×8–10', rest: 75, start: '30–35 kg', tip: 'Opuszczaj za głowę, łokcie stabilne.' },
    ],
  },
  {
    id: 'LA', name: 'Lower A', day: 'Wt', focus: 'Siła: przysiad i core',
    ex: [
      { id: 'la1', bar: true, name: 'Przysiad ze sztangą', main: 'squat', rest: 180, tip: 'Głębokość min. do równoległej, brzuch napięty przed zejściem.' },
      { id: 'la2', bar: true, name: 'Rumuński martwy ciąg', sets: '3×8', rest: 120, start: '90–100 kg', tip: 'Biodra do tyłu, sztanga blisko nóg, plecy proste.' },
      { id: 'la3', inc: 2, name: 'Wykroki chodzone z hantlami', sets: '3×10 / nogę', rest: 90, start: '20–24 kg / rękę', tip: 'Długi krok, tułów prosto.' },
      { id: 'la4', name: 'Prostowanie nóg na maszynie', sets: '3×12–15', rest: 60, start: 'dobierz', tip: 'Pauza 1 s na górze.' },
      { id: 'la5', name: 'Wspięcia na palce stojąc', sets: '4×10–12', rest: 60, start: 'dobierz', tip: 'Pełne rozciągnięcie na dole, pauza na górze.' },
      { id: 'la6', name: 'Ab wheel (kółko) z kolan', sets: '3×8–12', rest: 60, start: 'ciało', tip: 'Wracasz brzuchem, nie biodrami. Lędźwia nie wyginają się.' },
      { id: 'la7', name: 'Pallof press na wyciągu', sets: '3×10 / str.', rest: 45, start: '15–20 kg', tip: 'Skośne brzucha: nie daj się obrócić.' },
    ],
  },
  {
    id: 'UB', name: 'Upper B', day: 'Czw', focus: 'Barki i plecy w pionie, więcej objętości',
    ex: [
      { id: 'ub1', bar: true, name: 'Wyciskanie żołnierskie stojąc (OHP)', main: 'ohp', rest: 150, tip: 'Pośladki i brzuch spięte, głowa do przodu, gdy sztanga minie twarz.' },
      { id: 'ub2', name: 'Podciąganie nachwytem', sets: '4×6–10', rest: 120, start: 'ciało / guma', tip: '4×10 czystych powtórzeń, potem +2,5 kg na pasie.' },
      { id: 'ub3', name: 'Dipy na poręczach', sets: '3×8–10', rest: 90, start: 'ciało', tip: 'Lekko pochylony tułów = więcej klatki.' },
      { id: 'ub4', inc: 2, name: 'Wiosłowanie hantlem jednorącz', sets: '3×8–10 / str.', rest: 90, start: '36–40 kg', tip: 'Łokieć blisko ciała, ciągnij do biodra.' },
      { id: 'ub5', inc: 1, name: 'Wznosy bokiem hantlami', sets: '3×12–15', rest: 60, start: '10–12 kg', tip: 'Ostatnia seria: dropset −30% do upadku.' },
      { id: 'ub6', name: 'Face pull na linie', sets: '2×15', rest: 60, start: '20–25 kg', tip: 'Ciągnij do twarzy, łokcie wysoko.' },
      { id: 'ub7', inc: 2, name: 'Uginanie młotkowe', sets: '2×10–12', rest: 0, ss: true, start: '14–16 kg / rękę', tip: 'Superseria z następnym ćwiczeniem. Kciuki do góry.' },
      { id: 'ub8', name: 'Prostowanie ramion na wyciągu z liną', sets: '2×10–12', rest: 60, start: '25–30 kg', tip: 'Rozciągnij linę na dole.' },
    ],
  },
  {
    id: 'LB', name: 'Lower B', day: 'Pt', focus: 'Sumo, pośladki i tył uda',
    ex: [
      { id: 'lb1', bar: true, name: 'Martwy ciąg sumo', main: 'sumo', rest: 180, tip: 'Kolana na zewnątrz, biodra blisko sztangi, „wypchnij podłogę”.' },
      { id: 'lb2', inc: 5, name: 'Wypychanie nóg na suwnicy', sets: '3×8–10', rest: 120, start: '180–220 kg', tip: 'Pełny zakres, nie odrywaj miednicy, nie blokuj kolan.' },
      { id: 'lb3', bar: true, name: 'Hip thrust ze sztangą', sets: '3×8–10', rest: 90, start: '120–140 kg', tip: 'Pauza 1 s na górze, broda do klatki.' },
      { id: 'lb4', name: 'Uginanie nóg siedząc', sets: '3×10–12', rest: 60, start: 'dobierz', tip: '3 s w dół.' },
      { id: 'lb5', name: 'Wspięcia na palce siedząc', sets: '3×12–15', rest: 60, start: 'dobierz', tip: 'Pełny zakres ruchu.' },
      { id: 'lb6', name: 'Unoszenie nóg w zwisie', sets: '3×10–15', rest: 60, start: 'ciało', tip: 'Zwijaj miednicę, bez bujania.' },
      { id: 'lb7', inc: 2, name: 'Spacer z hantlem w jednej ręce', sets: '3×30 m / str.', rest: 60, start: '28–32 kg', unit: 'm', tip: 'Idź prosto, nie przechylaj się. W polu powtórzeń wpisz metry.' },
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
  down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9.5l6 6 6-6"/></svg>',
  left: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  right: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>',
  clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9.5 2.5h5"/></svg>',
  chart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19.5h16M6.5 16l4-5 3 3 4.5-6"/></svg>',
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
      restFull: true,
      bar: 20,
      plates: [25, 20, 15, 10, 5, 2.5, 1.25],
      remind: { measureDay: 0, measureTime: '08:00', workoutTime: '17:00' },
    },
    workouts: [],
    measurements: [
      { id: 'start', date: '2026-11-03', weight: 106, waist: 96, flanks: 104, chest: 111, thigh: 71, calf: 44, biceps: 40, steps: null, note: 'Start (waga po jedzeniu)' },
    ],
    drafts: {},
    planned: [],
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
        remind: { ...base.settings.remind, ...(s.settings?.remind || {}) },
        pct: Array.isArray(s.settings?.pct) && s.settings.pct.length === 8 ? s.settings.pct : base.settings.pct,
      },
      workouts: Array.isArray(s.workouts) ? s.workouts : [],
      measurements: Array.isArray(s.measurements) ? s.measurements : base.measurements,
      drafts: s.drafts && typeof s.drafts === 'object' ? s.drafts : {},
      planned: Array.isArray(s.planned) ? s.planned : [],
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
  window.onLocalSave?.(); // sync.js wyśle zmiany do chmury
}

// Wywoływane przez sync.js, gdy przyjdą zmiany z innego urządzenia.
const typing = () => document.activeElement?.matches?.('#view input, #view textarea, #view select');
window.applyRemote = (fn) => {
  fn(state);
  saveNow();
  if (typing()) ui.pendingRender = true;
  else render();
};
window.onCloudStatus = () => {
  if (ui.tab !== 'plan') return;
  if (typing()) ui.pendingRender = true;
  else render();
};
document.addEventListener('focusout', () => {
  setTimeout(() => { if (ui.pendingRender && !typing()) { ui.pendingRender = false; render(); } }, 0);
});
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
      const prog = progression(ex, week);
      if (lastKg) kg = week === 8 ? round25(lastKg * 0.7) : prog?.kg ?? lastKg;
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

/* ------------------------- Progresja, talerze, czas ------------------------- */

const SESSION_COLOR = { UA: 'var(--amber)', LA: 'var(--teal)', UB: 'var(--blue)', LB: 'var(--pink)' };
const RPE_DESC = {
  6: 'lekko, 4+ powt. w zapasie', 6.5: 'lekko, 3–4 w zapasie', 7: '3 powt. w zapasie', 7.5: '2–3 w zapasie',
  8: '2 powt. w zapasie', 8.5: '1–2 w zapasie', 9: '1 powt. w zapasie', 9.5: 'może jeszcze jedno', 10: 'do upadku',
};
const rpeDesc = (r) => RPE_DESC[toNum(r)] || '';
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const pad2 = (n) => String(n).padStart(2, '0');
const isoOf = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const roundTo = (x, step) => Math.round(x / step) * step;
const hms = (sec) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h ? `${h}:${pad2(m)}:${pad2(sec % 60)}` : `${m}:${pad2(sec % 60)}`;
};
const durLabel = (sec) => {
  const m = Math.round(sec / 60);
  return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`;
};
const durShort = (sec) => {
  const m = Math.round(sec / 60);
  return m >= 60 ? `${Math.floor(m / 60)}:${pad2(m % 60)} h` : `${m} min`;
};
const setsTxt = (sets, unit = '') => sets.map((x) => `${fmt(x.kg)}×${fmt(x.reps, 0)}${unit}`).join(', ');

// zakres powtórzeń z opisu „3×8–10” albo „2×15”
function repRange(ex) {
  const m = String(ex.sets || '').match(/×\s*(\d+)(?:\s*[–-]\s*(\d+))?/);
  return m ? { min: Number(m[1]), max: Number(m[2] || m[1]) } : null;
}

/* Podwójna progresja z uwzględnieniem trudności (RPE) z ostatniego razu:
   góra zakresu we wszystkich seriach i RPE ≤ 9 → więcej kg, przy RPE ≤ 6,5 podwójny krok;
   góra zakresu przy RPE 9,5–10 → ten sam ciężar; dużo serii poniżej zakresu przy RPE ≥ 9,5 → mniej kg;
   w pozostałych przypadkach ten sam ciężar i +1 powtórzenie. */
function progression(ex, week) {
  const last = lastEntry(ex.id);
  if (!last) return null;
  const e = last.entry;
  const r = toNum(e.rpe);
  const rTxt = r != null ? ` przy RPE ${e.rpe}` : '';
  if (ex.main) {
    if (r == null) return null;
    const t = mainTarget(ex.main, week);
    const tr = toNum(String(t.rpe).split('–').pop());
    if (r <= tr - 1.5) return { kind: 'up', text: `Ostatnio RPE ${e.rpe}, lżej niż zakłada plan. Jeśli dziś też pójdzie lekko, podbij wynik w Planie → Główne boje.` };
    if (r >= tr + 1) return { kind: 'hold', text: `Ostatnio RPE ${e.rpe}, ciężej niż plan (${t.rpe}). Dziś technika i pełny zakres, bez dokładania.` };
    return { kind: 'ok', text: `Ostatnio RPE ${e.rpe}, zgodnie z planem.` };
  }
  const rr = repRange(ex);
  const sets = e.sets.filter((s) => s.reps > 0);
  if (!rr || ex.unit === 'm' || !sets.length || week === 8) return null;
  const kg = Math.max(...sets.map((s) => s.kg || 0));
  const allTop = sets.every((s) => s.reps >= rr.max);
  const below = sets.filter((s) => s.reps < rr.min).length;
  const inc = ex.inc || 2.5;
  if (!kg) {
    if (allTop) return { kind: 'up', text: `${rr.max} powtórzeń w każdej serii${rTxt}. Czas na +2,5 kg na pasie albo trudniejszą wersję.` };
    return { kind: 'reps', text: `Dołóż po powtórzeniu. Cel: ${rr.max} w każdej serii.` };
  }
  if (allTop && (r == null || r <= 9)) {
    const step = r != null && r <= 6.5 ? inc * 2 : inc;
    return { kind: 'up', kg: kg + step, text: `Góra zakresu we wszystkich seriach${rTxt}. Dziś +${fmt(step)} kg, czyli ${fmt(kg + step)} kg.` };
  }
  if (allTop) return { kind: 'hold', kg, text: `Góra zakresu, ale${rTxt}. Zostań przy ${fmt(kg)} kg, aż pójdzie lżej.` };
  if (r != null && r >= 9.5 && below * 2 >= sets.length) {
    const down = Math.max(inc, roundTo(kg * 0.93, inc));
    return { kind: 'down', kg: down, text: `Za mało powtórzeń${rTxt}. Zejdź do ${fmt(down)} kg i wróć w zakres ${rr.min}–${rr.max}.` };
  }
  return { kind: 'reps', kg, text: `Zostań przy ${fmt(kg)} kg i dołóż powtórzenie. Cel: ${rr.max} w każdej serii${r != null && r <= 7 ? ', zapas był spory' : ''}.` };
}
const PROG_ICON = { up: '↑', reps: '+1', hold: '=', down: '↓', ok: '✓' };

// Talerze na stronę: kolor, wysokość (% średnicy), grubość
const PLATE_STYLE = {
  25: ['#e5383b', 100, 17], 20: ['#2f6bff', 94, 15], 15: ['#f4c430', 86, 13], 10: ['#2bb24c', 76, 11],
  5: ['#eceef4', 58, 9], 2.5: ['#c0392b', 46, 8], 1.25: ['#b8bcc8', 38, 7],
};
function platesFor(kg) {
  const bar = state.settings.bar || 20;
  if (!(kg > 0)) return null;
  if (kg < bar) return { bar, side: [], rest: 0, under: true };
  let side = (kg - bar) / 2;
  const out = [];
  for (const p of (state.settings.plates || []).slice().sort((a, b) => b - a)) {
    while (side >= p - 1e-9) { out.push(p); side -= p; }
  }
  return { bar, side: out, rest: Math.round(side * 200) / 100 };
}
function platesHTML(kg, compact = false) {
  const p = platesFor(kg);
  if (!p) return '';
  if (p.under) return `<div class="plates-txt">Mniej niż sama sztanga (${fmt(p.bar)} kg).</div>`;
  const txt = p.side.length ? `Na stronę: <b>${p.side.map((x) => fmt(x, 2)).join(' + ')}</b>` : 'Sama sztanga';
  const vis = compact ? '' : `<div class="plates" aria-hidden="true"><span class="sleeve"></span>${p.side
    .map((x, i) => {
      const [c, h, w] = PLATE_STYLE[x] || ['#999', 50, 8];
      return `<i class="plate" style="--c:${c};--h:${h}%;--w:${w}px;--i:${i}">${w >= 11 ? `<b>${fmt(x, 2)}</b>` : ''}</i>`;
    })
    .join('')}<span class="collar"></span></div>`;
  return `${vis}<div class="plates-txt">${txt}<span class="faint"> · sztanga ${fmt(p.bar)} kg${p.rest ? `, brakuje ${fmt(p.rest, 2)} kg` : ''}</span></div>`;
}

// Kolejna seria po odhaczeniu (z obsługą superserii: po drugim ćwiczeniu wracamy do pierwszego).
function nextSetAfter(sessionId, exId, i) {
  const d = state.drafts[sessionId];
  const s = SESSION_BY_ID[sessionId];
  if (!d || !s) return null;
  const idx = s.ex.findIndex((e) => e.id === exId);
  const free = (ex, j) => d.entries[ex.id]?.sets[j] && !d.entries[ex.id].sets[j].done;
  const prev = s.ex[idx - 1];
  if (prev?.ss && free(prev, i + 1)) return { exId: prev.id, i: i + 1 };
  for (let k = idx; k < s.ex.length; k++) {
    const sets = d.entries[s.ex[k].id]?.sets || [];
    for (let j = k === idx ? i + 1 : 0; j < sets.length; j++) if (!sets[j].done) return { exId: s.ex[k].id, i: j };
  }
  for (const ex of s.ex) {
    const j = (d.entries[ex.id]?.sets || []).findIndex((x) => !x.done);
    if (j >= 0) return { exId: ex.id, i: j };
  }
  return null;
}

// Historia jednego ćwiczenia: najlepsza seria z każdego treningu
function exHistory(exId) {
  const ex = EX_BY_ID[exId];
  const out = [];
  for (const w of sortedWorkouts()) {
    const e = w.entries.find((x) => x.exId === exId);
    if (!e || !e.sets.length) continue;
    const maxKg = Math.max(...e.sets.map((s) => s.kg || 0));
    const maxReps = Math.max(...e.sets.map((s) => s.reps || 0));
    const best = ex?.unit === 'm' ? maxKg : maxKg ? entryBest(e) : maxReps;
    out.push({ date: w.date, wid: w.id, v: Math.round(best * 10) / 10, sets: e.sets, rpe: e.rpe, note: e.note, maxKg });
  }
  return out;
}
const exMetricUnit = (ex, hist) => (ex.unit === 'm' || hist.some((h) => h.maxKg) ? 'kg' : 'powt.');

function sparkline(vals) {
  if (vals.length < 2) return '';
  const W = 56, H = 22;
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = max - min || 1;
  const pts = vals.map((v, i) => `${((i * W) / (vals.length - 1)).toFixed(1)},${(H - 2 - ((v - min) * (H - 4)) / span).toFixed(1)}`).join(' ');
  const up = vals[vals.length - 1] >= vals[0];
  return `<svg class="spark ${up ? 'up' : 'down'}" viewBox="0 0 ${W} ${H}" aria-hidden="true"><polyline points="${pts}"/></svg>`;
}

// licznik czasu trwania treningu (elementy .js-elapsed z data-since)
function updateElapsed() {
  document.querySelectorAll('.js-elapsed').forEach((el) => {
    const t = Number(el.dataset.since);
    if (t) el.textContent = hms(Math.max(0, Math.floor((Date.now() - t) / 1000)));
  });
}
setInterval(updateElapsed, 1000);

function measureDue() {
  const last = sortedMeasures().slice(-1)[0];
  if (!last) return true;
  const since = daysBetween(last.date, todayISO());
  const dow = (new Date().getDay() + 6) % 7;
  return (dow === Number(state.settings.remind.measureDay) && since >= 4) || since >= 8;
}

function todayBanners() {
  const today = todayISO();
  const doneToday = state.workouts.filter((w) => w.date === today).map((w) => w.session);
  let h = '';
  for (const p of state.planned.filter((x) => x.date === today && !doneToday.includes(x.session))) {
    h += `<div class="banner glass" style="--c:${SESSION_COLOR[p.session]}"><span class="banner-dot"></span>
      <div class="grow"><b>Dziś w planie: ${esc(SESSION_BY_ID[p.session]?.name || p.session)}</b><div class="small muted">Z kalendarza w Historii</div></div>
      ${ui.session !== p.session ? `<button class="btn btn-small" data-action="set-session" data-value="${p.session}">Otwórz</button>` : ''}</div>`;
  }
  if (measureDue()) {
    h += `<div class="banner glass" style="--c:var(--teal)"><span class="banner-dot"></span>
      <div class="grow"><b>Czas na cotygodniowy pomiar</b><div class="small muted">Waga, talia i boczki, rano na czczo</div></div>
      <button class="btn btn-small" data-action="measure-now">Dodaj</button></div>`;
  }
  return h;
}

/* ------------------------- Przypomnienia w Kalendarzu (.ics) ------------------------- */

const icsEsc = (s) => String(s).replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');
const icsDate = (iso, time) => `${iso.replace(/-/g, '')}T${String(time || '08:00').replace(':', '')}00`;
function icsDownload(name, events) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const url = location.origin + location.pathname;
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Silownia//PL', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  for (const ev of events) {
    lines.push('BEGIN:VEVENT', `UID:${ev.uid}`, `DTSTAMP:${stamp}`, `DTSTART:${ev.start}`, `DURATION:${ev.dur}`,
      `SUMMARY:${icsEsc(ev.title)}`, `DESCRIPTION:${icsEsc(ev.desc)}`, `URL:${url}${ev.hash || ''}`);
    if (ev.rrule) lines.push(`RRULE:${ev.rrule}`);
    lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsEsc(ev.title)}`, `TRIGGER:${ev.alarm || 'PT0M'}`, 'END:VALARM', 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  const href = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar' }));
  const a = document.createElement('a');
  a.href = href;
  // iPhone: otwarcie pliku pokazuje „Dodaj do Kalendarza”; komputer: zwykłe pobranie
  if (/iPhone|iPad|iPod/.test(navigator.userAgent)) a.target = '_blank';
  else a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(href); a.remove(); }, 8000);
}
function icsMeasure() {
  const r = state.settings.remind;
  const d = new Date();
  const dow = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() + ((Number(r.measureDay) - dow + 7) % 7));
  icsDownload('pomiary.ics', [{
    uid: 'pomiary-co-tydzien@silownia', start: icsDate(isoOf(d), r.measureTime), dur: 'PT10M', rrule: 'FREQ=WEEKLY',
    title: 'Pomiary: waga, talia, boczki', desc: 'Rano, na czczo, po toalecie. Wpisz w aplikacji Siłownia → Pomiary.', hash: '#pomiary',
  }]);
}
function icsPlanned() {
  const today = todayISO();
  const list = state.planned.filter((p) => p.date >= today).sort((a, b) => (a.date < b.date ? -1 : 1));
  if (!list.length) { toast('Brak zaplanowanych treningów. Zaplanuj je w kalendarzu w Historii.'); return; }
  const r = state.settings.remind;
  icsDownload('treningi.ics', list.map((p) => ({
    uid: `${p.id}@silownia`, start: icsDate(p.date, r.workoutTime), dur: 'PT1H30M', alarm: '-PT30M',
    title: `Trening: ${SESSION_BY_ID[p.session]?.name || p.session}`, desc: SESSION_BY_ID[p.session]?.focus || '', hash: '#trening',
  })));
}

/* ------------------------- Zdjęcia sylwetki (IndexedDB, tylko to urządzenie) ------------------------- */

const photos = {
  db: null,
  urls: new Map(),
  list: null,
  open() {
    if (this.db) return Promise.resolve(this.db);
    return new Promise((res, rej) => {
      const r = indexedDB.open('silownia-photos', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('photos', { keyPath: 'id' });
      r.onsuccess = () => { this.db = r.result; res(this.db); };
      r.onerror = () => rej(r.error);
    });
  },
  async tx(mode, fn) {
    const db = await this.open();
    return new Promise((res, rej) => {
      const t = db.transaction('photos', mode);
      const req = fn(t.objectStore('photos'));
      t.oncomplete = () => res(req?.result);
      t.onerror = () => rej(t.error);
    });
  },
  async all() {
    if (!this.list) this.list = (await this.tx('readonly', (s) => s.getAll())).sort((a, b) => (a.date === b.date ? a.createdAt - b.createdAt : a.date < b.date ? -1 : 1));
    return this.list;
  },
  async put(p) { await this.tx('readwrite', (s) => s.put(p)); this.list = null; },
  async del(id) {
    await this.tx('readwrite', (s) => s.delete(id));
    if (this.urls.has(id)) { URL.revokeObjectURL(this.urls.get(id)); this.urls.delete(id); }
    this.list = null;
  },
  url(p) {
    if (!this.urls.has(p.id)) this.urls.set(p.id, URL.createObjectURL(p.blob));
    return this.urls.get(p.id);
  },
};
const POSES = { front: 'Przód', side: 'Bok', back: 'Tył' };

async function compressImage(file) {
  let src;
  try { src = await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (e) {
    src = await new Promise((res, rej) => { const img = new Image(); img.onload = () => res(img); img.onerror = rej; img.src = URL.createObjectURL(file); });
  }
  const w = src.width || src.naturalWidth;
  const h = src.height || src.naturalHeight;
  const k = Math.min(1, 1600 / Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = Math.round(w * k);
  c.height = Math.round(h * k);
  c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
  return new Promise((res) => c.toBlob(res, 'image/jpeg', 0.82));
}

async function fillPhotos() {
  const grid = $('#photo-grid');
  if (!grid) return;
  let list;
  try { list = await photos.all(); } catch (e) { grid.innerHTML = '<p class="faint small">Ta przeglądarka nie pozwala zapisać zdjęć.</p>'; return; }
  if (!$('#photo-grid')) return;
  grid.innerHTML = list.length
    ? list.slice().reverse().map((p) => `<button class="ph" data-action="photo-open" data-id="${p.id}">
        <img src="${photos.url(p)}" alt="Zdjęcie ${esc(POSES[p.pose] || '')} z ${esc(dShort(p.date))}" loading="lazy">
        <span>${esc(dShort(p.date))} · ${esc(POSES[p.pose] || '')}</span></button>`).join('')
    : '<p class="faint small" style="grid-column:1/-1;margin:4px 0">Brak zdjęć. Pierwsze zrób dziś, za miesiąc zobaczysz różnicę.</p>';
}

function photoForm(blob) {
  ui.pendingPhoto = blob;
  const url = URL.createObjectURL(blob);
  openSheet(`<h2 id="sheet-title">Nowe zdjęcie</h2>
    <form id="photo-form">
      <img class="ph-preview" src="${url}" alt="Podgląd zdjęcia">
      <div class="form-grid" style="margin-top:12px">
        <div><label class="lbl" for="p-date">Data</label><input id="p-date" class="field" type="date" name="date" value="${todayISO()}"></div>
        <div><label class="lbl" for="p-pose">Ujęcie</label><select id="p-pose" class="field" name="pose">${Object.entries(POSES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></div>
      </div>
      <button class="btn btn-primary btn-block" style="margin-top:14px" type="submit">Zapisz zdjęcie</button>
    </form>`);
}

async function photoSheet(id) {
  const p = (await photos.all()).find((x) => x.id === id);
  if (!p) return;
  openSheet(`<h2 id="sheet-title">${esc(POSES[p.pose] || 'Zdjęcie')}, ${esc(dShort(p.date))}</h2>
    <img class="ph-full" src="${photos.url(p)}" alt="Zdjęcie sylwetki">
    <div class="row wrap" style="margin-top:12px">
      <button class="btn btn-primary" data-action="photo-compare" data-id="${p.id}">Porównaj</button>
      <button class="btn btn-danger" data-action="photo-del" data-id="${p.id}">Usuń</button>
    </div>`);
}

async function compareSheet(bId, aId) {
  const list = await photos.all();
  if (list.length < 2) { toast('Do porównania potrzebne są co najmniej 2 zdjęcia'); return; }
  const b = list.find((x) => x.id === bId) || list[list.length - 1];
  const a = list.find((x) => x.id === aId) || list.find((x) => x.pose === b.pose && x.id !== b.id) || list.find((x) => x.id !== b.id);
  const opt = (sel) => list.map((p) => `<option value="${p.id}" ${p.id === sel.id ? 'selected' : ''}>${esc(dShort(p.date))} · ${esc(POSES[p.pose] || '')}</option>`).join('');
  const html = `<h2 id="sheet-title">Porównanie</h2>
    <p class="muted small" style="margin:0 0 10px">Przesuwaj palcem po zdjęciu.</p>
    <div class="cmp" style="--x:50%">
      <img src="${photos.url(a)}" alt="Wcześniej">
      <img class="cmp-b" src="${photos.url(b)}" alt="Później">
      <span class="cmp-line" aria-hidden="true"></span>
      <span class="cmp-tag l">${esc(dShort(a.date))}</span><span class="cmp-tag r">${esc(dShort(b.date))}</span>
      <input type="range" class="cmp-range" min="0" max="100" value="50" aria-label="Suwak porównania">
    </div>
    <div class="form-grid" style="margin-top:12px">
      <div><label class="lbl" for="cmp-a">Wcześniej</label><select id="cmp-a" class="field" data-cmp="a" data-other="${b.id}">${opt(a)}</select></div>
      <div><label class="lbl" for="cmp-b">Później</label><select id="cmp-b" class="field" data-cmp="b" data-other="${a.id}">${opt(b)}</select></div>
    </div>`;
  if ($('#sheet').hidden) openSheet(html);
  else $('#sheet-body').innerHTML = html;
}

/* ------------------------------- Widoki ------------------------------ */

const ui = {
  tab: 'trening',
  session: null,
  week: null,
  lift: 'bench',
  metric: 'waist',
  open: new Set(['boje']),
  calMonth: null,
  calSel: null,
  calAnim: null,
  moving: null,
  restOpen: false,
};

function render() {
  const view = $('#view');
  const fn = { trening: viewTrening, historia: viewHistoria, postep: viewPostep, pomiary: viewPomiary, plan: viewPlan }[ui.tab] || viewTrening;
  const segPrev = segThumbState();
  view.innerHTML = fn();
  document.querySelectorAll('.tab').forEach((t) => {
    if (t.dataset.tab === ui.tab) t.setAttribute('aria-current', 'page');
    else t.removeAttribute('aria-current');
  });
  placeSegThumbs(segPrev);
  placeTabThumb();
  updateTopbar();
  updateElapsed();
  if (ui.tab === 'pomiary') fillPhotos();
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
    const planned = state.planned.find((p) => p.date === todayISO() && !state.workouts.some((w) => w.date === p.date && w.session === p.session));
    ui.session = touched ? touched.id : planned ? planned.session : nextSessionId();
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

  html += todayBanners();

  html += `<div class="stack">${seg(SESSIONS.map((x) => [x.id, x.name]), ui.session, 'set-session', 'Wybierz trening')}
    ${seg(SCHEME.map((_, i) => [i + 1, `T${i + 1}`]), week, 'set-week', 'Tydzień cyklu')}</div>`;

  html += draft.startedAt
    ? `<div class="live-pill glass"><span class="live-dot"></span>Trening trwa <b class="num js-elapsed" data-since="${draft.startedAt}">0:00</b></div>`
    : '<p class="faint small" style="margin:10px 4px 0">Czas treningu ruszy sam po odhaczeniu pierwszej serii.</p>';

  html += `<section class="hero glass" style="margin-top:14px" aria-label="Bój główny">
    <div class="hero-lift">${esc(s.name)}: ${esc(LIFTS[mainEx.main].name)}</div>
    <div class="hero-weight"><span class="num">${fmt(t.kg)}</span><span class="unit">kg</span></div>
    <div class="hero-scheme">${t.sets} × ${t.reps}</div>
    <div class="hero-meta">
      <span class="pill amber">RPE ${esc(t.rpe)}</span>
      <span class="pill">${Math.round(t.pct * 100)}% maksu</span>
      <span class="pill teal">Szacowany maks ${fmt(liftE1RM(mainEx.main))} kg</span>
    </div>
    <div class="hero-plates">${platesHTML(t.kg)}</div>
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
    const prog = progression(ex, week);
    const unitS = ex.unit === 'm' ? ' m' : '';
    const prevBox = last
      ? `<button class="ex-prev" data-action="open-ex" data-ex="${ex.id}" aria-label="Historia ćwiczenia ${esc(ex.name)}">
          <span class="ex-prev-head"><span>Ostatnio · ${esc(dShort(last.date))}</span>${last.entry.rpe ? `<span class="pill small-pill">RPE ${esc(last.entry.rpe)}</span>` : ''}<span class="ex-prev-more">${ICON.chart}</span></span>
          <span class="ex-prev-sets">${last.entry.sets.map((x) => `<span class="set-chip num">${fmt(x.kg)}×${fmt(x.reps, 0)}${unitS}</span>`).join('')}</span>
          ${last.entry.note ? `<span class="ex-prev-note">„${esc(last.entry.note)}”</span>` : ''}
        </button>`
      : ex.start ? `<div class="ex-last">Start: ${esc(ex.start)}</div>` : '';
    const firstKg = toNum(e.sets[0]?.kg);
    html += `<article class="card glass ${ex.main ? 'ex-main' : ''}" data-ex="${ex.id}">
      <div class="ex-head">
        <div class="ex-index">${i + 1}</div>
        <div class="grow">
          <div class="ex-name">${esc(ex.name)}</div>
          <div class="ex-target">Cel: <b>${esc(target)}</b>${ex.rest ? `, przerwa ${restLabel(ex.rest)}` : ''}</div>
          ${ex.ss ? '<div class="badge-ss">Superseria z następnym ćwiczeniem</div>' : ''}
          <div class="ex-tip">${esc(ex.tip)}</div>
        </div>
      </div>
      ${prevBox}
      ${prog ? `<div class="prog prog-${prog.kind}"><span class="prog-ic">${PROG_ICON[prog.kind]}</span><span>${esc(prog.text)}</span></div>` : ''}
      ${ex.bar && !ex.main && firstKg ? `<div class="ex-plates">${platesHTML(firstKg, true)}</div>` : ''}
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
      </div>
      ${rpeSlider(ex.id, e.rpe)}
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

function rpeSlider(exId, rpe) {
  const v = toNum(rpe);
  const p = (((v ?? 8) - 6) / 4) * 100;
  return `<div class="rpe-wrap ${v == null ? 'unset' : ''}">
    <div class="rpe-top"><span class="lbl" style="margin:0">Trudność ostatniej serii</span>
      <b class="rpe-val num">${v == null ? 'przesuń' : `RPE ${esc(rpe)}`}</b></div>
    <input type="range" class="rpe-range" min="6" max="10" step="0.5" value="${v ?? 8}" style="--p:${p}%" data-ex="${exId}" data-k="rpe" aria-label="Trudność ostatniej serii, RPE od 6 do 10">
    <div class="rpe-desc small">${v == null ? 'Ile powtórzeń zostało w zapasie? Na tej podstawie apka podpowie ciężar następnym razem.' : esc(rpeDesc(rpe))}</div>
  </div>`;
}

/* ---- Historia ---- */
function viewHistoria() {
  const ws = sortedWorkouts().reverse();
  let html = head('Historia', ws.length ? `${ws.length} ${plural(ws.length, 'zapisany trening', 'zapisane treningi', 'zapisanych treningów')}` : '');
  html += calendarHTML() + dayPanelHTML();
  html += '<h2 class="section-title">Wszystkie treningi</h2>';
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
      html += `<h3 class="sub-title">${label}</h3><div class="list glass">`;
      curWeek = label;
      open = true;
    }
    const d = parseISO(w.date);
    const ton = workoutTonnage(w);
    html += `<button class="list-item" data-action="open-workout" data-id="${w.id}">
      <div class="date-chip"><div class="d">${d.getDate()}</div><div class="m">${MONTHS[d.getMonth()]}</div></div>
      <div class="grow"><div style="font-weight:650">${esc(SESSION_BY_ID[w.session]?.name || w.session)}</div>
      <div class="muted small">${w.duration ? `${durLabel(w.duration)}, ` : ''}tonaż ${fmt(ton, 0)} kg, ${w.entries.length} ${plural(w.entries.length, 'ćwiczenie', 'ćwiczenia', 'ćwiczeń')}</div></div>
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
      return `<tr><td><button class="link-btn" data-action="open-ex" data-ex="${e.exId}"><b>${esc(e.name || ex?.name)}</b></button>${best}${e.note ? `<div class="faint small">${esc(e.note)}</div>` : ''}</td>
        <td class="n">${sets}${e.rpe ? `<div class="faint small">RPE ${esc(e.rpe)}</div>` : ''}</td></tr>`;
    })
    .join('');
  openSheet(`<h2 id="sheet-title">${esc(s?.name || w.session)}</h2>
    <p class="muted" style="margin:0 0 8px">${esc(dLong(w.date))}, tydzień ${w.week}. ${w.duration ? `Czas ${esc(durLabel(w.duration))}. ` : ''}Tonaż ${fmt(workoutTonnage(w), 0)} kg.</p>
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

  html += '<h2 class="section-title">Każde ćwiczenie</h2><p class="muted small" style="margin:-4px 4px 10px">Stuknij, żeby zobaczyć wykres, rekord i notatki.</p>';
  for (const s of SESSIONS) {
    html += `<h3 class="sub-title" style="--c:${SESSION_COLOR[s.id]}"><span class="banner-dot"></span>${esc(s.name)}</h3><div class="list glass">${s.ex.map((ex) => {
      const h = exHistory(ex.id);
      const last = h[h.length - 1];
      return `<button class="list-item" data-action="open-ex" data-ex="${ex.id}">
        <div class="grow"><div style="font-weight:600">${esc(ex.name)}</div>
        <div class="muted small num">${last ? `${esc(dShort(last.date))}: ${esc(setsTxt(last.sets, ex.unit === 'm' ? ' m' : ''))}` : 'Brak wpisów'}</div></div>
        ${sparkline(h.slice(-8).map((x) => x.v))}${ICON.chev}</button>`;
    }).join('')}</div>`;
  }
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

  html += `<h2 class="section-title">Zdjęcia sylwetki</h2>
    <div class="card glass">
      <p class="muted small" style="margin:0 0 10px">Co 2–4 tygodnie, rano, to samo miejsce i światło. Zdjęcia zostają tylko na tym telefonie: nie idą do chmury ani do kopii JSON.</p>
      <div id="photo-grid" class="photo-grid"><p class="faint small">Wczytuję…</p></div>
      <div class="row wrap" style="margin-top:12px">
        <button class="btn btn-primary" data-action="photo-add">Dodaj zdjęcie</button>
        <button class="btn" data-action="photo-compare">Porównaj</button>
      </div>
      <input type="file" id="photo-file" accept="image/*" hidden>
    </div>`;

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
  html += acc('sprzet', 'Przerwa i sprzęt', `Sztanga ${fmt(st.bar)} kg${st.restFull ? ', przerwa na cały ekran' : ''}`, `
    <label class="switch-row"><span class="grow"><b>Przerwa na cały ekran</b><span class="muted small">Po odhaczeniu serii pokazuje duży pierścień i następną serię. Przeciągnij w dół, żeby zmniejszyć.</span></span>
      <input type="checkbox" class="switch" data-opt="restFull" ${st.restFull ? 'checked' : ''}></label>
    <label class="lbl" for="o-bar" style="margin-top:12px">Waga sztangi (kg)</label>
    <input id="o-bar" class="field num" inputmode="decimal" data-opt="bar" data-num="1" value="${esc(fmt(st.bar))}" style="max-width:120px">
    <div class="lbl" style="margin-top:12px">Talerze na siłowni</div>
    <div class="plan-chips">${[25, 20, 15, 10, 5, 2.5, 1.25, 0.5].map((p) => `<label class="chip plate-chip" style="--c:${(PLATE_STYLE[p] || ['#888'])[0]}"><input type="checkbox" data-plate="${p}" ${st.plates.includes(p) ? 'checked' : ''}>${fmt(p, 2)}</label>`).join('')}</div>
    <div class="hero-plates" style="margin-top:12px">${platesHTML(mainTarget('bench', cw.week).kg)}</div>
    <p class="small faint">Przykład: ławka w tym tygodniu, ${fmt(mainTarget('bench', cw.week).kg)} kg.</p>`);

  const rm = st.remind;
  const DOW = ['poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota', 'niedziela'];
  html += acc('przyp', 'Przypomnienia', `Pomiary: ${DOW[rm.measureDay]}, ${esc(rm.measureTime)}`, `
    <p>W aplikacji: na zakładce Trening pojawi się karta, gdy przyjdzie dzień pomiaru albo masz zaplanowany trening. Żeby telefon przypomniał sam, dodaj wydarzenia do Kalendarza iPhone'a.</p>
    <div class="form-grid">
      <div><label class="lbl" for="r-day">Dzień pomiaru</label><select id="r-day" class="field" data-opt="remind.measureDay" data-num="1">${DOW.map((d, i) => `<option value="${i}" ${Number(rm.measureDay) === i ? 'selected' : ''}>${d}</option>`).join('')}</select></div>
      <div><label class="lbl" for="r-time">Godzina</label><input id="r-time" class="field" type="time" data-opt="remind.measureTime" value="${esc(rm.measureTime)}"></div>
    </div>
    <button class="btn" style="margin-top:10px" data-action="ics-measure">Dodaj pomiary do Kalendarza (co tydzień)</button>
    <label class="lbl" for="r-wtime" style="margin-top:14px">Godzina zaplanowanych treningów</label>
    <input id="r-wtime" class="field" type="time" data-opt="remind.workoutTime" value="${esc(rm.workoutTime)}" style="max-width:140px">
    <button class="btn" style="margin-top:10px" data-action="ics-plan">Dodaj zaplanowane treningi do Kalendarza</button>
    <p class="small faint">Kalendarz przypomni 30 min przed treningiem. Treningi planujesz w kalendarzu w zakładce Historia. Po zmianie planu dodaj je ponownie: istniejące wydarzenia się zaktualizują.</p>`);

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

  html += acc('konto', 'Konto i synchronizacja', cloudSub(), cloudBody());

  html += acc('dane', 'Kopia zapasowa', 'Plik JSON do pobrania', `
    <p>Treningi i pomiary zapisują się w pamięci tego telefonu${window.cloudState?.email ? ' i w Twoim koncie w chmurze' : ''}. Kopia w pliku to dodatkowe zabezpieczenie.</p>
    <div class="callout warn">Na iPhonie aplikacja dodana do ekranu początkowego ma osobną pamięć niż Safari. ${window.cloudState?.email ? 'Zaloguj się w obu miejscach, a dane będą te same.' : 'Rób kopię co kilka tygodni i przed zmianą telefonu, albo załóż konto wyżej.'}</div>
    <div class="row wrap" style="margin-top:12px">
      <button class="btn" data-action="export">Pobierz kopię (JSON)</button>
      <button class="btn" data-action="import">Wczytaj kopię</button>
    </div>
    <input type="file" id="import-file" accept="application/json,.json" hidden>
    <p class="small faint">Zapisanych treningów: ${state.workouts.length}, pomiarów: ${state.measurements.length}.</p>
    <button class="btn btn-danger" style="margin-top:8px" data-action="reset-all">Usuń wszystkie dane</button>`);

  return html;
}

/* ---- Konto (Firebase, sync.js) ---- */
const CLOUD_LABEL = {
  loading: 'Łączenie…',
  'signed-out': 'Nie zalogowano. Dane tylko na tym urządzeniu',
  syncing: 'Synchronizuję…',
  ok: 'Zsynchronizowano',
  error: 'Problem z synchronizacją',
};
function cloudSub() {
  const c = window.cloudState;
  if (!c) return 'Niedostępne bez internetu';
  return c.email ? `${CLOUD_LABEL[c.status] || ''}: ${c.email}` : CLOUD_LABEL[c.status] || '';
}
function cloudBody() {
  const c = window.cloudState;
  if (!c) return '<p>Moduł synchronizacji nie wczytał się. Sprawdź internet i otwórz aplikację ponownie. Dane na urządzeniu są bezpieczne.</p>';
  if (c.email) {
    return `<p>Zalogowano jako <b>${esc(c.email)}</b>. Każda zmiana trafia do chmury, a inne urządzenia z tym kontem dostają ją same. Bez internetu zapis działa dalej i wyśle się później.</p>
      ${c.status === 'error' ? `<div class="callout warn">Nie udało się zsynchronizować (${esc(c.detail)}). Spróbuję ponownie przy następnej zmianie.</div>` : ''}
      <div class="row wrap" style="margin-top:12px">
        <button class="btn" data-action="cloud-signout">Wyloguj</button>
      </div>`;
  }
  return `<p>Załóż konto, żeby treningi i pomiary były w chmurze (darmowy Firebase). Dzięki temu nie stracisz ich przy zmianie telefonu i zobaczysz je także na komputerze.</p>
    <label class="lbl" for="c-email">E-mail</label>
    <input id="c-email" class="field" type="email" autocomplete="username" inputmode="email" autocapitalize="off">
    <label class="lbl" for="c-pass">Hasło</label>
    <input id="c-pass" class="field" type="password" autocomplete="current-password" minlength="6">
    <div class="row wrap" style="margin-top:12px">
      <button class="btn btn-primary" data-action="cloud-signin">Zaloguj</button>
      <button class="btn" data-action="cloud-signup">Załóż konto</button>
      <button class="btn btn-small" data-action="cloud-reset">Nie pamiętam hasła</button>
    </div>
    <p class="small faint">Po pierwszym zalogowaniu dane z tego urządzenia połączą się z tymi w chmurze. Nic nie zniknie.</p>`;
}
async function cloudAuth(action) {
  if (!window.cloud) { toast('Synchronizacja niedostępna, sprawdź internet'); return; }
  const email = $('#c-email')?.value.trim();
  const pass = $('#c-pass')?.value || '';
  if (!email) { toast('Wpisz e-mail'); return; }
  let err;
  if (action === 'cloud-reset') {
    err = await window.cloud.reset(email);
    toast(err || 'Wysłano e-mail do zmiany hasła');
    return;
  }
  err = action === 'cloud-signup' ? await window.cloud.signUp(email, pass) : await window.cloud.signIn(email, pass);
  document.activeElement?.blur();
  if (err) toast(err);
  else toast(action === 'cloud-signup' ? 'Konto założone, synchronizuję' : 'Zalogowano, synchronizuję');
}

/* ---- Kalendarz (Historia) ---- */
const MONTH_NAMES = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'];

function calendarHTML() {
  const today = todayISO();
  const ym = ui.calMonth || today.slice(0, 7);
  const [Y, M] = ym.split('-').map(Number);
  const startDow = (new Date(Y, M - 1, 1).getDay() + 6) % 7;
  const days = new Date(Y, M, 0).getDate();
  const weeks = Math.ceil((startDow + days) / 7);
  const by = {};
  for (const w of state.workouts) (by[w.date] ||= { w: [], p: [] }).w.push(w);
  for (const p of state.planned) (by[p.date] ||= { w: [], p: [] }).p.push(p);
  const sel = ui.calSel || today;
  let cells = '';
  for (let k = 0; k < weeks * 7; k++) {
    const d = new Date(Y, M - 1, 1 - startDow + k);
    const iso = isoOf(d);
    const it = by[iso] || { w: [], p: [] };
    const cls = ['cal-day', d.getMonth() !== M - 1 && 'out', iso === today && 'today', iso === sel && 'sel', (it.w.length || it.p.length) && 'has',
      ui.moving && 'target'].filter(Boolean).join(' ');
    const label = `${dLong(iso)}${it.w.length ? `, ${it.w.length} ${plural(it.w.length, 'trening', 'treningi', 'treningów')}` : ''}${it.p.length ? ', zaplanowany' : ''}`;
    cells += `<button class="${cls}" data-action="cal-day" data-date="${iso}" style="--i:${k}" aria-label="${esc(label)}" ${iso === sel ? 'aria-pressed="true"' : ''}>
      <span class="n">${d.getDate()}</span><span class="dots">${it.w.map((x) => `<i style="--c:${SESSION_COLOR[x.session]}"></i>`).join('')}${it.p.map((x) => `<i class="plan" style="--c:${SESSION_COLOR[x.session]}"></i>`).join('')}</span></button>`;
  }
  const monthCount = state.workouts.filter((w) => w.date.startsWith(ym)).length;
  const anim = ui.calAnim ? ` anim-${ui.calAnim}` : '';
  ui.calAnim = null;
  return `<section class="cal glass" aria-label="Kalendarz treningów">
    <div class="cal-head">
      <button class="icon-btn" data-action="cal-prev" aria-label="Poprzedni miesiąc">${ICON.left}</button>
      <div class="cal-title grow"><b>${MONTH_NAMES[M - 1]}</b> ${Y}<div class="faint small">${monthCount} ${plural(monthCount, 'trening', 'treningi', 'treningów')}</div></div>
      ${ym !== today.slice(0, 7) ? '<button class="btn btn-small" data-action="cal-today">Dziś</button>' : ''}
      <button class="icon-btn" data-action="cal-next" aria-label="Następny miesiąc">${ICON.right}</button>
    </div>
    <div class="cal-dow" aria-hidden="true"><span>Pn</span><span>Wt</span><span>Śr</span><span>Cz</span><span>Pt</span><span>So</span><span>Nd</span></div>
    <div class="cal-grid${anim}">${cells}</div>
    <div class="cal-legend">${SESSIONS.map((s) => `<span><i style="--c:${SESSION_COLOR[s.id]}"></i>${esc(s.name)}</span>`).join('')}<span><i class="plan" style="--c:var(--text-2)"></i>plan</span></div>
    <p class="faint small cal-hint">Przesuń w bok, żeby zmienić miesiąc. Przytrzymaj dzień z treningiem i przeciągnij na inny dzień, żeby go przenieść.</p>
  </section>`;
}

function dayPanelHTML() {
  const iso = ui.calSel || todayISO();
  const ws = state.workouts.filter((w) => w.date === iso);
  const ps = state.planned.filter((p) => p.date === iso);
  const title = dLong(iso);
  let h = `<section class="day-panel glass" aria-live="polite">`;
  if (ui.moving) {
    const what = ui.moving.type === 'w' ? state.workouts.find((w) => w.id === ui.moving.id)?.session : state.planned.find((p) => p.id === ui.moving.id)?.session;
    h += `<div class="move-banner"><b>Przenosisz ${esc(SESSION_BY_ID[what]?.name || 'trening')}.</b> Stuknij nowy dzień w kalendarzu.
      <button class="btn btn-small" data-action="move-cancel">Anuluj</button></div>`;
  }
  h += `<h3 class="day-title">${esc(title.charAt(0).toUpperCase() + title.slice(1))}</h3>`;
  if (!ws.length && !ps.length) h += '<p class="muted small" style="margin:2px 0 10px">Nic tu nie ma.</p>';
  for (const w of ws) {
    h += `<div class="day-item" style="--c:${SESSION_COLOR[w.session]}">
      <button class="day-main" data-action="open-workout" data-id="${w.id}"><span class="banner-dot"></span>
        <span class="grow"><b>${esc(SESSION_BY_ID[w.session]?.name || w.session)}</b><span class="muted small"> · ${w.duration ? `${durLabel(w.duration)} · ` : ''}${fmt(workoutTonnage(w), 0)} kg</span></span>${ICON.chev}</button>
      <button class="btn btn-small" data-action="move-start" data-type="w" data-id="${w.id}">Przenieś</button></div>`;
  }
  for (const p of ps) {
    h += `<div class="day-item planned" style="--c:${SESSION_COLOR[p.session]}">
      <div class="day-main"><span class="banner-dot"></span><span class="grow"><b>${esc(SESSION_BY_ID[p.session]?.name || p.session)}</b><span class="muted small"> · zaplanowany</span></span></div>
      <button class="btn btn-small" data-action="move-start" data-type="p" data-id="${p.id}">Przenieś</button>
      <button class="icon-btn small" data-action="plan-del" data-id="${p.id}" aria-label="Usuń z planu">${ICON.x}</button></div>`;
  }
  h += `<div class="lbl" style="margin-top:12px">Zaplanuj na ten dzień</div><div class="plan-chips">${SESSIONS.map((s) => `<button class="chip" style="--c:${SESSION_COLOR[s.id]}" data-action="plan-add" data-value="${s.id}" data-date="${iso}">${ICON.plus}${esc(s.name)}</button>`).join('')}</div>`;
  if (iso === todayISO() && ps.length) h += `<button class="btn btn-primary btn-block" style="margin-top:12px" data-action="set-session-go" data-value="${ps[0].session}">Zacznij ${esc(SESSION_BY_ID[ps[0].session]?.name || '')}</button>`;
  return `${h}</section>`;
}

function shiftMonth(dir) {
  const [Y, M] = (ui.calMonth || todayISO().slice(0, 7)).split('-').map(Number);
  const d = new Date(Y, M - 1 + dir, 1);
  ui.calMonth = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
  ui.calAnim = dir > 0 ? 'next' : 'prev';
  render();
}

function moveItem(type, id, date) {
  const item = type === 'w' ? state.workouts.find((w) => w.id === id) : state.planned.find((p) => p.id === id);
  ui.moving = null;
  if (!item || item.date === date) { render(); return; }
  item.date = date;
  ui.calSel = date;
  saveNow();
  haptic();
  render();
  toast(`Przeniesiono na ${dShort(date)}`);
}

// Gesty kalendarza: przesunięcie w bok zmienia miesiąc, przytrzymanie dnia z treningiem i przeciągnięcie przenosi go.
const calG = { on: false, x0: 0, y0: 0, timer: null, drag: null, ghost: null, over: null };
function calDragStart(cell) {
  const date = cell.dataset.date;
  const w = state.workouts.find((x) => x.date === date);
  const p = state.planned.find((x) => x.date === date);
  const item = w ? { type: 'w', id: w.id, session: w.session } : p ? { type: 'p', id: p.id, session: p.session } : null;
  if (!item) return;
  calG.drag = item;
  haptic();
  cell.classList.add('lifted');
  const g = document.createElement('div');
  g.className = 'cal-ghost';
  g.style.setProperty('--c', SESSION_COLOR[item.session]);
  g.textContent = SESSION_BY_ID[item.session]?.name || '';
  document.body.appendChild(g);
  calG.ghost = g;
  calDragMove(calG.x0, calG.y0);
}
function calDragMove(x, y) {
  calG.ghost.style.transform = `translate(${x}px, ${y}px) translate(-50%, -130%)`;
  const cell = document.elementFromPoint(x, y)?.closest('.cal-day');
  if (cell !== calG.over) {
    calG.over?.classList.remove('drop');
    cell?.classList.add('drop');
    calG.over = cell;
  }
}
function calDragEnd() {
  const target = calG.over?.dataset.date;
  calG.ghost?.remove();
  document.querySelectorAll('.cal-day.lifted, .cal-day.drop').forEach((c) => c.classList.remove('lifted', 'drop'));
  const item = calG.drag;
  calG.drag = null; calG.ghost = null; calG.over = null;
  if (item && target) moveItem(item.type, item.id, target);
}
document.addEventListener('touchstart', (e) => {
  const grid = e.target.closest?.('.cal-grid');
  if (!grid || e.touches.length !== 1) return;
  const t = e.touches[0];
  Object.assign(calG, { on: true, x0: t.clientX, y0: t.clientY });
  clearTimeout(calG.timer);
  const cell = e.target.closest('.cal-day');
  if (cell?.classList.contains('has') && !ui.moving) calG.timer = setTimeout(() => calDragStart(cell), 420);
}, { passive: true });
document.addEventListener('touchmove', (e) => {
  if (!calG.on) return;
  const t = e.touches[0];
  if (calG.drag) { e.preventDefault(); calDragMove(t.clientX, t.clientY); return; }
  if (Math.hypot(t.clientX - calG.x0, t.clientY - calG.y0) > 10) clearTimeout(calG.timer);
}, { passive: false });
document.addEventListener('touchend', (e) => {
  if (!calG.on) return;
  calG.on = false;
  clearTimeout(calG.timer);
  if (calG.drag) { e.preventDefault(); calDragEnd(); return; }
  const t = e.changedTouches[0];
  const dx = t.clientX - calG.x0;
  const dy = t.clientY - calG.y0;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) { e.preventDefault(); shiftMonth(dx < 0 ? 1 : -1); }
}, { passive: false });
document.addEventListener('touchcancel', () => { calG.on = false; clearTimeout(calG.timer); if (calG.drag) calDragEnd(); });

/* ---- Karta ćwiczenia: wykres i historia ---- */
function exerciseSheet(exId) {
  const ex = EX_BY_ID[exId];
  if (!ex) return;
  const hist = exHistory(exId);
  const unit = exMetricUnit(ex, hist);
  const metricLbl = unit === 'powt.' ? 'Najwięcej powtórzeń w serii' : ex.unit === 'm' ? 'Największy ciężar' : 'Szacowany maks (wzór Epleya)';
  const best = hist.reduce((m, h) => (h.v > (m?.v || 0) ? h : m), null);
  const sUnit = ex.unit === 'm' ? ' m' : '';
  const rows = hist.slice(-12).reverse().map((h) => `<button class="list-item" data-action="open-workout" data-id="${h.wid}">
      <div class="date-chip"><div class="d">${parseISO(h.date).getDate()}</div><div class="m">${MONTHS[parseISO(h.date).getMonth()]}</div></div>
      <div class="grow"><div class="num" style="font-weight:650">${esc(setsTxt(h.sets, sUnit))}</div>
        <div class="muted small">${h.rpe ? `RPE ${esc(h.rpe)} · ` : ''}${fmt(h.v)} ${unit}</div>
        ${h.note ? `<div class="ex-prev-note">„${esc(h.note)}”</div>` : ''}</div></button>`).join('');
  openSheet(`<h2 id="sheet-title">${esc(ex.name)}</h2>
    <p class="muted small" style="margin:0 0 10px">${esc(SESSION_BY_ID[ex.session]?.name || '')} · ${ex.main ? 'bój główny' : esc(ex.sets)}</p>
    <div class="stats">
      <div class="stat glass"><div class="label">Rekord</div><div class="value">${best ? fmt(best.v) : '–'}<span class="faint" style="font-size:13px"> ${unit}</span></div><div class="faint small">${best ? dShort(best.date) : ''}</div></div>
      <div class="stat glass"><div class="label">Ostatnio</div><div class="value">${hist.length ? fmt(hist[hist.length - 1].v) : '–'}<span class="faint" style="font-size:13px"> ${unit}</span></div><div class="faint small">${hist.length ? dShort(hist[hist.length - 1].date) : ''}</div></div>
      <div class="stat glass"><div class="label">Treningi</div><div class="value">${hist.length}</div></div>
    </div>
    <div class="card glass"><h3>${metricLbl}</h3>${lineChart(hist.map((h) => ({ label: dShort(h.date), v: h.v })), unit === 'powt.' ? '' : 'kg')}</div>
    ${rows ? `<h3 style="margin:14px 2px 8px">Historia</h3><div class="list glass">${rows}</div>` : '<p class="muted">Jeszcze nie ma zapisanych serii tego ćwiczenia.</p>'}`);
}

/* ---- Podsumowanie po treningu ---- */
function summarySheet(w, prev, prs) {
  const s = SESSION_BY_ID[w.session];
  const ton = workoutTonnage(w);
  const prevTon = prev ? workoutTonnage(prev) : null;
  const setsN = w.entries.reduce((n, e) => n + e.sets.length, 0);
  const repsN = w.entries.reduce((n, e) => n + (EX_BY_ID[e.exId]?.unit === 'm' ? 0 : e.sets.reduce((r, x) => r + x.reps, 0)), 0);
  const cmp = w.entries.map((e) => {
    const ex = EX_BY_ID[e.exId];
    const pe = prev?.entries.find((x) => x.exId === e.exId);
    const bestSet = (en) => en.sets.reduce((m, x) => (e1rm(x.kg, x.reps) > e1rm(m.kg, m.reps) || (!x.kg && x.reps > m.reps) ? x : m), en.sets[0]);
    const now = bestSet(e);
    const was = pe ? bestSet(pe) : null;
    const v = (x) => (x.kg ? e1rm(x.kg, x.reps) : x.reps);
    const d = was ? v(now) - v(was) : null;
    const cls = d == null ? 'flat' : d > 0.05 ? 'good' : d < -0.05 ? 'bad' : 'flat';
    const arrow = d == null ? 'nowe' : d > 0.05 ? '▲' : d < -0.05 ? '▼' : '=';
    const u = ex?.unit === 'm' ? ' m' : '';
    return `<div class="cmp-row"><div class="grow"><div class="cmp-name">${esc(e.name || ex?.name)}</div>
      <div class="muted small num">${fmt(now.kg)}×${fmt(now.reps, 0)}${u}${was ? ` <span class="faint">(było ${fmt(was.kg)}×${fmt(was.reps, 0)}${u})</span>` : ''}</div></div>
      <span class="delta ${cls}">${arrow}</span></div>`;
  }).join('');
  openSheet(`<div class="sum-hero">
      <svg class="sum-check" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="23"/><path d="M15 27l7 7 15-16"/></svg>
      <h2 id="sheet-title">Zapisano ${esc(s?.name || '')}</h2>
      <p class="muted" style="margin:2px 0 0">${esc(dLong(w.date))}</p>
    </div>
    <div class="stats">
      <div class="stat glass"><div class="label">Czas</div><div class="value">${w.duration ? esc(durShort(w.duration)) : '–'}</div></div>
      <div class="stat glass"><div class="label">Tonaż</div><div class="value">${fmt(ton / 1000, 1)}<span class="faint" style="font-size:13px"> t</span></div>
        ${prevTon != null ? `<div class="delta ${ton >= prevTon ? 'good' : 'bad'}">${fmtSigned(ton - prevTon, 0)} kg</div>` : ''}</div>
      <div class="stat glass"><div class="label">Serie</div><div class="value">${setsN}</div><div class="faint small">${repsN} powt.</div></div>
    </div>
    ${prs.length ? `<div class="callout good pr"><b>🏆 ${prs.length > 1 ? 'Nowe rekordy' : 'Nowy rekord'}.</b> ${esc(prs.join(', '))}.</div>` : ''}
    <h3 style="margin:16px 2px 6px">${prev ? `Porównanie z ${esc(dShort(prev.date))}` : 'Pierwszy raz ten trening'}</h3>
    <div class="list glass cmp-list">${cmp}</div>
    <p class="muted">Następny trening: <b>${esc(SESSION_BY_ID[ui.session].name)}</b>.</p>
    <button class="btn btn-primary btn-block" data-action="close-sheet">Gotowe</button>`);
}

/* ---- Przerwa na pełnym ekranie ---- */
const RING_C = 2 * Math.PI * 96;

function restNextHTML(t) {
  const n = t.next;
  if (!n) return '<div class="rest-next"><div class="rest-k">To była ostatnia seria</div><div class="rest-name">Zapisz trening na dole listy.</div></div>';
  const ex = EX_BY_ID[n.exId];
  const d = state.drafts[t.session];
  const set = d?.entries[n.exId]?.sets[n.i];
  if (!ex || !set) return '';
  const last = lastEntry(ex.id);
  const ls = last?.entry.sets[n.i];
  const repsPh = ex.main ? mainTarget(ex.main, d.week).reps : ls?.reps ?? repRange(ex)?.max ?? '';
  return `<div class="rest-next">
    <div class="rest-k">Następna: seria ${n.i + 1} z ${d.entries[n.exId].sets.length}</div>
    <div class="rest-name">${esc(ex.name)}</div>
    <div class="rest-inputs">
      <label class="rest-field"><input class="field num" inputmode="decimal" data-ex="${ex.id}" data-i="${n.i}" data-k="kg" value="${esc(set.kg)}" placeholder="kg" aria-label="Ciężar w kg"><span>kg</span></label>
      <span class="rest-x" aria-hidden="true">×</span>
      <label class="rest-field"><input class="field num" inputmode="numeric" data-ex="${ex.id}" data-i="${n.i}" data-k="reps" value="${esc(set.reps)}" placeholder="${esc(repsPh)}" aria-label="Powtórzenia"><span>${ex.unit === 'm' ? 'm' : 'powt.'}</span></label>
    </div>
    ${ls ? `<div class="rest-prev">Ostatnio ta seria: ${fmt(ls.kg)} × ${fmt(ls.reps, 0)}${last.entry.rpe ? `, RPE ${esc(last.entry.rpe)}` : ''}</div>` : ''}
    ${ex.bar ? `<div class="rest-plates">${platesHTML(toNum(set.kg))}</div>` : ''}
  </div>`;
}

function openRest() {
  const t = state.timer;
  if (!t) return;
  ui.restOpen = true;
  const el = $('#rest');
  el.innerHTML = `<div class="rest-scrim" data-action="rest-min"></div>
    <section class="rest-card" role="dialog" aria-modal="true" aria-label="Przerwa">
      <div class="sheet-grabber" aria-hidden="true"></div>
      <div class="rest-top"><span class="rest-title">${esc(t.label)}</span>
        <button class="icon-btn" data-action="rest-min" aria-label="Zmniejsz timer">${ICON.down}</button></div>
      <div class="rest-ring-wrap">
        <svg class="rest-ring" viewBox="0 0 220 220" aria-hidden="true">
          <defs><linearGradient id="ring-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--ring-a)"/><stop offset="1" stop-color="var(--ring-b)"/></linearGradient></defs>
          <circle class="track" cx="110" cy="110" r="96"/>
          <circle class="prog" cx="110" cy="110" r="96" stroke-dasharray="${RING_C.toFixed(1)}" stroke-dashoffset="0"/>
        </svg>
        <div class="rest-center" role="timer" aria-live="off"><div class="rest-label">Przerwa</div><div class="rest-time num">0:00</div><div class="rest-sub num"></div></div>
      </div>
      <div class="rest-ctrl">
        <button class="btn rest-adj" data-action="timer-sub" aria-label="Odejmij 15 sekund">−15 s</button>
        <button class="btn btn-primary rest-main" data-action="timer-skip">Pomiń</button>
        <button class="btn rest-adj" data-action="timer-add" aria-label="Dodaj 15 sekund">+15 s</button>
      </div>
      ${restNextHTML(t)}
      ${state.settings.clock.mode !== 'off' ? `<button class="btn btn-block rest-clock" data-action="timer-clock">${ICON.clock} Minutnik w Zegarze</button>` : ''}
    </section>`;
  el.hidden = false;
  document.body.classList.add('rest-open');
  const card = el.querySelector('.rest-card');
  dragToDismiss(card, closeRest, () => card.scrollTop <= 0);
  timer.html = '';
  tickTimer();
}
function closeRest() {
  ui.restOpen = false;
  const el = $('#rest');
  el.hidden = true;
  el.innerHTML = '';
  document.body.classList.remove('rest-open');
  timer.html = '';
  if (state.timer) tickTimer();
}
function updateRest(t) {
  const el = $('#rest');
  if (el.hidden) return;
  const card = el.querySelector('.rest-card');
  const time = el.querySelector('.rest-time');
  const leftMs = t.end - Date.now();
  const main = el.querySelector('.rest-main');
  if (leftMs <= 0) {
    card.classList.add('done');
    card.classList.remove('warn');
    time.textContent = '0:00';
    el.querySelector('.rest-label').textContent = 'Czas na serię';
    const over = Math.floor(-leftMs / 1000);
    el.querySelector('.rest-sub').textContent = over >= 3 ? `+${mmss(over)}` : '';
    el.querySelector('.prog').style.strokeDashoffset = '0';
    if (main.textContent !== 'OK') main.textContent = 'OK';
    return;
  }
  card.classList.remove('done');
  if (main.textContent !== 'Pomiń') main.textContent = 'Pomiń';
  el.querySelector('.rest-label').textContent = 'Przerwa';
  const sec = Math.ceil(leftMs / 1000);
  const txt = mmss(sec);
  if (time.textContent !== txt) {
    time.textContent = txt;
    card.classList.toggle('warn', sec <= 10);
    if (sec <= 10 && !reducedMotion()) { time.classList.remove('beat'); void time.offsetWidth; time.classList.add('beat'); }
  }
  el.querySelector('.rest-sub').textContent = `z ${mmss(t.total)}`;
  el.querySelector('.prog').style.strokeDashoffset = String((RING_C * (1 - leftMs / (t.total * 1000))).toFixed(1));
}

/* ---- Liquid Glass: przeciąganie w dół, przesuwane wskaźniki, pasek u góry ---- */

// Arkusz (lub przerwa) zjeżdża w dół za palcem; puszczenie nisko albo szybko zamyka.
function dragToDismiss(panel, onDismiss, canStart = () => true) {
  let y0 = null, x0 = 0, dy = 0, t0 = 0, active = false;
  panel.addEventListener('touchstart', (e) => {
    y0 = null;
    if (e.touches.length !== 1 || e.target.closest('input, select, textarea, .cmp') || !canStart(e)) return;
    y0 = e.touches[0].clientY; x0 = e.touches[0].clientX; dy = 0; t0 = performance.now(); active = false;
  }, { passive: true });
  panel.addEventListener('touchmove', (e) => {
    if (y0 == null) return;
    const d = e.touches[0].clientY - y0;
    if (!active) {
      if (d > 8 && d > Math.abs(e.touches[0].clientX - x0)) active = true;
      else { if (d < -4) y0 = null; return; }
    }
    e.preventDefault();
    dy = Math.max(0, d);
    panel.style.transition = 'none';
    panel.style.transform = `translateY(${dy}px)`;
  }, { passive: false });
  const end = () => {
    if (y0 == null || !active) { y0 = null; return; }
    y0 = null;
    const v = dy / Math.max(1, performance.now() - t0);
    panel.style.transition = '';
    if (dy > 130 || (dy > 50 && v > 0.5)) {
      panel.style.transform = 'translateY(105%)';
      setTimeout(() => { onDismiss(); panel.style.transform = ''; }, 230);
    } else panel.style.transform = '';
  };
  panel.addEventListener('touchend', end);
  panel.addEventListener('touchcancel', end);
}

// Przesuwany „kamyk” pod wybraną opcją w przełącznikach (zamiast skakania tła)
function placeSegThumbs(prev) {
  document.querySelectorAll('#view .segmented').forEach((sg) => {
    const on = sg.querySelector('.seg[aria-pressed="true"]');
    if (!on) return;
    const th = document.createElement('i');
    th.className = 'seg-thumb';
    th.setAttribute('aria-hidden', 'true');
    sg.prepend(th);
    const x = on.offsetLeft;
    const w = on.offsetWidth;
    const old = prev[sg.getAttribute('aria-label')];
    if (old && (old.x !== x || old.w !== w) && !reducedMotion()) {
      th.style.transition = 'none';
      th.style.transform = `translateX(${old.x}px)`;
      th.style.width = `${old.w}px`;
      th.getBoundingClientRect();
      th.style.transition = '';
    }
    th.style.transform = `translateX(${x}px)`;
    th.style.width = `${w}px`;
    th.dataset.x = x;
    th.dataset.w = w;
  });
}
function segThumbState() {
  const out = {};
  document.querySelectorAll('#view .segmented').forEach((sg) => {
    const th = sg.querySelector('.seg-thumb');
    if (th) out[sg.getAttribute('aria-label')] = { x: Number(th.dataset.x), w: Number(th.dataset.w) };
  });
  return out;
}
function placeTabThumb() {
  const on = document.querySelector('.tab[aria-current="page"]');
  const th = $('.tab-thumb');
  if (!on || !th) return;
  th.style.width = `${on.offsetWidth}px`;
  th.style.transform = `translateX(${on.offsetLeft}px)`;
}
function updateTopbar() {
  const t = $('#view .page-title');
  $('#topbar .topbar-title').textContent = t ? t.textContent : '';
}
let lastScrollY = 0;
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  $('#topbar').classList.toggle('show', y > 46);
  const tb = $('.tabbar');
  if (y > lastScrollY + 6 && y > 160) tb.classList.add('compact');
  else if (y < lastScrollY - 6 || y < 80) tb.classList.remove('compact');
  lastScrollY = y;
}, { passive: true });
if (window.ResizeObserver) new ResizeObserver(placeTabThumb).observe($('.tabbar'));

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

let sheetCloseTimer = null;
function openSheet(html) {
  clearTimeout(sheetCloseTimer);
  const w = $('#sheet');
  w.classList.remove('closing');
  $('#sheet-body').innerHTML = html;
  w.querySelector('.sheet').scrollTop = 0;
  w.hidden = false;
  document.body.style.overflow = 'hidden';
  setTimeout(() => $('#sheet .sheet').focus?.(), 50);
}
function closeSheet(instant = false) {
  const w = $('#sheet');
  if (w.hidden) return;
  const done = () => {
    w.hidden = true;
    w.classList.remove('closing');
    $('#sheet-body').innerHTML = '';
    if (!ui.restOpen) document.body.style.overflow = '';
  };
  clearTimeout(sheetCloseTimer);
  if (instant || reducedMotion()) return done();
  w.classList.add('closing');
  sheetCloseTimer = setTimeout(done, 220);
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

function startTimer(seconds, label, ctx = {}) {
  if (!seconds) return;
  state.timer = {
    end: Date.now() + seconds * 1000, total: seconds, label, finishedAt: 0,
    session: ctx.session || null, next: ctx.session ? nextSetAfter(ctx.session, ctx.exId, ctx.i) : null,
  };
  saveNow();
  primeAudio();
  runTimer();
  if (state.settings.restFull) openRest();
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
  if (ui.restOpen) closeRest();
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
    html = `<span class="t-time" data-action="rest-open">0:00</span><span class="grow" data-action="rest-open"><b>Czas na serię</b><span class="t-label t-over">${over >= 5 ? `+${mmss(over)} po przerwie` : esc(t.label)}</span></span>
      <button class="btn btn-primary" data-action="timer-skip">OK</button>`;
  } else {
    el.className = 'timer glass';
    html = `<span class="t-time" data-action="rest-open">${mmss(left)}</span><span class="grow t-label" data-action="rest-open">Przerwa</span>
      ${clockBtn()}
      <button class="btn" data-action="timer-add" aria-label="Dodaj 15 sekund">+15 s</button>
      <button class="btn" data-action="timer-skip">Pomiń</button>`;
  }
  // przepisujemy tylko przy zmianie, żeby nie podmieniać przycisku pod palcem
  if (html !== timer.html) { el.innerHTML = html; timer.html = html; }
  el.hidden = ui.restOpen;
  if (ui.restOpen) updateRest(t);
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
  // rekordy: boje główne względem maksa z planu, reszta względem najlepszej serii w historii
  const prs = [];
  for (const e of entries) {
    const ex = EX_BY_ID[e.exId];
    const now = entryBest(e);
    if (ex.main) {
      const prev = liftHistory(ex.main).reduce((m, p) => Math.max(m, p.v), liftE1RM(ex.main));
      if (now > prev + 0.05) prs.push(`${LIFTS[ex.main].short}: szacowany maks ${fmt(now)} kg`);
    } else if (ex.unit !== 'm' && now > 0) {
      const prev = exHistory(ex.id).reduce((m, h) => Math.max(m, h.v), 0);
      if (prev > 0 && now > prev + 0.05) prs.push(`${ex.name}: szacowany maks ${fmt(now, 0)} kg`);
    }
  }
  const date = d.date || todayISO();
  const prev = sortedWorkouts().filter((x) => x.session === ui.session && x.date <= date).pop() || null;
  // czas: od pierwszej odhaczonej serii; jeśli zapis był dużo później, liczymy do ostatniej serii + 3 min
  const now = Date.now();
  const lastDone = Math.max(0, ...Object.values(d.entries).flatMap((x) => x.sets.map((y) => y.doneAt || 0)));
  const end = lastDone && now - lastDone > 30 * 60000 ? lastDone + 3 * 60000 : now;
  const duration = d.startedAt ? Math.round((end - d.startedAt) / 1000) : null;
  const w = { id: uid(), date, week: d.week, session: ui.session, entries, createdAt: now, startedAt: d.startedAt || null, duration };
  state.workouts.push(w);
  state.planned = state.planned.filter((p) => !(p.date === date && p.session === w.session));
  delete state.drafts[ui.session];
  stopTimer();
  ui.session = nextSessionId();
  ui.week = currentWeek().week;
  saveNow();
  render();
  window.scrollTo({ top: 0 });
  summarySheet(w, prev, prs);
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
      const sync = state.sync;
      state = loadState();
      state.sync = sync;
      saveNow();
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
        set.doneAt = Date.now();
        if (!d.startedAt) d.startedAt = set.doneAt;
        const row = el.closest('.set-row');
        const repsInput = row.querySelector('[data-k="reps"]');
        if (!set.reps && repsInput.placeholder) set.reps = repsInput.placeholder;
        const ex = EX_BY_ID[el.dataset.ex];
        startTimer(ex.rest, ex.name, { session: ui.session, exId: ex.id, i: Number(el.dataset.i) });
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
    case 'open-workout': if (!ui.moving) workoutSheet(el.dataset.id); break;
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
      if (window.cloudState?.email) {
        // zalogowany: czyścimy tylko to urządzenie, dane w chmurze zostają
        if (confirm('Wylogować i usunąć dane z tego urządzenia? Dane w chmurze zostaną.')) {
          window.cloud.signOut().finally(() => {
            localStorage.removeItem(STORAGE_KEY);
            state = loadState();
            ui.session = null; ui.week = null;
            render(); toast('Wylogowano, dane z urządzenia usunięte');
          });
        }
        break;
      }
      if (confirm('Usunąć wszystkie treningi, pomiary i ustawienia?') && confirm('Na pewno? Bez kopii tych danych nie da się odzyskać.')) {
        localStorage.removeItem(STORAGE_KEY);
        state = loadState();
        ui.session = null; ui.week = null;
        render(); toast('Dane usunięte');
      }
      break;
    case 'cloud-signin':
    case 'cloud-signup':
    case 'cloud-reset': cloudAuth(a); break;
    case 'cloud-signout':
      if (confirm('Wylogować? Dane zostaną na tym urządzeniu i w chmurze.')) window.cloud?.signOut().then(() => toast('Wylogowano'));
      break;
    case 'close-sheet': closeSheet(); break;
    case 'timer-add':
      if (state.timer) {
        if (state.timer.end < Date.now()) { state.timer.end = Date.now(); state.timer.total = 0; }
        state.timer.end += 15000; state.timer.total += 15; state.timer.finishedAt = 0; saveSoon(); tickTimer();
      }
      break;
    case 'timer-sub':
      if (state.timer) { state.timer.end -= 15000; state.timer.total = Math.max(1, state.timer.total - 15); saveSoon(); tickTimer(); }
      break;
    case 'rest-open': if (state.timer) openRest(); break;
    case 'rest-min': closeRest(); break;
    case 'open-ex': exerciseSheet(el.dataset.ex); break;
    case 'cal-prev': shiftMonth(-1); break;
    case 'cal-next': shiftMonth(1); break;
    case 'cal-today': {
      const cur = ui.calMonth || todayISO().slice(0, 7);
      ui.calAnim = cur < todayISO().slice(0, 7) ? 'next' : 'prev';
      ui.calMonth = null; ui.calSel = todayISO(); render(); break;
    }
    case 'cal-day': {
      const date = el.dataset.date;
      if (ui.moving) { moveItem(ui.moving.type, ui.moving.id, date); break; }
      const ym = date.slice(0, 7);
      if (ym !== (ui.calMonth || todayISO().slice(0, 7))) { ui.calAnim = ym > (ui.calMonth || todayISO().slice(0, 7)) ? 'next' : 'prev'; ui.calMonth = ym; }
      ui.calSel = date;
      haptic();
      render();
      break;
    }
    case 'plan-add':
      state.planned.push({ id: uid(), date: el.dataset.date, session: v });
      saveNow(); haptic(); render(); toast(`Zaplanowano ${SESSION_BY_ID[v].name}, ${dShort(el.dataset.date)}`);
      break;
    case 'plan-del':
      state.planned = state.planned.filter((p) => p.id !== el.dataset.id);
      saveNow(); render();
      break;
    case 'move-start':
      closeSheet(true);
      ui.moving = { type: el.dataset.type, id: el.dataset.id };
      render();
      break;
    case 'move-cancel': ui.moving = null; render(); break;
    case 'set-session-go': ui.session = v; ui.week = null; location.hash = 'trening'; break;
    case 'measure-now': location.hash = 'pomiary'; setTimeout(() => measureForm(null), 60); break;
    case 'ics-measure': icsMeasure(); break;
    case 'ics-plan': icsPlanned(); break;
    case 'photo-add': $('#photo-file')?.click(); break;
    case 'photo-open': photoSheet(el.dataset.id); break;
    case 'photo-compare': compareSheet(el.dataset.id); break;
    case 'photo-del':
      if (confirm('Usunąć to zdjęcie?')) photos.del(el.dataset.id).then(() => { closeSheet(); fillPhotos(); toast('Zdjęcie usunięte'); });
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
  if (t.classList.contains('cmp-range')) { t.parentElement.style.setProperty('--x', `${t.value}%`); return; }
  const inRest = !!t.closest('#rest');
  if (t.dataset.k && (ui.tab === 'trening' || inRest)) {
    const d = state.drafts[inRest ? state.timer?.session : ui.session];
    if (!d) return;
    if (inRest) {
      // to samo pole w liście ćwiczeń i talerze na bieżąco
      const twin = document.querySelector(`#view input[data-ex="${t.dataset.ex}"][data-i="${t.dataset.i}"][data-k="${t.dataset.k}"]`);
      if (twin) twin.value = t.value;
      const pl = $('#rest .rest-plates');
      if (pl && t.dataset.k === 'kg') pl.innerHTML = platesHTML(toNum(t.value));
    }
    if (t.dataset.k === 'date') d.date = t.value;
    else if (t.dataset.k === 'rpe') {
      const v = fmt(Number(t.value));
      d.entries[t.dataset.ex].rpe = v;
      const wrap = t.closest('.rpe-wrap');
      wrap.classList.remove('unset');
      wrap.querySelector('.rpe-val').textContent = `RPE ${v}`;
      wrap.querySelector('.rpe-desc').textContent = rpeDesc(v);
      t.style.setProperty('--p', `${((Number(t.value) - 6) / 4) * 100}%`);
      if (Number(t.value) % 1 === 0) haptic();
    } else if (t.dataset.k === 'note') d.entries[t.dataset.ex].note = t.value;
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
  if (t.id === 'photo-file' && t.files?.[0]) {
    const f = t.files[0];
    t.value = '';
    compressImage(f).then(photoForm).catch(() => toast('Nie udało się wczytać zdjęcia'));
    return;
  }
  if (t.dataset.cmp) {
    const other = t.dataset.other;
    if (t.dataset.cmp === 'a') compareSheet(other, t.value);
    else compareSheet(t.value, other);
    return;
  }
  if (t.dataset.plate) {
    const p = Number(t.dataset.plate);
    const set = new Set(state.settings.plates);
    if (t.checked) set.add(p); else set.delete(p);
    state.settings.plates = [...set].sort((a, b) => b - a);
    saveNow(); render();
    return;
  }
  if (t.dataset.opt) {
    const val = t.type === 'checkbox' ? t.checked : t.dataset.num ? toNum(t.value) : t.value;
    if (val == null || val === '') { toast('Wpisz wartość'); render(); return; }
    setByPath(state.settings, t.dataset.opt, val);
    saveNow(); render();
    return;
  }
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
  if (e.target.id === 'photo-form') {
    e.preventDefault();
    const fd = new FormData(e.target);
    const blob = ui.pendingPhoto;
    ui.pendingPhoto = null;
    if (!blob) return;
    photos.put({ id: uid(), date: fd.get('date') || todayISO(), pose: fd.get('pose') || 'front', blob, createdAt: Date.now() })
      .then(() => { closeSheet(); fillPhotos(); toast('Zdjęcie zapisane na tym telefonie'); navigator.storage?.persist?.(); })
      .catch(() => toast('Za mało miejsca na zdjęcie'));
    return;
  }
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
  const next = ['trening', 'historia', 'postep', 'pomiary', 'plan'].includes(tab) ? tab : 'trening';
  const swap = () => {
    ui.tab = next;
    ui.moving = null;
    closeSheet(true);
    render();
    window.scrollTo({ top: 0 });
  };
  // płynne przejście między zakładkami (Safari 18+, Chrome)
  if (document.startViewTransition && ui.booted && !reducedMotion() && next !== ui.tab && document.visibilityState === 'visible') {
    const vt = document.startViewTransition(swap);
    vt.ready.catch(() => {}); // przerwane przejście (np. aplikacja w tle) nie jest błędem
  } else swap();
  ui.booted = true;
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
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!$('#sheet').hidden) closeSheet();
  else if (ui.restOpen) closeRest();
});
dragToDismiss($('#sheet .sheet'), () => closeSheet(true), () => $('#sheet .sheet').scrollTop <= 0);
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
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {}));
}
route();
// timer sprzed zamknięcia aplikacji; skończony ponad 15 min temu już nikomu się nie przyda
if (state.timer && Date.now() - state.timer.end < 15 * 60000) runTimer();
else if (state.timer) stopTimer();
