import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || 'AIzaSyDemoDummyKeyForAppMaliImmoPrestige',
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || 'mali-immo-prestige.firebaseapp.com',
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || 'mali-immo-prestige',
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || 'mali-immo-prestige.appspot.com',
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: metaEnv.VITE_FIREBASE_APP_ID || '1:123456789012:web:abcdef123456',
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let isConfigured = false;

try {
  if (getApps().length > 0) {
    app = getApp();
  } else {
    app = initializeApp(firebaseConfig);
  }
  db = getFirestore(app);
  storage = getStorage(app);
  isConfigured = Boolean(metaEnv.VITE_FIREBASE_PROJECT_ID);
} catch (error) {
  console.warn('Firebase initialized in offline/local mock mode:', error);
}

export { app, db, storage, isConfigured };
