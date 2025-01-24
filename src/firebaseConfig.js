// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAByFrKOgyqfK2qEbQCzDDn0Ja__Vuhobk",
  authDomain: "project-test-game.firebaseapp.com",
  projectId: "project-test-game",
  storageBucket: "project-test-game.appspot.com",
  messagingSenderId: "748865890277",
  appId: "1:748865890277:web:ace3e0e8ce796e18dd710c",
  measurementId: "G-2Q3KGG5BN4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// Inicializar Auth
const auth = getAuth(app);

// Habilitar persistencia en el navegador
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      // Múltiples pestañas abiertas
      console.warn('Persistencia de Firebase limitada');
    } else if (err.code === 'unimplemented') {
      // Navegador no soporta persistencia
      console.warn('Navegador no soporta persistencia de Firebase');
    }
  });

export { db, auth };