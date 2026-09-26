import React from 'react';
import { ArrowRight, BarChart3, Bell, Map, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const HomePage: React.FC = () => {
  const { loginAsPreset } = useApp();

  return (
    <main className="min-h-screen bg-[#F7F8FA] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0C2B20] text-white"><Map className="h-5 w-5" /></div>
            <div><p className="text-lg font-bold tracking-tight">LANDINTEL</p><p className="text-xs text-slate-500">Land Acquisition Intelligence</p></div>
          </div>
          <span className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 sm:inline-flex"><span className="h-2 w-2 rounded-full bg-emerald-600" />Demo environment</span>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-81px)] max-w-7xl items-center gap-12 px-6 py-14 lg:grid-cols-[1.2fr_0.8fr] lg:py-20">
        <div className="max-w-2xl">
          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-900">A clearer view of project delays</span>
          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-6xl">See land acquisition risks sooner.</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">Explore project risk predictions, locations, and alerts in one straightforward workspace.</p>

          <div className="mt-9 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4"><ShieldCheck className="h-5 w-5 text-emerald-700" /><h2 className="mt-3 text-sm font-semibold">Risk predictions</h2><p className="mt-1 text-sm text-slate-500">See which projects may need attention.</p></div>
            <div className="rounded-xl border border-slate-200 bg-white p-4"><Map className="h-5 w-5 text-emerald-700" /><h2 className="mt-3 text-sm font-semibold">Project map</h2><p className="mt-1 text-sm text-slate-500">Explore the portfolio by location.</p></div>
            <div className="rounded-xl border border-slate-200 bg-white p-4"><BarChart3 className="h-5 w-5 text-emerald-700" /><h2 className="mt-3 text-sm font-semibold">Portfolio insights</h2><p className="mt-1 text-sm text-slate-500">Follow trends and project progress.</p></div>
          </div>
        </div>

        <section aria-labelledby="demo-sign-in-title" className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/5 sm:p-9">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800"><Bell className="h-6 w-6" /></div>
          <p className="mt-6 text-sm font-semibold text-emerald-800">Ready to explore?</p>
          <h2 id="demo-sign-in-title" className="mt-1 text-2xl font-bold tracking-tight">Demo sign in</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">Open the sample workspace instantly. No username, password, or setup required.</p>
          <button onClick={() => loginAsPreset('Central Admin')} className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0C2B20] px-5 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-[#164734] focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2">
            Enter demo workspace <ArrowRight className="h-5 w-5" />
          </button>
          <p className="mt-4 text-center text-xs text-slate-500">Demo access · Central administrator view</p>
        </section>
      </section>
    </main>
  );
};
