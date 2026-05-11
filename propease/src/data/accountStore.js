/**
 * accountStore.js
 *
 * Persistent encrypted key-value account storage using AsyncStorage.
 *
 * Works on:  Android, iOS, Expo Go, Snack, Web — everywhere.
 * Persists:  Survives app restarts and device reboots.
 * Encrypted: Each value is XOR-encrypted with a rotating key before
 *            being written to disk. Passwords are additionally hashed
 *            with SHA-256 (pure-JS implementation — no native modules).
 *
 * Storage layout (AsyncStorage keys):
 *   @propease/index          → JSON array of account IDs
 *   @propease/acct/<id>      → encrypted JSON account object
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Encryption key ────────────────────────────────────────────
// Change this string to rotate encryption for a new deployment.
const ENC_KEY = 'PropEase@2025#Secure$Storage!Key';

// ── XOR cipher (symmetric — encrypt = decrypt) ───────────────
function xorEncrypt(text) {
  const key = ENC_KEY;
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  // base64 encode so it's safe to store as a string
  return btoa(unescape(encodeURIComponent(result)));
}

function xorDecrypt(encoded) {
  try {
    const text = decodeURIComponent(escape(atob(encoded)));
    const key  = ENC_KEY;
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(
        text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return result;
  } catch (_) {
    return null;
  }
}

// ── Pure-JS SHA-256 password hashing ─────────────────────────
// Derived from the public-domain implementation by Chris Veness.
function sha256(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let result = '';
  const words = [];
  const asciiBitLength = ascii.length * 8;

  let hash = [];
  const k  = [];
  let primeCounter = 0;

  const isComposite = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i = candidate * candidate; i < 313; i += candidate) {
        isComposite[i] = true;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++]  = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  ascii += '\x80';
  while (ascii.length % 64 !== 56) ascii += '\x00';

  for (let i = 0; i < ascii.length; i++) {
    const j = ascii.charCodeAt(i);
    if (j >> 8) return '';
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words.length] = ((asciiBitLength / maxWord) | 0);
  words[words.length] = (asciiBitLength | 0);

  for (let j = 0; j < words.length;) {
    const w = words.slice(j, j += 16);
    const oldHash = hash.slice(0);
    for (let i = 0; i < 64; i++) {
      const i2 = i < 16
        ? w[i]
        : (rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10))
          + w[i - 7]
          + (rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3))
          + w[i - 16];
      w[i] = i2;
      const t1 = hash[7]
        + (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25))
        + ((hash[4] & hash[5]) ^ (~hash[4] & hash[6]))
        + k[i] + i2;
      const t2 = (rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22))
        + ((hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]));
      hash = [(t1 + t2) | 0, hash[0], hash[1], hash[2],
              (hash[3] + t1) | 0, hash[4], hash[5], hash[6]];
    }
    for (let i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (let i = 0; i < 8; i++) {
    for (let j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += ((b < 16) ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

function hashPassword(plain) {
  return sha256('propease_v1::' + plain);
}

// ── AsyncStorage helpers ──────────────────────────────────────
const INDEX_KEY  = '@propease/index';
const acctKey    = (id) => `@propease/acct/${id}`;

async function readIndex() {
  try {
    const raw = await AsyncStorage.getItem(INDEX_KEY);
    if (raw) return JSON.parse(xorDecrypt(raw) || '[]');
  } catch (_) {}
  return [];
}

async function writeIndex(ids) {
  await AsyncStorage.setItem(INDEX_KEY, xorEncrypt(JSON.stringify(ids)));
}

async function readAccount(id) {
  try {
    const raw = await AsyncStorage.getItem(acctKey(id));
    if (raw) {
      const dec = xorDecrypt(raw);
      if (dec) return JSON.parse(dec);
    }
  } catch (_) {}
  return null;
}

async function writeAccount(account) {
  await AsyncStorage.setItem(
    acctKey(account.id),
    xorEncrypt(JSON.stringify(account))
  );
}

async function readAllAccounts() {
  const ids = await readIndex();
  const accounts = await Promise.all(ids.map(readAccount));
  return accounts.filter(Boolean);
}

// ── Demo accounts ─────────────────────────────────────────────
const DEMO_ACCOUNTS = [
  { email: 'rajesh@propease.in',    password: 'admin123', name: 'Rajesh Kumar', mobile: '9876543210', countryCode: '+91', role: 'manager'  },
  { email: 'john@propease.com',     password: 'admin123', name: 'John Smith',   mobile: '4155550100', countryCode: '+1',  role: 'manager'  },
  { email: 'priya.verma@gmail.com', password: 'priya123', name: 'Priya Verma',  mobile: '9845678901', countryCode: '+91', role: 'customer' },
  { email: 'amit.patel@gmail.com',  password: 'amit123',  name: 'Amit Patel',   mobile: '9812345678', countryCode: '+91', role: 'customer' },
];

async function seedIfEmpty() {
  const ids      = await readIndex();
  const existing = (await Promise.all(ids.map(readAccount))).filter(Boolean);
  const allIds   = [...ids];
  let   changed  = false;

  // Always ensure manager demo accounts exist
  for (const [i, demo] of DEMO_ACCOUNTS.filter(d => d.role === 'manager').entries()) {
    const id = 'demo_mgr_' + i;
    const alreadyExists = existing.some(
      a => a.mobile === demo.mobile && a.countryCode === demo.countryCode
    );
    if (!alreadyExists) {
      await writeAccount({
        id,
        name:         demo.name,
        mobile:       demo.mobile,
        countryCode:  demo.countryCode,
        email:        demo.email.toLowerCase(),
        passwordHash: hashPassword(demo.password),
        role:         demo.role,
      });
      if (!allIds.includes(id)) allIds.push(id);
      changed = true;
    }
  }

  // Seed customer demo accounts on first launch only
  if (existing.length === 0) {
    for (const [i, demo] of DEMO_ACCOUNTS.filter(d => d.role !== 'manager').entries()) {
      const id = 'demo_cust_' + i;
      await writeAccount({
        id,
        name:         demo.name,
        mobile:       demo.mobile,
        countryCode:  demo.countryCode,
        email:        demo.email.toLowerCase(),
        passwordHash: hashPassword(demo.password),
        role:         demo.role,
      });
      allIds.push(id);
      changed = true;
    }
  }

  if (changed) await writeIndex(allIds);
}

// ── Public API ────────────────────────────────────────────────

/** Call once at app startup. */
export async function initAccountStore() {
  await seedIfEmpty();
}

