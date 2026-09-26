import React from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AlertsView: React.FC = () => {
  const { alerts, acknowledgeAlert, markAllAlertsRead } = useApp();
  const orderedAlerts = [...alerts].sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-5 py-9 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Action items from project monitoring</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Alerts</h1>
        </div>
        <button onClick={markAllAlertsRead} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><CheckCheck className="h-4 w-4" />Mark all read</button>
      </header>
      <section className="space-y-3">
        {orderedAlerts.map((alert) => {
          const colors = alert.severity === 'Critical' ? 'border-l-red-600' : alert.severity === 'Warning' ? 'border-l-amber-500' : 'border-l-emerald-600';
          return <article key={alert.id} className={`rounded-xl border border-slate-200 border-l-4 ${colors} bg-white p-5 shadow-sm`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3"><Bell className="mt-1 h-5 w-5 shrink-0 text-slate-500" /><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{alert.severity} · {alert.project_name}</p><h2 className="mt-1 text-lg font-semibold text-slate-900">{alert.title}</h2><p className="mt-2 text-sm leading-relaxed text-slate-600">{alert.message}</p><time className="mt-3 block text-xs text-slate-400">{new Date(alert.timestamp).toLocaleString()}</time></div></div>
              {!alert.acknowledged && <button onClick={() => acknowledgeAlert(alert.id)} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700"><Check className="h-4 w-4" />Acknowledge</button>}
            </div>
          </article>;
        })}
        {orderedAlerts.length === 0 && <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center"><Bell className="mx-auto h-8 w-8 text-slate-400" /><p className="mt-3 text-lg font-semibold text-slate-900">You’re all caught up</p><p className="mt-1 text-sm text-slate-500">New project alerts will appear here.</p></div>}
      </section>
    </main>
  );
};
