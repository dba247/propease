/**
 * accountStore.js
 *
 * Self-contained encrypted key-value account storage.
 * NO external imports — works in Snack, Expo Go, and production builds.
 *
 * Storage engine (auto-selected):
 *   1. localStorage  — web / Snack (persists across refreshes)
 *   2. Module-level Map — fallback (in-memory, session only)
 *
 * Encryption: XOR cipher + base64 (pure JS)
 * Passwords:  SHA-256 pure-JS hash
 */

// ── Storage engine (no imports needed) ───────────────────────
const storage = (() => {
  try {
    // Test if localStorage is available (web / Snack)
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('__pe_test__', '1');
      window.localStorage.removeItem('__pe_test__');
      return {
        get: (key) => window.localStorage.getItem(key),
        set: (key, val) => window.localStorage.setItem(key, val),
        remove: (key) => window.localStorage.removeItem(key),
      };
    }
  } catch (_) {}

  // Fallback: module-level Map (survives component remounts)
  const map = new Map();
  return {
    get: (key) => map.get(key) || null,
    set: (key, val) => map.set(key, val),
    remove: (key) => map.delete(key),
  };
})();

// ── XOR encryption ────────────────────────────────────────────
const ENC_KEY = 'PropEase@2025#Secure$Storage!Key';

function encrypt(text) {
  try {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(
        text.charCodeAt(i) ^ ENC_KEY.charCodeAt(i % ENC_KEY.length)
      );
    }
    return btoa(unescape(encodeURIComponent(result)));
  } catch (_) { return btoa(text); }
}

function decrypt(encoded) {
  try {
    const text = decodeURIComponent(escape(atob(encoded)));
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(
        text.charCodeAt(i) ^ ENC_KEY.charCodeAt(i % ENC_KEY.length)
      );
    }
    return result;
  } catch (_) { return null; }
}

