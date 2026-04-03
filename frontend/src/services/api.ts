import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          localStorage.setItem('accessToken', data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const auth = {
  register: (email: string, password: string) => api.post('/auth/register', { email, password }),
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const subscriptions = {
  getAll: (params?: { status?: string; category?: string }) => api.get('/subscriptions', { params }),
  getById: (id: string) => api.get(`/subscriptions/${id}`),
  create: (data: { name: string; amount: number; currency?: string; billingCycle: string; nextBillingDate: string }) =>
    api.post('/subscriptions', data),
  update: (id: string, data: Partial<{ name: string; amount: number; status: string }>) => api.patch(`/subscriptions/${id}`, data),
  delete: (id: string) => api.delete(`/subscriptions/${id}`),
  pause: (id: string) => api.post(`/subscriptions/${id}/pause`),
  resume: (id: string) => api.post(`/subscriptions/${id}/resume`),
  upcoming: (days?: number) => api.get('/subscriptions/upcoming', { params: { days } }),
};

export const detection = {
  detectSms: (text: string) => api.post('/detect/sms', { text }),
  confirm: (detectionLogId: string, confirmed: boolean, data?: { name: string; amount: number; billingCycle: string }) =>
    api.post('/detect/confirm', { detectionLogId, confirmed, ...data }),
  getLogs: (status?: string) => api.get('/detect/logs', { params: { status } }),
};

export const analytics = {
  monthlySpend: (months?: number) => api.get('/analytics/monthly-spend', { params: { months } }),
  categoryBreakdown: () => api.get('/analytics/category-breakdown'),
  subscriptionStats: () => api.get('/analytics/subscription-stats'),
  upcomingRenewals: (days?: number) => api.get('/analytics/upcoming-renewals', { params: { days } }),
  totalMonthlySpend: () => api.get('/analytics/total-monthly-spend'),
  unusedSubscriptions: (days?: number) => api.get('/analytics/unused-subscriptions', { params: { days } }),
};

export const payments = {
  getAll: (subscriptionId?: string) => api.get('/payments', { params: { subscriptionId } }),
  create: (data: { subscriptionId: string; amount: number; currency?: string; paymentDate: string }) =>
    api.post('/payments', data),
};

export default api;