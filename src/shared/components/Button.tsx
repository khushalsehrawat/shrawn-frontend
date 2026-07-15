import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  isLoading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', isLoading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
        variant === 'primary' && 'bg-slate-950 text-white shadow-lg shadow-slate-950/15 hover:-translate-y-0.5 hover:bg-indigo-700',
        variant === 'secondary' && 'border border-slate-200 bg-white text-slate-900 shadow-sm hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-700',
        variant === 'ghost' && 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
        variant === 'danger' && 'bg-rose-600 text-white shadow-lg shadow-rose-600/15 hover:bg-rose-700',
        className,
      )}
      {...props}
    >
      {isLoading ? 'Please wait...' : children}
    </button>
  ),
);

Button.displayName = 'Button';
