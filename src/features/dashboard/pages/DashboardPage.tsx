import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, ArrowLeft, ArrowRight, CreditCard, IndianRupee, LayoutDashboard, Plus, ReceiptText, TrendingDown, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Badge } from '../../../shared/components/Badge';
import { Card } from '../../../shared/components/Card';
import { EmptyState } from '../../../shared/components/EmptyState';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { Modal } from '../../../shared/components/Modal';
import { PageHeader } from '../../../shared/components/PageHeader';
import { Select } from '../../../shared/components/Select';
import { StatCard } from '../../../shared/components/StatCard';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { Textarea } from '../../../shared/components/Textarea';
import { getApiErrorMessage } from '../../../shared/api/apiError';
import { formatDate, todayISO } from '../../../shared/utils/dateFormat';
import { formatMoney } from '../../../shared/utils/moneyFormat';
import { analyticsApi } from '../../analytics/api/analyticsApi';
import { categoryApi } from '../../categories/api/categoryApi';
import { expenseApi } from '../../expenses/api/expenseApi';
import type { ExpenseType, PaymentMethod } from '../../expenses/types';
import { individualDashboardApi, selectedDashboardChangedEvent, selectedDashboardStorageKey } from '../../individualDashboards/api/individualDashboardApi';

const paymentMethods: PaymentMethod[] = ['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'WALLET', 'OTHER'];

function toNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (value && typeof value === 'object' && 'amount' in value) {
    return toNumber((value as { amount?: unknown }).amount);
  }
  return 0;
}

function amountOf(item: { amount?: unknown; total?: unknown; totalAmount?: unknown; value?: unknown }) {
  return toNumber(item.amount ?? item.totalAmount ?? item.total ?? item.value);
}

function publishSelectedDashboardChange() {
  window.dispatchEvent(new Event(selectedDashboardChangedEvent));
}

