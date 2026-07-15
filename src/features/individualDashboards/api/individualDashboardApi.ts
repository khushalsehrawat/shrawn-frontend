import { apiClient, unwrapResponse } from '../../../shared/api/apiClient';
import type { IndividualDashboard, IndividualDashboardRequest } from '../types';

export const selectedDashboardStorageKey = 'shrawn_selected_individual_dashboard_id';
export const selectedDashboardChangedEvent = 'shrawn:selected-dashboard-changed';

export const individualDashboardApi = {
  async list() {
    const response = await apiClient.get('/api/v1/expense-dashboards');
    return unwrapResponse<IndividualDashboard[]>(response.data) ?? [];
  },
  async create(body: IndividualDashboardRequest) {
    const response = await apiClient.post('/api/v1/expense-dashboards', body);
    return unwrapResponse<IndividualDashboard>(response.data);
  },
  async update(id: string, body: IndividualDashboardRequest) {
    const response = await apiClient.put(`/api/v1/expense-dashboards/${id}`, body);
    return unwrapResponse<IndividualDashboard>(response.data);
  },
  async deactivate(id: string) {
    const response = await apiClient.patch(`/api/v1/expense-dashboards/${id}/deactivate`);
    return unwrapResponse<IndividualDashboard>(response.data);
  },
};
