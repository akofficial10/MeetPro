import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDGDw8nKgQQA0aHYFTKyzWgGQ7eeHOXnDo",
  authDomain: "meet-pro-d9458.firebaseapp.com",
  projectId: "meet-pro-d9458",
  storageBucket: "meet-pro-d9458.appspot.com",
  messagingSenderId: "239296265796",
  appId: "1:239296265796:web:511e727a7d8968dd414611",
  measurementId: "G-6Z06G2NYFK",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Authentication
const auth = getAuth(app);

// Google Auth Provider with additional scopes if needed
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
  access_type: "offline",
});

// Firestore Database
const db = getFirestore(app);

// Export auth functions for direct use if needed
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logoutFirebase = () => signOut(auth);

export {
  auth,
  googleProvider,
  db,
  GoogleAuthProvider, // Exporting for credential handling
};
