import { format, parseISO } from 'date-fns';

export function formatDate(value?: string | null, pattern = 'dd MMM yyyy') {
  if (!value) return 'Not set';
  try {
    return format(parseISO(value), pattern);
  } catch {
    return value;
  }
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}
