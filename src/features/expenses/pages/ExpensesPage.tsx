import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit3, LayoutDashboard, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { getApiErrorMessage } from '../../../shared/api/apiError';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { Card } from '../../../shared/components/Card';
import { EmptyState } from '../../../shared/components/EmptyState';
import { Input } from '../../../shared/components/Input';
import { Modal } from '../../../shared/components/Modal';
import { PageHeader } from '../../../shared/components/PageHeader';
import { Select } from '../../../shared/components/Select';
import { Textarea } from '../../../shared/components/Textarea';
import { todayISO } from '../../../shared/utils/dateFormat';
import { formatDate } from '../../../shared/utils/dateFormat';
import { formatMoney } from '../../../shared/utils/moneyFormat';
import { categoryApi } from '../../categories/api/categoryApi';
import type { CategoryType } from '../../categories/types';
import { individualDashboardApi, selectedDashboardStorageKey } from '../../individualDashboards/api/individualDashboardApi';
import { expenseApi } from '../api/expenseApi';
import type { Expense, ExpenseFilters, ExpenseRequest, PaymentMethod } from '../types';

const paymentMethods: PaymentMethod[] = ['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'WALLET', 'OTHER'];
const schema = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
  description: z.string().min(2, 'Description is required'),
  type: z.enum(['EXPENSE', 'INCOME']),
  paymentMethod: z.enum(paymentMethods),
  expenseDate: z.string().min(1, 'Date is required'),
  categoryId: z.string().min(1, 'Choose a category'),
});

type ExpenseFormInput = z.input<typeof schema>;
type ExpenseFormOutput = z.output<typeof schema>;

function toNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function ExpensesPage() {
  const [filters, setFilters] = useState<ExpenseFilters>({ sortDirection: 'DESC' });
  const [editing, setEditing] = useState<Expense | null>(null);
  const [open, setOpen] = useState(false);
  const [newCategory, setNewCategory] = useState<{ name: string; type: CategoryType }>({ name: '', type: 'EXPENSE' });
  const [selectedDashboardId, setSelectedDashboardId] = useState(() => localStorage.getItem(selectedDashboardStorageKey) ?? '');
  const [newDashboard, setNewDashboard] = useState({ name: '', description: '' });
  const queryClient = useQueryClient();
  const dashboardsQuery = useQuery({ queryKey: ['individualDashboards'], queryFn: individualDashboardApi.list });
  const dashboards = dashboardsQuery.data ?? [];
  const activeDashboard = dashboards.find((dashboard) => dashboard.id === selectedDashboardId) ?? dashboards[0];
  const dashboardId = activeDashboard?.id;
  const effectiveFilters = { ...filters, dashboardId };
  const expensesQuery = useQuery({
    queryKey: ['expenses', effectiveFilters],
    queryFn: () => expenseApi.list(effectiveFilters),
    enabled: Boolean(dashboardId),
  });
  const categoriesQuery = useQuery({ queryKey: ['categories', 'active'], queryFn: () => categoryApi.ensureDefaultCategories(true) });
  const form = useForm<ExpenseFormInput, unknown, ExpenseFormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { amount: 0, description: '', type: 'EXPENSE', paymentMethod: 'UPI', expenseDate: todayISO(), categoryId: '' },
  });
  const categories = categoriesQuery.data ?? [];
  const categoryNameById = new Map(categories.map((category) => [category.id, category.name]));

  useEffect(() => {
    localStorage.removeItem('expense_tracker_recent_expenses');
  }, []);

  useEffect(() => {
    if (!dashboardId) return;
    setSelectedDashboardId(dashboardId);
    localStorage.setItem(selectedDashboardStorageKey, dashboardId);
  }, [dashboardId]);

  const saveMutation = useMutation({
    mutationFn: (values: ExpenseFormOutput) => {
      const body: ExpenseRequest = { ...values, dashboardId, tagIds: [] };
      return editing ? expenseApi.update(editing.id, body) : expenseApi.create(body);
    },
    onSuccess: (savedExpense) => {
      toast.success(editing ? 'Expense updated' : 'Expense created');
      queryClient.setQueriesData({ queryKey: ['expenses'] }, (oldData: unknown) => {
        if (!oldData || typeof oldData !== 'object' || !('content' in oldData)) return oldData;
        const page = oldData as { content?: Expense[]; totalElements?: number };
        const current = page.content ?? [];
        const withoutSaved = current.filter((expense) => expense.id !== savedExpense.id);
        return {
          ...page,
          content: [savedExpense, ...withoutSaved],
          totalElements: editing ? page.totalElements : (page.totalElements ?? withoutSaved.length) + 1,
        };
      });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      setOpen(false);
      setEditing(null);
      form.reset({ amount: 0, description: '', type: 'EXPENSE', paymentMethod: 'UPI', expenseDate: todayISO(), categoryId: '' });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
  const deleteMutation = useMutation({
    mutationFn: expenseApi.delete,
    onSuccess: () => {
      toast.success('Expense deleted');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
  const createCategoryMutation = useMutation({
    mutationFn: () =>
      categoryApi.create({
        name: newCategory.name.trim(),
        type: newCategory.type,
        description: `Created while adding an expense.`,
      }),
    onSuccess: (category) => {
      toast.success('Category created');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      form.setValue('categoryId', category.id, { shouldValidate: true, shouldDirty: true });
      setNewCategory({ name: '', type: 'EXPENSE' });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not create category')),
  });
  const createDashboardMutation = useMutation({
    mutationFn: () =>
      individualDashboardApi.create({
        name: newDashboard.name.trim(),
        description: newDashboard.description.trim() || undefined,
      }),
    onSuccess: (dashboard) => {
      toast.success('Dashboard created');
      setNewDashboard({ name: '', description: '' });
      setSelectedDashboardId(dashboard.id);
      localStorage.setItem(selectedDashboardStorageKey, dashboard.id);
      queryClient.invalidateQueries({ queryKey: ['individualDashboards'] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not create dashboard')),
  });

  const startEdit = (expense: Expense) => {
    setEditing(expense);
    form.reset({
      amount: expense.amount,
      description: expense.description,
      type: expense.type,
      paymentMethod: expense.paymentMethod,
      expenseDate: expense.expenseDate,
      categoryId: expense.category?.id ?? expense.categoryId ?? '',
    });
    setOpen(true);
  };

  return (
    <div>
      <PageHeader title="Expenses" description="Filter, create, update, and delete transactions using real backend records." actions={<Button disabled={!dashboardId} onClick={() => setOpen(true)}><Plus className="h-4 w-4" />New expense</Button>} />
      <Card className="mb-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-950">Expense data store</h2>
            </div>
            <Select
              label="Save and view expenses in"
              value={dashboardId ?? ''}
              onChange={(event) => {
                setSelectedDashboardId(event.target.value);
                localStorage.setItem(selectedDashboardStorageKey, event.target.value);
              }}
            >
              {dashboards.map((dashboard) => <option key={dashboard.id} value={dashboard.id}>{dashboard.name}</option>)}
            </Select>
            <p className="mt-2 text-sm text-slate-500">{activeDashboard?.description ?? 'Choose a dashboard so expenses stay separated from your other dashboards.'}</p>
          </div>
          <form
            className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              if (newDashboard.name.trim().length < 2) return;
              createDashboardMutation.mutate();
            }}
          >
            <Input label="New dashboard" placeholder="Example: Home expenses" value={newDashboard.name} onChange={(event) => setNewDashboard((value) => ({ ...value, name: event.target.value }))} />
            <Input label="Description" placeholder="Example: Rent, groceries, utilities" value={newDashboard.description} onChange={(event) => setNewDashboard((value) => ({ ...value, description: event.target.value }))} />
            <Button className="self-end" type="submit" disabled={newDashboard.name.trim().length < 2} isLoading={createDashboardMutation.isPending}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </form>
        </div>
      </Card>
      <Card className="mb-6">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Input label="Start" type="date" value={filters.startDate ?? ''} onChange={(event) => setFilters((v) => ({ ...v, startDate: event.target.value }))} />
          <Input label="End" type="date" value={filters.endDate ?? ''} onChange={(event) => setFilters((v) => ({ ...v, endDate: event.target.value }))} />
          <Select label="Category" value={filters.categoryId ?? ''} onChange={(event) => setFilters((v) => ({ ...v, categoryId: event.target.value }))}>
            <option value="">All</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select label="Type" value={filters.type ?? ''} onChange={(event) => setFilters((v) => ({ ...v, type: event.target.value as ExpenseFilters['type'] }))}>
            <option value="">All</option><option value="EXPENSE">Expense</option><option value="INCOME">Income</option>
          </Select>
          <Select label="Payment" value={filters.paymentMethod ?? ''} onChange={(event) => setFilters((v) => ({ ...v, paymentMethod: event.target.value as ExpenseFilters['paymentMethod'] }))}>
            <option value="">All</option>{paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}
          </Select>
          <Input label="Keyword" value={filters.keyword ?? ''} onChange={(event) => setFilters((v) => ({ ...v, keyword: event.target.value }))} />
        </div>
      </Card>
      <Card>
        {expensesQuery.isError ? (
          <EmptyState title="Could not load expenses" description={getApiErrorMessage(expensesQuery.error, 'Please check the backend response for /api/v1/expenses.')} />
        ) : !dashboardId ? (
          <EmptyState title="Create a dashboard first" description="Expenses need a dashboard so each group has its own data store." />
        ) : (expensesQuery.data?.content ?? []).length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-400"><tr><th className="py-3">Transaction</th><th>Category</th><th>Method</th><th>Date</th><th className="text-right">Amount</th><th className="text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {expensesQuery.data?.content.map((expense) => (
                  <tr key={expense.id}>
                    <td className="py-4">
                      <p className="font-bold text-slate-950">{expense.description}</p>
                    </td>
                    <td>{expense.category?.name ?? categoryNameById.get(expense.categoryId ?? '') ?? 'Uncategorized'}</td>
                    <td><Badge>{expense.paymentMethod}</Badge></td>
                    <td>{formatDate(expense.expenseDate)}</td>
                    <td className={`text-right font-bold ${expense.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-950'}`}>{formatMoney(toNumber(expense.amount))}</td>
                    <td className="space-x-2 text-right">
                      <Button variant="secondary" onClick={() => startEdit(expense)}><Edit3 className="h-4 w-4" />Edit</Button>
                      <Button variant="danger" onClick={() => deleteMutation.mutate(expense.id)}><Trash2 className="h-4 w-4" />Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState title="No expenses found" description="Create a transaction or adjust your filters." />}
      </Card>
      <Modal open={open} title={editing ? 'Edit expense' : 'New expense'} onClose={() => { setOpen(false); setEditing(null); form.reset(); }}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}>
          <Input label="Amount" type="number" step="0.01" error={form.formState.errors.amount?.message?.toString()} {...form.register('amount')} />
          <Select label="Type" error={form.formState.errors.type?.message} {...form.register('type')}><option value="EXPENSE">Expense</option><option value="INCOME">Income</option></Select>
          <Select label="Payment method" error={form.formState.errors.paymentMethod?.message} {...form.register('paymentMethod')}>{paymentMethods.map((m) => <option key={m} value={m}>{m}</option>)}</Select>
          <Input label="Date" type="date" error={form.formState.errors.expenseDate?.message} {...form.register('expenseDate')} />
          <div className="space-y-3">
            <Select label="Category" error={form.formState.errors.categoryId?.message} {...form.register('categoryId')}>
              <option value="">Select category</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
            </Select>
            {!editing ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Quick create category</p>
                <div className="grid gap-2 sm:grid-cols-[1fr_8rem_auto]">
                  <Input
                    aria-label="New category name"
                    placeholder="Category name"
                    value={newCategory.name}
                    onChange={(event) => setNewCategory((value) => ({ ...value, name: event.target.value }))}
                  />
                  <Select
                    aria-label="New category type"
                    value={newCategory.type}
                    onChange={(event) => setNewCategory((value) => ({ ...value, type: event.target.value as CategoryType }))}
                  >
                    <option value="EXPENSE">Expense</option>
                    <option value="INCOME">Income</option>
                  </Select>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => createCategoryMutation.mutate()}
                    disabled={newCategory.name.trim().length < 2}
                    isLoading={createCategoryMutation.isPending}
                  >
                    Add
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
          <Textarea className="md:col-span-2" label="Description" error={form.formState.errors.description?.message} {...form.register('description')} />
          <Button className="md:col-span-2" type="submit" isLoading={saveMutation.isPending}>{editing ? 'Save changes' : 'Create expense'}</Button>
        </form>
      </Modal>
    </div>
  );
}
