import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  baseURL: 'http://192.168.160.79:8080', // Cambia esta IP por la IP de tu servidor backend
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
        await AsyncStorage.removeItem('token');
        authEvents.emit('unauthorized');
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