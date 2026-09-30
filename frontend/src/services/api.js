import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true,
});

export const tripService = {
  search: (params) => api.get('/trips/search', { params }),
  getById: (id) => api.get(`/trips/${id}`),
  getSeats: (id, date) => api.get(`/trips/${id}/seats`, { params: { date } }),
};

export const bookingService = {
  create: (data) => api.post('/bookings', data),
  lookup: (bookingCode, phone) => api.get('/bookings/lookup', { params: { bookingCode, phone } }),
  getById: (id) => api.get(`/bookings/${id}`),
  cancel: (id) => api.patch(`/bookings/${id}/cancel`),
};

export const routeService = {
  getPopular: () => api.get('/routes/popular'),
  getCities: () => api.get('/routes/cities'),
};

export const promotionService = {
  getActive: () => api.get('/promotions'),
};

export const newsService = {
  getAll: () => api.get('/news'),
  getById: (id) => api.get(`/news/${id}`),
};

export const authService = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
};

export default api;
