import api from './api';

const authService = {
  login: (email, password) => api.post('/users/login', { email, password }),
  logout: () => api.post('/users/logout'),
  getSessions: (params) => api.get('/users/sessions', { params }),
};

export default authService;
