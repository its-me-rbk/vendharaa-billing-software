import api from './api';

const reportService = {
  getSummary: () => api.get('/reports/summary'),
  getTopProducts: () => api.get('/reports/top-products'),
  getExpiringProducts: () => api.get('/reports/expiring-products'),
  getSalesTrend: () => api.get('/reports/sales-trend'),
  getCategoryDistribution: () => api.get('/reports/category-distribution'),
};

export default reportService;
