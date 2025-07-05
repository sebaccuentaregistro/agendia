// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Your web app's Firebase configuration is now read from environment variables.
// These variables are automatically provided by Firebase App Hosting during deployment.
// For local development, you can create a `.env.local` file at the root of your
// project and add the configuration values there. See the `.env.local.example` file.
const firebaseConfig = {
  apiKey: "AIzaSyDMlnGw4QdX8TmRy-uGQr0iseudb9cy4TM",
  authDomain: "yogaflow-manager-uqjpc.firebaseapp.com",
  projectId: "yogaflow-manager-uqjpc",
  storageBucket: "yogaflow-manager-uqjpc.appspot.com",
  messagingSenderId: "230355743596",
  appId: "1:230355743596:web:91e896c93c7f0965d8b949",
};


// Initialize Firebase App
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize and export the Firebase services directly
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);


export { auth, db };
