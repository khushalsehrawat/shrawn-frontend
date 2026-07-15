import { apiClient, unwrapResponse } from '../../../shared/api/apiClient';
import type { IndividualDashboard, IndividualDashboardRequest } from '../types';

export const selectedDashboardStorageKey = 'shrawn_selected_individual_dashboard_id';
export const selectedDashboardChangedEvent = 'shrawn:selected-dashboard-changed';

export const individualDashboardApi = {
  async list() {
    const response = await apiClient.get('/expense-dashboards');
    return unwrapResponse<IndividualDashboard[]>(response.data) ?? [];
  },
  async create(body: IndividualDashboardRequest) {
    const response = await apiClient.post('/expense-dashboards', body);
    return unwrapResponse<IndividualDashboard>(response.data);
  },
  async update(id: string, body: IndividualDashboardRequest) {
    const response = await apiClient.put(`/expense-dashboards/${id}`, body);
    return unwrapResponse<IndividualDashboard>(response.data);
  },
  async deactivate(id: string) {
    const response = await apiClient.patch(`/expense-dashboards/${id}/deactivate`);
    return unwrapResponse<IndividualDashboard>(response.data);
  },
};
