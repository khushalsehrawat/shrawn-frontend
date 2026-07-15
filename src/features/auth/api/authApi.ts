import { apiClient, unwrapResponse } from '../../../shared/api/apiClient';
import { getRefreshToken } from '../../../shared/api/tokenStorage';
import type { AuthResponse, LoginRequest, RegisterRequest } from '../types';

function normalizeAuthResponse(payload: unknown): Required<Pick<AuthResponse, 'accessToken'>> & AuthResponse {
  const data = unwrapResponse<AuthResponse>(payload);
  const accessToken = data.accessToken ?? data.token;
  if (!accessToken) {
    throw new Error('Authentication response did not include an access token');
  }
  return { ...data, accessToken };
}

export const authApi = {
  async login(body: LoginRequest) {
    const response = await apiClient.post('/api/v1/auth/login', body);
    return normalizeAuthResponse(response.data);
  },
  async register(body: RegisterRequest) {
    const response = await apiClient.post('/api/v1/auth/register', body);
    return normalizeAuthResponse(response.data);
  },
  async logout() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return;
    await apiClient.post('/api/v1/auth/logout', { refreshToken });
  },
};
