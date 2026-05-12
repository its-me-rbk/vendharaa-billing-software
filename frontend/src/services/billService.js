import api from './api';

const billService = {
  getAll: () => api.get('/bills'),
  create: (data) => api.post('/bills', data),
  addPayment: (billId, data) => api.post(`/bills/${billId}/payments`, data),
};

export default billService;
