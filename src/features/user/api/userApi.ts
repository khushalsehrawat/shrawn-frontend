import { apiClient, unwrapResponse } from '../../../shared/api/apiClient';
import type { UpdateUserRequest, UserProfile } from '../types';

export const userApi = {
  async me() {
    const response = await apiClient.get('/users/me');
    return unwrapResponse<UserProfile>(response.data);
  },
  async updateMe(body: UpdateUserRequest) {
    const response = await apiClient.put('/users/me', body);
    return unwrapResponse<UserProfile>(response.data);
  },
};
