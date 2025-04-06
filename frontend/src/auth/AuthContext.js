import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          console.log('Token found, getting current user');
          const userData = await authService.getCurrentUser();
          console.log('Current user data:', userData);
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error getting current user:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        console.log('No token found');
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username, password, role, company) => {
    try {
      console.log('Login attempt with:', { username, role, company });
      const response = await authService.login(username, password, role, company);
      console.log('Login response:', response);
      
      localStorage.setItem('token', response.access);
      localStorage.setItem('refreshToken', response.refresh);
      
      // Get user data after successful login
      const userData = await authService.getCurrentUser();
      setUser(userData);
      setIsAuthenticated(true);
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    console.log('Logging out');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 