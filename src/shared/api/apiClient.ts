import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from './tokenStorage';

type RetriableRequest = InternalAxiosRequestConfig & { _retry?: boolean };

const backendURL = import.meta.env.VITE_API_BASE_URL;
const baseURL = `${backendURL.replace(/\/$/, '')}/api/v1`;

export const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

export function unwrapResponse<T>(response: unknown): T {
  if (response && typeof response === 'object' && 'data' in response) {
    const maybeWrapped = response as { data?: unknown; success?: boolean };
    if ('success' in maybeWrapped || 'timestamp' in maybeWrapped) {
      return maybeWrapped.data as T;
    }
  }
  return response as T;
}

function readTokens(payload: unknown) {
  const data = unwrapResponse<Record<string, unknown>>(payload);
  return {
    accessToken:
      typeof data?.accessToken === 'string'
        ? data.accessToken
        : typeof data?.token === 'string'
          ? data.token
          : undefined,
    refreshToken:
      typeof data?.refreshToken === 'string'
        ? data.refreshToken
        : typeof data?.refresh_token === 'string'
          ? data.refresh_token
          : undefined,
  };
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequest | undefined;
    const status = error.response?.status;

    /*if (!originalRequest || status !== 401 || originalRequest._retry || originalRequest.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }*/
    const isAuthRequest =
  originalRequest?.url?.includes('/auth/login') ||
  originalRequest?.url?.includes('/auth/register') ||
  originalRequest?.url?.includes('/auth/refresh');

if (
  !originalRequest ||
  status !== 401 ||
  originalRequest._retry ||
  isAuthRequest
) {
  return Promise.reject(error);
}



    

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearTokens();
      window.location.assign('/login');
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const refreshResponse = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
      const tokens = readTokens(refreshResponse.data);
      if (!tokens.accessToken) {
        throw new Error('Refresh response did not include an access token');
      }
      saveTokens(tokens.accessToken, tokens.refreshToken ?? refreshToken);
      originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      clearTokens();
      window.location.assign('/login');
      return Promise.reject(refreshError);
    }
  },
);
