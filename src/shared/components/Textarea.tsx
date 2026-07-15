import { type TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '../utils/cn';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, label, error, ...props }, ref) => (
  <label className="block space-y-2">
    {label ? <span className="text-sm font-semibold text-slate-700">{label}</span> : null}
    <textarea
      ref={ref}
      className={cn(
        'min-h-24 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100',
        error && 'border-rose-300 focus:border-rose-400 focus:ring-rose-100',
        className,
      )}
      {...props}
    />
    {error ? <span className="text-xs font-medium text-rose-600">{error}</span> : null}
  </label>
));

Textarea.displayName = 'Textarea';
