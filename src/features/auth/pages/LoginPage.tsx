import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { LockKeyhole } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '../../../shared/components/Button';
import { Card } from '../../../shared/components/Card';
import { Input } from '../../../shared/components/Input';
import { getApiErrorMessage } from '../../../shared/api/apiError';
import { saveTokens } from '../../../shared/api/tokenStorage';
import { selectedDashboardStorageKey } from '../../individualDashboards/api/individualDashboardApi';
import { authApi } from '../api/authApi';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const form = useForm<LoginValues>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });
  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      saveTokens(data.accessToken, data.refreshToken);
      localStorage.removeItem(selectedDashboardStorageKey);
      toast.success('Welcome back');
      navigate('/dashboard', { replace: true });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Login failed')),
  });

  return (
    <Card className="mx-auto w-full max-w-md">
      <div className="mb-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
          <LockKeyhole className="h-5 w-5" />
        </div>
        <h1 className="mt-5 text-3xl font-bold text-slate-950">Login</h1>
        <p className="mt-2 text-sm text-slate-500">Access your premium expense dashboard.</p>
      </div>
      <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <Input label="Email" type="email" autoComplete="email" error={form.formState.errors.email?.message} {...form.register('email')} />
        <Input label="Password" type="password" autoComplete="current-password" error={form.formState.errors.password?.message} {...form.register('password')} />
        <Button className="w-full" type="submit" isLoading={mutation.isPending}>Login</Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        New here? <Link className="font-bold text-indigo-600 hover:text-indigo-700" to="/register">Create an account</Link>
      </p>
    </Card>
  );
}
