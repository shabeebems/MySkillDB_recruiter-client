import axios from 'axios';

/**
 * API Configuration
 * 
 * SECURITY NOTE: In production, ensure VITE_SERVER_API_URL uses HTTPS (https://)
 * to encrypt all data in transit, including login credentials.
 * The password visible in browser DevTools is normal - it's encrypted when sent over HTTPS.
 */
const API = axios.create({
    baseURL: `${import.meta.env.VITE_SERVER_API_URL}/api`,
    // Removed withCredentials: true - no longer using cookies
});

// Request interceptor to add Authorization header
API.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
API.interceptors.response.use(
  (response) => {
    // Check if server sent a new access token (token refresh via checkAuth)
    const newAccessToken = response.headers['x-new-access-token'];
    if (newAccessToken) {
      localStorage.setItem('accessToken', newAccessToken);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Guard: no config (e.g. network error) — reject immediately
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Skip token refresh for login and refresh endpoints to avoid infinite loops
    const isAuthEndpoint = originalRequest.url?.includes('/auth/login') || 
                          originalRequest.url?.includes('/auth/refresh');

    // If unauthorized and we haven't retried yet, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        try {
          // Call refresh token endpoint
          const response = await axios.post(
            `${import.meta.env.VITE_SERVER_API_URL}/api/auth/refresh`,
            {},
            {
              headers: {
                Authorization: `Bearer ${refreshToken}`,
              },
            }
          );

          if (response.data.success && response.data.data?.accessToken) {
            const newAccessToken = response.data.data.accessToken;
            
            // Update access token in localStorage
            localStorage.setItem('accessToken', newAccessToken);

            // Update the original request with new token
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

            // Retry the original request
            return API(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed - clear tokens and redirect to login
          console.error('Token refresh failed:', refreshError);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          
          // Only redirect if not already on login page
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available - clear tokens and redirect
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        // Only redirect if not already on login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export const getRequest = (route) => API.get(route);
export const postRequest = (route, data, method = 'POST') => {
  if (method === 'DELETE') {
    return API.delete(route);
  }
  return API.post(route, data);
};
export const putRequest = (route, data) => API.put(route, data);
export const patchRequest = (route, data) => API.patch(route, data);
export const deleteRequest = (route) => API.delete(route);

export const logoutRequest = (route) => API.post(route);