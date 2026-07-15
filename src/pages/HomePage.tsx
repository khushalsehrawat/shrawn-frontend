import { motion } from 'framer-motion';
import { BarChart3, LockKeyhole, ReceiptText, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../shared/components/Button';
import logo from '../assets/logo.png';

const features = [
  { title: 'Expense Tracking', icon: ReceiptText, text: 'Capture income and expenses with categories, tags, and payment methods.' },
  { title: 'Budget Control', icon: Target, text: 'Plan monthly or custom budgets across your whole account or a single category.' },
  { title: 'Analytics', icon: BarChart3, text: 'See category, tag, payment method, and daily spending trends.' },
  { title: 'Secure Auth', icon: LockKeyhole, text: 'JWT access tokens with refresh-token retry built into the client.' },
];

export function HomePage() {
  return (
    <main className="min-h-screen px-4 py-6">
      <nav className="mx-auto flex max-w-7xl items-center justify-between">
        <Link to="/" className="flex items-center gap-3 font-bold text-slate-950">
          <img src={logo} alt="Shrawn logo" className="h-10 w-10 rounded-2xl object-contain shadow-sm" />
          Shrawn
        </Link>
        <div className="flex gap-2">
          <Link to="/login"><Button variant="ghost">Login</Button></Link>
          <Link to="/register"><Button>Get Started</Button></Link>
        </div>
      </nav>
      <section className="mx-auto grid max-w-7xl items-center gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        <div>
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-600">
            Premium finance workspace
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mt-5 max-w-3xl text-5xl font-bold tracking-tight text-slate-950 sm:text-6xl">
            Expense tracking with a quieter, sharper dashboard.
          </motion.h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            A clean React frontend for your Spring Boot APIs, designed for fast daily entry and clear financial review.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register"><Button>Get Started</Button></Link>
            <Link to="/login"><Button variant="secondary">Login</Button></Link>
          </div>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl border border-white/70 bg-slate-950 p-5 shadow-2xl shadow-indigo-950/20">
          <div className="rounded-[1.5rem] bg-white p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <p className="text-sm font-semibold text-slate-500">Monthly position</p>
                <p className="mt-1 text-3xl font-bold text-slate-950">₹84,250</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">+12.4%</span>
            </div>
            <div className="mt-6 grid gap-3">
              {['Dining', 'Transport', 'Subscriptions', 'Travel'].map((item, index) => (
                <div key={item} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                  <span className="font-semibold text-slate-700">{item}</span>
                  <span className="font-bold text-slate-950">₹{(index + 2) * 1250}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-4 pb-12 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <motion.div key={feature.title} whileHover={{ y: -4 }} className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-xl shadow-slate-200/60 backdrop-blur">
            <feature.icon className="h-6 w-6 text-indigo-600" />
            <h2 className="mt-4 font-bold text-slate-950">{feature.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{feature.text}</p>
          </motion.div>
        ))}
      </section>
    </main>
  );
}
