import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, initializeFirestore, Firestore, doc, getDocFromServer, setDoc } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import defaultAppletConfig from '../../firebase-applet-config.json';

export interface FirebaseConfigOptions {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  firestoreDatabaseId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

const LOCAL_STORAGE_FIREBASE_KEY = 'mali_immo_firebase_custom_config';

const metaEnv = (import.meta as any).env || {};

export const getDefaultConfig = (): FirebaseConfigOptions => {
  // 1. Check if default provisioned firebase-applet-config.json exists
  if (defaultAppletConfig && defaultAppletConfig.projectId && defaultAppletConfig.apiKey) {
    // If a saved localStorage config exists, check if it's the obsolete test project or mismatched
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_FIREBASE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.projectId === 'utility-abstraction-kcf5x') {
          // Purge obsolete previous project to align all devices automatically
          localStorage.removeItem(LOCAL_STORAGE_FIREBASE_KEY);
        } else if (parsed && parsed.projectId && parsed.apiKey && parsed.projectId !== defaultAppletConfig.projectId) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Custom config read notice:', e);
    }

    return {
      apiKey: defaultAppletConfig.apiKey,
      authDomain: defaultAppletConfig.authDomain,
      projectId: defaultAppletConfig.projectId,
      firestoreDatabaseId: defaultAppletConfig.firestoreDatabaseId,
      storageBucket: defaultAppletConfig.storageBucket,
      messagingSenderId: defaultAppletConfig.messagingSenderId,
      appId: defaultAppletConfig.appId,
    };
  }

  // 2. Check if user saved custom config in app localStorage
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

  // 3. Fallback to env
  return {
    apiKey: metaEnv.VITE_FIREBASE_API_KEY || '',
    authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || '',
    firestoreDatabaseId: metaEnv.VITE_FIREBASE_DATABASE_ID || '',
    storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: metaEnv.VITE_FIREBASE_APP_ID || '',
  };
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;
let isConfigured = false;
let currentConfig: FirebaseConfigOptions = getDefaultConfig();

export const initFirebase = (config?: FirebaseConfigOptions) => {
  const activeConfig = config || getDefaultConfig();
  currentConfig = activeConfig;

  if (!activeConfig.projectId || !activeConfig.apiKey) {
    isConfigured = false;
    db = null;
    auth = null;
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
    
    // CRITICAL: Always pass firestoreDatabaseId if present, and configure long-polling
    // to prevent streaming connection drops behind proxies and iframes
    const dbId = activeConfig.firestoreDatabaseId;
    try {
      if (dbId) {
        db = initializeFirestore(app, {
          experimentalForceLongPolling: true,
        }, dbId);
      } else {
        db = initializeFirestore(app, {
          experimentalForceLongPolling: true,
        });
      }
    } catch (fsErr) {
      // If Firestore was already initialized on this FirebaseApp, retrieve the existing instance
      db = dbId ? getFirestore(app, dbId) : getFirestore(app);
    }

    try {
      auth = getAuth(app);
    } catch (authErr) {
      console.warn('Auth init note:', authErr);
    }

    try {
      storage = getStorage(app);
    } catch (storageErr) {
      console.warn('Storage init note:', storageErr);
    }

    isConfigured = true;
    return true;
  } catch (error) {
    console.warn('Firebase initialization error:', error);
    isConfigured = false;
    db = null;
    auth = null;
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
      projectId: currentConfig.projectId,
    }, { merge: true });

    await getDocFromServer(testRef);
    return {
      success: true,
      message: `Connexion Cloud Firestore établie avec succès ! (Projet : ${currentConfig.projectId})`,
    };
  } catch (error: any) {
    console.warn('Test connection notice:', error);
    return {
      success: false,
      message: error?.message || "Échec de connexion au Cloud Firestore. Vérifiez les règles Firestore ou la clé API.",
    };
  }
};

export const getActiveFirebaseConfig = () => currentConfig;

export { app, db, auth, storage, isConfigured };


