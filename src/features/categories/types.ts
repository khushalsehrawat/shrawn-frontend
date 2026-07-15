export type CategoryType = 'EXPENSE' | 'INCOME';

export type Category = {
  id: string;
  name: string;
  description?: string | null;
  type: CategoryType;
  active: boolean;
};

export type CategoryRequest = {
  name: string;
  description?: string;
  type: CategoryType;
};
