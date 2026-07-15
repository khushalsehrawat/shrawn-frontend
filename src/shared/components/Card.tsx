import { type ComponentProps } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

type CardProps = ComponentProps<typeof motion.div>;

export function Card({ className, ...props }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn('rounded-3xl border border-white/70 bg-white/82 p-6 shadow-xl shadow-slate-200/60 backdrop-blur', className)}
      {...props}
    />
  );
}
