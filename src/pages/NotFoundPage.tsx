import { Link } from 'react-router-dom';
import { Button } from '../shared/components/Button';

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-indigo-600">404</p>
        <h1 className="mt-4 text-4xl font-bold text-slate-950">Page not found</h1>
        <p className="mt-3 text-slate-500">The page you are looking for does not exist.</p>
        <Link to="/dashboard" className="mt-6 inline-flex">
          <Button>Back to dashboard</Button>
        </Link>
      </div>
    </main>
  );
}
