import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api.js';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCivicUser, setIsCivicUser] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Check for Civic Auth token first
      const civicToken = localStorage.getItem('civicToken');
      if (civicToken) {
        // TODO: Verify Civic token with backend
        const civicUser = JSON.parse(localStorage.getItem('civicUser'));
        if (civicUser) {
          setUser(civicUser);
          setIsCivicUser(true);
          setLoading(false);
          return;
        }
      }

      // Fallback to existing JWT auth
      const response = await api.get('/api/users/me/');
      setUser(response.data);
      setIsCivicUser(false);
    } catch (error) {
      console.warn('checkAuth failed, probably expired token');
      setUser(null);
      setIsCivicUser(false);
    } finally {
      setLoading(false);
    }
  };

  // Civic Auth methods
  const civicLogin = async (civicUserData) => {
    try {
      // Store Civic user data
      localStorage.setItem('civicUser', JSON.stringify(civicUserData));
      localStorage.setItem('civicToken', 'civic-auth-token-placeholder');
      
      // Set user in context
      setUser(civicUserData);
      setIsCivicUser(true);
      
      // TODO: Sync with backend if needed
      // await api.post('/api/users/civic-sync/', civicUserData);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Civic authentication failed',
      };
    }
  };

  const civicLogout = async () => {
    try {
      // Clear Civic auth data
      localStorage.removeItem('civicUser');
      localStorage.removeItem('civicToken');
      
      // Clear user from context
      setUser(null);
      setIsCivicUser(false);
      
      // TODO: Notify backend if needed
      // await api.post('/api/users/civic-logout/');
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Civic logout failed',
      };
    }
  };

  // Legacy JWT auth methods (kept for backward compatibility)
  const login = async (username, password) => {
    try {
      const response = await api.post('/api/users/login/', { username, password });
      const { access, refresh, ...userData } = response.data;

      if (access) localStorage.setItem('accessToken', access);
      if (refresh) localStorage.setItem('refreshToken', refresh);

      api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      setUser(userData);
      setIsCivicUser(false);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed',
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/api/users/register/', userData);
      setUser(response.data);
      setIsCivicUser(false);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Registration failed',
      };
    }
  };

  const logout = async () => {
    try {
      if (isCivicUser) {
        return await civicLogout();
      }

      // Legacy JWT logout
      await api.post('/api/users/logout/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      setIsCivicUser(false);
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isCivicUser,
    civicLogin,
    civicLogout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
