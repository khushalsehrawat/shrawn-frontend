import { apiClient, unwrapResponse } from '../../../shared/api/apiClient';
import type { Tag, TagRequest } from '../types';

export const tagApi = {
  async list(activeOnly?: boolean) {
    const response = await apiClient.get('/tags', { params: activeOnly ? { activeOnly: true } : undefined });
    return unwrapResponse<Tag[]>(response.data) ?? [];
  },
  async create(body: TagRequest) {
    const response = await apiClient.post('/tags', body);
    return unwrapResponse<Tag>(response.data);
  },
  async update(id: string, body: TagRequest) {
    const response = await apiClient.put(`/tags/${id}`, body);
    return unwrapResponse<Tag>(response.data);
  },
  deactivate(id: string) {
    return apiClient.patch(`/tags/${id}/deactivate`);
  },
  reactivate(id: string) {
    return apiClient.patch(`/tags/${id}/reactivate`);
  },
};
