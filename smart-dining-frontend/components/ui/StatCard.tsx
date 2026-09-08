import React from 'react';
import { Card } from './Card';

export function StatCard({ label, value, detail, icon: Icon, tone = 'amber' }: { label: string; value: string; detail?: string; icon: React.ElementType; tone?: 'amber' | 'blue' | 'green' | 'indigo' }) {
  const tones = { amber: 'bg-amber-50 text-amber-600', blue: 'bg-sky-50 text-sky-600', green: 'bg-emerald-50 text-emerald-600', indigo: 'bg-indigo-50 text-indigo-600' };
  return <Card className="flex items-start justify-between p-5"><div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>{detail && <p className="mt-1 text-xs text-slate-400">{detail}</p>}</div><div className={`rounded-xl p-3 ${tones[tone]}`}><Icon className="h-5 w-5" /></div></Card>;
}