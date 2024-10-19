import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';

import backgroundImageLogin from '../assets/BackgroundLogin.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      console.error("Error de autenticación:", error);
      setError("Error de autenticación, por favor revisa tus credenciales.");
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError(null);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-yellow-700">
      <div 
        className="relative w-full max-w-md p-8 bg-no-repeat bg-contain bg-center"
        style={{ 
          backgroundImage: `url(${backgroundImageLogin})`,
          aspectRatio: "1 / 1",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        <h2 className="text-3xl font-bold text-center text-pink-600 mb-6">
          {isLogin ? "Iniciar sesión" : "Registrarse"}
        </h2>
        {error && <p className="p-2 text-red-600 bg-red-100 rounded mb-4">{error}</p>}
        <form onSubmit={handleAuth} className="space-y-4 w-3/4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo electrónico"
            required
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-yellow-500 bg-white placeholder-gray-400"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            required
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-yellow-500 bg-white placeholder-gray-400"
          />
          <button
            type="submit"
            className="w-full py-3 font-semibold text-white bg-yellow-600 rounded hover:bg-yellow-700 transition duration-200"
          >
            {isLogin ? "Iniciar Partida" : "Registrarse"}
          </button>
        </form>
        <p className="mt-4 text-sm text-gray-600">
          {isLogin ? "¿No tienes una cuenta?" : "¿Ya tienes una cuenta?"}
          <button
            onClick={toggleAuthMode}
            className="ml-1 text-pink-600 hover:text-pink-800"
          >
            {isLogin ? "Regístrate" : "Inicia sesión"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;