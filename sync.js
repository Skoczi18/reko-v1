// Synchronizacja z Firebase (darmowy plan Spark): konto e-mail + Firestore.
// Źródłem prawdy na urządzeniu nadal jest localStorage z app.js; tu tylko
// wysyłamy zmiany do chmury i wpuszczamy zmiany z innych urządzeń.
//
// Układ danych w Firestore (reguły: każdy widzi tylko users/{swoje uid}/**):
//   users/{uid}                       { data: JSON ustawień i szkiców, updatedAt, device }
//   users/{uid}/workouts/{id}         { data: JSON treningu, deleted, updatedAt }
//   users/{uid}/measurements/{id}     { data: JSON pomiaru, deleted, updatedAt }
// Usunięcie zostawia „nagrobek” (deleted: true), żeby inne urządzenie wiedziało,
// że ma skasować u siebie, a nie wysłać to z powrotem.

import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js';
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail, signOut,
} from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js';
import {
  initializeFirestore, persistentLocalCache, doc, collection, onSnapshot, writeBatch,
} from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyAlY79IGPo8Owh5VTMG6Y_Kx69-PCcIIjw',
  authDomain: 'silownia-reko.firebaseapp.com',
  projectId: 'silownia-reko',
  storageBucket: 'silownia-reko.firebasestorage.app',
  messagingSenderId: '844842048456',
  appId: '1:844842048456:web:3b7d5e489a256df1693efd',
};

const fbApp = initializeApp(firebaseConfig);
const auth = getAuth(fbApp);
auth.languageCode = 'pl';
const db = initializeFirestore(fbApp, { localCache: persistentLocalCache() });

const COLS = ['workouts', 'measurements'];
const DEVICE = (() => {
  try {
    let id = localStorage.getItem('silownia.device');
    if (!id) { id = Math.random().toString(36).slice(2, 10); localStorage.setItem('silownia.device', id); }
    return id;
  } catch (e) { return 'x'; }
})();

let user = null;
let unsubs = [];
let ready = new Set();               // które nasłuchy dostały już pierwszy snapshot
let known = { workouts: new Map(), measurements: new Map() }; // id -> JSON w chmurze (null = nagrobek)
let cloudMeta = '';                  // JSON ustawień, który jest teraz w chmurze
let pushTimer = null;

// ustawienia, szkice i plan w kalendarzu; timer zostaje lokalny dla urządzenia
const metaOf = (s) => JSON.stringify({ settings: s.settings, drafts: s.drafts, planned: s.planned });

function setStatus(status, detail = '') {
  window.cloudState = { ...window.cloudState, status, detail, email: user?.email || '' };
  window.onCloudStatus?.();
}

function stopListening() {
  unsubs.forEach((u) => u());
  unsubs = [];
  ready = new Set();
  known = { workouts: new Map(), measurements: new Map() };
  cloudMeta = '';
}

function markReady(key) {
  ready.add(key);
  if (ready.size === COLS.length + 1) {
    state.sync = { ...(state.sync || {}), uid: user.uid };
    pushNow();
    setStatus('ok');
  }
}

function startListening(uid) {
  stopListening();
  setStatus('syncing');
  const fail = (e) => { console.warn('sync', e); setStatus('error', e.code || e.message); };

  unsubs.push(onSnapshot(doc(db, 'users', uid), (snap) => {
    const d = snap.data();
    if (d?.data) {
      const firstTime = state.sync?.uid !== uid;
      const newer = (d.updatedAt || 0) > (state.sync?.metaAt || 0);
      cloudMeta = d.data;
      if ((firstTime || (newer && d.device !== DEVICE)) && d.data !== metaOf(state)) {
        const m = JSON.parse(d.data);
        window.applyRemote((s) => {
          s.settings = { ...s.settings, ...m.settings };
          s.drafts = m.drafts || {};
          if (Array.isArray(m.planned)) s.planned = m.planned;
          s.sync = { ...(s.sync || {}), metaAt: d.updatedAt || Date.now() };
          cloudMeta = metaOf(s); // żeby nie odesłać tego samego z powrotem
        });
      }
    }
    markReady('meta');
  }, fail));

  for (const col of COLS) {
    unsubs.push(onSnapshot(collection(db, 'users', uid, col), (snap) => {
      const changes = [];
      snap.docChanges().forEach((ch) => {
        if (ch.type === 'removed') { known[col].delete(ch.doc.id); return; }
        const d = ch.doc.data();
        known[col].set(ch.doc.id, d.deleted ? null : d.data);
        changes.push([ch.doc.id, d.deleted ? null : d.data]);
      });
      const dirty = changes.some(([id, j]) => {
        const local = state[col].find((x) => x.id === id);
        return j === null ? !!local : !local || JSON.stringify(local) !== j;
      });
      if (dirty) {
        window.applyRemote((s) => {
          for (const [id, j] of changes) {
            const i = s[col].findIndex((x) => x.id === id);
            if (j === null) { if (i >= 0) s[col].splice(i, 1); }
            else if (i >= 0) s[col][i] = JSON.parse(j);
            else s[col].push(JSON.parse(j));
          }
        });
      }
      markReady(col);
    }, fail));
  }
}

