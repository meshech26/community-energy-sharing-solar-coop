import axios from 'axios';
import { Platform } from 'react-native';
import { useAuthStore } from '../store/authStore';

// Dynamically get the host running the page in the browser.
// If running on a phone browser, window.location.hostname will return your computer's IP (e.g. 192.168.196.15).
// If running on your computer, it will return 'localhost'.
const getWebHost = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    return window.location.hostname;
  }
  return 'localhost';
};

const host = getWebHost();

const API_URL = Platform.select({
  web: `http://${host}:5000/api`,
  ios: 'http://localhost:5000/api',
  android: 'http://10.0.2.2:5000/api',
  // Fallback to your computer's local network IP for physical Expo Go devices
  default: 'http://192.168.196.15:5000/api', 
});

console.log(`[API Client] Connecting to backend at: ${API_URL}`);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor to append authentication token from Zustand store
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor for centralized error and unauthorized redirection handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response ? error.response.status : null;
    
    if (status === 401) {
      console.warn('Unauthorized request! Logging out...');
      useAuthStore.getState().logout();
    }
    
    return Promise.reject(error);
  }
);

export default api;