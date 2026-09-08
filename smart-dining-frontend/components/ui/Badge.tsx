import React from 'react';

type BadgeTone = 'green' | 'amber' | 'red' | 'blue' | 'indigo' | 'slate';

export function Badge({ children, tone = 'slate' }: { children: React.ReactNode; tone?: BadgeTone }) {
  const tones: Record<BadgeTone, string> = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    blue: 'bg-sky-50 text-sky-700 border-sky-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}