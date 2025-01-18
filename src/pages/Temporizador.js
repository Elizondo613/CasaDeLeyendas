import React, { useState, useEffect } from 'react';

const GameTimer = ({ 
  tiempoFinReto,
  onTimeUp,
  className = ""
}) => {
  const [tiempoRestante, setTiempoRestante] = useState(30);
  const [mostrarAlerta, setMostrarAlerta] = useState(false);

  useEffect(() => {
    if (!tiempoFinReto) return;

    const calcularTiempoRestante = () => {
      const ahora = new Date();
      const tiempoFin = tiempoFinReto.toDate();
      return Math.max(0, Math.floor((tiempoFin - ahora) / 1000));
    };

    // Establecer tiempo inicial
    setTiempoRestante(calcularTiempoRestante());

    // Crear intervalo
    const intervalo = setInterval(() => {
      const nuevoTiempo = calcularTiempoRestante();
      setTiempoRestante(nuevoTiempo);

      // Si el tiempo llega a 0, mostrar alerta y finalizar
      if (nuevoTiempo <= 0) {
        clearInterval(intervalo);
        setMostrarAlerta(true);
        // Llamar a onTimeUp inmediatamente
        if (onTimeUp) onTimeUp();
        
        // Ocultar la alerta después de 3 segundos
        setTimeout(() => {
          setMostrarAlerta(false);
        }, 3000);
      }
    }, 1000);

    return () => clearInterval(intervalo);
  }, [tiempoFinReto, onTimeUp]);

  const formatearTiempo = (segundos) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div className={`relative ${className}`}>
        <span className="text-2xl font-bold">
          {formatearTiempo(tiempoRestante)}
        </span>
      </div>

      {mostrarAlerta && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 9999 }}>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-xl p-6 shadow-xl transform scale-100 transition-all duration-300 animate-bounce">
            <h2 className="text-2xl md:text-3xl font-bold text-red-600 text-center">
              ¡Se acabó el tiempo!
            </h2>
            <p className="text-gray-600 text-center mt-2">
              El reto ha finalizado
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default GameTimer;