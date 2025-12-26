import axios from 'axios';

// Access token en memoria (no localStorage)
let accessToken = null;
export const setAccessToken = (token) => {
  accessToken = token;
};
export const clearAccessToken = () => {
  accessToken = null;
};

// https://dte-webapp-api-production.up.railway.app/api
// http://localhost:5001/api
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  withCredentials: true
});

// Interceptor de request para agregar Authorization si hay token
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Interceptor de response para refrescar en caso de 401
let isRefreshing = false;
let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    const isRefreshCall = originalRequest?.url?.includes('/auth/refresh');

    if (status === 401 && !originalRequest._retry && !isRefreshCall) {
      if (!refreshPromise) {
        isRefreshing = true;
        refreshPromise = api
          .post('/auth/refresh')
          .then((res) => {
            const newToken = res.data?.token;
            if (newToken) {
              setAccessToken(newToken);
            }
            return newToken;
          })
          .catch((err) => {
            clearAccessToken();
            throw err;
          })
          .finally(() => {
            isRefreshing = false;
            refreshPromise = null;
          });
      }

      try {
        const newToken = await refreshPromise;
        if (newToken) {
          originalRequest._retry = true;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
