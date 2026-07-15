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
import { tagApi } from '../api/tagApi';
import type { Tag, TagRequest } from '../types';

const schema = z.object({ name: z.string().min(2, 'Name is required') });

export function TagsPage() {
  const [editing, setEditing] = useState<Tag | null>(null);
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const tagsQuery = useQuery({ queryKey: ['tags'], queryFn: () => tagApi.list() });
  const form = useForm<TagRequest>({ resolver: zodResolver(schema), defaultValues: { name: '' } });

  const saveMutation = useMutation({
    mutationFn: (values: TagRequest) => (editing ? tagApi.update(editing.id, values) : tagApi.create(values)),
    onSuccess: () => {
      toast.success(editing ? 'Tag updated' : 'Tag created');
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setOpen(false);
      setEditing(null);
      form.reset({ name: '' });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const statusMutation = useMutation({
    mutationFn: (tag: Tag) => (tag.active ? tagApi.deactivate(tag.id) : tagApi.reactivate(tag.id)),
    onSuccess: () => {
      toast.success('Tag status updated');
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  return (
    <div>
      <PageHeader title="Tags" description="Attach flexible labels to transactions for sharper analysis." actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />New tag</Button>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(tagsQuery.data ?? []).length ? tagsQuery.data?.map((tag) => (
          <Card key={tag.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div><h2 className="font-bold text-slate-950">{tag.name}</h2><Badge className={tag.active ? 'mt-3 bg-emerald-50 text-emerald-700' : 'mt-3'}>{tag.active ? 'Active' : 'Inactive'}</Badge></div>
              <div className="flex gap-2">
                <Button variant="secondary" className="h-10 w-10 px-0" onClick={() => { setEditing(tag); form.reset({ name: tag.name }); setOpen(true); }} aria-label="Edit tag"><Edit3 className="h-4 w-4" /></Button>
                <Button variant={tag.active ? 'danger' : 'secondary'} onClick={() => statusMutation.mutate(tag)}>{tag.active ? 'Off' : 'On'}</Button>
              </div>
            </div>
          </Card>
        )) : <div className="sm:col-span-2 xl:col-span-3"><EmptyState title="No tags yet" description="Create tags for projects, people, or spending contexts." /></div>}
      </div>
      <Modal open={open} title={editing ? 'Edit tag' : 'New tag'} onClose={() => { setOpen(false); setEditing(null); form.reset(); }}>
        <form className="space-y-4" onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}>
          <Input label="Name" error={form.formState.errors.name?.message} {...form.register('name')} />
          <Button type="submit" isLoading={saveMutation.isPending}>{editing ? 'Save changes' : 'Create tag'}</Button>
        </form>
      </Modal>
    </div>
  );
}
