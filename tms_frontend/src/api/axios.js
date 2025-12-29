import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/',
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let refreshPromise = null;

const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    throw new Error('Missing refresh token');
  }
  const response = await api.post('token/refresh/', { refresh: refreshToken });
  const accessToken = response.data?.access;
  if (!accessToken) {
    throw new Error('Missing access token');
  }
  localStorage.setItem('token', accessToken);
  return accessToken;
};

// Interceptor to attach Auth Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle 401 Unauthorized (Auto Logout)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;
    if (response && response.status === 401) {
      const isLoginRequest = config?.url?.includes('token/') && !config?.url?.includes('refresh');
      const isRefreshRequest = config?.url?.includes('token/refresh');
      const detail = response.data?.detail;
      const disabledReasons = [
        'Subscription Expired. Contact Support.',
        'Account Suspended. Contact Support.',
      ];
      const isDisabled = disabledReasons.includes(detail);

      if (!isLoginRequest && !isRefreshRequest && isDisabled) {
        sessionStorage.setItem('accountDisabledReason', detail);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/disabled') {
          window.location.href = '/disabled';
        }
        return Promise.reject(error);
      }

      if (!isLoginRequest && !isRefreshRequest) {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken && config && !config._retry) {
          config._retry = true;
          try {
            if (!isRefreshing) {
              isRefreshing = true;
              refreshPromise = refreshAccessToken().finally(() => {
                isRefreshing = false;
                refreshPromise = null;
              });
            }
            const newAccessToken = await refreshPromise;
            config.headers = {
              ...(config.headers || {}),
              Authorization: `Bearer ${newAccessToken}`,
            };
            return api(config);
          } catch (refreshError) {
            // Fall through to logout cleanup below.
          }
        }
      }

      if (!isLoginRequest) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'; 
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
