import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://taskflow-production-addb.up.railway.app/api';

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true
});

export default api;
