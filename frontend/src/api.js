import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Documents API
export const documentsApi = {
  getAll: (params = {}) => api.get('/documents', { params }),
  getById: (id) => api.get(`/documents/${id}`),
  create: (data) => api.post('/documents', data),
  update: (id, data) => api.put(`/documents/${id}`, data),
  updateStatus: (id, status) => api.put(`/documents/${id}/status`, { status }),
  addCustomField: (id, fieldName, fieldValue) =>
    api.post(`/documents/${id}/custom-field`, { fieldName, fieldValue }),
  getHistory: (id) => api.get(`/documents/${id}/history`),
};

// Pre-start Meetings API
export const prestartApi = {
  getToday: () => api.get('/prestart/today'),
  getAll: (params = {}) => api.get('/prestart', { params }),
  getById: (id) => api.get(`/prestart/${id}`),
  create: (data) => api.post('/prestart', data),
  addJob: (id, jobData) => api.post(`/prestart/${id}/jobs`, jobData),
  update: (id, data) => api.put(`/prestart/${id}`, data),
  getJobmanData: () => api.get('/prestart/jobman-data'),
};

// Jobman API (proxied through backend)
export const jobmanApi = {
  getLeads: (params = {}) => api.get('/jobman/leads', { params }),
  getQuotes: (params = {}) => api.get('/jobman/quotes', { params }),
  getJobs: (params = {}) => api.get('/jobman/jobs', { params }),
  getStaff: () => api.get('/jobman/staff'),
  getContacts: (params = {}) => api.get('/jobman/contacts', { params }),
};

// Files API
export const filesApi = {
  upload: (documentId, formData) =>
    api.post(`/files/document/${documentId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getForDocument: (documentId) => api.get(`/files/document/${documentId}`),
  delete: (fileId) => api.delete(`/files/${fileId}`),
};

// Form Templates API
export const templatesApi = {
  getAll: (params = {}) => api.get('/templates', { params }),
  getById: (id) => api.get(`/templates/${id}`),
  create: (data) => api.post('/templates', data),
  update: (id, data) => api.put(`/templates/${id}`, data),
  delete: (id) => api.delete(`/templates/${id}`),
  getVariables: () => api.get('/templates/variables'),
  preview: (id, data = {}) => api.post(`/templates/${id}/preview`, { data }),
  previewRaw: (htmlTemplate, cssStyles, data = {}) =>
    api.post('/templates/preview-raw', { htmlTemplate, cssStyles, data }),
};

export default api;
