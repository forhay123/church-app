// auth.js

import { BASE_URL, getToken } from './config';
import { fetchWithAuth } from './utils';

/**
 * Login user, store access token, and fetch user details
 */
export const loginUser = async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    // This part is correctly handling the URL with a manual normalization
    // because it uses a specific form-urlencoded content type.
    const normalizedBaseUrl = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
    const url = `${normalizedBaseUrl}/token`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Login failed');
    }

    const data = await response.json();
    const token = data.access_token;

    localStorage.setItem('token', token);
    localStorage.setItem('username', username);

    // Fetch current user info
    const user = await getCurrentUser();

    // Store user attributes
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('fullName', user.full_name || '');
    localStorage.setItem('isAdmin', user.role === 'admin');
    localStorage.setItem('role', user.role);
    localStorage.setItem('level', user.level || '');
    localStorage.setItem('department', user.department || '');

    return { token, user };
};

/**
 * Get currently logged-in user details
 */
export const getCurrentUser = async () => {
    const token = getToken();
    if (!token) throw new Error('No auth token found');

    // THIS IS THE LINE THAT NEEDS TO BE CHANGED IN YOUR CODE
    // It must use the fetchWithAuth utility
    return await fetchWithAuth('/me/', 'GET');
};

/**
 * Register a new user (admin-only or authenticated)
 */
export const registerUser = async (userDetails) => {
    // This function is already correctly using fetchWithAuth
    return await fetchWithAuth('/register/', 'POST', userDetails);
};

/**
 * Logout user by clearing localStorage
 */
export const logoutUser = () => {
    localStorage.clear();
};