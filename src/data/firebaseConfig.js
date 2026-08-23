/**
 * firebaseConfig.js
 *
 * ─────────────────────────────────────────────────────────────
 *  STEP-BY-STEP: CREATE YOUR FIREBASE PROJECT
 * ─────────────────────────────────────────────────────────────
 *
 *  1. Go to https://console.firebase.google.com
 *     Sign in with your Google account.
 *
 *  2. Click "Add project" → enter a name (e.g. "PropEase") →
 *     disable Google Analytics if you don't need it → click
 *     "Create project".
 *
 *  3. Once created, click the "</>" (Web) icon on the project
 *     overview page to register a Web app.
 *     - App nickname: "PropEase"
 *     - Do NOT check "Firebase Hosting"
 *     - Click "Register app"
 *     - Firebase will show you a firebaseConfig object — copy
 *       the values into the config block below.
 *
 *  4. Enable Firestore:
 *     - In the left sidebar go to Build → Firestore Database
 *     - Click "Create database"
 *     - Choose "Start in production mode" → Next
 *     - Pick the region closest to you (e.g. us-central) →
 *       click "Enable"
 *
 *  5. Set Firestore rules (so your app can read/write):
 *     - In Firestore → Rules tab, replace the contents with:
 *
 *         rules_version = '2';
 *         service cloud.firestore {
 *           match /databases/{database}/documents {
 *             match /{document=**} {
 *               allow read, write: if true;
 *             }
 *           }
 *         }
 *
 *     - Click "Publish"
 *     NOTE: These are open rules suitable for a private/internal
 *     app. If PropEase ever becomes public-facing, add proper
 *     auth-based rules.
 *
 *  6. Install the Firebase package in your project:
 *
 *       npm install firebase
 *
 *  7. Place this file at:  src/data/firebaseConfig.js
 *     Place the two store files at:
 *       src/data/accountStore.js
 *       src/data/propertyStore.js
 *
 * ─────────────────────────────────────────────────────────────
 *  PASTE YOUR CONFIG VALUES BELOW
 * ─────────────────────────────────────────────────────────────
 */

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            "AIzaSyBrkF5W0j57n4dfe_tPMsE55jy00IJ6jeo",
  authDomain:        "rentpe-90e18.firebaseapp.com",
  projectId:         "rentpe-90e18",
  storageBucket:     "rentpe-90e18.firebasestorage.app",
  messagingSenderId: "395476344207",
  appId:             "1:395476344207:web:729cced32dc4e5c670bffa",
};

// Prevent re-initialising on hot reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);