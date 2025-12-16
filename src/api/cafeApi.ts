// src/api/cafeApi.ts
import axios from 'axios';

const cafeApi = axios.create({
  baseURL: 'https://proyecto-wine-backend.onrender.com/api', // Fuerza solo producción
  // baseURL: 'http://localhost:8080/api', // Fuerza solo local
  
});


// Interceptor para enviar token en cada petición
cafeApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['x-token'] = token;
  }
  return config;
});

export default cafeApi;
