import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { auth } from '../firebaseConfig';
import { signOut } from 'firebase/auth';

import candado1 from '../assets/Candado1.png';
import candado2 from '../assets/Candado2.png';
import candado3 from '../assets/Candado3.png';
import candado4 from '../assets/Candado4.png';
import avatar from '../assets/Usuario1.png';

const SalaPrincipal = ({ usuario }) => {
  const [showInstructions, setShowInstructions] = useState(false);
  const [codigoSala, setCodigoSala] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const nombreUsuario = usuario.email.split('@')[0];

  const manejarCerrarSesion = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      setError('Error al cerrar sesión. Por favor, intenta de nuevo.');
    }
  };

  const manejarSerAnfitrion = async () => {
    setCargando(true);
    setError(null);
    try {
      const codigoGenerado = Math.floor(100000 + Math.random() * 900000).toString();
      
      const salaRef = doc(db, 'salas', codigoGenerado);
      
      const nuevaSala = {
        anfitrion: {
          id: usuario.uid,
          isOnline: true,
          lastActive: serverTimestamp(),
          disconnectedAt: null
        },
        jugadores: [usuario.uid],
        createdAt: serverTimestamp(),
        estadoJuego: 'esperando',
        retoActual: null,
        tiempoFinReto: null,
        jugadorActual: null,
        descripcionReto: null,
        tipoReto: null,
        activa: true,
        maxJugadores: 6,
        puntos: {
          [usuario.uid]: 0
        },
        anfitrionTemporal: null,
        tiempoGracia: null
      };

      await setDoc(salaRef, nuevaSala);
      
      navigate(`/sala/${codigoGenerado}`);
    } catch (e) {
      console.error('Error al crear la sala:', e);
      setError('Error al crear la sala. Por favor, intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  const manejarUnirseSala = async () => {
    if (codigoSala.length !== 6) {
      setError('Por favor, ingresa un código válido de 6 dígitos.');
      return;
    }

    setCargando(true);
    setError(null);

    try {
      const salaRef = doc(db, 'salas', codigoSala);
      const salaDoc = await getDoc(salaRef);

      if (!salaDoc.exists()) {
        setError('La sala no existe.');
        return;
      }

      const salaData = salaDoc.data();

      if (salaData.jugadores.includes(usuario.uid)) {
        // El jugador ya está en la sala, simplemente navegar
        navigate(`/sala/${codigoSala}`);
        return;
      }

      if (salaData.jugadores.length >= salaData.maxJugadores) {
        setError('La sala está llena.');
        return;
      }

      // Agregar el jugador a la sala
      await updateDoc(salaRef, {
        jugadores: arrayUnion(usuario.uid)
      });

      navigate(`/sala/${codigoSala}`);
    } catch (e) {
      console.error('Error al unirse a la sala:', e);
      setError('Error al unirse a la sala. Por favor, intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  return (
<div className="flex items-center justify-center min-h-screen bg-yellow-700">
      <div className="w-full max-w-md p-8 bg-yellow-100 rounded-lg shadow-lg">
        <div className="flex items-center mb-6 bg-teal-600 rounded-lg p-2">
          <img src={avatar} alt="Avatar" className="w-12 h-12 rounded-full mr-4" />
          <h1 className="text-2xl font-bold text-white">Bienvenido, {nombreUsuario}</h1>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={manejarSerAnfitrion}
            disabled={cargando}
            className="w-full bg-teal-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-teal-700 transition duration-300"
          >
            Ser Maestro de Leyendas
          </button>

          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Código de Sala"
              value={codigoSala}
              onChange={(e) => setCodigoSala(e.target.value)}
              className="flex-1 p-3 border rounded-lg"
              maxLength={6}
            />
            <button
              onClick={manejarUnirseSala}
              disabled={cargando}
              className="bg-teal-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-teal-700 transition duration-300"
            >
              Unirse
            </button>
          </div>
        </div>

        <div className="mt-8 flex justify-between">
          <img src={candado1} alt="Candado 1" className="w-16 h-16" />
          <img src={candado2} alt="Candado 2" className="w-16 h-16" />
          <img src={candado3} alt="Candado 3" className="w-14 h-16" />
          <img src={candado4} alt="Candado 4" className="w-16 h-16" />
        </div>

        <div className="flex justify-between items-center mt-5">
          <button
            onClick={manejarCerrarSesion}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-300"
          >
            Cerrar Sesión
          </button>

          <button
            onClick={() => setShowInstructions(true)}
            className="bg-teal-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-teal-700 transition duration-300"
          >
            Instrucciones
          </button>
        </div>
      </div>

      {/* Modal de Instrucciones */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h2 className="text-2xl font-bold mb-4">Instrucciones del Juego</h2>
            
            <div className="space-y-4 mb-6">
              <p>¡Bienvenido a Leyendas! Aquí están las instrucciones básicas:</p>
              
              <ul className="list-disc pl-6 space-y-2">
                <li>Como Maestro de Leyendas, podrás crear una sala y compartir el código con otros jugadores.</li>
                <li>Los jugadores pueden unirse usando el código de sala proporcionado.</li>
                <li>Cada candado representa una puerta que debes abrir para asegurar tu victoria.</li>
                <li>Deberás resolver acertijos y superar desafíos para avanzar.</li>
              </ul>
              
              <p>¡Prepárate para una aventura llena de misterios y diversión!</p>
            </div>

            <button
              onClick={() => setShowInstructions(false)}
              className="w-full bg-teal-600 text-white py-2 rounded-lg font-semibold hover:bg-teal-700 transition duration-300"
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaPrincipal;