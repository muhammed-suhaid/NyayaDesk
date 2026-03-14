import axios from 'axios';

import { getToken, logout } from '../auth';

const http = axios.create({
  baseURL: '/api',
});

http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      logout();
    }
    return Promise.reject(err);
  }
);

export const AuthApi = {
  login: (payload) => http.post('/auth/login', payload),
  registerAdmin: (payload) => http.post('/auth/register-admin', payload),
  logout: () => http.post('/auth/logout'),
  updateProfile: (payload) => http.put('/auth/profile', payload),
};

export const AdminApi = {
  listUsers: () => http.get('/admin/users'),
  createUser: (payload) => http.post('/admin/users', payload),
  updateUser: (id, payload) => http.put(`/admin/users/${id}`, payload),
  deleteUser: (id) => http.delete(`/admin/users/${id}`),
  getCompany: () => http.get('/admin/company'),
  updateCompany: (payload) => http.put('/admin/company', payload),
};

export const SuperAdminApi = {
  summary: () => http.get('/superadmin/summary'),
  companies: () => http.get('/superadmin/companies'),
  company: (id) => http.get(`/superadmin/companies/${id}`),
  setCompanyStatus: (id, status) => http.put(`/superadmin/companies/${id}/status`, { status }),
  downloadPayment: (companyId, paymentId) => http.get(`/superadmin/companies/${companyId}/payments/${paymentId}/download`, { responseType: 'blob' }),
};

export const CasesApi = {
  list: (params) => http.get('/cases', { params }),
  get: (id) => http.get(`/cases/${id}`),
  create: (payload) => http.post('/cases', payload),
  update: (id, payload) => http.put(`/cases/${id}`, payload),
  remove: (id) => http.delete(`/cases/${id}`),
  listDocuments: (caseId) => http.get(`/cases/${caseId}/documents`),
  uploadDocument: (caseId, file, type = 'Other') => {
    const form = new FormData();
    form.append('file', file);
    if (type) form.append('type', type);
    return http.post(`/cases/${caseId}/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteDocument: (caseId, docId) => http.delete(`/cases/${caseId}/documents/${docId}`),
  downloadDocument: (caseId, docId) => http.get(`/cases/${caseId}/documents/${docId}/download`, { responseType: 'blob' }),
  
  // Hearings
  addHearing: (caseId, payload) => http.post(`/cases/${caseId}/hearings`, payload),
  updateHearing: (caseId, hearingId, payload) => http.put(`/cases/${caseId}/hearings/${hearingId}`, payload),
  deleteHearing: (caseId, hearingId) => http.delete(`/cases/${caseId}/hearings/${hearingId}`),

  // Updates
  listUpdates: (caseId) => http.get(`/cases/${caseId}/updates`),
  addUpdate: (caseId, payload) => http.post(`/cases/${caseId}/updates`, payload),

  // Dispose
  disposeCase: (caseId, payload) => http.put(`/cases/${caseId}/dispose`, payload),

  // Report
  downloadReport: (caseId) => http.get(`/cases/${caseId}/report`, { responseType: 'blob' }),
};

export const HearingsApi = {
  getUpcoming: () => http.get('/hearings/upcoming'),
};

export const ClientsApi = {
  list: (params) => http.get('/clients', { params }),
  create: (payload) => http.post('/clients', payload),
  update: (id, payload) => http.put(`/clients/${id}`, payload),
  remove: (id) => http.delete(`/clients/${id}`),
};

export const AdvocatesApi = {
  list: (params) => http.get('/advocates', { params }),
  create: (payload) => http.post('/admin/users', payload),
  update: (id, payload) => http.put(`/advocates/${id}`, payload),
  remove: (id) => http.delete(`/advocates/${id}`),
};

export const AttendanceApi = {
  list: (params) => http.get('/attendance', { params }),
  mark: (payload) => http.post('/attendance', payload),
  export: (params) => http.get('/attendance/export', { params, responseType: 'blob' }),
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
  getSummary: () => http.get('/reports/summary'),
  casesByStatus: () => http.get('/reports/cases-by-status'),
  casesByGroup: () => http.get('/reports/cases-by-group'),
  caseTrends: () => http.get('/reports/case-trends'),
  casesByDistrict: () => http.get('/reports/cases-by-district'),
  casesByAdvocate: () => http.get('/reports/cases-by-advocate'),
  upcomingHearings: (params) => http.get('/reports/upcoming-hearings', { params }),
  attendance: (params) => http.get('/reports/attendance', { params }),
};

export const SubscriptionApi = {
  // GET  /api/subscription
  getCurrent: () => http.get('/subscription'),

  // GET  /api/subscription/plans
  getPlans: () => http.get('/subscription/plans'),

  // POST /api/subscription/activate  → body: { planId }  (demo: no real payment)
  activate: (planId) => http.post('/subscription/activate', { planId }),

  // POST /api/subscription/reset (testing only)
  reset: () => http.post('/subscription/reset'),

  // POST /api/subscription/cancel
  cancel: () => http.post('/subscription/cancel'),

  // POST /api/subscription/billing-cycle → body: { cycle }
  changeBillingCycle: (cycle) => http.post('/subscription/billing-cycle', { cycle }),

  // GET  /api/subscription/invoices
  getInvoices: () => http.get('/subscription/invoices'),

  // GET  /api/subscription/invoices/:id/download
  downloadInvoice: (invoiceId) => http.get(`/subscription/invoices/${invoiceId}/download`),
};

export default http;
