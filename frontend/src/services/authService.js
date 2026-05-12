import api from './api';

const authService = {
  login: (email, password, role) => api.post('/users/login', { email, password, role }),
  logout: () => api.post('/users/logout'),
  getSessions: (params) => api.get('/users/sessions', { params }),
};

export default authService;
