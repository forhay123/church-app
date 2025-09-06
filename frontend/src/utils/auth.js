import { jwtDecode } from 'jwt-decode';

/**
 * Retrieves and decodes the user's token from local storage.
 * @returns {object|null} The decoded user object or null if no valid token exists.
 */
export function get_current_user_token() {
  // ✅ FIX: Change the key from 'access_token' to 'token'
  const token = localStorage.getItem('token'); 
  
  if (!token) {
    return null;
  }
  try {
    const decodedToken = jwtDecode(token);
    // Check if the token is expired
    if (decodedToken.exp * 1000 < Date.now()) {
      localStorage.removeItem('token'); // Clean up expired token
      return null;
    }
    return decodedToken;
  } catch (error) {
    console.error("Failed to decode token:", error);
    localStorage.removeItem('token'); // In case of invalid token format
    return null;
  }
}

/**
 * Checks if a user has access based on their role and a required route role.
 * @param {string} role - The user's role.
 * @param {string} routeRole - The role required for the route.
 * @returns {boolean} True if the user has access, false otherwise.
 */
export function canAccess(role, routeRole) {
  // This logic seems a bit simplified, but we'll keep it as-is for now.
  return role === "admin" || role === routeRole;
}