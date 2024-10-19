import React, { useState, useEffect, useCallback } from 'react';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import QrScanner from '../components/QRScanner';
import { db } from '../firebaseConfig';
import llave1 from '../assets/Llave1.png';
import llave2 from '../assets/Llave2.png';
import llave3 from '../assets/Llave3.png';
import llave4 from '../assets/Llave4.png';
import usuario1 from '../assets/Usuario1.png';
import usuario2 from '../assets/Usuario2.png';
import usuario3 from '../assets/Usuario3.png';
import usuario4 from '../assets/Usuario4.png';
import usuario5 from '../assets/Usuario5.png';
import usuario6 from '../assets/Usuario6.png';

const API_BASE_URL = 'https://api-casal.onrender.com/api';

const llaveImages = [llave1, llave2, llave3, llave4];
const usuarioImages = [usuario1, usuario2, usuario3, usuario4, usuario5, usuario6];

export default function Sala({ usuario }) {
  const { codigoSala } = useParams();
  const navigate = useNavigate();
  
  const [salaData, setSalaData] = useState(null);
  const [mostrarScanner, setMostrarScanner] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [respuestaSeleccionada, setRespuestaSeleccionada] = useState(null);
  const [temporizadorID, setTemporizadorID] = useState(null);
  const [puntos, setPuntos] = useState({});
  const [imagenReto, setImagenReto] = useState(null);
  const [retoTexto, setRetoTexto] = useState(null);
  const [escanerListo, setEscanerListo] = useState(false);

  const limpiarTemporizador = useCallback(() => {
    if (temporizadorID) {
      clearInterval(temporizadorID);
      setTemporizadorID(null);
    }
    setTiempoRestante(null);
  }, [temporizadorID]);

  const finalizarReto = useCallback(async () => {
    limpiarTemporizador();
    
    const salaRef = doc(db, 'salas', codigoSala);
    await updateDoc(salaRef, {
      estadoJuego: 'iniciado',
      retoActual: null,
      tiempoFinReto: null,
      jugadorActual: null,
      tipoReto: null,
      ultimaRespuesta: null
    });
    setRespuestaSeleccionada(null);
    setImagenReto(null);
    setRetoTexto(null);
  }, [codigoSala, limpiarTemporizador]);

  useEffect(() => {
    const salaRef = doc(db, 'salas', codigoSala);
    
    const unsubscribe = onSnapshot(salaRef, (doc) => {
      if (doc.exists()) {
        const data = { id: doc.id, ...doc.data() };
        setSalaData(data);
        
        // Actualizar los puntos desde Firestore
        if (data.puntos) {
          setPuntos(data.puntos);
        } else {
          // Inicializar puntos para nuevos jugadores si no existen
          const puntosIniciales = {};
          data.jugadores.forEach((jugador) => {
            if (!(jugador in puntos)) {
              puntosIniciales[jugador] = 0;
            }
          });
          setPuntos(prevPuntos => ({ ...prevPuntos, ...puntosIniciales }));
        }
        
        if (data.ultimaRespuesta) {
          limpiarTemporizador();
        } else if (data.tiempoFinReto) {
          const tiempoFin = data.tiempoFinReto.toDate();
          const actualizarTemporizador = () => {
            const ahora = new Date();
            const diferencia = Math.max(0, Math.floor((tiempoFin - ahora) / 1000));
            
            if (diferencia > 0) {
              setTiempoRestante(diferencia);
            } else {
              limpiarTemporizador();
              if (data.estadoJuego === 'jugando') {
                finalizarReto();
              }
            }
          };
          
          if (!temporizadorID) {
            const intervalo = setInterval(actualizarTemporizador, 1000);
            setTemporizadorID(intervalo);
            actualizarTemporizador();
          }
        } else {
          limpiarTemporizador();
        }
      } else {
        setError('La sala no existe');
        setTimeout(() => navigate('/'), 3000);
      }
      setCargando(false);
    });
  
    return () => {
      unsubscribe();
      limpiarTemporizador();
    };
  }, [codigoSala, navigate, finalizarReto, limpiarTemporizador, temporizadorID, puntos]);

  const iniciarJuego = async () => {
    const salaRef = doc(db, 'salas', codigoSala);
    await updateDoc(salaRef, {
      estadoJuego: 'iniciado'
    });
  };

  const manejarScanExitoso = async (decodedText) => {
    try {
      setError(null);
      
      const tipoReto = decodedText.includes('/trivia') ? 'trivia' : 
                       decodedText.includes('/riddle') ? 'riddle' :
                       decodedText.includes('/mimica') ? 'mimica' :
                       decodedText.includes('/image') ? 'image' :
                       decodedText.includes('/reto') ? 'reto' : null;
                       
      if (!tipoReto) {
        throw new Error('Código QR no válido para ningún tipo de reto');
      }

      const response = await axios.get(`${API_BASE_URL}/challenge/${tipoReto}`);
      const retoData = response.data;
      
      const salaRef = doc(db, 'salas', codigoSala);
      const tiempoFinReto = new Date(Date.now() + (tipoReto === 'image' || tipoReto === 'reto' || tipoReto === 'mimica' ? 10000 : 60000));
      
      await updateDoc(salaRef, {
        estadoJuego: 'jugando',
        jugadorActual: usuario.uid,
        tiempoFinReto: tiempoFinReto,
        tipoReto: tipoReto,
        retoActual: retoData,
        ultimaRespuesta: null
      });
      
      setMostrarScanner(false);

      if (tipoReto === 'image') {
        setImagenReto(retoData.url);
        setRetoTexto(retoData.description);
      } else if (tipoReto === 'reto') {
        setRetoTexto(retoData.text);
      } else if (tipoReto === 'mimica') {
        setRetoTexto(retoData.text);
      }
    } catch (error) {
      console.error('Error al procesar el QR:', error);
      setError(`Error al procesar el código QR: ${error.message}`);
    }
  };

  const manejarRespuestaTrivia = async (indice) => {
    if (respuestaSeleccionada !== null) return;
    
    setRespuestaSeleccionada(indice);
    
    const esCorrecta = indice === parseInt(salaData.retoActual.correctAnswer);
    
    const salaRef = doc(db, 'salas', codigoSala);
    await updateDoc(salaRef, {
      ultimaRespuesta: {
        jugador: usuario.uid,
        respuestaSeleccionada: indice,
        correcta: esCorrecta
      }
    });

    setTimeout(finalizarReto, 3000);
  };

  const actualizarPuntos = async (jugadorId, incremento) => {
    const nuevosPuntos = Math.max(0, Math.min(4, (puntos[jugadorId] || 0) + incremento));
    
    // Actualizar el estado local
    setPuntos(prevPuntos => ({
      ...prevPuntos,
      [jugadorId]: nuevosPuntos
    }));
  
    // Actualizar Firestore
    const salaRef = doc(db, 'salas', codigoSala);
    await updateDoc(salaRef, {
      [`puntos.${jugadorId}`]: nuevosPuntos
    });
  };

  const renderJugadores = () => (
    <ul className="space-y-2">
      {salaData.jugadores?.map((jugador, index) => (
        <li 
          key={jugador}
          className={`flex items-center justify-between ${jugador === salaData.jugadorActual ? 'font-bold' : ''}`}
        >
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 flex items-center justify-center">
              <img src={usuarioImages[index % usuarioImages.length]} alt={`Usuario ${index + 1}`} className="w-6 h-6" />
            </div>
            <span>
              {jugador === usuario.uid ? 'Tú' : `Jugador ${jugador.slice(0, 4)}`}
              {jugador === salaData.anfitrion && ' (Anfitrión)'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-8 h-8 border border-gray-300 rounded-sm flex items-center justify-center">
                {i < (puntos[jugador] || 0) && (
                  <img src={llaveImages[i]} alt={`Llave ${i + 1}`} className="w-6 h-6" />
                )}
              </div>
            ))}
            {salaData.anfitrion === usuario.uid && (
              <>
                <button 
                  onClick={() => actualizarPuntos(jugador, -1)}
                  className="bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center"
                >
                  -
                </button>
                <button 
                  onClick={() => actualizarPuntos(jugador, 1)}
                  className="bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center"
                >
                  +
                </button>
              </>
            )}
          </div>
        </li>
      ))}
    </ul>
  );

  const renderContenidoJuego = () => {
    if (!salaData || salaData.estadoJuego !== 'jugando' || !salaData.retoActual) return null;
  
    const esJugadorActual = salaData.jugadorActual === usuario.uid;
  
    switch (salaData.tipoReto) {
      case 'trivia':
        const ultimaRespuesta = salaData.ultimaRespuesta;
        const mostrarResultado = ultimaRespuesta !== null;
  
        if (!esJugadorActual && !mostrarResultado) {
          return (
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <h2 className="font-bold text-xl mb-4">Esperando respuesta...</h2>
              <p className="text-lg">El jugador actual está respondiendo una trivia</p>
            </div>
          );
        }
  
        return (
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="font-bold text-xl mb-4">{salaData.retoActual.question}</h2>
            <div className="space-y-2">
              {salaData.retoActual.options.map((opcion, indice) => {
                let estilo = 'bg-gray-100 hover:bg-gray-200';
                
                if (mostrarResultado) {
                  const esRespuestaCorrecta = indice === parseInt(salaData.retoActual.correctAnswer);
                  const fueSeleccionada = indice === ultimaRespuesta.respuestaSeleccionada;
                  
                  if (fueSeleccionada) {
                    estilo = esRespuestaCorrecta ? 'bg-green-500 text-white' : 'bg-red-500 text-white';
                  } else if (esRespuestaCorrecta) {
                    estilo = 'bg-green-200';
                  }
                }
  
                return (
                  <button
                    key={indice}
                    onClick={() => esJugadorActual && !mostrarResultado && manejarRespuestaTrivia(indice)}
                    className={`w-full p-3 rounded text-left ${estilo} ${
                      !esJugadorActual || mostrarResultado ? 'cursor-default' : 'cursor-pointer'
                    }`}
                    disabled={!esJugadorActual || mostrarResultado}
                  >
                    {opcion}
                  </button>
                );
              })}
            </div>
            {mostrarResultado && (
              <div className="mt-4 text-center">
                <p className="text-lg font-bold mb-2">
                  {ultimaRespuesta.correcta ? '¡Respuesta correcta!' : 'Respuesta incorrecta'}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Continuando en unos segundos...
                </p>
              </div>
            )}
          </div>
        );
      
      case 'riddle':
        return esJugadorActual ? (
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <h2 className="font-bold text-xl mb-4">¡Adivina el personaje!</h2>
            <p className="text-lg mb-4">Los demás jugadores tienen la pista. ¡Intenta adivinar!</p>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <h2 className="font-bold text-xl mb-4">Personaje a adivinar:</h2>
            <p className="text-lg mb-4">{salaData.retoActual.text}</p>
            <button
              onClick={finalizarReto}
              className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
            >
              ¡El jugador ha acertado!
            </button>
          </div>
        );
      
      case 'image':
        return (
          <div className="bg-white p-4 rounded-lg shadow text-center">
          <h2 className="font-bold text-xl mb-4">Imagen del Reto</h2>
          {imagenReto && (
            <img 
              src={imagenReto} 
              alt="Reto" 
              className="max-w-full h-auto mb-4" 
            />
          )}
          {retoTexto && (
            <p className="text-lg mb-4">{retoTexto}</p>
          )}
          <p className="text-sm text-gray-600">
            La imagen se mostrará por unos segundos...
          </p>
        </div>
        );
      
      case 'reto':
        if (esJugadorActual) {
          return (
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <h2 className="font-bold text-xl mb-4">Reto Especial</h2>
              <p className="text-lg mb-4">{retoTexto}</p>
              <p className="text-sm text-gray-600">
                El reto se mostrará por unos segundos...
              </p>
            </div>
          );
        } else {
          return (
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <h2 className="font-bold text-xl mb-4">Reto en Progreso</h2>
              <p className="text-lg mb-4">
                El jugador actual está realizando un reto especial.
              </p>
              <p className="text-sm text-gray-600">
                Espera unos momentos...
              </p>
            </div>
          );
        }

        case 'mimica':
          if (esJugadorActual) {
            return (
              <div className="bg-white p-4 rounded-lg shadow text-center">
                <h2 className="font-bold text-xl mb-4">Mimica</h2>
                <p className="text-lg mb-4">{retoTexto}</p>
                <p className="text-sm text-gray-600">
                  Realiza la mímica!
                </p>
              </div>
            );
          } else {
            return (
              <div className="bg-white p-4 rounded-lg shadow text-center">
                <h2 className="font-bold text-xl mb-4">Reto en Progreso</h2>
                <p className="text-lg mb-4">
                  Debes adivinar la mímica!
                </p>
              </div>
            );
          }

      default:
        return null;
    }
  };
   
  if (cargando) return <div className="text-center">Cargando sala...</div>;
  if (!salaData) return <div className="text-center">Sala no encontrada</div>;

  const esAnfitrion = salaData.anfitrion === usuario.uid;
  const puedeEscanear = salaData.estadoJuego === 'iniciado';
  const estaJugando = salaData.estadoJuego === 'jugando';

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Sala {codigoSala}</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">
          Jugadores ({salaData.jugadores?.length || 0}/{salaData.maxJugadores}):
        </h2>
        {renderJugadores()}
      </div>

      {tiempoRestante !== null && (
        <div className="text-center text-2xl font-bold mb-4">
          Tiempo: {tiempoRestante}s
        </div>
      )}

      {esAnfitrion && salaData.estadoJuego === 'esperando' && (
        <button 
          onClick={iniciarJuego}
          className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 mb-4"
        >
          Empezar Juego
        </button>
      )}

      {puedeEscanear && !estaJugando && (
        <button 
          onClick={() => setMostrarScanner(true)}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 mb-4"
        >
          Iniciar aventura
        </button>
      )}

      {mostrarScanner && puedeEscanear && (
        <div className="mb-4">
          <QrScanner
            onScanSuccess={manejarScanExitoso}
            onScanFailure={(error) => {
              console.error('Error en el escaneo:', error);
              setError(`Error al escanear: ${error.message || 'Desconocido'}`);
            }}
            onLoad={() => setEscanerListo(true)}
          />
          {!escanerListo && <p className="text-gray-500">Cargando escáner...</p>}
          <button 
            onClick={() => {
              setMostrarScanner(false);
              setEscanerListo(false); // Resetea el estado cuando se cierra el escáner
            }}
            className="mt-2 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
          >
            Cancelar escaneo
          </button>
        </div>
      )}

      {renderContenidoJuego()}
    </div>
  );
}