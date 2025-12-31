import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: '/api', // Proxy in vite.config handles this -> http://localhost:5000/api
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;