// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA71z_ID0sh_DUlsWQYyIAwBxE8VCGvTy4",
  authDomain: "juego-legend.firebaseapp.com",
  projectId: "juego-legend",
  storageBucket: "juego-legend.appspot.com",
  messagingSenderId: "20712709003",
  appId: "1:20712709003:web:96f832b2bd44109ccc2d8e",
  measurementId: "G-0LP7TR8QE8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// Inicializar Auth
const auth = getAuth(app);

export { db, auth };