import { apiClient, unwrapResponse } from '../../../shared/api/apiClient';
import type { AnalyticsSummary, ChartPoint } from '../types';

type AnalyticsParams = {
  dashboardId?: string;
  month?: string;
  startDate?: string;
  endDate?: string;
};

export const analyticsApi = {
  async summary(params?: AnalyticsParams) {
    const response = await apiClient.get('/api/v1/analytics/summary', { params });
    return unwrapResponse<AnalyticsSummary>(response.data) ?? {};
  },
  async byCategory(params?: AnalyticsParams) {
    const response = await apiClient.get('/api/v1/analytics/by-category', { params });
    return unwrapResponse<ChartPoint[]>(response.data) ?? [];
  },
  async byPaymentMethod(params?: AnalyticsParams) {
    const response = await apiClient.get('/api/v1/analytics/by-payment-method', { params });
    return unwrapResponse<ChartPoint[]>(response.data) ?? [];
  },
  async byTag(params?: AnalyticsParams) {
    const response = await apiClient.get('/api/v1/analytics/by-tag', { params });
    return unwrapResponse<ChartPoint[]>(response.data) ?? [];
  },
  async daily(params?: AnalyticsParams) {
    const response = await apiClient.get('/api/v1/analytics/daily', { params });
    return unwrapResponse<ChartPoint[]>(response.data) ?? [];
  },
};
