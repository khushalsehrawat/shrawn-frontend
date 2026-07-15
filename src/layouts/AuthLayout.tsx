import { Link, Outlet } from 'react-router-dom';
import logo from '../assets/logo.png';

export default function AuthLayout() {
  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1fr_0.9fr]">
        <section className="hidden lg:block">
          <Link to="/" className="inline-flex items-center gap-3 text-lg font-bold text-slate-950">
            <img src={logo} alt="Shrawn logo" className="h-11 w-11 rounded-2xl object-contain shadow-sm" />
            Shrawn Expense
          </Link>
          <h1 className="mt-10 max-w-xl text-5xl font-bold tracking-tight text-slate-950">
            Calm finances, crisp decisions, fewer surprises.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-slate-600">
            Track spending, budgets, and patterns from one elegant workspace connected to your Spring Boot backend.
          </p>
        </section>
        <Outlet />
      </div>
    </main>
  );
}
