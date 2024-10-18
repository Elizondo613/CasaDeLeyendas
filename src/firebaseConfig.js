// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCU6HVETf4AlCNKq_7rZdJNfx2sj5aEelM",
  authDomain: "juego-de-mesa-20a35.firebaseapp.com",
  projectId: "juego-de-mesa-20a35",
  storageBucket: "juego-de-mesa-20a35.appspot.com",
  messagingSenderId: "228029492364",
  appId: "1:228029492364:web:b664144c4131a65e6a9fa9",
  measurementId: "G-VRHGJ9HMZD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// Inicializar Auth
const auth = getAuth(app);

export { db, auth };