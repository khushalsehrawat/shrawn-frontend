import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit3, Plus } from 'lucide-react';
import { useState } from 'react';
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
import { currentMonth, formatDate } from '../../../shared/utils/dateFormat';
import { formatMoney } from '../../../shared/utils/moneyFormat';
import { categoryApi } from '../../categories/api/categoryApi';
import { budgetApi } from '../api/budgetApi';
import type { Budget, BudgetRequest } from '../types';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  limitAmount: z.coerce.number().positive('Limit must be positive'),
  periodType: z.enum(['MONTHLY', 'CUSTOM']),
  month: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
}).superRefine((value, context) => {
  if (value.periodType === 'MONTHLY' && !value.month) context.addIssue({ code: 'custom', path: ['month'], message: 'Month is required' });
  if (value.periodType === 'CUSTOM' && (!value.startDate || !value.endDate)) context.addIssue({ code: 'custom', path: ['startDate'], message: 'Start and end dates are required' });
});

type BudgetFormInput = z.input<typeof schema>;
type BudgetFormOutput = z.output<typeof schema>;

export function BudgetsPage() {
  const [editing, setEditing] = useState<Budget | null>(null);
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const budgetsQuery = useQuery({ queryKey: ['budgets'], queryFn: () => budgetApi.list() });
  const categoriesQuery = useQuery({ queryKey: ['categories', 'active', 'expense'], queryFn: async () => (await categoryApi.list(true)).filter((c) => c.type === 'EXPENSE') });
  const form = useForm<BudgetFormInput, unknown, BudgetFormOutput>({ resolver: zodResolver(schema), defaultValues: { name: '', limitAmount: 0, periodType: 'MONTHLY', month: currentMonth(), startDate: '', endDate: '', categoryId: null } });
  const periodType = form.watch('periodType');

  const normalize = (values: BudgetRequest): BudgetRequest => ({
    ...values,
    categoryId: values.categoryId || null,
    month: values.periodType === 'MONTHLY' ? values.month : null,
    startDate: values.periodType === 'CUSTOM' ? values.startDate : null,
    endDate: values.periodType === 'CUSTOM' ? values.endDate : null,
  });

  const saveMutation = useMutation({
    mutationFn: (values: BudgetRequest) => (editing ? budgetApi.update(editing.id, normalize(values)) : budgetApi.create(normalize(values))),
    onSuccess: () => {
      toast.success(editing ? 'Budget updated' : 'Budget created');
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setOpen(false);
      setEditing(null);
      form.reset({ name: '', limitAmount: 0, periodType: 'MONTHLY', month: currentMonth(), startDate: '', endDate: '', categoryId: null });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
  const statusMutation = useMutation({
    mutationFn: (budget: Budget) => (budget.active ? budgetApi.deactivate(budget.id) : budgetApi.reactivate(budget.id)),
    onSuccess: () => {
      toast.success('Budget status updated');
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  return (
    <div>
      <PageHeader title="Budgets" description="Create monthly or custom budgets for all expenses or a real category UUID." actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />New budget</Button>} />
      <div className="grid gap-4 lg:grid-cols-2">
        {(budgetsQuery.data ?? []).length ? budgetsQuery.data?.map((budget) => (
          <Card key={budget.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-950">{budget.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{budget.category?.name ?? 'Overall budget'} · {budget.periodType === 'MONTHLY' ? budget.month : `${formatDate(budget.startDate)} to ${formatDate(budget.endDate)}`}</p>
              </div>
              <Badge className={budget.active ? 'bg-emerald-50 text-emerald-700' : ''}>{budget.active ? 'Active' : 'Inactive'}</Badge>
            </div>
            <p className="mt-6 text-3xl font-bold text-slate-950">{formatMoney(budget.limitAmount)}</p>
            <div className="mt-6 flex gap-2">
              <Button variant="secondary" onClick={() => { setEditing(budget); form.reset({ name: budget.name, limitAmount: budget.limitAmount, periodType: budget.periodType, month: budget.month, startDate: budget.startDate, endDate: budget.endDate, categoryId: budget.category?.id ?? budget.categoryId ?? null }); setOpen(true); }}><Edit3 className="h-4 w-4" />Edit</Button>
              <Button variant={budget.active ? 'danger' : 'secondary'} onClick={() => statusMutation.mutate(budget)}>{budget.active ? 'Deactivate' : 'Reactivate'}</Button>
            </div>
          </Card>
        )) : <div className="lg:col-span-2"><EmptyState title="No budgets yet" description="Create a monthly or custom budget to start planning." /></div>}
      </div>
      <Modal open={open} title={editing ? 'Edit budget' : 'New budget'} onClose={() => { setOpen(false); setEditing(null); form.reset(); }}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}>
          <Input label="Name" error={form.formState.errors.name?.message} {...form.register('name')} />
          <Input label="Limit amount" type="number" step="0.01" error={form.formState.errors.limitAmount?.message} {...form.register('limitAmount')} />
          <Select label="Period" error={form.formState.errors.periodType?.message} {...form.register('periodType')}><option value="MONTHLY">Monthly</option><option value="CUSTOM">Custom</option></Select>
          <Select label="Category" error={form.formState.errors.categoryId?.message} {...form.register('categoryId')}>
            <option value="">Overall budget</option>{categoriesQuery.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          {periodType === 'MONTHLY' ? <Input label="Month" type="month" error={form.formState.errors.month?.message} {...form.register('month')} /> : <>
            <Input label="Start date" type="date" error={form.formState.errors.startDate?.message} {...form.register('startDate')} />
            <Input label="End date" type="date" error={form.formState.errors.endDate?.message} {...form.register('endDate')} />
          </>}
          <Button className="md:col-span-2" type="submit" isLoading={saveMutation.isPending}>{editing ? 'Save changes' : 'Create budget'}</Button>
        </form>
      </Modal>
    </div>
  );
}
