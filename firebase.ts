import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

// Define Env Types for Vite
declare global {
  interface ImportMetaEnv {
    VITE_FIREBASE_API_KEY: string;
    VITE_FIREBASE_AUTH_DOMAIN: string;
    VITE_FIREBASE_PROJECT_ID: string;
    VITE_FIREBASE_STORAGE_BUCKET: string;
    VITE_FIREBASE_MESSAGING_SENDER_ID: string;
    VITE_FIREBASE_APP_ID: string;
  }
}

// Safe access to environment variables with fallback
const env = (import.meta.env || {}) as any;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
if (!firebase.apps.length) {
    if (firebaseConfig.apiKey) {
        firebase.initializeApp(firebaseConfig);
    } else {
        console.warn("Firebase config missing. App will run in offline/demo mode.");
    }
}

// Export db with fallback mock for UI testing without credentials
const dbInstance = firebase.apps.length ? firebase.firestore() : {
    collection: () => ({
        doc: () => ({
            update: async () => {},
            set: async () => {},
            delete: async () => {},
        }),
        onSnapshot: (cb: any) => { cb({ empty: true, docs: [] }); return () => {}; }
    }),
    batch: () => ({ set: () => {}, commit: async () => {} })
};

export const db = dbInstance as firebase.firestore.Firestore;