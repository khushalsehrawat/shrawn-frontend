import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { getApiErrorMessage } from '../../../shared/api/apiError';
import { saveTokens } from '../../../shared/api/tokenStorage';
import { Button } from '../../../shared/components/Button';
import { Card } from '../../../shared/components/Card';
import { Input } from '../../../shared/components/Input';
import { authApi } from '../api/authApi';

const schema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type RegisterValues = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const form = useForm<RegisterValues>({ resolver: zodResolver(schema), defaultValues: { fullName: '', email: '', password: '' } });
  const mutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      saveTokens(data.accessToken, data.refreshToken);
      toast.success('Account created');
      navigate('/dashboard', { replace: true });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Registration failed')),
  });

  return (
    <Card className="mx-auto w-full max-w-md">
      <div className="mb-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
          <Sparkles className="h-5 w-5" />
        </div>
        <h1 className="mt-5 text-3xl font-bold text-slate-950">Create account</h1>
        <p className="mt-2 text-sm text-slate-500">Start tracking with a clean financial workspace.</p>
      </div>
      <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <Input label="Full name" autoComplete="name" error={form.formState.errors.fullName?.message} {...form.register('fullName')} />
        <Input label="Email" type="email" autoComplete="email" error={form.formState.errors.email?.message} {...form.register('email')} />
        <Input label="Password" type="password" autoComplete="new-password" error={form.formState.errors.password?.message} {...form.register('password')} />
        <Button className="w-full" type="submit" isLoading={mutation.isPending}>Create account</Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Already registered? <Link className="font-bold text-indigo-600 hover:text-indigo-700" to="/login">Login</Link>
      </p>
    </Card>
  );
}
