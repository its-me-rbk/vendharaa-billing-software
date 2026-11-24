import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

/* ═══ REQUEST INTERCEPTOR ═══ */
api.interceptors.request.use(
  (config) => {
    if (config.url.includes('/users/login')) return config;
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

/* ═══ RESPONSE INTERCEPTOR ═══ */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const message = error.response.data?.message;
      const LOGOUT_KEY = 'app_logout_handled';

      const doLogoutOnce = async (reason, alertText) => {
        try {
          try {
            const { broadcastAndClear } = await import('../utils/storageCleanup');
            broadcastAndClear(LOGOUT_KEY, { reason, ts: Date.now() });
          } catch (_e) {
            try { localStorage.setItem(LOGOUT_KEY, JSON.stringify({ reason, ts: Date.now() })); } catch (_) {}
          }
          try {
            const { default: notify } = await import('../components/ui/notify');
            notify(alertText, 'error');
          } catch (_) {
            console.error(alertText);
          }
        } catch (_) {
          console.error(alertText);
        } finally {
          ['token', 'tokenExpiry', 'user', 'role', 'businessType'].forEach((k) => {
            try { localStorage.removeItem(k); } catch (_) {}
            try { sessionStorage.removeItem(k); } catch (_) {}
          });
          window.location.reload();
        }
      };

      if (message === 'Account logged in from another device') {
        doLogoutOnce('another_device', 'Logged out: account used in another tab/device');
      } else if (message === 'Token expired or invalid') {
        doLogoutOnce('expired', 'Session expired. Please login again.');
      }
    }

    if (error.response?.data?.errorCode) {
      const srvCode = error.response.data.errorCode;
      import('../components/ui/notify')
        .then(({ default: notify }) => notify(`Server Error: ${srvCode}`, 'error'))
        .catch(() => console.error(`Server Error: ${srvCode}`));
    }

    return Promise.reject(error);
  }
);

export default api;
