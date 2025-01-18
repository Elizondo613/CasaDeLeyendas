import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { auth } from '../firebaseConfig';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged,
  sendPasswordResetEmail 
} from 'firebase/auth';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

import backgroundImageLogin from '../assets/BackgroundLogin.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Creamos nuevo documento de usuario
  const createUserDocument = async (user) => {
    try {
      const userRef = doc(db, 'usuarios', user.uid);
      await setDoc(userRef, {
        email: user.email,
        displayName: user.email.split('@')[0], // Nombre por defecto
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error al crear documento de usuario:", error);
      // No lanzamos el error para no interrumpir el flujo de registro
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Registro de nuevo usuario
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Crear documento en Firestore
        await createUserDocument(userCredential.user);
      }
    } catch (error) {
      console.error("Error de autenticación:", error);
      setError("Error de autenticación, por favor revisa tus credenciales.");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Por favor, ingresa tu correo electrónico");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage("Se ha enviado un correo de recuperación. Por favor revisa tu bandeja de entrada.");
      setError(null);
      setShowResetPassword(false);
    } catch (error) {
      console.error("Error al enviar email de recuperación:", error);
      setError("Error al enviar el correo de recuperación. Verifica que el correo sea correcto.");
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setSuccessMessage('');
    setShowResetPassword(false);
  };

  const toggleResetPassword = () => {
    setShowResetPassword(!showResetPassword);
    setError(null);
    setSuccessMessage('');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-yellow-700 p-4">
      <div className="w-full max-w-sm sm:max-w-lg mx-auto px-4">
        {/* Marco con fondo de imagen */}
        <div 
          className="relative flex items-center justify-center bg-no-repeat bg-cover bg-center rounded-lg shadow-lg overflow-hidden"
          style={{ backgroundImage: `url(${backgroundImageLogin})` }}
        >
          {/* Contenido */}
          <div className="relative z-10 w-full px-6 py-8 sm:px-8 sm:py-12 space-y-6 rounded-lg">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-pink-600 leading-relaxed">
              {showResetPassword 
                ? "Recuperar Contraseña" 
                : (isLogin ? "Iniciar sesión" : "Registrarse")}
            </h2>

            {/* Mensajes de error y éxito */}
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-100 rounded-lg">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="p-3 text-sm text-green-600 bg-green-100 rounded-lg">
                {successMessage}
              </div>
            )}

            {/* Formulario */}
            <div className="space-y-6">
              {showResetPassword ? (
                <form onSubmit={handleResetPassword} className="space-y-6">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Correo electrónico"
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                  />
                  <button
                    type="submit"
                    className="w-full py-3 font-semibold text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 transition duration-200"
                  >
                    Enviar correo
                  </button>
                  <button
                    type="button"
                    onClick={toggleResetPassword}
                    className="w-full py-3 font-semibold text-yellow-600 border border-yellow-600 rounded-lg hover:bg-yellow-50 transition duration-200"
                  >
                    Volver
                  </button>
                </form>
              ) : (
                <form onSubmit={handleAuth} className="space-y-6">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Correo electrónico"
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                  />
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Contraseña"
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 font-semibold text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 transition duration-200"
                  >
                    {isLogin ? "Iniciar Partida" : "Registrarse"}
                  </button>
                </form>
              )}

              {/* Enlaces */}
              {isLogin && (
                <button
                  onClick={toggleResetPassword}
                  className="block text-center text-pink-600 hover:text-pink-800"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              )}
              <p className="text-center text-gray-600">
                {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}
                <button
                  type="button"
                  onClick={toggleAuthMode}
                  className="ml-1 text-pink-600 hover:text-pink-800"
                >
                  {isLogin ? "Regístrate" : "Inicia sesión"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
