import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import SalaPrincipal from './pages/SalaPrincipal';
import Sala from './pages/Sala';
import Perfil from './pages/Perfil';
import { auth } from './firebaseConfig';
import { useAuthState } from 'react-firebase-hooks/auth';

const App = () => {
  const [user, loading] = useAuthState(auth); // Añadimos el estado "loading"

  if (loading) {
    return <p>Cargando...</p>; // Muestra un mensaje mientras se obtiene la autenticación
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={user ? <SalaPrincipal usuario={user} /> : <Login />} />
        <Route path="/sala/:codigoSala" element={<Sala usuario={user} />} />
        <Route path="/perfil" element={<Perfil usuario={user} />} />
      </Routes>
    </Router>
  );
};

export default App;

