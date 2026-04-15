import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '');

if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  console.error('Missing VITE_API_URL. Set it to your Railway backend URL ending in /api.');
}

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true
});

export default api;
