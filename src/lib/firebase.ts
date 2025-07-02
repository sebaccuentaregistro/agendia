// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDMlnGw4QdX8TmRy-uGQr0iseudb9cy4TM",
  authDomain: "yogaflow-manager-uqjpc.firebaseapp.com",
  projectId: "yogaflow-manager-uqjpc",
  storageBucket: "yogaflow-manager-uqjpc.firebasestorage.app",
  messagingSenderId: "230355743596",
  appId: "1:230355743596:web:91e896c93c7f0965d8b949"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export { app };
