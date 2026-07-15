export type IndividualDashboard = {
  id: string;
  name: string;
  description?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type IndividualDashboardRequest = {
  name: string;
  description?: string | null;
};
