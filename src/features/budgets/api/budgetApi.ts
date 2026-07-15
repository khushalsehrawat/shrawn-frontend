import { apiClient, unwrapResponse } from '../../../shared/api/apiClient';
import type { Budget, BudgetRequest } from '../types';

export const budgetApi = {
  async list(activeOnly?: boolean) {
    const response = await apiClient.get('/budgets', { params: activeOnly ? { activeOnly: true } : undefined });
    return unwrapResponse<Budget[]>(response.data) ?? [];
  },
  async create(body: BudgetRequest) {
    const response = await apiClient.post('/budgets', body);
    return unwrapResponse<Budget>(response.data);
  },
  async update(id: string, body: BudgetRequest) {
    const response = await apiClient.put(`/budgets/${id}`, body);
    return unwrapResponse<Budget>(response.data);
  },
  deactivate(id: string) {
    return apiClient.patch(`/budgets/${id}/deactivate`);
  },
  reactivate(id: string) {
    return apiClient.patch(`/budgets/${id}/reactivate`);
  },
};
