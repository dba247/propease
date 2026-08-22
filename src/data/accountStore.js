/**
 * accountStore.js
 *
 * Account storage backed by Firebase Firestore.
 * All reads/writes are async and synced across every device in real time.
 *
 * Collection layout:
 *   accounts/          ← one document per user account
 *     {id}
 *       id, name, mobile, countryCode, email, passwordHash, role
 *
 * Passwords: SHA-256 pure-JS hash (same algorithm as before — existing
 * hashed passwords stored in Firestore remain valid).
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebaseConfig';

const ACCOUNTS = 'accounts';

// ── Pure-JS SHA-256 (unchanged from original) ─────────────────
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

// ── Demo / seed accounts ──────────────────────────────────────
const DEMO_ACCOUNTS = [
  { id: 'demo_mgr_0',   email: 'propeasemgr@propease.in', password: 'admin123',  name: 'PropEase Manager', mobile: '9494154838', countryCode: '+1',  role: 'manager'  },
  { id: 'demo_cust_0',  email: 'priya.verma@gmail.com',   password: 'priya123',  name: 'Priya Verma',      mobile: '9845678901', countryCode: '+91', role: 'customer' },
  { id: 'demo_cust_1',  email: 'amit.patel@gmail.com',    password: 'amit123',   name: 'Amit Patel',       mobile: '9812345678', countryCode: '+91', role: 'customer' },
];

// ── Public API (all async) ────────────────────────────────────

/**
 * Call once at app startup (e.g. in App.js useEffect).
 * Seeds demo accounts into Firestore if they don't already exist,
 * and ensures the manager account always has the correct credentials.
 */
export async function initAccountStore() {
  try {
    for (const demo of DEMO_ACCOUNTS) {
      const ref = doc(db, ACCOUNTS, demo.id);
      const snap = await getDoc(ref);

      if (demo.role === 'manager') {
        // Always overwrite manager to keep credentials locked
        await setDoc(ref, {
          id:           demo.id,
          name:         demo.name,
          mobile:       demo.mobile,
          countryCode:  demo.countryCode,
          email:        demo.email.toLowerCase(),
          passwordHash: hashPassword(demo.password),
          role:         demo.role,
        });
      } else if (!snap.exists()) {
        // Seed customer demo accounts only on first run
        await setDoc(ref, {
          id:           demo.id,
          name:         demo.name,
          mobile:       demo.mobile,
          countryCode:  demo.countryCode,
          email:        demo.email.toLowerCase(),
          passwordHash: hashPassword(demo.password),
          role:         demo.role,
        });
      }
    }
  } catch (e) {
    console.error('[accountStore] initAccountStore failed:', e);
  }
}

/**
 * Register a new manager account.
 * Returns { success: true } or { success: false, error: string }
 */
export async function registerAccount({ name, mobile, countryCode, email, password }) {
  try {
    const emailLower = email ? email.toLowerCase().trim() : '';
    const col        = collection(db, ACCOUNTS);

    // Check for duplicate mobile
    const mobileQ = query(col,
      where('mobile', '==', mobile),
      where('countryCode', '==', countryCode)
    );
    const mobileSnap = await getDocs(mobileQ);
    if (!mobileSnap.empty) {
      return { success: false, error: `An account with ${countryCode} ${mobile} already exists.` };
    }

    // Check for duplicate email
    if (emailLower) {
      const emailQ  = query(col, where('email', '==', emailLower));
      const emailSnap = await getDocs(emailQ);
      if (!emailSnap.empty) {
        return { success: false, error: `An account with "${emailLower}" already exists.` };
      }
    }

    const id = 'user_' + Date.now();
    await setDoc(doc(db, ACCOUNTS, id), {
      id,
      name,
      mobile,
      countryCode,
      email: emailLower,
      passwordHash: hashPassword(password),
      role: 'manager',
    });

    return { success: true };
  } catch (e) {
    console.error('[accountStore] registerAccount failed:', e);
    return { success: false, error: 'Registration failed. Please check your connection.' };
  }
}

/**
 * Find and authenticate an account.
 * Returns { found: bool, wrongPassword: bool, account: object|null }
 */
export async function findAccount({ loginMode, identifier, countryCode, password }) {
  try {
    const col        = collection(db, ACCOUNTS);
    const emailLower = loginMode === 'email' ? identifier.toLowerCase().trim() : '';

    let snap;
    if (loginMode === 'phone') {
      snap = await getDocs(query(col,
        where('mobile', '==', identifier.trim()),
        where('countryCode', '==', countryCode)
      ));
    } else {
      snap = await getDocs(query(col, where('email', '==', emailLower)));
    }

    if (snap.empty) return { found: false, wrongPassword: false, account: null };

    const account = snap.docs
      .map(d => d.data())
      .find(a => a.passwordHash === hashPassword(password));

    if (!account) return { found: true, wrongPassword: true, account: null };

    return { found: true, wrongPassword: false, account };
  } catch (e) {
    console.error('[accountStore] findAccount failed:', e);
    return { found: false, wrongPassword: false, account: null };
  }
}