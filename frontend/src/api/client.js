import axios from 'axios';

const apiClient = axios.create({
  // Fallback to localhost, but allow Railway to inject the live URL
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
});

export const uploadInvoice = async (file) => {
  const formData = new FormData();
  formData.append('invoice', file);
  const response = await apiClient.post('/invoices/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const getDashboardStats = async () => {
  const response = await apiClient.get('/dashboard/stats');
  return response.data;
};

export const getAIAdvice = async (message) => {
  const response = await apiClient.post('/advisor/chat', { message });
  return response.data;
};

export const getFinancialHealth = async () => {
  const response = await apiClient.get('/advisor/health');
  return response.data;
};

export const getInvoices = async () => {
  const response = await apiClient.get('/invoices');
  return response.data;
};

export const getVendorAnalysis = async () => {
  const response = await apiClient.get('/vendors/analysis');
  return response.data;
};

export default apiClient;
