import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Import all avatar images
import avatar1 from '../assets/Usuario1.png';
import avatar2 from '../assets/Usuario2.png';
import avatar3 from '../assets/Usuario3.png';
import avatar4 from '../assets/Usuario4.png';
import avatar5 from '../assets/Usuario5.png';
import avatar6 from '../assets/Usuario6.png';

const avatarImages = [
  { src: avatar1, name: 'Chispuda' },
  { src: avatar2, name: 'Chela' },
  { src: avatar3, name: 'Chinche' },
  { src: avatar4, name: 'Chongo' },
  { src: avatar5, name: 'Choncho' },
  { src: avatar6, name: 'Chilera' }
];

const Perfil = ({ usuario }) => {
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAvatarSelecting, setIsAvatarSelecting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const navigate = useNavigate();

  // Cargar o crear el perfil del usuario
  useEffect(() => {
    const inicializarPerfil = async () => {
      try {
        const userRef = doc(db, 'usuarios', usuario.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          // Si el documento existe, cargar el displayName y avatar
          const userData = userDoc.data();
          setDisplayName(userData.displayName || usuario.email.split('@')[0]);
          setSelectedAvatar(userData.avatar || null);
        } else {
          // Si el documento no existe, crearlo
          const defaultDisplayName = usuario.email.split('@')[0];
          await setDoc(userRef, {
            email: usuario.email,
            displayName: defaultDisplayName,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          setDisplayName(defaultDisplayName);
          setMensaje('¡Bienvenido! Hemos creado tu perfil');
          setTimeout(() => setMensaje(''), 3000);
        }
      } catch (error) {
        console.error('Error al inicializar el perfil:', error);
        setError('Error al cargar el perfil');
      }
    };

    inicializarPerfil();
  }, [usuario.uid, usuario.email]);

  // Guardar nombre
  const guardarNombre = async () => {
    if (!displayName.trim()) {
      setError('El nombre no puede estar vacío');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userRef = doc(db, 'usuarios', usuario.uid);
      await updateDoc(userRef, {
        displayName: displayName.trim(),
        updatedAt: serverTimestamp()
      });

      setIsEditing(false);
      setMensaje('Nombre actualizado correctamente');
      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      console.error('Error al actualizar el nombre:', error);
      setError('Error al actualizar el nombre');
    } finally {
      setLoading(false);
    }
  };

  // Guardar avatar
  const guardarAvatar = async (avatarSrc) => {
    setLoading(true);
    setError(null);

    try {
      const userRef = doc(db, 'usuarios', usuario.uid);
      await updateDoc(userRef, {
        avatar: avatarSrc,
        updatedAt: serverTimestamp()
      });

      setSelectedAvatar(avatarSrc);
      setIsAvatarSelecting(false);
      setMensaje('Avatar actualizado correctamente');
      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      console.error('Error al actualizar el avatar:', error);
      setError('Error al actualizar el avatar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-yellow-700">
      <div className="w-full max-w-md p-8 bg-yellow-100 rounded-lg shadow-lg">
        <div className="flex items-center mb-6 bg-teal-600 rounded-lg p-2">
          <img 
            src={selectedAvatar || avatar1} 
            alt="Avatar" 
            className="w-12 h-12 rounded-full mr-4" 
          />
          <h1 className="text-2xl font-bold text-white">Mi Perfil</h1>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}

        {mensaje && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
            {mensaje}
          </div>
        )}

        <div className="space-y-4">
          {/* Nombre de usuario */}
          <div className="bg-white p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Nombre de usuario</h2>
            {isEditing ? (
              <div className="flex items-center justify-between space-x-4 mt-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                    placeholder="Ingresa tu nombre de usuario"
                    maxLength={20}
                  />
                </div>
                <button
                  onClick={guardarNombre}
                  disabled={loading}
                  className="bg-teal-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 transition duration-300"
                >
                  Guardar
                </button>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <span className="text-gray-700">
                  {displayName || 'No has establecido un nombre'}
                </span>
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition duration-300"
                >
                  Editar
                </button>
              </div>
            )}
          </div>

          {/* Selección de Avatar */}
          <div className="bg-white p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Avatar</h2>
            {isAvatarSelecting ? (
              <div className="grid grid-cols-3 gap-4">
                {avatarImages.map((avatar, index) => (
                  <div 
                    key={index} 
                    className="flex flex-col items-center cursor-pointer hover:opacity-75"
                    onClick={() => guardarAvatar(avatar.src)}
                  >
                    <img 
                      src={avatar.src} 
                      alt={`Avatar ${index + 1}`} 
                      className="w-20 h-20 rounded-full mb-2" 
                    />
                    <span className="text-sm">{avatar.name}</span>
                  </div>
                ))}
                <button
                  onClick={() => setIsAvatarSelecting(false)}
                  className="col-span-3 mt-4 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition duration-300"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <img 
                    src={selectedAvatar || avatar1} 
                    alt="Avatar seleccionado" 
                    className="w-16 h-16 rounded-full mr-4" 
                  />
                  <span className="text-gray-700">
                    {selectedAvatar 
                      ? avatarImages.find(a => a.src === selectedAvatar)?.name 
                      : 'No has seleccionado un avatar'}
                  </span>
                </div>
                <button
                  onClick={() => setIsAvatarSelecting(true)}
                  className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition duration-300"
                >
                  Cambiar
                </button>
              </div>
            )}
          </div>

          <div className="bg-white p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Email</h2>
            <span className="text-gray-700">{usuario.email}</span>
          </div>

          <button
            onClick={() => navigate('/')}
            className="ml-4 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition duration-300"
          >
            Volver
          </button>
        </div>
      </div>
    </div>
  );
};

export default Perfil;