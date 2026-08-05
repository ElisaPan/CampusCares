// Firebase configuration for Google authentication
// Real Firebase project configuration for CampusCares

import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from 'firebase/app';
import {
  onAuthStateChanged as fbOnAuthStateChanged,
  User as FirebaseAuthUser,
  GoogleAuthProvider as FirebaseGoogleAuthProvider,
  signOut as firebaseSignOut,
  getReactNativePersistence,
  GoogleAuthProvider,
  initializeAuth,
  signInWithCredential,
} from 'firebase/auth';

export interface FirebaseUser {
  email: string;
  displayName: string;
  photoURL: string;
  uid: string;
  getIdToken: () => Promise<string>;
}

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const provider = new GoogleAuthProvider();
// provider.setCustomParameters({ prompt: 'select_account' });


// Configure Google provider
provider.setCustomParameters({
  prompt: 'select_account',
});

const mapFirebaseUser = (user: FirebaseAuthUser | null): FirebaseUser | null => {
  if (!user) return null;
  return {
    email: user.email || '',
    displayName: user.displayName || '',
    photoURL: user.photoURL || '',
    uid: user.uid,
    getIdToken: () => user.getIdToken(),
  };
};

export { fbOnAuthStateChanged, firebaseSignOut, signInWithCredential };

export const initializeFirebase = async () => {
  return;
};

export const onAuthStateChanged = (cb: (user: FirebaseUser | null) => void) => {
  return fbOnAuthStateChanged(auth, (user) => {
    cb(mapFirebaseUser(user));
  });
};

export const getCurrentUser = (): Promise<FirebaseUser | null> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = fbOnAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        resolve(mapFirebaseUser(user));
      },
      (err) => {
        unsubscribe();
        reject(err);
      }
    );
  });
};

/**
 * Call this AFTER getting a Google ID token from a native Google sign-in flow.
 */
export const signInWithGoogleIdToken = async (idToken: string): Promise<FirebaseUser> => {
  try {
    const credential = FirebaseGoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);
    const user = result.user;

    return {
      email: user.email || '',
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      uid: user.uid,
      getIdToken: () => user.getIdToken(),
    };
  } catch (error: any) {
    console.error('Firebase sign-in error:', error);
    throw new Error(error.message || 'Sign-in failed');
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    console.error('Firebase sign-out error:', error);
    throw new Error(error.message || 'Sign-out failed');
  }
};