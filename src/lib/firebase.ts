// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration is now managed in the .env file
const firebaseConfig = {
  apiKey: "AIzaSyAre4fsapbFOgaNmMYWKxkulhMdmMA8Lts",
  authDomain: "agendia-57247.firebaseapp.com",
  projectId: "agendia-57247",
  storageBucket: "agendia-57247.appspot.com",
  messagingSenderId: "145587178960",
  appId: "1:145587178960:web:77f0a756d9c6f58c0b7dd5",
  measurementId: "G-MX0WCMGDLM"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize Analytics if it's supported
isSupported().then(supported => {
  if (supported) {
    getAnalytics(app);
  }
});

export { app, auth, db };
