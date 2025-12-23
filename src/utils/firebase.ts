// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD-ZoOqkuISeU2PS4U5B9nujFx1DmBePSY",
    authDomain: "novaframes-ai.firebaseapp.com",
    projectId: "novaframes-ai",
    storageBucket: "novaframes-ai.firebasestorage.app",
    messagingSenderId: "620867292952",
    appId: "1:620867292952:web:e00b75a4781e96451e986d",
    measurementId: "G-RK3PGDC688"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Authentication and Firestore
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export default app;