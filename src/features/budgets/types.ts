import type { Category } from '../categories/types';

export type BudgetPeriodType = 'MONTHLY' | 'CUSTOM';

export type Budget = {
  id: string;
  name: string;
  limitAmount: number;
  periodType: BudgetPeriodType;
  month?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  active: boolean;
  category?: Category | null;
  categoryId?: string | null;
};

export type BudgetRequest = {
  name: string;
  limitAmount: number;
  periodType: BudgetPeriodType;
  month?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  categoryId?: string | null;
};
