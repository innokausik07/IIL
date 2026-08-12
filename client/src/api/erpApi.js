import api from './axiosInstance';

export const getGoogleSheetList = (params) =>
  api.get('/google-sheet', { params });

export const getGoogleSheetStats = () =>
  api.get('/google-sheet/stats');

export const getBinsByLocation = (location) =>
  api.get('/google-sheet/bins', { params: { location } });

export const doAction = (action, ids, extra = {}) =>
  api.post('/google-sheet/action', { action, ids, ...extra });

export const doMovement = (formData) =>
  api.post('/google-sheet/action', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const bulkAssignee = (formData) =>
  api.post('/google-sheet/bulk/assignee', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const bulkAck = (formData) =>
  api.post('/google-sheet/bulk/ack', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const downloadTemplate = (type) =>
  api.get(`/google-sheet/template/${type}`, { responseType: 'blob' });

export const getMovedSheetList = (params) =>
  api.get('/moved-sheet', { params });

export const getCrossAuditList = (params) =>
  api.get('/cross-audit', { params });

export const getStoreStockList = (params) =>
  api.get('/store-stock', { params });

export const loginUser = (username, password) =>
  api.post('/auth/login', { username, password });

export const getMe = () =>
  api.get('/auth/me');
