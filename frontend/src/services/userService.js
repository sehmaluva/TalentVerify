import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const userService = {
  getUsers: async () => {
    try {
      const response = await api.get('/users/');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch users');
    }
  },

  getUserById: async (id) => {
    try {
      const response = await api.get(`/users/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user details');
    }
  },

  createUser: async (userData) => {
    try {
      const response = await api.post('/users/register/', userData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create user');
    }
  },

  updateUser: async (id, userData) => {
    try {
      const response = await api.put(`/users/${id}/`, userData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update user');
    }
  },

  deleteUser: async (id) => {
    try {
      await api.delete(`/users/${id}/`);
      return true;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete user');
    }
  },

  changePassword: async (passwordData) => {
    try {
      const response = await api.post('/users/change-password/', passwordData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to change password');
    }
  }
}; 