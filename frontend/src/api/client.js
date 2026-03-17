import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ams_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ams_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),

  logout: () => api.post('/auth/logout'),

  me: () => api.get('/auth/me'),
};

export const studentsApi = {
  list: (params) => api.get('/students', { params }),

  get: (id) => api.get(`/students/${id}`),

  create: (data) => api.post('/students', data),

  update: (id, data) => api.put(`/students/${id}`, data),
};

export const subjectsApi = {
  list: () => api.get('/subjects'),
};

export const attendanceApi = {
  createSession: (data) => api.post('/attendance/session', data),

  bulkMark: (session_id, records) =>
    api.post(`/attendance/session/${session_id}/mark`, { records }),

  overrideRecord: (record_id, status) =>
    api.put(`/attendance/record/${record_id}`, { status }),

  getSummary: (subject_id) =>
    api.get('/attendance/summary', {
      params: subject_id ? { subject_id } : {},
    }),

  getDefaulters: () => api.get('/attendance/defaulters'),

  condoneRecord: (record_id, reason) =>
    api.put(`/attendance/record/${record_id}/condone`, { reason }),

  markHoliday: (subject_id, date) =>
    api.post('/attendance/holiday', { subject_id, date }),

  getSessionRecords: (session_id) =>
    api.get(`/attendance/session/${session_id}/records`),
};

export const marksApi = {
  getBySubject: (subject_id) => api.get(`/marks/${subject_id}`),

  bulkSave: (subject_id, marks) =>
    api.post('/marks/bulk', { subject_id, marks }),

  update: (marks_id, data) => api.put(`/marks/${marks_id}`, data),

  submit: (subject_id) => api.post(`/marks/${subject_id}/submit`),

  getStats: (subject_id) => api.get(`/marks/${subject_id}/stats`),

  downloadPdf: (subject_id) =>
    api.get(`/marks/${subject_id}/pdf`, { responseType: 'blob' }),
};

export const notifyApi = {
  sendAbsentToday: (session_id) =>
    api.post('/notify/absent-today', { session_id }),

  sendLowAttendance: (subject_id) =>
    api.post('/notify/low-attendance', { subject_id }),

  sendMarksPublished: (subject_id) =>
    api.post('/notify/marks-published', { subject_id }),

  sendHodReport: () => api.post('/notify/hod-report'),

  getLog: () => api.get('/notify/log'),
};

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
};

export default api;
