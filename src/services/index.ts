import Api from './api';

export const backendService = new Api({
  baseURL: import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3000',
  withCredentials: true,
});
