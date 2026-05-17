import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Cola de peticiones que llegan mientras hay un refresh en curso.
// Cuando el refresh termina se resuelven (nuevo token) o se rechazan (fallo).
let _isRefreshing = false;
let _pendingQueue = [];

function processQueue(error, token = null) {
  _pendingQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  );
  _pendingQueue = [];
}

function clearSessionAndRedirect() {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

// Hooks can't be used in a plain module, so we replicate what AuthContext does
// (clear the same localStorage keys) and let the page reload reinitialize auth state.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalConfig = error.config;

    // No intentar refresh en endpoints de auth ni en reintentos ya realizados
    const isAuthEndpoint = originalConfig?.url?.includes('/auth/');
    if (error.response?.status !== 401 || isAuthEndpoint || originalConfig?._retry) {
      return Promise.reject(error);
    }

    // Si ya hay un refresh en curso, encolar esta petición y esperar
    if (_isRefreshing) {
      return new Promise((resolve, reject) => {
        _pendingQueue.push({ resolve, reject });
      }).then((newToken) => {
        originalConfig.headers.Authorization = `Bearer ${newToken}`;
        return api(originalConfig);
      });
    }

    originalConfig._retry = true;
    _isRefreshing = true;

    const storedRefreshToken = localStorage.getItem('refreshToken');
    if (!storedRefreshToken) {
      _isRefreshing = false;
      clearSessionAndRedirect();
      return Promise.reject(error);
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/refresh`,
        { refreshToken: storedRefreshToken }
      );
      const { token: newToken, refreshToken: newRefreshToken } = res.data;

      localStorage.setItem('token', newToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      api.defaults.headers.common.Authorization = `Bearer ${newToken}`;

      processQueue(null, newToken);
      originalConfig.headers.Authorization = `Bearer ${newToken}`;
      return api(originalConfig);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearSessionAndRedirect();
      return Promise.reject(refreshError);
    } finally {
      _isRefreshing = false;
    }
  }
);

export default api;
