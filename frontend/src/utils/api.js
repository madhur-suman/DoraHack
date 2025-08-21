import axios from 'axios';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: '',
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include CSRF token if needed
api.interceptors.request.use(
  (config) => {
    // Get CSRF token from cookie if it exists
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
    
    // Attach JWT access token if available
    const access = localStorage.getItem('accessToken');
    if (access) {
      config.headers['Authorization'] = `Bearer ${access}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Optional: handle 401 for token refresh logic
    return Promise.reject(error);
  }
);

export default api;
