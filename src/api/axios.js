import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/constants';

class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  off(event, callback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  emit(event, data) {
    if (!this.events[event]) return;
    this.events[event].forEach(callback => callback(data));
  }
}

export const authEvents = new EventEmitter();

const api = axios.create({
  baseURL: API_BASE_URL, // URL base desde variables de entorno
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      console.error('Error de respuesta:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
      
      if (error.response.status === 401) {
        // Solo procesar 401 si NO es una petición de login
        const isLoginRequest = error.config?.url?.includes('/api/login_check');
        
        if (!isLoginRequest) {
          // Verificar si es un token expirado
          const isExpiredToken = error.response.data?.message === "Expired JWT Token";
          
          // Emitir evento específico para token expirado
          if (isExpiredToken) {
            authEvents.emit('sessionExpired');
          }
          
          // Eliminar token y emitir evento de unauthorized
          setTimeout(async () => {
            await AsyncStorage.removeItem('token');
            authEvents.emit('unauthorized');
          }, 300);
          
          return new Promise(() => {}); // Cancela la promesa sin rechazarla
        }
        // Si es login, dejar que el error pase al catch de AuthContext
      }
      
      if (error.response.status === 403) {
        // Manejo específico para error 403 (Forbidden)
        await AsyncStorage.removeItem('token');
        authEvents.emit('forbidden', {
          message: 'No posee permisos para acceder a este recurso'
        });
        return new Promise(() => {}); // Cancela la promesa sin rechazarla
      }
    } else if (error.request) {
      // La solicitud se realizó pero no se recibió respuesta
      console.error('Error de red:', error.request);
    } else {
      // Algo sucedió en la configuración de la solicitud
      console.error('Error de configuración:', error.message);
    }
    return Promise.reject(error);
   }
);

export default api;