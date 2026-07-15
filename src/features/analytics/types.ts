export type AnalyticsSummary = {
  totalExpense?: number;
  totalIncome?: number;
  remaining?: number;
  transactionCount?: number;
  expenseCount?: number;
  incomeCount?: number;
};

export type ChartPoint = {
  name?: string;
  label?: string;
  categoryName?: string;
  tagName?: string;
  paymentMethod?: string;
  date?: string;
  amount?: number;
  total?: number;
  totalAmount?: number;
  value?: number;
};
