// lib/firebase.ts

// Firebase v8 compat SDK initialization
// NOTE: Do not migrate this project to v9 modular imports.

import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyARkw9clCiguWnBVfEmZHUI8xnkdvjjDkI",
  authDomain: "pict-connect-a00c6.firebaseapp.com",
  projectId: "pict-connect-a00c6",
  storageBucket: "pict-connect-a00c6.firebasestorage.app",
  messagingSenderId: "663234570592",
  appId: "1:663234570592:web:58d674e8e326f249a01605",
  measurementId: "G-BD1SRXSDFK",
};

// Ensure we only initialize once in the browser/Node environment
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const db = firebase.firestore();

// Export the firebase namespace for compat usage across the app
export { firebase };