// Wysyła różnicę między stanem lokalnym a tym, co wiemy o chmurze.
async function pushNow() {
  clearTimeout(pushTimer);
  if (!user || ready.size < COLS.length + 1) return;
  const uid = user.uid;
  const now = Date.now();
  const ops = [];
  for (const col of COLS) {
    const ids = new Set();
    for (const item of state[col]) {
      if (!item?.id) continue;
      ids.add(item.id);
      const j = JSON.stringify(item);
      if (known[col].get(item.id) !== j) {
        known[col].set(item.id, j);
        ops.push([doc(db, 'users', uid, col, item.id), { data: j, deleted: false, updatedAt: now }]);
      }
    }
    for (const [id, j] of known[col]) {
      if (j !== null && !ids.has(id)) {
        known[col].set(id, null);
        ops.push([doc(db, 'users', uid, col, id), { deleted: true, updatedAt: now }]);
      }
    }
  }
  const meta = metaOf(state);
  if (meta !== cloudMeta) {
    cloudMeta = meta;
    state.sync = { ...(state.sync || {}), uid, metaAt: now };
    ops.push([doc(db, 'users', uid), { data: meta, updatedAt: now, device: DEVICE }]);
  }
  if (!ops.length) return;
  setStatus('syncing');
  try {
    // limit Firestore: 500 zapisów w jednej paczce
    for (let i = 0; i < ops.length; i += 400) {
      const b = writeBatch(db);
      ops.slice(i, i + 400).forEach(([ref, data]) => b.set(ref, data));
      await b.commit();
    }
    setStatus('ok');
  } catch (e) {
    console.warn('sync push', e);
    setStatus('error', e.code || e.message);
  }
}

// app.js woła to po każdym zapisie w localStorage
window.onLocalSave = () => {
  if (!user) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(pushNow, 1200);
};
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') pushNow(); });

const PL_ERR = {
  'auth/invalid-email': 'Niepoprawny adres e-mail.',
  'auth/missing-password': 'Wpisz hasło.',
  'auth/weak-password': 'Hasło musi mieć co najmniej 6 znaków.',
  'auth/email-already-in-use': 'To konto już istnieje. Zaloguj się.',
  'auth/invalid-credential': 'Zły e-mail albo hasło.',
  'auth/wrong-password': 'Zły e-mail albo hasło.',
  'auth/user-not-found': 'Nie ma takiego konta. Załóż je.',
  'auth/too-many-requests': 'Za dużo prób. Spróbuj za kilka minut.',
  'auth/network-request-failed': 'Brak internetu.',
};
const plErr = (e) => PL_ERR[e.code] || `Błąd: ${e.code || e.message}`;

window.cloud = {
  async signIn(email, pass) {
    try { await signInWithEmailAndPassword(auth, email, pass); return null; } catch (e) { return plErr(e); }
  },
  async signUp(email, pass) {
    try { await createUserWithEmailAndPassword(auth, email, pass); return null; } catch (e) { return plErr(e); }
  },
  async reset(email) {
    try { await sendPasswordResetEmail(auth, email); return null; } catch (e) { return plErr(e); }
  },
  async signOut() {
    await pushNow();
    await signOut(auth);
  },
  syncNow: pushNow,
};

onAuthStateChanged(auth, (u) => {
  user = u;
  if (u) startListening(u.uid);
  else { stopListening(); setStatus('signed-out'); }
});

setStatus('loading');
