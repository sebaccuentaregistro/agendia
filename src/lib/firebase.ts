// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDMlnGw4QdX8TmRy-uGQr0iseudb9cy4TM",
  authDomain: "yogaflow-manager-uqjpc.firebaseapp.com",
  projectId: "yogaflow-manager-uqjpc",
  storageBucket: "yogaflow-manager-uqjpc.firebasestorage.app",
  messagingSenderId: "230355743596",
  appId: "1:230355743596:web:91e896c93c7f0965d8b949"
};


// Initialize Firebase App
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

let auth: Auth;
let db: Firestore;

// Functions to get singleton instances of Firebase services
export const getFirebaseAuth = () => {
    if (!auth) {
        auth = getAuth(app);
    }
    return auth;
};

export const getFirebaseDb = () => {
    if (!db) {
        db = getFirestore(app);
    }
    return db;
};
