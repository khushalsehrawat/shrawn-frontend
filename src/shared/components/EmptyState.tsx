import { Inbox } from 'lucide-react';
import { Card } from './Card';

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <Card className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-3xl bg-slate-100 p-4 text-slate-500">
        <Inbox className="h-8 w-8" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-slate-950">{title}</h3>
      {description ? <p className="mt-2 max-w-md text-sm text-slate-500">{description}</p> : null}
    </Card>
  );
}