/**
 * Register a new account.
 * Returns { success: true } or { success: false, error: string }
 */
export async function registerAccount({ name, mobile, countryCode, email, password }) {
  const emailLower = email ? email.toLowerCase().trim() : '';
  const accounts   = await readAllAccounts();

  if (accounts.some(a => a.mobile === mobile && a.countryCode === countryCode)) {
    return { success: false, error: `An account with ${countryCode} ${mobile} already exists. Please log in.` };
  }
  if (emailLower && accounts.some(a => a.email === emailLower)) {
    return { success: false, error: `An account with "${emailLower}" already exists. Please log in.` };
  }

  const ids = await readIndex();
  const id  = 'user_' + Date.now();

  await writeAccount({
    id, name, mobile, countryCode,
    email:        emailLower,
    passwordHash: hashPassword(password),
    role:         'manager',
  });
  await writeIndex([...ids, id]);
  return { success: true };
}

/**
 * Attempt login.
 * Returns { found, wrongPassword, account }
 */
export async function findAccount({ loginMode, identifier, countryCode, password }) {
  const accounts   = await readAllAccounts();
  const emailLower = loginMode === 'email' ? identifier.toLowerCase().trim() : '';

  const match = (a) =>
    loginMode === 'phone'
      ? a.mobile === identifier.trim() && a.countryCode === countryCode
      : a.email === emailLower;

  const accountExists = accounts.some(match);
  if (!accountExists) return { found: false, wrongPassword: false, account: null };

  const inputHash = hashPassword(password);
  const account   = accounts.find(a => match(a) && a.passwordHash === inputHash);
  if (!account)   return { found: true, wrongPassword: true,  account: null };

  return { found: true, wrongPassword: false, account };
}