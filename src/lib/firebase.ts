// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCBYgL407y8tC5sL2oWb8jH1rFp4eA_4eE",
  authDomain: "agendia-live.firebaseapp.com",
  projectId: "agendia-live",
  storageBucket: "agendia-live.appspot.com",
  messagingSenderId: "56358814771",
  appId: "1:56358814771:web:3a5f7e7e6f6a7d1a2b3c4d",
  measurementId: "G-51E7L7745L"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();


// Initialize Analytics if it's supported
isSupported().then(supported => {
  if (supported) {
    getAnalytics(app);
  }
});

export { app, auth, db, googleProvider };
