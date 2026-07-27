import axios from 'axios';

// Axios Instance
// Configures central HTTP client for Express backend communication.
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default API;
