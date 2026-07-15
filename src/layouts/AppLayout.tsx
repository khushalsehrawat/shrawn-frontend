import { useMutation, useQuery } from '@tanstack/react-query';
import { LogOut, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authApi } from '../features/auth/api/authApi';
import { selectedDashboardChangedEvent, selectedDashboardStorageKey } from '../features/individualDashboards/api/individualDashboardApi';
import { userApi } from '../features/user/api/userApi';
import { Button } from '../shared/components/Button';
import { appNavItems } from '../shared/constants/routes';
import { clearTokens } from '../shared/api/tokenStorage';
import { cn } from '../shared/utils/cn';
import logo from '../assets/logo.png';

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const [selectedDashboardId, setSelectedDashboardId] = useState(() => localStorage.getItem(selectedDashboardStorageKey) ?? '');
  const location = useLocation();
  const navigate = useNavigate();
  const { data: user } = useQuery({ queryKey: ['user', 'me'], queryFn: userApi.me });
  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      clearTokens();
      localStorage.removeItem(selectedDashboardStorageKey);
      toast.success('Signed out');
      navigate('/login', { replace: true });
    },
  });

  useEffect(() => {
    const syncSelectedDashboard = () => {
      setSelectedDashboardId(localStorage.getItem(selectedDashboardStorageKey) ?? '');
    };

    window.addEventListener(selectedDashboardChangedEvent, syncSelectedDashboard);
    window.addEventListener('storage', syncSelectedDashboard);

    return () => {
      window.removeEventListener(selectedDashboardChangedEvent, syncSelectedDashboard);
      window.removeEventListener('storage', syncSelectedDashboard);
    };
  }, []);

  const selectingDashboard = location.pathname === '/dashboard' && !selectedDashboardId;

  const sidebar = (
    <aside className="flex h-full flex-col border-r border-white/70 bg-white/80 p-4 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <NavLink to="/dashboard" className="flex items-center gap-3 font-bold text-slate-950" onClick={() => setOpen(false)}>
          <img src={logo} alt="Shrawn logo" className="h-10 w-10 rounded-2xl object-contain shadow-sm" />
          <span>Shrawn</span>
        </NavLink>
        <Button variant="ghost" className="h-10 w-10 px-0 lg:hidden" onClick={() => setOpen(false)} aria-label="Close navigation">
          <X className="h-5 w-5" />
        </Button>
      </div>
      <nav className="mt-8 space-y-1">
        {appNavItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950',
                isActive && 'bg-slate-950 text-white shadow-lg shadow-slate-950/10 hover:bg-slate-950 hover:text-white',
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto rounded-3xl bg-slate-50 p-4">
        <p className="text-sm font-bold text-slate-950">{user?.fullName ?? 'Account'}</p>
        <p className="mt-1 truncate text-xs text-slate-500">{user?.email ?? 'Signed in'}</p>
      </div>
    </aside>
  );

  return (
    <div className={cn('min-h-screen', !selectingDashboard && 'lg:grid lg:grid-cols-[17rem_1fr]')}>
      {!selectingDashboard ? <div className="hidden lg:block">{sidebar}</div> : null}
      {open && !selectingDashboard ? <div className="fixed inset-0 z-40 lg:hidden">{sidebar}</div> : null}
      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-white/70 bg-white/70 px-4 py-3 backdrop-blur-xl sm:px-6">
          <div className="flex items-center justify-between gap-4">
            {!selectingDashboard ? <Button variant="ghost" className="h-10 w-10 px-0 lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation">
              <Menu className="h-5 w-5" />
            </Button> : null}
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-indigo-600">Expense Tracker</p>
              <p className="truncate text-sm text-slate-500">Connected to localhost backend</p>
            </div>
            <Button variant="secondary" onClick={() => logoutMutation.mutate()} isLoading={logoutMutation.isPending}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