export function DashboardPage() {
  const queryClient = useQueryClient();
  const [selectedDashboardId, setSelectedDashboardId] = useState(() => localStorage.getItem(selectedDashboardStorageKey) ?? '');
  const [newDashboard, setNewDashboard] = useState({ name: '', description: '' });
  const [openingDashboardId, setOpeningDashboardId] = useState('');
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [quickExpense, setQuickExpense] = useState({
    amount: '',
    description: '',
    type: 'EXPENSE' as ExpenseType,
    paymentMethod: 'UPI' as PaymentMethod,
    expenseDate: todayISO(),
    categoryId: '',
  });
  const dashboardsQuery = useQuery({
    queryKey: ['individualDashboards'],
    queryFn: individualDashboardApi.list,
    refetchOnMount: 'always',
  });
  const dashboards = dashboardsQuery.data ?? [];
  const activeDashboard = dashboards.find((dashboard) => dashboard.id === selectedDashboardId);
  const dashboardId = activeDashboard?.id;

  useEffect(() => {
    if (!selectedDashboardId) return;
    if (dashboards.length && !dashboards.some((dashboard) => dashboard.id === selectedDashboardId)) {
      setSelectedDashboardId('');
      localStorage.removeItem(selectedDashboardStorageKey);
      publishSelectedDashboardChange();
    }
  }, [dashboards, selectedDashboardId]);

  const createDashboardMutation = useMutation({
    mutationFn: () => individualDashboardApi.create({
      name: newDashboard.name.trim(),
      description: newDashboard.description.trim() || undefined,
    }),
    onSuccess: (dashboard) => {
      toast.success('Dashboard created');
      setNewDashboard({ name: '', description: '' });
      localStorage.setItem(selectedDashboardStorageKey, dashboard.id);
      setOpeningDashboardId(dashboard.id);
      window.setTimeout(() => {
        setSelectedDashboardId(dashboard.id);
        setOpeningDashboardId('');
        publishSelectedDashboardChange();
      }, 260);
      queryClient.invalidateQueries({ queryKey: ['individualDashboards'] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not create dashboard')),
  });

  const quickExpenseMutation = useMutation({
    mutationFn: () => {
      if (!dashboardId) {
        throw new Error('Select a dashboard first');
      }

      return expenseApi.create({
        amount: Number(quickExpense.amount),
        description: quickExpense.description.trim(),
        type: quickExpense.type,
        paymentMethod: quickExpense.paymentMethod,
        expenseDate: quickExpense.expenseDate,
        dashboardId,
        categoryId: quickExpense.categoryId,
        tagIds: [],
      });
    },
    onSuccess: () => {
      toast.success('Expense created');
      setExpenseModalOpen(false);
      setQuickExpense({
        amount: '',
        description: '',
        type: 'EXPENSE',
        paymentMethod: 'UPI',
        expenseDate: todayISO(),
        categoryId: '',
      });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not create expense')),
  });

  const expensesQuery = useQuery({
    queryKey: ['expenses', 'dashboard', dashboardId],
    queryFn: () => expenseApi.list({ sortDirection: 'DESC', dashboardId }),
    enabled: Boolean(dashboardId),
    refetchOnMount: 'always',
  });
  const dailyQuery = useQuery({
    queryKey: ['analytics', 'daily', dashboardId],
    queryFn: () => analyticsApi.daily({ dashboardId }),
    enabled: Boolean(dashboardId),
    refetchOnMount: 'always',
  });
  const categoriesQuery = useQuery({ queryKey: ['categories', 'active'], queryFn: () => categoryApi.ensureDefaultCategories(true) });
  const expenses = expensesQuery.data?.content ?? [];
  const quickExpenseCategories = (categoriesQuery.data ?? []).filter((category) => category.type === quickExpense.type);
  const categoryNameById = new Map((categoriesQuery.data ?? []).map((category) => [category.id, category.name]));
  const totalExpense = expenses.filter((expense) => expense.type === 'EXPENSE').reduce((total, expense) => total + toNumber(expense.amount), 0)
    || (dailyQuery.data ?? []).reduce((total, item) => total + amountOf(item), 0);
  const totalIncome = expenses.filter((expense) => expense.type === 'INCOME').reduce((total, expense) => total + toNumber(expense.amount), 0);
  const remaining = totalIncome - totalExpense;
  const transactionCount = expenses.length;

  if (dashboardsQuery.isLoading || (dashboardId && expensesQuery.isLoading)) {
    return <div className="flex min-h-96 items-center justify-center"><LoadingSpinner className="h-10 w-10" /></div>;
  }

  const createDashboardForm = (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (newDashboard.name.trim().length < 2) return;
        createDashboardMutation.mutate();
      }}
    >
      <Input label="New dashboard name" placeholder="Example: Trip to Goa" value={newDashboard.name} onChange={(event) => setNewDashboard((value) => ({ ...value, name: event.target.value }))} />
      <Textarea label="Description" placeholder="Example: Food, stay, travel and shopping expenses for this trip." value={newDashboard.description} onChange={(event) => setNewDashboard((value) => ({ ...value, description: event.target.value }))} />
      <Button type="submit" disabled={newDashboard.name.trim().length < 2} isLoading={createDashboardMutation.isPending}>
        <Plus className="h-4 w-4" />
        Create dashboard
      </Button>
    </form>
  );

  const openDashboard = (dashboardIdToOpen: string) => {
    localStorage.setItem(selectedDashboardStorageKey, dashboardIdToOpen);
    setOpeningDashboardId(dashboardIdToOpen);
    window.setTimeout(() => {
      setSelectedDashboardId(dashboardIdToOpen);
      setOpeningDashboardId('');
      publishSelectedDashboardChange();
    }, 260);
  };

  if (!dashboardId) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
        <PageHeader title="Your expense dashboards" description="Click an existing dashboard name or create a new one." />
        <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {dashboards.map((dashboard) => (
              <motion.div
                key={dashboard.id}
                layout
                whileHover={{ y: -3, scale: 1.01 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.18 }}
              >
                <Button
                  className="h-16 w-full justify-between rounded-3xl px-5 text-left"
                  isLoading={openingDashboardId === dashboard.id}
                  onClick={() => openDashboard(dashboard.id)}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <LayoutDashboard className="h-5 w-5 shrink-0" />
                    <span className="truncate text-base">{dashboard.name}</span>
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            ))}
            {!dashboards.length ? (
              <EmptyState title="No dashboards yet" description="Create your first dashboard to start saving expenses in a separate data store." />
            ) : null}
          </div>
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-950">Create new dashboard</h2>
            </div>
            {createDashboardForm}
          </Card>
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={dashboardId}
        initial={{ opacity: 0, y: 14, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.99 }}
        transition={{ duration: 0.24 }}
      >
        <PageHeader
          title={activeDashboard.name}
          description={activeDashboard.description ?? 'This dashboard has its own expenses, totals, chart, and recent transactions.'}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setExpenseModalOpen(true)}>
                <ReceiptText className="h-4 w-4" />
                Create expense
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedDashboardId('');
                  localStorage.removeItem(selectedDashboardStorageKey);
                  publishSelectedDashboardChange();
                }}
              >
                <ArrowLeft className="h-4 w-4" />
                All dashboards
              </Button>
            </div>
          }
        />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboards.map((dashboard) => (
          <Button
            key={dashboard.id}
            variant={dashboard.id === dashboardId ? 'primary' : 'secondary'}
            isLoading={openingDashboardId === dashboard.id}
            onClick={() => openDashboard(dashboard.id)}
          >
            <LayoutDashboard className="h-4 w-4" />
            {dashboard.name}
          </Button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Expense" value={formatMoney(totalExpense)} icon={TrendingDown} tone="rose" />
        <StatCard label="Total Income" value={formatMoney(totalIncome)} icon={TrendingUp} tone="emerald" />
        <StatCard label="Remaining" value={formatMoney(remaining)} icon={IndianRupee} tone="indigo" />
        <StatCard label="Transactions" value={String(transactionCount)} icon={Activity} tone="amber" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-950">Daily flow</h2>
            <Badge>Live API</Badge>
          </div>
          {(dailyQuery.data ?? []).length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={(dailyQuery.data ?? []).map((item) => ({ name: item.date ?? item.label ?? item.name, amount: amountOf(item) }))}>
                  <defs>
                    <linearGradient id="dailyAmount" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => formatMoney(Number(value))} />
                  <Area type="monotone" dataKey="amount" stroke="#4f46e5" fill="url(#dailyAmount)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No chart data yet" description="Daily analytics will appear when the backend returns spending points." />
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-950">Recent expenses</h2>
            </div>
            {expenses.length > 4 ? (
              <Link to="/expenses">
                <Button variant="ghost" className="h-9 px-3">
                  Load more
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : null}
          </div>
          {expensesQuery.isError ? (
            <EmptyState title="Could not load recent expenses" description="The backend returned an error for the expenses list." />
          ) : expenses.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <tbody className="divide-y divide-slate-100">
                  {expenses.slice(0, 4).map((expense) => (
                    <tr key={expense.id}>
                      <td className="py-3">
                        <p className="font-semibold text-slate-950">{expense.description}</p>
                        <p className="text-xs text-slate-500">
                          {formatDate(expense.expenseDate)} - {expense.category?.name ?? categoryNameById.get(expense.categoryId ?? '') ?? 'Uncategorized'}
                        </p>
                      </td>
                      <td className="py-3 text-right font-bold text-slate-950">{formatMoney(toNumber(expense.amount))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No recent transactions" description="Create an expense inside this dashboard to see it here." />
          )}
        </Card>
      </div>
      <Modal open={expenseModalOpen} title={`Create expense in ${activeDashboard.name}`} onClose={() => setExpenseModalOpen(false)}>
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!quickExpense.amount || Number(quickExpense.amount) <= 0 || quickExpense.description.trim().length < 2 || !quickExpense.categoryId) {
              toast.error('Please fill amount, description, and category');
              return;
            }
            quickExpenseMutation.mutate();
          }}
        >
          <Input
            label="Amount"
            type="number"
            step="0.01"
            min="0.01"
            value={quickExpense.amount}
            onChange={(event) => setQuickExpense((value) => ({ ...value, amount: event.target.value }))}
          />
          <Select
            label="Type"
            value={quickExpense.type}
            onChange={(event) => setQuickExpense((value) => ({ ...value, type: event.target.value as ExpenseType, categoryId: '' }))}
          >
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
          </Select>
          <Select
            label="Payment method"
            value={quickExpense.paymentMethod}
            onChange={(event) => setQuickExpense((value) => ({ ...value, paymentMethod: event.target.value as PaymentMethod }))}
          >
            {paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}
          </Select>
          <Input
            label="Date"
            type="date"
            value={quickExpense.expenseDate}
            onChange={(event) => setQuickExpense((value) => ({ ...value, expenseDate: event.target.value }))}
          />
          <Select
            className="md:col-span-2"
            label="Category"
            value={quickExpense.categoryId}
            onChange={(event) => setQuickExpense((value) => ({ ...value, categoryId: event.target.value }))}
          >
            <option value="">Select category</option>
            {quickExpenseCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </Select>
          <Textarea
            className="md:col-span-2"
            label="Description"
            value={quickExpense.description}
            onChange={(event) => setQuickExpense((value) => ({ ...value, description: event.target.value }))}
          />
          <Button className="md:col-span-2" type="submit" isLoading={quickExpenseMutation.isPending}>
            Save expense
          </Button>
        </form>
      </Modal>
      </motion.div>
    </AnimatePresence>
  );
}
