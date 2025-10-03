import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { authEvents } from '../api/axios';
import ToastService from '../services/toastService';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

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
      return { success: true };
    } catch (error) {
      
      // Capturar el mensaje específico del error antes de que el interceptor lo procese
      if (error.response && error.response.status === 401) {
        return { success: false, message: 'Credenciales inválidas' };
      }
      
      return { success: false, message: 'Error de conexión. Intente nuevamente.' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      setUser(null);
    } catch (error) {
      ToastService.showError('Error en logout', error.message || 'Error desconocido');
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
      ToastService.showError('Error en checkAuthState', error.message || 'Error desconocido');
    } finally {
      setInitializing(false);
    }
  };

  useEffect(() => {
    checkAuthState();
    
    const handleUnauthorized = () => {
      setUser(null);
    };
    
    const handleForbidden = (data) => {
      ToastService.showError('Sin permisos', data.message || 'No posee permisos para acceder a este recurso');
      setUser(null);
    };
    
    const handleSessionExpired = (data) => {
      setSessionExpired(true);
      setUser(null);
    };
    
    authEvents.on('unauthorized', handleUnauthorized);
    authEvents.on('forbidden', handleForbidden);
    authEvents.on('sessionExpired', handleSessionExpired);
    
    return () => {
      authEvents.off('unauthorized', handleUnauthorized);
      authEvents.off('forbidden', handleForbidden);
      authEvents.off('sessionExpired', handleSessionExpired);
    };
  }, []);

  if (initializing) {
    // Pantalla de carga mientras se verifica el estado de autenticación
    return null; // O puedes retornar un componente de splash screen
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, initializing, sessionExpired, setSessionExpired }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);