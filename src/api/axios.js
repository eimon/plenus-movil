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

      
      if (error.response.status === 401) {
        // Solo procesar 401 si NO es una petición de login
        const isLoginRequest = error.config?.url?.includes('/api/login_check');
        
        if (!isLoginRequest) {
          // Verificar si es un token expirado
          const isExpiredToken = error.response.data?.message === "Expired JWT Token";
          
          // Emitir evento específico para token expirado
          if (isExpiredToken) {
            authEvents.emit('sessionExpired', {
              message: 'Su sesión ha expirado. Por favor inicie sesión nuevamente.'
            });
          }
          
          // Eliminar token y emitir evento de unauthorized
          setTimeout(async () => {
            await AsyncStorage.removeItem('token');
            authEvents.emit('unauthorized', {
              message: 'Sesión no autorizada. Por favor inicie sesión.'
            });
          }, 300);
          
          return new Promise(() => {}); // Cancela la promesa sin rechazarla
        }
        // Si es login, dejar que el error pase al catch de AuthContext
      }
      
      if (error.response.status === 403) {
        // Diferenciar 403 por endpoint para manejar permisos globales vs de recurso
        const url = error.config?.url || '';
        const isEventsListing = url.includes('/api/eventos');

        if (isEventsListing) {
          // Sin permisos para ver el listado general: cerrar sesión
          await AsyncStorage.removeItem('token');
          authEvents.emit('forbidden', {
            message: 'No posee permisos para acceder al listado de eventos'
          });
          return new Promise(() => {}); // Cancela la promesa sin rechazarla
        }

        // 403 al acceder a un recurso específico (evento/competencia):
        // no desloguear; dejar que la pantalla maneje el error
        authEvents.emit('resourceForbidden', {
          message: 'No posee permisos para acceder a este recurso',
          url,
        });
        return Promise.reject(error);
      }
    } 
    return Promise.reject(error);
   }
);

export default api;