import React, { useState, useEffect, useCallback } from 'react';
import { doc, updateDoc, getDoc, onSnapshot, Timestamp, serverTimestamp } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import QrScanner from '../components/QRScanner';
import { db } from '../firebaseConfig';
import GameTimer from './Temporizador';

//Importacion de imagenes:
import llave1 from '../assets/Llave1.png';
import llave2 from '../assets/Llave2.png';
import llave3 from '../assets/Llave3.png';
import llave4 from '../assets/Llave4.png';
import usuario1 from '../assets/Usuario1.png';
import marcoHeader from '../assets/Marco_Sala.png';
import relojIcon from '../assets/relojIcon.png';
import fondoMimica from '../assets/fondoMimica.png';
import lunaIcon from '../assets/lunaIcon.png';
import logoLeyendas from '../assets/logoLeyendas.png';
import fondoImage from '../assets/fondoImage.png';
import fondoTrivia from '../assets/fondoTrivia.png';
import candelaIcon from '../assets/candelaIcon.png';
import facebookIcon from '../assets/facebookIcon.png';
import instagramIcon from '../assets/instagramIcon.png';
import tiktokIcon from '../assets/tiktokIcon.png';

//api
const API_BASE_URL = 'https://api-casal.onrender.com/api';

const llaveImages = [llave1, llave2, llave3, llave4];

