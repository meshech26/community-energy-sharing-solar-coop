import axios from 'axios';

const API_URL = 'http://YOUR_COMPUTER_IP:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;