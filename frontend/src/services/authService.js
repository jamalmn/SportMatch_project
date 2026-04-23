import api from './api';

export const login = (email, password) =>
  api.post('/api/auth/login', { email, password });

export const register = (data) =>
  api.post('/api/auth/register', data);

export const logout = () =>
  api.post('/api/auth/logout');
