import { apiClient, unwrapResponse } from '../../../shared/api/apiClient';
import type { Expense, ExpenseFilters, ExpenseRequest, PageResponse } from '../types';

function normalizeExpense(expense: Expense): Expense {
  const amount = typeof expense.amount === 'string' ? Number(expense.amount) : expense.amount;
  return {
    ...expense,
    amount: Number.isFinite(amount) ? amount : 0,
    tagIds: expense.tagIds ?? expense.tags?.map((tag) => tag.id) ?? [],
  };
}

function normalizeExpenseList(payload: unknown): PageResponse<Expense> {
  const data = unwrapResponse<PageResponse<Expense> | Expense[]>(payload);
  if (Array.isArray(data)) {
    const content = data.map(normalizeExpense);
    return {
      content,
      pageNumber: 0,
      pageSize: content.length,
      totalElements: content.length,
      totalPages: 1,
      first: true,
      last: true,
    };
  }
  if (!data) {
    return { content: [], pageNumber: 0, pageSize: 20, totalElements: 0, totalPages: 0, first: true, last: true };
  }
  return {
    ...data,
    content: (data.content ?? []).map(normalizeExpense),
    pageNumber: data.pageNumber ?? data.page ?? 0,
    pageSize: data.pageSize ?? data.size ?? data.content?.length ?? 20,
  };
}

export const expenseApi = {
  async list(filters: ExpenseFilters = {}) {
    const { sortDirection } = filters;
    const params = Object.fromEntries(
      Object.entries(filters).filter(([key, value]) => !['sortDirection', 'page', 'size'].includes(key) && value !== '' && value !== undefined && value !== null),
    );
    const response = await apiClient.get('/api/v1/expenses', { params });
    const pageData = normalizeExpenseList(response.data);
    if (!sortDirection) return pageData;

    return {
      ...pageData,
      content: [...pageData.content].sort((left, right) => {
        const leftTime = new Date(left.expenseDate).getTime();
        const rightTime = new Date(right.expenseDate).getTime();
        return sortDirection === 'ASC' ? leftTime - rightTime : rightTime - leftTime;
      }),
    };
  },
  async create(body: ExpenseRequest) {
    const response = await apiClient.post('/api/v1/expenses', body);
    return normalizeExpense(unwrapResponse<Expense>(response.data));
  },
  async update(id: string, body: ExpenseRequest) {
    const response = await apiClient.put(`/api/v1/expenses/${id}`, body);
    return normalizeExpense(unwrapResponse<Expense>(response.data));
  },
  delete(id: string) {
    return apiClient.delete(`/api/v1/expenses/${id}`);
  },
};
