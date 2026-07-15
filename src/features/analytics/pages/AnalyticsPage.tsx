import { useQuery } from '@tanstack/react-query';
import { Activity, IndianRupee, TrendingDown, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '../../../shared/components/Card';
import { EmptyState } from '../../../shared/components/EmptyState';
import { Input } from '../../../shared/components/Input';
import { PageHeader } from '../../../shared/components/PageHeader';
import { Select } from '../../../shared/components/Select';
import { StatCard } from '../../../shared/components/StatCard';
import { currentMonth } from '../../../shared/utils/dateFormat';
import { formatMoney } from '../../../shared/utils/moneyFormat';
import { analyticsApi } from '../api/analyticsApi';
import type { ChartPoint } from '../types';
import { useEffect, useState } from 'react';
import { individualDashboardApi, selectedDashboardStorageKey } from '../../individualDashboards/api/individualDashboardApi';

const colors = ['#4f46e5', '#059669', '#f59e0b', '#e11d48', '#0f172a', '#7c3aed'];

function amountOf(item: ChartPoint) {
  return item.amount ?? item.totalAmount ?? item.total ?? item.value ?? 0;
}

function nameOf(item: ChartPoint) {
  return item.categoryName ?? item.paymentMethod ?? item.date ?? item.label ?? item.name ?? 'Other';
}

export function AnalyticsPage() {
  const [month, setMonth] = useState(currentMonth());
  const [selectedDashboardId, setSelectedDashboardId] = useState(() => localStorage.getItem(selectedDashboardStorageKey) ?? '');
  const dashboardsQuery = useQuery({ queryKey: ['individualDashboards'], queryFn: individualDashboardApi.list });
  const dashboards = dashboardsQuery.data ?? [];
  const activeDashboard = dashboards.find((dashboard) => dashboard.id === selectedDashboardId) ?? dashboards[0];
  const dashboardId = activeDashboard?.id;
  const params = { ...(month ? { month } : {}), ...(dashboardId ? { dashboardId } : {}) };
  const summaryQuery = useQuery({ queryKey: ['analytics', 'summary', month, dashboardId], queryFn: () => analyticsApi.summary(params), enabled: Boolean(dashboardId) });
  const categoryQuery = useQuery({ queryKey: ['analytics', 'category', month, dashboardId], queryFn: () => analyticsApi.byCategory(params), enabled: Boolean(dashboardId) });
  const paymentQuery = useQuery({ queryKey: ['analytics', 'payment', month, dashboardId], queryFn: () => analyticsApi.byPaymentMethod(params), enabled: Boolean(dashboardId) });
  const dailyQuery = useQuery({ queryKey: ['analytics', 'daily', month, dashboardId], queryFn: () => analyticsApi.daily(params), enabled: Boolean(dashboardId) });
  const summary = summaryQuery.data ?? {};
  const chart = (items?: ChartPoint[]) => (items ?? []).map((item) => ({ name: nameOf(item), amount: amountOf(item) }));

  useEffect(() => {
    if (!dashboardId) return;
    setSelectedDashboardId(dashboardId);
    localStorage.setItem(selectedDashboardStorageKey, dashboardId);
  }, [dashboardId]);

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Visual analysis for the selected individual dashboard."
        actions={
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Dashboard"
              value={dashboardId ?? ''}
              onChange={(event) => {
                setSelectedDashboardId(event.target.value);
                localStorage.setItem(selectedDashboardStorageKey, event.target.value);
              }}
            >
              {dashboards.map((dashboard) => <option key={dashboard.id} value={dashboard.id}>{dashboard.name}</option>)}
            </Select>
            <Input type="month" label="Month" value={month} onChange={(event) => setMonth(event.target.value)} />
          </div>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Expense" value={formatMoney(summary.totalExpense)} icon={TrendingDown} tone="rose" />
        <StatCard label="Total Income" value={formatMoney(summary.totalIncome)} icon={TrendingUp} tone="emerald" />
        <StatCard label="Remaining" value={formatMoney(summary.remaining ?? (summary.totalIncome ?? 0) - (summary.totalExpense ?? 0))} icon={IndianRupee} />
        <StatCard label="Transactions" value={String(summary.transactionCount ?? 0)} icon={Activity} tone="amber" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ChartCard title="By category" data={chart(categoryQuery.data)} type="pie" />
        <ChartCard title="By payment method" data={chart(paymentQuery.data)} type="bar" />
        <ChartCard title="Daily spending" data={chart(dailyQuery.data)} type="line" />
      </div>
    </div>
  );
}

function ChartCard({ title, data, type }: { title: string; data: { name: string; amount: number }[]; type: 'pie' | 'bar' | 'line' }) {
  return (
    <Card>
      <h2 className="mb-5 text-lg font-bold text-slate-950">{title}</h2>
      {data.length ? (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {type === 'pie' ? (
              <PieChart>
                <Pie data={data} dataKey="amount" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={3}>
                  {data.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => formatMoney(Number(value))} />
              </PieChart>
            ) : type === 'line' ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatMoney(Number(value))} />
                <Line type="monotone" dataKey="amount" stroke="#4f46e5" strokeWidth={3} dot={false} />
              </LineChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatMoney(Number(value))} />
                <Bar dataKey="amount" fill="#4f46e5" radius={[10, 10, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      ) : <EmptyState title="No analytics data" description="The backend did not return points for this view yet." />}
    </Card>
  );
}
