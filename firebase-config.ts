// Firebase configuration for Google authentication
// Real Firebase project configuration for CampusCares

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  User as FirebaseAuthUser,
  GoogleAuthProvider as FirebaseGoogleAuthProvider,
  GoogleAuthProvider,
  onAuthStateChanged as fbOnAuthStateChanged,
  signOut as firebaseSignOut,
  getReactNativePersistence,
  initializeAuth,
  signInWithCredential
} from 'firebase/auth';

export interface FirebaseUser {
  email: string;
  displayName: string;
  photoURL: string;
  uid: string;
  getIdToken: () => Promise<string>;
}

const firebaseConfig = {
  apiKey: 'AIzaSyC5UWjB0GTpC8WwvlWYCSRJIvzDUPgJjwc',
  authDomain: 'campuscares-94b93.firebaseapp.com',
  projectId: 'campuscares-94b93',
  storageBucket: 'campuscares-94b93.firebasestorage.app',
  messagingSenderId: '640519159185',
  appId: '1:640519159185:web:2ad46a1766ca7422aaee30',
  measurementId: 'G-3KL9VPX0Y4',
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });


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

export { auth, fbOnAuthStateChanged, firebaseSignOut, provider, signInWithCredential };

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