import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for authentication
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const lecturerAPI = {
  create: (data) => api.post('/admin/lecturers', data),
  getAll: () => api.get('/admin/lecturers'),
  update: (id, data) => api.put(`/admin/lecturers/${id}`, data),
  delete: (id) => api.delete(`/admin/lecturers/${id}`)
};

export const courseAssignmentAPI = {
  create: (data) => api.post('/admin/assignments', data),
  getAll: () => api.get('/admin/assignments'),
  update: (id, data) => api.put(`/admin/assignments/${id}`, data),
  delete: (id) => api.delete(`/admin/assignments/${id}`)
}; 