export default function Sala({ usuario }) {
  const { codigoSala } = useParams();
  const navigate = useNavigate();
  
  const [salaData, setSalaData] = useState(null);
  const [mostrarScanner, setMostrarScanner] = useState(false);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [respuestaSeleccionada, setRespuestaSeleccionada] = useState(null);
  const [puntos, setPuntos] = useState({});
  const [imagenReto, setImagenReto] = useState(null);
  const [retoTexto, setRetoTexto] = useState(null);
  const [escanerListo, setEscanerListo] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [nombresUsuarios, setNombresUsuarios] = useState({});
  const [avataresUsuarios, setAvataresUsuarios] = useState({});

  // Salir de la sala
  const handleSalirSala = async () => {
    try {
      if (salaData) {
        const salaRef = doc(db, 'salas', codigoSala);
        
        // Si es el anfitrión
        if (salaData.anfitrion.id === usuario.uid) {
          const tiempoGracia = new Date();
          tiempoGracia.setMinutes(tiempoGracia.getMinutes() + 2); // 2 minutos de gracia
          
          // Seleccionar un jugador aleatorio (excluyendo al anfitrión)
          const jugadoresDisponibles = salaData.jugadores.filter(id => id !== usuario.uid);
          const anfitrionTemporal = jugadoresDisponibles.length > 0 
            ? jugadoresDisponibles[Math.floor(Math.random() * jugadoresDisponibles.length)]
            : null;
  
          await updateDoc(salaRef, {
            'anfitrion.isOnline': false,
            'anfitrion.disconnectedAt': serverTimestamp(),
            estadoJuego: 'pausado',
            tiempoGracia: tiempoGracia,
            anfitrionTemporal: anfitrionTemporal,
            jugadores: salaData.jugadores.filter(id => id !== usuario.uid)
          });
        } else {
          // Si no es anfitrión, solo remover al jugador
          await updateDoc(salaRef, {
            jugadores: salaData.jugadores.filter(id => id !== usuario.uid)
          });
        }
      }
      
      navigate('/');
    } catch (error) {
      console.error('Error al salir de la sala:', error);
      setError('Error al salir de la sala');
    }
  };

  //Likes e iconos para reto de redes
  const [likesNeeded] = useState(() => Math.floor(Math.random() * 5) + 1);

  const getSocialIcon = (category) => {
    switch (category.toLowerCase()) {
      case 'Facebook':
        return facebookIcon;
      case 'Instagram':
        return instagramIcon;
      case 'Tiktok':
        return tiktokIcon;
      default:
        return facebookIcon;
    }
  };

  //Define el reto como finalizado
  const finalizarReto = useCallback(async () => {
    
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
  }, [codigoSala]);

  // Añadir esta función para cargar los nombres de usuario
  const cargarNombresUsuarios = async (jugadores) => {
    const nombres = {};
    for (const jugador of jugadores) {
      const jugadorId = typeof jugador === 'string' ? jugador : jugador.id;
      try {
        const userDoc = await getDoc(doc(db, 'usuarios', jugadorId));
        if (userDoc.exists()) {
          nombres[jugadorId] = userDoc.data().displayName;
        } else {
          nombres[jugadorId] = `Usuario ${jugadorId.slice(0, 4)}`;
        }
      } catch (error) {
        console.error('Error al cargar nombre de usuario:', error);
        nombres[jugadorId] = `Usuario ${jugadorId.slice(0, 4)}`;
      }
    }
    setNombresUsuarios(nombres);
  };

  // LocalStorage
  useEffect(() => {
    // Intentar recuperar datos de localStorage al cargar
    const salaGuardada = localStorage.getItem(`sala_${codigoSala}`);
    if (salaGuardada) {
      try {
        const datosGuardados = JSON.parse(salaGuardada);
        setSalaData(datosGuardados);
      } catch (error) {
        console.error('Error al recuperar datos de localStorage', error);
      }
    }
  }, [codigoSala]);

  // Guardar datos en localStorage cuando cambien
  useEffect(() => {
    if (salaData) {
      try {
        localStorage.setItem(`sala_${codigoSala}`, JSON.stringify(salaData));
      } catch (error) {
        console.error('Error al guardar datos en localStorage', error);
      }
    }
  }, [salaData, codigoSala]);

  useEffect(() => {
    const salaRef = doc(db, 'salas', codigoSala);
    
    const unsubscribe = onSnapshot(salaRef, async (doc) => {
      if (doc.exists()) {
        const data = { id: doc.id, ...doc.data() };
        setSalaData(data);

        await cargarNombresUsuarios(data.jugadores);

        // Manejar reconexión del anfitrión
        if (data.anfitrion.id === usuario.uid && !data.anfitrion.isOnline) {
          const ahora = new Date();
          const tiempoGracia = data.tiempoGracia?.toDate();
          
          if (tiempoGracia && ahora < tiempoGracia) {
            // El anfitrión regresa dentro del tiempo de gracia
            await updateDoc(salaRef, {
              'anfitrion.isOnline': true,
              'anfitrion.disconnectedAt': null,
              tiempoGracia: null,
              anfitrionTemporal: null,
              estadoJuego: 'iniciado'
            });
          }
        }

        // Verificar si el tiempo de gracia expiró
        if (data.tiempoGracia) {
          const ahora = new Date();
          const tiempoGracia = data.tiempoGracia.toDate();
          
          if (ahora > tiempoGracia && data.anfitrionTemporal) {
            // Transferir el rol de anfitrión
            await updateDoc(salaRef, {
              anfitrion: {
                id: data.anfitrionTemporal,
                isOnline: true,
                lastActive: serverTimestamp(),
                disconnectedAt: null
              },
              tiempoGracia: null,
              anfitrionTemporal: null,
              estadoJuego: 'iniciado'
            });
          }
        }

        if (data.puntos) {
          setPuntos(data.puntos);
        } else {
          const puntosIniciales = {};
          data.jugadores.forEach((jugador) => {
            if (!(jugador in puntos)) {
              puntosIniciales[jugador] = 0;
            }
          });
          setPuntos(prevPuntos => ({ ...prevPuntos, ...puntosIniciales }));
        }
      } else {
        setError('La sala no existe');
        setTimeout(() => navigate('/'), 3000);
      }
      setCargando(false);
    });
  
    return () => {
      unsubscribe();
    };
  }, [codigoSala, usuario.uid, navigate, puntos]);

    // Efecto para cargar los avatares de los usuarios
    useEffect(() => {
      const cargarAvatares = async () => {
        const avatares = {};
        for (const jugador of salaData.jugadores) {
          const jugadorId = typeof jugador === 'string' ? jugador : jugador.id;
          try {
            const userDoc = await getDoc(doc(db, 'usuarios', jugadorId));
            if (userDoc.exists()) {
              // Si existe un avatar personalizado, usarlo
              const userData = userDoc.data();
              avatares[jugadorId] = userData.avatar || usuario1;
            } else {
              // Fallback al avatar predeterminado
              avatares[jugadorId] = usuario1;
            }
          } catch (error) {
            console.error(`Error al cargar avatar para ${jugadorId}:`, error);
            avatares[jugadorId] = usuario1;
          }
        }
        setAvataresUsuarios(avatares);
      };
  
      // Solo ejecutar si hay jugadores en la sala
      if (salaData?.jugadores?.length) {
        cargarAvatares();
      }
    }, [salaData?.jugadores]);

  //Inicio de juego
  const iniciarJuego = async () => {
    if (!esAnfitrion) {
      setError('Solo el anfitrión puede iniciar el juego');
      return;
    }
  
    try {
      const salaRef = doc(db, 'salas', codigoSala);
      await updateDoc(salaRef, {
        estadoJuego: 'iniciado'
      });
    } catch (error) {
      console.error('Error al iniciar el juego:', error);
      setError('Error al iniciar el juego');
    }
  };

  //Maneja con exito las respuestas para el QR
  const manejarScanExitoso = async (decodedText) => {
    try {
      setError(null);
      
      const tipoReto = decodedText.includes('/trivia') ? 'trivia' : 
                       decodedText.includes('/riddle') ? 'riddle' :
                       decodedText.includes('/mimica') ? 'mimica' :
                       decodedText.includes('/image') ? 'image' :
                       decodedText.includes('/retoRedes') ? 'retoRedes' :
                       decodedText.includes('/reto') ? 'reto' : null;
                       
      if (!tipoReto) {
        throw new Error('Código QR no válido para ningún tipo de reto');
      }
  
      const response = await axios.get(`${API_BASE_URL}/challenge/${tipoReto}`);
      const retoData = response.data;
      
      const salaRef = doc(db, 'salas', codigoSala);
      
      // Modificar esta parte para asignar tiempo solo a los retos que lo necesitan
      const tiempoFinReto = ['trivia', 'riddle', 'mimica'].includes(tipoReto)
      ? Timestamp.fromDate(new Date(Date.now() + 60000))  // Usar Timestamp de Firestore
      : tipoReto === 'reto'
      ? Timestamp.fromDate(new Date(Date.now() + 60000))
      : null;
      
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
      } else if (tipoReto === 'retoRedes') {
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
    if (!esAnfitrion) {
      setError('Solo el anfitrión puede modificar los puntos');
      return;
    }
  
    try {
      const salaRef = doc(db, 'salas', codigoSala);
      const nuevoPuntaje = (puntos[jugadorId] || 0) + incremento;
      
      // Asegurarse de que los puntos estén entre 0 y 4
      if (nuevoPuntaje >= 0 && nuevoPuntaje <= 4) {
        await updateDoc(salaRef, {
          [`puntos.${jugadorId}`]: nuevoPuntaje
        });
      }
    } catch (error) {
      console.error('Error al actualizar puntos:', error);
      setError('Error al actualizar puntos');
    }
  };

  //Avatares y nombres para los jugadores - llaves
  const renderJugadores = () => (
    <ul className="space-y-2">
      {salaData.jugadores?.map((jugador, index) => {
        // Determinar el ID del jugador
        const jugadorId = typeof jugador === 'string' ? jugador : jugador.id;
    
        // Obtener el nombre del jugador desde nombresUsuarios o un nombre genérico
        const nombreJugador = nombresUsuarios[jugadorId] || `Jugador ${jugadorId.slice(0, 10)}`;
    
        // Verificar si el jugador es el usuario actual
        const esUsuarioActual = jugadorId === usuario.uid;
    
        // Verificar si el jugador es el anfitrión
        const esAnfitrionJugador = jugadorId === salaData.anfitrion.id;

        // Obtener el avatar del jugador, con fallback a usuario1
        const avatarJugador = avataresUsuarios[jugadorId] || usuario1;
    
        return (
          <li
            key={jugadorId}
            className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 ${
              index % 2 === 0 ? 'bg-[#fff3e0]' : 'bg-[#ffe0b2]'
            } rounded-lg space-y-4 sm:space-y-0`}
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 flex items-center justify-center">
                <img 
                  src={avatarJugador} 
                  alt={`Avatar de ${nombreJugador}`} 
                  className="w-10 h-10 object-cover rounded-full" 
                />
              </div>
              <span className="text-xl font-medium text-gray-800">
                {esUsuarioActual ? 'Tú' : nombreJugador}
                {esAnfitrionJugador && ' (Anfitrión)'}
              </span>
            </div>
            <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
              {[...Array(4)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-10 h-10 flex items-center justify-center"
                >
                  {i < (puntos[jugadorId] || 0) && (
                    <img 
                      src={llaveImages[i]} 
                      alt={`Llave ${i + 1}`} 
                      className="w-full h-full object-contain max-w-[40px] max-h-[40px]" 
                    />
                  )}
                </div>
              ))}
              
              {/* Solo muestra los botones si el usuario actual es el anfitrión */}
              {esAnfitrion && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => actualizarPuntos(jugadorId, -1)}
                    className="bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-xl hover:bg-red-600"
                  >
                    -
                  </button>
                  <button
                    onClick={() => actualizarPuntos(jugadorId, 1)}
                    className="bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-xl hover:bg-green-600"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          </li>
        );
      })}
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
            {/* Contenedor principal con fondo de trivia - Ajustado para móviles */}
            <div className="relative w-full min-h-[450px] md:min-h-[500px] lg:min-h-[600px]">
              {/* Imagen de fondo */}
              <img 
                src={fondoTrivia} 
                alt="Marco Trivia" 
                className="absolute inset-0 w-full h-full object-cover md:object-contain"
              />
              
              {/* Contenido superpuesto */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 md:p-8">
                {/* Íconos superiores */}
                {/* Barra de tiempo con iconos */}
                <div className="bg-orange-100 rounded-lg p-3 md:p-4 mb-4 flex justify-center items-center space-x-4">
                  <img src={relojIcon} alt="Reloj" className="w-6 h-6 md:w-8 md:h-8" />
                  <GameTimer 
                    tiempoFinReto={salaData.tiempoFinReto}
                    onTimeUp={finalizarReto}
                  />
                  <img src={logoLeyendas} alt="Logo Leyendas" className="w-6 h-6 md:w-8 md:h-8" />
                </div>

                <div className="flex justify-between w-full max-w-lg mb-4 md:mb-6">
                  <img src={candelaIcon} alt="Candela" className="w-6 h-6 md:w-8 md:h-8" />
                  <img src={relojIcon} alt="Reloj" className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                
                {/* Pregunta */}
                <h2 className="font-bold text-lg md:text-xl lg:text-2xl mb-4 md:mb-6 text-white text-center px-2 md:px-4">
                  {salaData.retoActual.question}
                </h2>
                
                {/* Opciones */}
                <div className="w-full max-w-lg space-y-2 md:space-y-3 px-4">
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
                        className={`w-full p-2 md:p-3 rounded-lg text-center text-sm md:text-base font-semibold transition-colors ${estilo} ${
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
                  <div className="mt-4 md:mt-6 text-center">
                    <p className="text-base md:text-lg font-bold text-white mb-2">
                      {ultimaRespuesta.correcta ? '¡Respuesta correcta!' : 'Respuesta incorrecta'}
                    </p>
                    <p className="text-xs md:text-sm text-white/80">
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
          <div className="w-full max-w-4xl mx-auto px-4">
            {/* Barra de tiempo con iconos */}
            <div className="bg-orange-100 rounded-lg p-3 md:p-4 mb-4 flex justify-center items-center space-x-4">
              <img src={relojIcon} alt="Reloj" className="w-6 h-6 md:w-8 md:h-8" />
              <GameTimer 
                tiempoFinReto={salaData.tiempoFinReto}
                onTimeUp={finalizarReto}
              />
              <img src={logoLeyendas} alt="Logo Leyendas" className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            
            {/* Contenedor principal con fondo */}
            <div className="relative w-full min-h-[450px] md:min-h-[500px] lg:min-h-[600px] rounded-lg">
              {/* Fondo */}
              <img 
                src={fondoMimica} 
                alt="Fondo" 
                className="absolute inset-0 w-full h-full object-contain"
              />
              
              {/* Luna decorativa */}
              <img 
                src={lunaIcon} 
                alt="Luna" 
                className="relative top-4 left-1/2 transform -translate-x-1/2 w-12 h-12 md:w-16 md:h-16"
              />
              
              {/* Contenido centrado */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 md:p-6 lg:p-8">
                <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold text-white text-center mb-4">
                  ¡Adivina el personaje!
                </h2>
                <p className="text-base md:text-lg lg:text-xl text-white text-center mt-4 max-w-md mx-auto">
                  Los demás jugadores te irán dando pistas. ¡Intenta adivinar!
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-4xl mx-auto px-4">
            {/* Barra de tiempo con iconos */}
            <div className="bg-orange-100 rounded-lg p-3 md:p-4 mb-4 flex justify-center items-center space-x-4">
              <img src={relojIcon} alt="Reloj" className="w-6 h-6 md:w-8 md:h-8" />
              <GameTimer 
                tiempoFinReto={salaData.tiempoFinReto}
                onTimeUp={finalizarReto}
              />
              <img src={logoLeyendas} alt="Logo Leyendas" className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            
            {/* Contenedor principal con fondo */}
            <div className="relative w-full min-h-[450px] md:min-h-[500px] lg:min-h-[600px] rounded-lg">
              {/* Fondo */}
              <img 
                src={fondoMimica} 
                alt="Fondo" 
                className="absolute inset-0 w-full h-full object-contain"
              />
              
              {/* Luna decorativa */}
              <img 
                src={lunaIcon} 
                alt="Luna" 
                className="absolute top-4 left-1/2 transform -translate-x-1/2 w-12 h-12 md:w-16 md:h-16"
              />
              
              {/* Contenido centrado */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 md:p-6 lg:p-8">
                <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold text-white text-center mb-4">
                  {salaData.retoActual.text}
                </h2>
                <h3 className="text-2xl md:text-3xl lg:text-5xl font-bold text-white text-center mb-4">Categoría: 
                  {salaData.retoActual.category}
                </h3>
                <button
                  onClick={finalizarReto}
                  className="mt-6 bg-green-500 hover:bg-green-600 text-white py-2 md:py-3 px-6 md:px-8 rounded-lg text-base md:text-xl font-semibold transition-colors"
                >
                  ¡El jugador ha acertado!
                </button>
              </div>
            </div>
          </div>
        );
      
      //LEYENDAS
      case 'image':
        return (
          <div className="w-full max-w-4xl mx-auto min-h-screen p-4">
                {/* Barra superior */}
                <div className="bg-orange-100 rounded-lg p-3 mb-2 flex justify-center items-center">
                  <img src={relojIcon} alt="Reloj" className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                
                {/* Contenedor del marco - Este mantiene la proporción del marco */}
                <div className="relative w-full aspect-[3/4] sm:aspect-[4/3] md:aspect-[16/9]">
                  {/* Marco exterior - Siempre visible y completo */}
                  <img 
                    src={fondoImage} 
                    alt="Marco"
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                  
                  {/* Contenedor interno - Este maneja el contenido dentro del marco */}
                  <div className="absolute inset-[10%] sm:inset-[12%] md:inset-[10%] flex flex-col items-center">
                    {/* Logo superior */}
                    <img 
                      src={logoLeyendas} 
                      alt="Logo Leyendas" 
                      className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2 sm:mb-4"
                    />
                    
                    {/* Contenedor para imagen y texto */}
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      {imagenReto && (
                        <div className="w-full h-auto max-h-[60%] relative rounded-lg overflow-hidden">
                          <img 
                            src={imagenReto} 
                            alt="Reto" 
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                      
                      {retoTexto && (
                        <div className="text-center mt-2 sm:mt-4 w-full px-2 sm:px-4">
                          <h2 className="text-sm sm:text-base md:text-lg font-bold text-white mb-2">
                            {retoTexto}
                          </h2>
                          
                        </div>
                      )}
                    </div>
                    <button
                            onClick={finalizarReto}
                            className="bg-green-500 hover:bg-green-600 text-white 
                                    py-1.5 px-4 sm:py-2 sm:px-6 md:py-2.5 md:px-8
                                    rounded-lg text-sm sm:text-base font-semibold 
                                    transition-colors"
                          >
                            Avanzar
                    </button>
                  </div>
                </div>
            </div>
        );
      
      //RETOS  
      case 'retoRedes':
        if (esJugadorActual) {
          const socialIcon = getSocialIcon(salaData.retoActual.category);
          
          return (
            <div className="w-full max-w-4xl mx-auto px-4">
              {/* Contenedor principal con aspect ratio ajustado */}
              <div className="relative w-full h-screen max-h-[800px] rounded-lg">
                <img 
                  src={fondoImage} 
                  alt="Fondo" 
                  className="absolute inset-0 w-full h-full object-contain"
                />
                
                {/* Contenido centrado */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                  {/* Logo de la app */}
                  <img 
                    src={logoLeyendas} 
                    alt="Logo Leyendas" 
                    className="w-16 h-16 mb-6"
                  />
                  
                  {/* Ícono de red social */}
                  <img 
                    src={socialIcon} 
                    alt="Red Social" 
                    className="w-20 h-20 mb-6"
                  />
                  
                  {/* Texto del reto */}
                  <div className="bg-gray/90 rounded-lg p-6 max-w-lg w-full mx-auto mb-6">
                    <p className="text-xl text-white md:text-2xl text-center font-bold">
                      {retoTexto}
                    </p>
                  </div>
                  
                  {/* Mensaje de likes */}
                  <div className="bg-blue-500 text-white rounded-lg px-6 py-3 mb-6 mt-5">
                    <p className="text-lg font-semibold text-center">
                      Obtén {likesNeeded} reacciones
                    </p>
                  </div>
                  {/* Botón de avanzar */}
                  <button
                    onClick={finalizarReto}
                    className="bg-green-500 hover:bg-green-600 text-white py-3 px-8 rounded-lg text-xl font-semibold transition-colors"
                  >
                    Avanzar
                  </button>
                  
                </div>
              </div>
            </div>
          );
        } else {
          return (
            <div className="w-full max-w-4xl mx-auto px-4">
              {/* Mantener el mismo header con tiempo */}
              <div className="bg-orange-100 rounded-lg p-4 mb-4 flex justify-center items-center space-x-4">
                <img src={logoLeyendas} alt="Logo Leyendas" className="w-8 h-8" />
              </div>
              
              {/* Mensaje de espera */}
              <div className="relative w-full aspect-[16/9] rounded-lg">
                <img 
                  src={fondoMimica} 
                  alt="Fondo" 
                  className="absolute inset-0 w-full h-full object-contain"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <h2 className="text-2xl md:text-4xl font-bold text-white text-center px-6">
                    ¡El jugador está realizando un reto en redes sociales!
                  </h2>
                </div>
              </div>
            </div>
          );
        }

        //MIMICAS
        case 'mimica':
          if (esJugadorActual) {
            return (
              <div className="w-full max-w-4xl mx-auto px-4 flex flex-col items-center">
                {/* Barra de tiempo */}
                <div className="bg-orange-100 rounded-lg p-3 md:p-4 mb-4 flex justify-center items-center space-x-4">
                  <img src={relojIcon} alt="Reloj" className="w-6 h-6 md:w-8 md:h-8" />
                  <GameTimer 
                    tiempoFinReto={salaData.tiempoFinReto}
                    onTimeUp={finalizarReto}
                  />
                  <img src={logoLeyendas} alt="Logo Leyendas" className="w-6 h-6 md:w-8 md:h-8" />
                </div>
        
                {/* Contenedor de la mímica */}
                <div className="relative w-full min-h-[450px] md:min-h-[500px] lg:min-h-[600px] rounded-lg mb-4">
                  {/* Fondo */}
                  <img 
                    src={fondoMimica} 
                    alt="Fondo" 
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                  
                  {/* Luna decorativa */}
                  <img 
                    src={lunaIcon} 
                    alt="Luna" 
                    className="absolute top-4 left-1/2 transform -translate-x-1/2 w-12 h-12 md:w-16 md:h-16"
                  />
                  
                  {/* Texto de la mímica */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 md:p-6 lg:p-8">
                    <h2 className="text-xl md:text-3xl lg:text-5xl font-bold text-white text-center mb-4 max-w-2xl">
                      {retoTexto}
                    </h2>
                    <p className="text-base md:text-lg lg:text-xl text-white text-center mt-4">
                      ¡Realiza la mímica!
                    </p>
                  </div>
                </div>
                <button
                  onClick={finalizarReto}
                  className="bg-green-500 hover:bg-green-600 text-white py-2 md:py-3 px-6 md:px-8 rounded-lg text-base md:text-xl font-semibold transition-colors -mt-8"
                >
                  ¡El jugador ha acertado!
                </button>
              </div>
            );
          } else {
            return (
              <div className="w-full max-w-4xl mx-auto px-4">
                {/* Barra de tiempo */}
                <div className="bg-orange-100 rounded-lg p-3 md:p-4 mb-4 flex justify-center items-center space-x-4">
                  <img src={relojIcon} alt="Reloj" className="w-6 h-6 md:w-8 md:h-8" />
                  <GameTimer 
                    tiempoFinReto={salaData.tiempoFinReto}
                    onTimeUp={finalizarReto}
                  />
                  <img src={logoLeyendas} alt="Logo Leyendas" className="w-6 h-6 md:w-8 md:h-8" />
                </div>
        
                {/* Contenedor de la mímica */}
                <div className="relative w-full min-h-[450px] md:min-h-[500px] lg:min-h-[600px] rounded-lg">
                  <img 
                    src={fondoMimica} 
                    alt="Fondo" 
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                  <img 
                    src={lunaIcon} 
                    alt="Luna" 
                    className="absolute top-4 left-1/2 transform -translate-x-1/2 w-12 h-12 md:w-16 md:h-16"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 md:p-6 lg:p-8">
                    <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold text-white text-center max-w-2xl">
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

  const esAnfitrion = salaData?.anfitrion?.id === usuario.uid;
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
              backgroundImage: `url(${marcoHeader})`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
            {/* Contenedor para el texto centrado */}
            <div className="absolute inset-0 flex items-center justify-between px-6">
              <div className="flex-grow flex items-center justify-center space-x-4">
                <h1 className="text-3xl font-bold text-white">
                  SALA {codigoSala}
                </h1>
              </div>
              {/* Contador de jugadores */}
              <div className="bg-white/20 px-3 py-1 rounded-lg backdrop-blur-sm">
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

        {esAnfitrion && salaData.estadoJuego === 'esperando' && (
          <button 
            onClick={iniciarJuego}
            className="w-full bg-[#2F4F4F] text-white py-3 px-6 rounded-lg hover:bg-[#1e3333] text-xl font-semibold mb-4 transition-colors"
          >
            Iniciar sala de juego
          </button>
        )}

        {puedeEscanear && !estaJugando && !mostrarScanner && (
          <button 
            onClick={() => setMostrarScanner(true)}
            className="w-full bg-[#2F4F4F] text-white py-3 px-6 rounded-lg hover:bg-[#1e3333] text-xl font-semibold mb-4 transition-colors"
          >
            Jugar
          </button>
        )}

        {/* Muestra la opción para escanear */}
        {mostrarScanner && puedeEscanear && (
          <div className="rounded-lg mb-4">
            <QrScanner
              onScanSuccess={manejarScanExitoso}
              onScanFailure={(error) => {
                console.error('Error en el escaneo:', error);
                //setError(`Error al escanear: ${error.message || 'Desconocido'}`);
              }}
              onLoad={() => setEscanerListo(true)}
            />
            {!escanerListo && (
              <p className="text-white text-center py-2"></p>
            )}
          </div>
        )}

        {renderContenidoJuego()}
      </div>
            {/* Botón Salir fijo en la parte inferior */}
            <div className="p-4">
      <div className="max-w-3xl mx-auto">
        {/* Botón Salir */}
        <button
          onClick={() => setShowModal(true)}
          className="w-full bg-red-500 text-white py-3 px-4 rounded-lg hover:bg-red-600 transition-colors text-lg font-medium"
        >
          Salir
        </button>

        {/* Modal de confirmación */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <h2 className="text-xl font-bold mb-4">¿Estás seguro que deseas salir?</h2>
              <p className="text-gray-600 mb-6">
                {salaData?.anfitrion === usuario.uid
                  ? "Si sales de la sala, esta se cerrará para todos los jugadores ya que eres el anfitrión."
                  : "Si sales de la sala, perderás tu lugar y tendrás que volver a unirte."}
              </p>
              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    handleSalirSala();
                    setShowModal(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  Salir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}