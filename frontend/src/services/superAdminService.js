import api from './api';

const superAdminService = {
  getSummary: () => api.get('/super-admin/summary'),
  getLogs: (params) => api.get('/super-admin/logs', { params }),
  getUsers: () => api.get('/super-admin/users'),
  addUser: (data) => api.post('/super-admin/users', data),
  deleteUser: (id) => api.delete(`/super-admin/users/${id}`),
  updateUser: (id, data) => api.put(`/super-admin/users/${id}`, data),
};

export default superAdminService;
