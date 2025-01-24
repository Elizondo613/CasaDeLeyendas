import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import SalaPrincipal from './pages/SalaPrincipal';
import Sala from './pages/Sala';
import Perfil from './pages/Perfil';
import { auth } from './firebaseConfig';
import { useAuthState } from 'react-firebase-hooks/auth';

const ProtectedRoute = ({ children, user, loading }) => {
  if (loading) {
    return <p>Cargando...</p>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const App = () => {
  const [user, loading] = useAuthState(auth);

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={user ? <SalaPrincipal usuario={user} /> : <Login />} 
        />
        <Route 
          path="/sala/:codigoSala" 
          element={
            <ProtectedRoute user={user} loading={loading}>
              <Sala usuario={user} />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/perfil" 
          element={
            <ProtectedRoute user={user} loading={loading}>
              <Perfil usuario={user} />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;