import axios from 'axios';
import { supabase } from './supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(err.response?.data || err)
);

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (name, email, password) => api.post('/auth/register', { name, email, password }),
  me: () => api.get('/auth/me'),
  updateStreak: () => api.post('/auth/streak'),
};

export const questionsAPI = {
  subjects: () => api.get('/questions/subjects'),
  bySubject: (subjectId, params) => api.get(`/questions/subject/${subjectId}`, { params }),
  bookmark: (id) => api.post(`/questions/${id}/bookmark`),
  myBookmarks: (subject_id) => api.get('/questions/bookmarks/mine', { params: { subject_id } }),
};

export const testsAPI = {
  list: (params) => api.get('/tests', { params }),
  get: (id) => api.get(`/tests/${id}`),
  daily: (subjectId) => api.get(`/tests/daily/${subjectId}`),
};

export const resultsAPI = {
  submit: (test_id, answers, time_taken) => api.post('/results/submit', { test_id, answers, time_taken }),
  get: (id) => api.get(`/results/${id}`),
  history: () => api.get('/results/my/history'),
  leaderboard: () => api.get('/results/leaderboard/weekly'),
};

export const adminAPI = {
  stats: () => api.get('/admin/questions/stats'),
  uploadPDF: (formData) => api.post('/admin/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  uploadStatus: (logId) => api.get(`/admin/upload/status/${logId}`),
  uploadLogs: () => api.get('/admin/upload/logs'),
  questions: (params) => api.get('/admin/questions', { params }),
  createQuestion: (data) => api.post('/admin/questions', data),
  updateQuestion: (id, data) => api.put(`/admin/questions/${id}`, data),
  deleteQuestion: (id) => api.delete(`/admin/questions/${id}`),
  bulkDelete: (ids) => api.delete('/admin/questions/bulk', { data: { ids } }),
};

export default api;
