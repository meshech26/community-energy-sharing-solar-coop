import axios from "axios";
import { useAuthStore } from "../store/authStore";

const client = axios.create({
  baseURL: "http://192.168.1.47:5000/api",
});

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;