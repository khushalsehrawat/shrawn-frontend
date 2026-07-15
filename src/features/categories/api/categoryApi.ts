import { apiClient, unwrapResponse } from '../../../shared/api/apiClient';
import type { Category, CategoryRequest } from '../types';

export const defaultCategories: CategoryRequest[] = [
  { name: 'Food & Dining', description: 'Meals, cafes, restaurants, and takeout.', type: 'EXPENSE' },
  { name: 'Groceries', description: 'Home essentials and supermarket spending.', type: 'EXPENSE' },
  { name: 'Transport', description: 'Fuel, rides, metro, parking, and commute costs.', type: 'EXPENSE' },
  { name: 'Bills & Utilities', description: 'Electricity, internet, rent, subscriptions, and recurring bills.', type: 'EXPENSE' },
  { name: 'Shopping', description: 'Clothes, electronics, gifts, and personal purchases.', type: 'EXPENSE' },
  { name: 'Health', description: 'Medical, pharmacy, fitness, and wellness spending.', type: 'EXPENSE' },
  { name: 'Salary', description: 'Primary salary or recurring income.', type: 'INCOME' },
];

export const categoryApi = {
  async list(activeOnly?: boolean) {
    const response = await apiClient.get('/categories', { params: activeOnly ? { activeOnly: true } : undefined });
    return unwrapResponse<Category[]>(response.data) ?? [];
  },
  async create(body: CategoryRequest) {
    const response = await apiClient.post('/categories', body);
    return unwrapResponse<Category>(response.data);
  },
  async update(id: string, body: CategoryRequest) {
    const response = await apiClient.put(`/categories/${id}`, body);
    return unwrapResponse<Category>(response.data);
  },
  deactivate(id: string) {
    return apiClient.patch(`/categories/${id}/deactivate`);
  },
  reactivate(id: string) {
    return apiClient.patch(`/categories/${id}/reactivate`);
  },
  async ensureDefaultCategories(activeOnly = true) {
    const existing = await this.list(false);
    const existingKeys = new Set(existing.map((category) => `${category.type}:${category.name.trim().toLowerCase()}`));
    const missing = defaultCategories.filter((category) => !existingKeys.has(`${category.type}:${category.name.trim().toLowerCase()}`));

    if (missing.length) {
      await Promise.all(
        missing.map(async (category) => {
          try {
            await this.create(category);
          } catch {
            // If another request created it first, the follow-up list will still return the real record.
          }
        }),
      );
    }

    return this.list(activeOnly);
  },
};
