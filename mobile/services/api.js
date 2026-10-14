import axios from 'axios';
import { Platform } from 'react-native';

import { useAuthStore } from '../store/authStore';

const configuredUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
const isLocalBrowser = Platform.OS === 'web' && typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
// A phone's LAN address can change when Wi-Fi changes. Local browser previews
// can reach the same backend through loopback without depending on that address.
const localUrl = new URL(configuredUrl);
if (isLocalBrowser && /^(localhost|127\.0\.0\.1|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(localUrl.hostname)) {
  localUrl.hostname = window.location.hostname;
}
const API_URL = (Platform.OS === 'web' && process.env.EXPO_PUBLIC_WEB_API_URL
  ? process.env.EXPO_PUBLIC_WEB_API_URL
  : localUrl.toString()).replace(/\/$/, '');

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
export { API_URL };
