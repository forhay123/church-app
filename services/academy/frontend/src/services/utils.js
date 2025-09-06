// services/utils.js
import { BASE_URL, getToken } from './config';

export const fetchWithAuth = async (endpoint, method = 'GET', body = null) => {
  // Normalize the URL safely
  const normalizedBaseUrl = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const url = `${normalizedBaseUrl}/${normalizedEndpoint}`;

  const token = getToken();
  const headers = {};

  if (!(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : null,
  };

  if (import.meta.env.DEV) {
    console.log("🔐 fetchWithAuth →", { url, method, headers, body: body instanceof FormData ? 'FormData' : body });
  }

  let response;
  try {
    response = await fetch(url, config);
  } catch (err) {
    console.error("🚨 Network error in fetchWithAuth:", err);
    throw err;
  }

  if (!response.ok) {
    let errorData = {};
    try {
      errorData = await response.json();
    } catch {
      // no json body
    }
    console.error("❌ fetchWithAuth failed:", response.status, errorData, "for", url);
    throw new Error(errorData.detail || `API call failed: ${response.status}`);
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null;
  }

  return await response.json();
};