// ── Pure-JS SHA-256 ───────────────────────────────────────────
function sha256(ascii) {
  function rr(v, a) { return (v >>> a) | (v << (32 - a)); }
  const mp = Math.pow, mw = mp(2, 32);
  let result = '', words = [];
  const ab = ascii.length * 8;
  let hash = [], k = [], pc = 0;
  const ic = {};
  for (let c = 2; pc < 64; c++) {
    if (!ic[c]) {
      for (let i = c * c; i < 313; i += c) ic[i] = true;
      hash[pc] = (mp(c, 0.5) * mw) | 0;
      k[pc++]  = (mp(c, 1/3) * mw) | 0;
    }
  }
  ascii += '\x80';
  while (ascii.length % 64 !== 56) ascii += '\x00';
  for (let i = 0; i < ascii.length; i++) {
    words[i >> 2] |= ascii.charCodeAt(i) << ((3 - i) % 4) * 8;
  }
  words[words.length] = ((ab / mw) | 0);
  words[words.length] = (ab | 0);
  for (let j = 0; j < words.length;) {
    const w = words.slice(j, j += 16);
    const oh = hash.slice(0);
    for (let i = 0; i < 64; i++) {
      const i2 = i < 16 ? w[i]
        : (rr(w[i-2],17)^rr(w[i-2],19)^(w[i-2]>>>10)) + w[i-7]
          + (rr(w[i-15],7)^rr(w[i-15],18)^(w[i-15]>>>3)) + w[i-16];
      w[i] = i2;
      const t1 = hash[7] + (rr(hash[4],6)^rr(hash[4],11)^rr(hash[4],25))
        + ((hash[4]&hash[5])^(~hash[4]&hash[6])) + k[i] + i2;
      const t2 = (rr(hash[0],2)^rr(hash[0],13)^rr(hash[0],22))
        + ((hash[0]&hash[1])^(hash[0]&hash[2])^(hash[1]&hash[2]));
      hash = [(t1+t2)|0,hash[0],hash[1],hash[2],(hash[3]+t1)|0,hash[4],hash[5],hash[6]];
    }
    for (let i = 0; i < 8; i++) hash[i] = (hash[i] + oh[i]) | 0;
  }
  for (let i = 0; i < 8; i++)
    for (let j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j*8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  return result;
}

function hashPassword(plain) {
  return sha256('propease_v1::' + plain);
}

// ── Storage keys ──────────────────────────────────────────────
const INDEX_KEY = 'pe_idx';
const acctKey   = (id) => `pe_ac_${id}`;

function readIndex() {
  try {
    const raw = storage.get(INDEX_KEY);
    if (raw) return JSON.parse(decrypt(raw) || '[]');
  } catch (_) {}
  return [];
}

function writeIndex(ids) {
  storage.set(INDEX_KEY, encrypt(JSON.stringify(ids)));
}

function readAccount(id) {
  try {
    const raw = storage.get(acctKey(id));
    if (raw) { const d = decrypt(raw); if (d) return JSON.parse(d); }
  } catch (_) {}
  return null;
}

function writeAccount(account) {
  storage.set(acctKey(account.id), encrypt(JSON.stringify(account)));
}

function readAllAccounts() {
  return readIndex().map(readAccount).filter(Boolean);
}

// ── Demo accounts ─────────────────────────────────────────────
const DEMO_ACCOUNTS = [
  // Only one authorised management account
  { email: 'propeasemgr@propease.in', password: 'admin123', name: 'PropEase Manager', mobile: '9494154838', countryCode: '+1', role: 'manager' },
  // Customer demo accounts
  { email: 'priya.verma@gmail.com', password: 'priya123', name: 'Priya Verma', mobile: '9845678901', countryCode: '+91', role: 'customer' },
  { email: 'amit.patel@gmail.com',  password: 'amit123',  name: 'Amit Patel',  mobile: '9812345678', countryCode: '+91', role: 'customer' },
];

function seedManagers() {
  // Clear stale manager accounts that no longer match the locked credentials,
  // then always write the current authorised manager account.
  let ids    = readIndex();
  let allIds = [...ids];

  // Remove any old manager accounts with wrong credentials
  const staleIds = ids.filter(id => {
    const acct = readAccount(id);
    return acct && acct.role === 'manager' && acct.email !== 'propeasemgr@propease.in';
  });
  staleIds.forEach(id => {
    storage.remove(acctKey(id));
    allIds = allIds.filter(i => i !== id);
  });

  for (const [i, demo] of DEMO_ACCOUNTS.filter(d => d.role === 'manager').entries()) {
    const id = 'demo_mgr_' + i;
    writeAccount({
      id,
      name:         demo.name,
      mobile:       demo.mobile,
      countryCode:  demo.countryCode,
      email:        demo.email.toLowerCase(),
      passwordHash: hashPassword(demo.password),
      role:         demo.role,
    });
    if (!allIds.includes(id)) allIds.push(id);
  }

  // Seed customer demo accounts only on first launch (no index yet)
  if (ids.length === 0) {
    for (const [i, demo] of DEMO_ACCOUNTS.filter(d => d.role !== 'manager').entries()) {
      const id = 'demo_cust_' + i;
      writeAccount({
        id,
        name:         demo.name,
        mobile:       demo.mobile,
        countryCode:  demo.countryCode,
        email:        demo.email.toLowerCase(),
        passwordHash: hashPassword(demo.password),
        role:         demo.role,
      });
      allIds.push(id);
    }
  }

  writeIndex(allIds);
}

// ── Public API (synchronous — no async needed) ────────────────

export function initAccountStore() {
  seedManagers();
}

export function registerAccount({ name, mobile, countryCode, email, password }) {
  const emailLower = email ? email.toLowerCase().trim() : '';
  const accounts   = readAllAccounts();

  if (accounts.some(a => a.mobile === mobile && a.countryCode === countryCode))
    return { success: false, error: `An account with ${countryCode} ${mobile} already exists.` };
  if (emailLower && accounts.some(a => a.email === emailLower))
    return { success: false, error: `An account with "${emailLower}" already exists.` };

  const id = 'user_' + Date.now();
  writeAccount({ id, name, mobile, countryCode, email: emailLower,
    passwordHash: hashPassword(password), role: 'manager' });
  writeIndex([...readIndex(), id]);
  return { success: true };
}

export function findAccount({ loginMode, identifier, countryCode, password }) {
  const accounts   = readAllAccounts();
  const emailLower = loginMode === 'email' ? identifier.toLowerCase().trim() : '';

  const match = (a) => loginMode === 'phone'
    ? a.mobile === identifier.trim() && a.countryCode === countryCode
    : a.email === emailLower;

  if (!accounts.some(match)) return { found: false, wrongPassword: false, account: null };

  const account = accounts.find(a => match(a) && a.passwordHash === hashPassword(password));
  if (!account)  return { found: true, wrongPassword: true, account: null };

  return { found: true, wrongPassword: false, account };
}