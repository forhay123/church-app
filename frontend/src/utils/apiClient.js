import axios from "axios";

// ----------------------
// API Base URL
// ----------------------
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/workforce/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ----------------------
// Interceptor: attach JWT
// ----------------------
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;
