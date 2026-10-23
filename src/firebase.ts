import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  memoryLocalCache,
  getFirestore, 
  Firestore 
} from 'firebase/firestore';
import rawFirebaseConfig from '../firebase-applet-config.json';

// Merged config: environment variables take precedence, with json fallback
const firebaseConfig = {
  apiKey: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_API_KEY) || rawFirebaseConfig.apiKey,
  authDomain: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN) || rawFirebaseConfig.authDomain,
  projectId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_PROJECT_ID) || rawFirebaseConfig.projectId,
  storageBucket: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET) || rawFirebaseConfig.storageBucket,
  messagingSenderId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID) || rawFirebaseConfig.messagingSenderId,
  appId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_APP_ID) || rawFirebaseConfig.appId,
  firestoreDatabaseId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_DATABASE_ID) || rawFirebaseConfig.firestoreDatabaseId,
};

let appInstance: FirebaseApp;
try {
  appInstance = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
} catch (err) {
  console.warn('Firebase initializeApp warning, falling back to existing or default app:', err);
  const existing = getApps();
  if (existing.length > 0) {
    appInstance = existing[0];
  } else {
    appInstance = initializeApp({
      apiKey: firebaseConfig.apiKey || 'AIzaDummyKeyForOfflineMode',
      projectId: firebaseConfig.projectId || 'san-luis-quillota',
    }, 'san-luis-fallback');
  }
}

export const app = appInstance;

let firestoreInstance: Firestore;
const dbId = firebaseConfig.firestoreDatabaseId || undefined;

try {
  // Try persistent cache with multi-tab support so opening in multiple tabs or private browsing never fails
  firestoreInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    ignoreUndefinedProperties: true
  }, dbId);
} catch (e1) {
  console.warn('persistentLocalCache failed, falling back to memoryLocalCache:', e1);
  try {
    firestoreInstance = initializeFirestore(app, {
      localCache: memoryLocalCache(),
      ignoreUndefinedProperties: true
    }, dbId);
  } catch (e2) {
    console.warn('memoryLocalCache failed, falling back to getFirestore:', e2);
    try {
      firestoreInstance = dbId ? getFirestore(app, dbId) : getFirestore(app);
    } catch (e3) {
      console.warn('Named getFirestore failed, falling back to default getFirestore:', e3);
      firestoreInstance = getFirestore(app);
    }
  }
}

export const db = firestoreInstance;
