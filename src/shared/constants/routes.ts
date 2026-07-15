import {
  BarChart3,
  FolderKanban,
  Gauge,
  ReceiptText,
  Target,
  UserRound,
} from 'lucide-react';

export const routes = {
  home: '/',
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  expenses: '/expenses',
  categories: '/categories',
  tags: '/tags',
  budgets: '/budgets',
  analytics: '/analytics',
  profile: '/profile',
} as const;

export const appNavItems = [
  { label: 'Dashboard', href: routes.dashboard, icon: Gauge },
  { label: 'Expenses', href: routes.expenses, icon: ReceiptText },
  { label: 'Categories', href: routes.categories, icon: FolderKanban },
  { label: 'Budgets', href: routes.budgets, icon: Target },
  { label: 'Analytics', href: routes.analytics, icon: BarChart3 },
  { label: 'Profile', href: routes.profile, icon: UserRound },
];
