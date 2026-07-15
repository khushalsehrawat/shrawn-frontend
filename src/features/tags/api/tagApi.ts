import { apiClient, unwrapResponse } from '../../../shared/api/apiClient';
import type { Tag, TagRequest } from '../types';

export const tagApi = {
  async list(activeOnly?: boolean) {
    const response = await apiClient.get('/api/v1/tags', { params: activeOnly ? { activeOnly: true } : undefined });
    return unwrapResponse<Tag[]>(response.data) ?? [];
  },
  async create(body: TagRequest) {
    const response = await apiClient.post('/api/v1/tags', body);
    return unwrapResponse<Tag>(response.data);
  },
  async update(id: string, body: TagRequest) {
    const response = await apiClient.put(`/api/v1/tags/${id}`, body);
    return unwrapResponse<Tag>(response.data);
  },
  deactivate(id: string) {
    return apiClient.patch(`/api/v1/tags/${id}/deactivate`);
  },
  reactivate(id: string) {
    return apiClient.patch(`/api/v1/tags/${id}/reactivate`);
  },
};
