import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  const setSession = (accessToken, userData, refreshToken = null) => {
    localStorage.setItem('token', accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    } else {
      localStorage.removeItem('refreshToken');
    }
    localStorage.setItem('user', JSON.stringify(userData));
    sessionStorage.removeItem('accountDisabledReason');
    setToken(accessToken);
    setUser(userData);
  };

  const updateUser = (updates) => {
    setUser((prev) => {
      const nextUser = { ...(prev || {}), ...updates };
      localStorage.setItem('user', JSON.stringify(nextUser));
      return nextUser;
    });
  };

  useEffect(() => {
    // Basic check: if we have a token, we assume logged in for now.
    setLoading(false);
  }, [token]);

  const login = async (username, password) => {
    try {
      const response = await api.post('token/', { username, password });
      const { access, refresh, ...userData } = response.data;
      setSession(access, userData, refresh);
      return userData;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const impersonate = async (organizationId, userId = null) => {
    try {
      const response = await api.post(`admin/organizations/${organizationId}/impersonate/`, userId ? { user_id: userId } : {});
      const { access, refresh, ...userData } = response.data;
      setSession(access, userData, refresh);
      return userData;
    } catch (error) {
      console.error("Impersonation failed:", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    sessionStorage.removeItem('accountDisabledReason');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, loading, impersonate, updateUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
