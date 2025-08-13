import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { authEvents } from '../api/axios';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const login = async (username, password) => {
    try {
      setLoading(true);
      const response = await api.post('/api/login_check', { 
        username, 
        password 
      });
      const { token } = response.data;
      
      await AsyncStorage.setItem('token', token);
      setUser({ username }); // Guardamos el nombre de usuario como información básica del usuario
      return true;
    } catch (error) {
      console.error('Error en login:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      setUser(null);
    } catch (error) {
      console.error('Error en logout:', error);
    }
  };

  const checkAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        // Si hay token, asumimos que el usuario está autenticado
        // Aquí podrías hacer una llamada al servidor para validar el token
        setUser({ authenticated: true });
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setInitializing(false);
    }
  };

  useEffect(() => {
    checkAuthState();
    
    const handleUnauthorized = () => {
      setUser(null);
    };
    
    authEvents.on('unauthorized', handleUnauthorized);
    
    return () => {
      authEvents.off('unauthorized', handleUnauthorized);
    };
  }, []);

  if (initializing) {
    // Pantalla de carga mientras se verifica el estado de autenticación
    return null; // O puedes retornar un componente de splash screen
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, initializing }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);