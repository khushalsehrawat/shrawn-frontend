import { type SelectHTMLAttributes, forwardRef } from 'react';
import { cn } from '../utils/cn';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, label, error, children, ...props }, ref) => (
  <label className="block space-y-2">
    {label ? <span className="text-sm font-semibold text-slate-700">{label}</span> : null}
    <select
      ref={ref}
      className={cn(
        'h-11 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 text-sm text-slate-950 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100',
        error && 'border-rose-300 focus:border-rose-400 focus:ring-rose-100',
        className,
      )}
      {...props}
    >
      {children}
    </select>
    {error ? <span className="text-xs font-medium text-rose-600">{error}</span> : null}
  </label>
));

Select.displayName = 'Select';
