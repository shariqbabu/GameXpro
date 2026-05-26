import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
// To use with real Firebase: Create a project at https://console.firebase.google.com
// and replace the values below or set them as environment variables
const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || "AIzaSyBdemo_GameZone_Replace_With_Real_Key",
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || "gamezone-pro-demo.firebaseapp.com",
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || "gamezone-pro-demo",
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || "gamezone-pro-demo.appspot.com",
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || "123456789012",
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || "1:123456789012:web:abcdef1234567890",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
