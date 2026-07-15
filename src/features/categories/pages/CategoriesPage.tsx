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
import { Textarea } from '../../../shared/components/Textarea';
import { categoryApi } from '../api/categoryApi';
import type { Category, CategoryRequest } from '../types';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional(),
  type: z.enum(['EXPENSE', 'INCOME']),
});

export function CategoriesPage() {
  const [editing, setEditing] = useState<Category | null>(null);
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: () => categoryApi.ensureDefaultCategories(false) });
  const form = useForm<CategoryRequest>({ resolver: zodResolver(schema), defaultValues: { name: '', description: '', type: 'EXPENSE' } });

  const saveMutation = useMutation({
    mutationFn: (values: CategoryRequest) => (editing ? categoryApi.update(editing.id, values) : categoryApi.create(values)),
    onSuccess: () => {
      toast.success(editing ? 'Category updated' : 'Category created');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setOpen(false);
      setEditing(null);
      form.reset({ name: '', description: '', type: 'EXPENSE' });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const statusMutation = useMutation({
    mutationFn: (category: Category) => (category.active ? categoryApi.deactivate(category.id) : categoryApi.reactivate(category.id)),
    onSuccess: () => {
      toast.success('Category status updated');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const startEdit = (category: Category) => {
    setEditing(category);
    form.reset({ name: category.name, description: category.description ?? '', type: category.type });
    setOpen(true);
  };

  return (
    <div>
      <PageHeader title="Categories" description="Organize transactions by income and expense categories." actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />New category</Button>} />
      <Card>
        {(categoriesQuery.data ?? []).length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-400">
                <tr><th className="py-3">Name</th><th>Type</th><th>Status</th><th className="text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categoriesQuery.data?.map((category) => (
                  <tr key={category.id}>
                    <td className="py-4"><p className="font-bold text-slate-950">{category.name}</p><p className="text-xs text-slate-500">{category.description}</p></td>
                    <td><Badge>{category.type}</Badge></td>
                    <td><Badge className={category.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100'}>{category.active ? 'Active' : 'Inactive'}</Badge></td>
                    <td className="space-x-2 text-right">
                      <Button variant="secondary" onClick={() => startEdit(category)}><Edit3 className="h-4 w-4" />Edit</Button>
                      <Button variant={category.active ? 'danger' : 'secondary'} onClick={() => statusMutation.mutate(category)}>
                        {category.active ? 'Deactivate' : 'Reactivate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState title="No categories yet" description="Create categories before adding expenses." />}
      </Card>
      <Modal open={open} title={editing ? 'Edit category' : 'New category'} onClose={() => { setOpen(false); setEditing(null); form.reset(); }}>
        <form className="space-y-4" onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}>
          <Input label="Name" error={form.formState.errors.name?.message} {...form.register('name')} />
          <Select label="Type" error={form.formState.errors.type?.message} {...form.register('type')}>
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
          </Select>
          <Textarea label="Description" error={form.formState.errors.description?.message} {...form.register('description')} />
          <Button type="submit" isLoading={saveMutation.isPending}>{editing ? 'Save changes' : 'Create category'}</Button>
        </form>
      </Modal>
    </div>
  );
}
