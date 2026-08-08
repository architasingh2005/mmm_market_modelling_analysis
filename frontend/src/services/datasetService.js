import axios from 'axios';

// Dedicated API instance for dataset operations.
// Reads the auth token from localStorage and attaches it to every request.
const datasetAPI = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
});

// Request interceptor — injects Bearer token on every call.
datasetAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * uploadDataset
 *
 * Uploads a file to POST /api/datasets/upload.
 * Accepts an onUploadProgress callback so the UI can track the
 * file-transfer phase independently from the AI processing phase.
 *
 * @param {File}     file              - The file object from the file input.
 * @param {Function} onUploadProgress  - Called with AxiosProgressEvent during upload.
 * @returns {Promise<Object>}          - Resolves with { dataset, report } on success.
 */
export async function uploadDataset(file, onUploadProgress) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('datasetName', file.name);

  const response = await datasetAPI.post('/datasets/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });

  return response.data;
}
