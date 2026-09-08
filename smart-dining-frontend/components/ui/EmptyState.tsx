import React from 'react';
import { Inbox } from 'lucide-react';

export function EmptyState({ title, message, action }: { title: string; message: string; action?: React.ReactNode }) {
  return <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center"><div className="rounded-full bg-slate-100 p-3 text-slate-400"><Inbox className="h-6 w-6" /></div><h3 className="mt-4 font-semibold text-slate-900">{title}</h3><p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>{action && <div className="mt-5">{action}</div>}</div>;
}