import React, { useState, useEffect, useCallback } from 'react';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import QrScanner from '../components/QRScanner';
import { db } from '../firebaseConfig';

//Importacion de imagenes:
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
import marcoHeader from '../assets/Marco_Sala.png';
import relojIcon from '../assets/relojIcon.png';
import fondoMimica from '../assets/fondoMimica.png';
import lunaIcon from '../assets/lunaIcon.png';
import logoLeyendas from '../assets/logoLeyendas.png';
import fondoImage from '../assets/fondoImage.png';
import fondoTrivia from '../assets/fondoTrivia.png';
import candelaIcon from '../assets/candelaIcon.png';

//api
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

  //Define el reto como finalizado
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

  //Maneja con exito las respuestas para el QR
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

  //Tiempo para las trivias - correcto o no
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

  //Logica de llaves
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

  //Avatares y nombres para los jugadores - llaves
  const renderJugadores = () => (
    <ul className="space-y-2">
      {salaData.jugadores?.map((jugador, index) => (
        <li 
          key={jugador}
          className={`flex items-center justify-between p-4 ${
            index % 2 === 0 ? 'bg-[#fff3e0]' : 'bg-[#ffe0b2]'
          } rounded-lg`}
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 flex items-center justify-center">
              <img src={usuarioImages[index % usuarioImages.length]} alt={`Usuario ${index + 1}`} className="w-10 h-10" />
            </div>
            <span className="text-xl font-medium text-gray-800">
              {jugador === usuario.uid ? 'Tú' : `Jugador ${jugador.slice(0, 4)}`}
              {jugador === salaData.anfitrion && ' (Anfitrión)'}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-10 h-10 flex items-center justify-center">
                {i < (puntos[jugador] || 0) && (
                  <img src={llaveImages[i]} alt={`Llave ${i + 1}`} className="w-8 h-8" />
                )}
              </div>
            ))}
            {salaData.anfitrion === usuario.uid && (
              <>
                <button 
                  onClick={() => actualizarPuntos(jugador, -1)}
                  className="bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-xl hover:bg-red-600"
                >
                  -
                </button>
                <button 
                  onClick={() => actualizarPuntos(jugador, 1)}
                  className="bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-xl hover:bg-green-600"
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

  //Pantalla para cada caso de lectura de QR
  const renderContenidoJuego = () => {
    if (!salaData || salaData.estadoJuego !== 'jugando' || !salaData.retoActual) return null;
  
    const esJugadorActual = salaData.jugadorActual === usuario.uid;
  
    switch (salaData.tipoReto) {
      //TRIVIAS
      case 'trivia':
        const ultimaRespuesta = salaData.ultimaRespuesta;
        const mostrarResultado = ultimaRespuesta !== null;
  
        if (!esJugadorActual && !mostrarResultado) {
          return (
            <div className="w-full max-w-4xl mx-auto px-4">
              <div className="bg-white p-4 rounded-lg shadow text-center">
                <h2 className="font-bold text-xl mb-4">Esperando respuesta...</h2>
                <p className="text-lg">El jugador actual está respondiendo una trivia</p>
              </div>
            </div>
          );
        }
  
        return (
          <div className="w-full max-w-4xl mx-auto px-4">
            {/* Contenedor principal con fondo de trivia */}
            <div className="relative w-full aspect-[16/9]">
              {/* Imagen de fondo */}
              <img 
                src={fondoTrivia} 
                alt="Marco Trivia" 
                className="absolute inset-0 w-full h-full object-contain"
              />
              
              {/* Contenido superpuesto */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                {/* Íconos superiores */}
                <div className="flex justify-between w-full mb-6">
                  <img src={candelaIcon} alt="Candela" className="w-8 h-8" />
                  <img src={relojIcon} alt="Reloj" className="w-8 h-8" />
                </div>
                
                {/* Pregunta */}
                <h2 className="font-bold text-xl md:text-2xl lg:text-3xl mb-6 text-white text-center">
                  {salaData.retoActual.question}
                </h2>
                
                {/* Opciones */}
                <div className="w-full max-w-lg space-y-3">
                  {salaData.retoActual.options.map((opcion, indice) => {
                    let estilo = 'bg-white/90 hover:bg-white';
                    
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
                        className={`w-full p-3 rounded-lg text-center font-semibold transition-colors ${estilo} ${
                          !esJugadorActual || mostrarResultado ? 'cursor-default' : 'cursor-pointer'
                        }`}
                        disabled={!esJugadorActual || mostrarResultado}
                      >
                        {opcion}
                      </button>
                    );
                  })}
                </div>
  
                {/* Resultado */}
                {mostrarResultado && (
                  <div className="mt-6 text-center">
                    <p className="text-lg font-bold text-white mb-2">
                      {ultimaRespuesta.correcta ? '¡Respuesta correcta!' : 'Respuesta incorrecta'}
                    </p>
                    <p className="text-sm text-white/80">
                      Continuando en unos segundos...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      
      //ADIVINA EL PERSONAJE
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
      
      //LEYENDAS
      case 'image':
        return (
          <div className="w-full min-h-screen bg-[#FFF8E7]">
            {/* Contenedor principal */}
            <div className="w-full max-w-5xl mx-auto px-4 py-4 space-y-4">
              {/* Logo superior centrado */}
              <div className="flex justify-center mb-4">
                <img 
                  src={logoLeyendas} 
                  alt="Logo Leyendas" 
                  className="w-16 h-16 md:w-20 md:h-20"
                />
              </div>

              {/* Card principal con marco y fondo */}
              <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden">
                {/* Fondo decorativo */}
                <img 
                  src={fondoImage} 
                  alt="Fondo" 
                  className="absolute inset-0 w-full h-full object-contain"
                />
                
                {/* Contenido centrado con scroll si es necesario */}
                <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-4 md:p-8">
                  <div className="w-full max-h-full overflow-y-auto flex flex-col items-center">
                    {/* Contenedor de la imagen con tamaño máximo controlado */}
                    {imagenReto && (
                      <div className="w-full max-w-md mx-auto mb-4">
                        <img 
                          src={imagenReto} 
                          alt="Reto" 
                          className="w-full h-auto rounded-lg shadow-md"
                        />
                      </div>
                    )}
                    
                    {/* Texto del reto con tamaño controlado */}
                    {retoTexto && (
                      <div className="text-center mt-2 px-4">
                        <h2 className="text-lg md:text-2xl font-bold text-white mb-2">
                          {retoTexto}
                        </h2>
                        <p className="text-sm md:text-base text-white/80">
                          La imagen se mostrará por unos segundos...
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      //RETOS  
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

        //MIMICAS
        case 'mimica':
          if (esJugadorActual) {
            return (
              <div className="w-full max-w-4xl mx-auto">
                {/* Barra de tiempo */}
                <div className="bg-orange-100 rounded-lg p-4 mb-4 flex justify-center items-center space-x-4">
                  <img src={relojIcon} alt="Reloj" className="w-8 h-8" />
                  <span className="text-2xl font-bold">{tiempoRestante}</span>
                  <img src={logoLeyendas} alt="Logo Leyendas" className="w-8 h-8 ml-4" />
                </div>
        
                {/* Contenedor de la mímica */}
                <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden">
                  {/* Fondo */}
                  <img 
                    src={fondoMimica} 
                    alt="Fondo" 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  
                  {/* Luna decorativa */}
                  <img 
                    src={lunaIcon} 
                    alt="Luna" 
                    className="absolute top-4 left-1/2 transform -translate-x-1/2 w-16 h-16"
                  />
                  
                  {/* Texto de la mímica */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
                    <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-4">
                      {retoTexto}
                    </h2>
                    <p className="text-xl text-white text-center mt-4">
                      ¡Realiza la mímica!
                    </p>
                  </div>
                </div>
              </div>
            );
          } else {
            return (
              <div className="w-full max-w-4xl mx-auto">
                {/* Barra de tiempo */}
                <div className="bg-orange-100 rounded-lg p-4 mb-4 flex justify-center items-center space-x-4">
                  <img src={relojIcon} alt="Reloj" className="w-8 h-8" />
                  <span className="text-2xl font-bold">{tiempoRestante}s</span>
                  <img src={logoLeyendas} alt="Logo Leyendas" className="w-8 h-8 ml-4" />
                </div>
        
                {/* Contenedor de la mímica */}
                <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden">
                  <img 
                    src={fondoMimica} 
                    alt="Fondo" 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <img 
                    src={lunaIcon} 
                    alt="Luna" 
                    className="absolute top-4 left-1/2 transform -translate-x-1/2 w-16 h-16"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
                    <h2 className="text-3xl md:text-5xl font-bold text-white text-center">
                      ¡Adivina la mímica!
                    </h2>
                  </div>
                </div>
              </div>
            );
          }

      default:
        return null;
    }
  };
   
  if (cargando) return <div className="text-center text-white text-xl">Cargando sala...</div>;
  if (!salaData) return <div className="text-center text-white text-xl">Sala no encontrada</div>;

  const esAnfitrion = salaData.anfitrion === usuario.uid;
  const puedeEscanear = salaData.estadoJuego === 'iniciado';
  const estaJugando = salaData.estadoJuego === 'jugando';

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: '#B8860B' }}>
      <div className="max-w-3xl mx-auto">
        {/* Header con marco decorativo */}
        <div className="relative mb-8">
          <div 
            className="h-24 relative rounded-lg overflow-hidden"
            style={{
              backgroundImage: `url(${marcoHeader})`, // Asumiendo que importaste la imagen como marcoHeader
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
            {/* Contenedor para el texto centrado */}
            <div className="absolute inset-0 flex items-center justify-between px-6">
              <div className="flex-1 text-center">
                <h1 className="text-3xl font-bold text-white">
                  SALA {codigoSala}
                </h1>
              </div>
              {/* Contador de jugadores */}
              <div className="absolute top-8 left-1/2 transform translate-x-28 bg-white/20 px-3 py-1 rounded-lg backdrop-blur-sm">
                <span className="text-xl text-white font-medium">
                  {salaData.jugadores?.length || 0}/{salaData.maxJugadores}
                </span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        <div className="bg-[#fff8e1] rounded-lg p-6 mb-6">
          {renderJugadores()}
        </div>

        {tiempoRestante !== null && (
          <div className="text-center text-3xl font-bold mb-6 text-white">
            Tiempo: {tiempoRestante}s
          </div>
        )}

        {esAnfitrion && salaData.estadoJuego === 'esperando' && (
          <button 
            onClick={iniciarJuego}
            className="w-full bg-[#2F4F4F] text-white py-3 px-6 rounded-lg hover:bg-[#1e3333] text-xl font-semibold mb-4 transition-colors"
          >
            Empezar Juego
          </button>
        )}

        {puedeEscanear && !estaJugando && (
          <button 
            onClick={() => setMostrarScanner(true)}
            className="w-full bg-[#2F4F4F] text-white py-3 px-6 rounded-lg hover:bg-[#1e3333] text-xl font-semibold mb-4 transition-colors"
          >
            Escanear Código
          </button>
        )}

        {/* Muestra la opción para escanear */}
        {mostrarScanner && puedeEscanear && (
          <div className="bg-white rounded-lg p-4 mb-4">
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
                setEscanerListo(false);
              }}
              className="mt-4 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
            >
              Cancelar escaneo
            </button>
          </div>
        )}

        {renderContenidoJuego()}
      </div>
    </div>
  );
}