// services/config.js
export const BASE_URL = import.meta.env.VITE_API_BASE_URL;

console.log(`🔗 API Base URL: ${BASE_URL}`);

export const getToken = () => localStorage.getItem("token");
