import axios from 'axios';

const http = axios.create({
  baseURL: '/api',
});

export const CasesApi = {
  list: (params) => http.get('/cases', { params }),
  get: (id) => http.get(`/cases/${id}`),
  create: (payload) => http.post('/cases', payload),
  update: (id, payload) => http.put(`/cases/${id}`, payload),
  remove: (id) => http.delete(`/cases/${id}`),
  listDocuments: (caseId) => http.get(`/cases/${caseId}/documents`),
  uploadDocument: (caseId, file) => {
    const form = new FormData();
    form.append('file', file);
    return http.post(`/cases/${caseId}/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteDocument: (caseId, docId) => http.delete(`/cases/${caseId}/documents/${docId}`),
  downloadUrl: (caseId, docId) => `/cases/${caseId}/documents/${docId}/download`,
};

export const ClientsApi = {
  list: (params) => http.get('/clients', { params }),
  create: (payload) => http.post('/clients', payload),
  update: (id, payload) => http.put(`/clients/${id}`, payload),
  remove: (id) => http.delete(`/clients/${id}`),
};

export const AdvocatesApi = {
  list: (params) => http.get('/advocates', { params }),
  create: (payload) => http.post('/advocates', payload),
  update: (id, payload) => http.put(`/advocates/${id}`, payload),
  remove: (id) => http.delete(`/advocates/${id}`),
};

export const AttendanceApi = {
  list: (params) => http.get('/attendance', { params }),
  mark: (payload) => http.post('/attendance', payload),
};

export const LeaveApi = {
  list: (params) => http.get('/leave', { params }),
  submit: (payload) => http.post('/leave', payload),
  update: (id, payload) => http.put(`/leave/${id}`, payload),
};

export const NotificationsApi = {
  list: (params) => http.get('/notifications', { params }),
  markRead: (id) => http.put(`/notifications/${id}/read`),
  readAll: () => http.put('/notifications/read-all'),
};

export const ReportsApi = {
  casesByDistrict: () => http.get('/reports/cases-by-district'),
  casesByAdvocate: () => http.get('/reports/cases-by-advocate'),
  upcomingHearings: (params) => http.get('/reports/upcoming-hearings', { params }),
  attendance: (params) => http.get('/reports/attendance', { params }),
};

export default http;
