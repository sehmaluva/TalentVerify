// API Configuration
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Authentication Configuration
export const AUTH_TOKEN_KEY = 'token';
export const AUTH_USER_KEY = 'user';

// Role Configuration
export const position = {
  ADMIN: 'admin',
  COMPANY: 'company',
  EMPLOYEE: 'employee'
};

// Route Configuration
export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  ADMIN: '/admin',
  COMPANY: '/company',
  EMPLOYEE: '/employee',
  SEARCH: '/search',
  PROFILE: '/profile'
}; 