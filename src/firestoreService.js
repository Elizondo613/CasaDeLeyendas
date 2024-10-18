// firestoreService.js
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from './firebaseConfig'; // Asegúrate de que la ruta sea correcta

// Función para obtener la sala por el código
export const obtenerSalaPorCodigo = async (codigoSala) => {
  const q = query(collection(db, "salas"), where("codigoSala", "==", codigoSala));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const salaData = querySnapshot.docs[0].data(); // El primer documento que coincide
    return { salaData, ref: querySnapshot.docs[0].ref }; // Retornamos los datos y la referencia
  } else {
    console.error("No se encontró la sala");
    return null;
  }
};
