import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000', // adjust to your backend
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refresh = localStorage.getItem('refreshToken');
        if (!refresh) throw new Error('No refresh token');

        // Adjust if your backend uses /api/token/refresh/
        const res = await axios.post('http://localhost:8000/api/token/refresh/', { refresh });

        const { access } = res.data;
        localStorage.setItem('accessToken', access);

        api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
        originalRequest.headers['Authorization'] = `Bearer ${access}`;

        return api(originalRequest);
      } catch (err) {
        console.error('Refresh failed', err);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    }

    return Promise.reject(error);
  }
);

export default api;
