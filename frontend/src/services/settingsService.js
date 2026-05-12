import api from './api';

const settingsService = {
  getPublic: () => api.get('/general-settings/public'),
  get: () => api.get('/general-settings/get'),
  save: (formData) => api.post('/general-settings/save', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export default settingsService;
