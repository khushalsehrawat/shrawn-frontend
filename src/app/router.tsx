import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { AnalyticsPage } from '../features/analytics/pages/AnalyticsPage';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { BudgetsPage } from '../features/budgets/pages/BudgetsPage';
import { CategoriesPage } from '../features/categories/pages/CategoriesPage';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';
import { ExpensesPage } from '../features/expenses/pages/ExpensesPage';
import { TagsPage } from '../features/tags/pages/TagsPage';
import { ProfilePage } from '../features/user/pages/ProfilePage';
import AppLayout from '../layouts/AppLayout';
import AuthLayout from '../layouts/AuthLayout';
import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { hasAccessToken } from '../shared/api/tokenStorage';

function ProtectedRoute() {
  return hasAccessToken() ? <Outlet /> : <Navigate to="/login" replace />;
}

function PublicOnlyRoute() {
  return hasAccessToken() ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/expenses', element: <ExpensesPage /> },
          { path: '/categories', element: <CategoriesPage /> },
          { path: '/tags', element: <TagsPage /> },
          { path: '/budgets', element: <BudgetsPage /> },
          { path: '/analytics', element: <AnalyticsPage /> },
          { path: '/profile', element: <ProfilePage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
