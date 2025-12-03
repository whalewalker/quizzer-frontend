import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const isIpAddress = (hostname: string) =>
  /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname);

const firebaseConfig = {
  apiKey: "AIzaSyCC2AsgmVpm_wpS-MoommA3g4cKpsTOCBY",
  authDomain:
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    !isIpAddress(window.location.hostname)
      ? window.location.hostname
      : "quizzer-609ff.firebaseapp.com",
  projectId: "quizzer-609ff",
  storageBucket: "quizzer-609ff.firebasestorage.app",
  messagingSenderId: "208450280402",
  appId: "1:208450280402:web:7547d639be92c50356860b",
  measurementId: "G-M3H06CRBNT",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});
