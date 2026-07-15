import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LayoutDashboard, Mail, Save, Trash2, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { getApiErrorMessage } from '../../../shared/api/apiError';
import { Button } from '../../../shared/components/Button';
import { Card } from '../../../shared/components/Card';
import { Input } from '../../../shared/components/Input';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { PageHeader } from '../../../shared/components/PageHeader';
import { individualDashboardApi, selectedDashboardStorageKey } from '../../individualDashboards/api/individualDashboardApi';
import { userApi } from '../api/userApi';
import type { UpdateUserRequest } from '../types';

const schema = z.object({ fullName: z.string().min(2, 'Full name is required') });

export function ProfilePage() {
  const queryClient = useQueryClient();
  const userQuery = useQuery({ queryKey: ['user', 'me'], queryFn: userApi.me });
  const dashboardsQuery = useQuery({ queryKey: ['individualDashboards'], queryFn: individualDashboardApi.list });
  const [dashboardNames, setDashboardNames] = useState<Record<string, string>>({});
  const form = useForm<UpdateUserRequest>({ resolver: zodResolver(schema), defaultValues: { fullName: '' } });

  useEffect(() => {
    if (userQuery.data) form.reset({ fullName: userQuery.data.fullName });
  }, [form, userQuery.data]);

  useEffect(() => {
    if (!dashboardsQuery.data) return;
    setDashboardNames(Object.fromEntries(dashboardsQuery.data.map((dashboard) => [dashboard.id, dashboard.name])));
  }, [dashboardsQuery.data]);

  const mutation = useMutation({
    mutationFn: userApi.updateMe,
    onSuccess: () => {
      toast.success('Profile updated');
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
  const updateDashboardMutation = useMutation({
    mutationFn: ({ id, name, description }: { id: string; name: string; description?: string | null }) =>
      individualDashboardApi.update(id, { name, description }),
    onSuccess: () => {
      toast.success('Dashboard name updated');
      queryClient.invalidateQueries({ queryKey: ['individualDashboards'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not update dashboard name')),
  });
  const removeDashboardMutation = useMutation({
    mutationFn: individualDashboardApi.deactivate,
    onSuccess: (_, dashboardId) => {
      toast.success('Dashboard removed');
      if (localStorage.getItem(selectedDashboardStorageKey) === dashboardId) {
        localStorage.removeItem(selectedDashboardStorageKey);
      }
      queryClient.invalidateQueries({ queryKey: ['individualDashboards'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not remove dashboard')),
  });

  if (userQuery.isLoading || dashboardsQuery.isLoading) return <div className="flex min-h-96 items-center justify-center"><LoadingSpinner className="h-10 w-10" /></div>;

  return (
    <div>
      <PageHeader title="Profile" description="Manage your account identity." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,42rem)_1fr]">
      <Card>
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-950 text-white"><UserRound className="h-6 w-6" /></div>
          <div>
            <h2 className="text-xl font-bold text-slate-950">{userQuery.data?.fullName}</h2>
            <p className="flex items-center gap-2 text-sm text-slate-500"><Mail className="h-4 w-4" />{userQuery.data?.email}</p>
          </div>
        </div>
        <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
          <Input label="Full name" error={form.formState.errors.fullName?.message} {...form.register('fullName')} />
          <Input label="Email" value={userQuery.data?.email ?? ''} readOnly />
          <Button type="submit" isLoading={mutation.isPending}>Save profile</Button>
        </form>
      </Card>
      <Card>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-950">Dashboard names</h2>
            <p className="text-sm text-slate-500">Rename the dashboards shown after login.</p>
          </div>
        </div>
        {(dashboardsQuery.data ?? []).length ? (
          <div className="space-y-4">
            {(dashboardsQuery.data ?? []).map((dashboard) => {
              const value = dashboardNames[dashboard.id] ?? dashboard.name;
              const trimmedValue = value.trim();
              const unchanged = trimmedValue === dashboard.name;
              return (
                <form
                  key={dashboard.id}
                  className="grid gap-3 rounded-3xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-[1fr_auto_auto]"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (trimmedValue.length < 2 || unchanged) return;
                    updateDashboardMutation.mutate({
                      id: dashboard.id,
                      name: trimmedValue,
                      description: dashboard.description,
                    });
                  }}
                >
                  <Input
                    label="Dashboard name"
                    value={value}
                    onChange={(event) => setDashboardNames((names) => ({ ...names, [dashboard.id]: event.target.value }))}
                  />
                  <Button className="self-end" type="submit" disabled={trimmedValue.length < 2 || unchanged} isLoading={updateDashboardMutation.isPending}>
                    <Save className="h-4 w-4" />
                    Save
                  </Button>
                  <Button
                    className="self-end"
                    type="button"
                    variant="danger"
                    disabled={(dashboardsQuery.data ?? []).length <= 1}
                    isLoading={removeDashboardMutation.isPending}
                    onClick={() => removeDashboardMutation.mutate(dashboard.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                </form>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No dashboards have been created yet.</p>
        )}
      </Card>
      </div>
    </div>
  );
}
