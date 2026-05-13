import api from './api';

const authService = {
  login: (email, password, force = false) => api.post('/users/login', { email, password, force }),
  logout: () => api.post('/users/logout'),
  getSessions: (params) => api.get('/users/sessions', { params }),
};

export default authService;
