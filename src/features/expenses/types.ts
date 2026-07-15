import type { Category } from '../categories/types';
import type { Tag } from '../tags/types';

export type ExpenseType = 'EXPENSE' | 'INCOME';
export type PaymentMethod = 'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER' | 'WALLET' | 'OTHER';

export type Expense = {
  id: string;
  amount: number | string;
  description: string;
  type: ExpenseType;
  paymentMethod: PaymentMethod;
  expenseDate: string;
  dashboardId?: string | null;
  category?: Category | null;
  categoryId?: string | null;
  tags?: Tag[];
  tagIds?: string[];
};

export type ExpenseRequest = {
  amount: number;
  description: string;
  type: ExpenseType;
  paymentMethod: PaymentMethod;
  expenseDate: string;
  dashboardId?: string | null;
  categoryId: string;
  tagIds: string[];
};

export type ExpenseFilters = {
  startDate?: string;
  endDate?: string;
  dashboardId?: string;
  categoryId?: string;
  tagId?: string;
  type?: ExpenseType | '';
  paymentMethod?: PaymentMethod | '';
  keyword?: string;
  page?: number;
  size?: number;
  sortDirection?: 'ASC' | 'DESC';
};

export type PageResponse<T> = {
  content: T[];
  pageNumber?: number;
  pageSize?: number;
  page?: number;
  size?: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty?: boolean;
};
