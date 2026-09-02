import { initializeApp, getApps, getApp, FirebaseApp, deleteApp } from 'firebase/app';
import { getFirestore, Firestore, doc, getDocFromServer, setDoc } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

export interface FirebaseConfigOptions {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

const LOCAL_STORAGE_FIREBASE_KEY = 'mali_immo_firebase_custom_config';

const metaEnv = (import.meta as any).env || {};

export const getDefaultConfig = (): FirebaseConfigOptions => {
  // 1. Check if user saved custom config in app localStorage
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_FIREBASE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.projectId && parsed.apiKey) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading custom firebase config:', e);
  }

  // 2. Check environment variables (Vercel / Vite env)
  return {
    apiKey: metaEnv.VITE_FIREBASE_API_KEY || '',
    authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || (metaEnv.VITE_FIREBASE_PROJECT_ID ? `${metaEnv.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com` : ''),
    projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || (metaEnv.VITE_FIREBASE_PROJECT_ID ? `${metaEnv.VITE_FIREBASE_PROJECT_ID}.appspot.com` : ''),
    messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: metaEnv.VITE_FIREBASE_APP_ID || '',
  };
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let isConfigured = false;
let currentConfig: FirebaseConfigOptions = getDefaultConfig();

export const initFirebase = (config?: FirebaseConfigOptions) => {
  const activeConfig = config || getDefaultConfig();
  currentConfig = activeConfig;

  if (!activeConfig.projectId || !activeConfig.apiKey) {
    isConfigured = false;
    db = null;
    storage = null;
    app = null;
    return false;
  }

  try {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      app = existingApps[0];
    } else {
      app = initializeApp(activeConfig);
    }
    db = getFirestore(app);
    storage = getStorage(app);
    isConfigured = true;
    return true;
  } catch (error) {
    console.warn('Firebase initialization error:', error);
    isConfigured = false;
    db = null;
    storage = null;
    return false;
  }
};

// Auto-run initial init
initFirebase();

export const saveCustomFirebaseConfig = (config: FirebaseConfigOptions): boolean => {
  try {
    localStorage.setItem(LOCAL_STORAGE_FIREBASE_KEY, JSON.stringify(config));
    return initFirebase(config);
  } catch (e) {
    console.error('Error saving custom Firebase config:', e);
    return false;
  }
};

export const clearCustomFirebaseConfig = () => {
  try {
    localStorage.removeItem(LOCAL_STORAGE_FIREBASE_KEY);
    initFirebase(getDefaultConfig());
  } catch (e) {
    console.error('Error clearing Firebase config:', e);
  }
};

export const testFirebaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  if (!db || !isConfigured) {
    return {
      success: false,
      message: "Firebase n'est pas encore configuré. Veuillez renseigner le Project ID et l'API Key.",
    };
  }

  try {
    const testRef = doc(db, '_system_health', 'connection_check');
    await setDoc(testRef, {
      lastCheckedAt: new Date().toISOString(),
      status: 'active',
      client: 'Mali Immo Prestige Cloud Engine',
    }, { merge: true });

    await getDocFromServer(testRef);
    return {
      success: true,
      message: `Connexion Cloud Firestore établie avec succès ! (Projet : ${currentConfig.projectId})`,
    };
  } catch (error: any) {
    console.error('Test connection error:', error);
    return {
      success: false,
      message: error?.message || "Échec de connexion au Cloud Firestore. Vérifiez les règles Firestore ou la clé API.",
    };
  }
};

export const getActiveFirebaseConfig = () => currentConfig;

export { app, db, storage, isConfigured };

