'use client';

import Link from 'next/link';

export default function SuperAdminLoginPage() {
  return (
    <div className="max-w-md mx-auto my-12 bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-xl">
      <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
        Screen 17
      </span>
      <h1 className="text-2xl font-bold text-white mt-3">Super Admin Login</h1>
      <p className="text-slate-400 text-sm mt-1">Platform administration authentication portal.</p>

      <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">Admin Email</label>
          <input
            type="email"
            placeholder="admin@smartdining.com"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">Secure Password</label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <Link
          href="/restaurants"
          className="block w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-center rounded-md transition text-sm shadow-md"
        >
          Authenticate Super Admin
        </Link>
      </form>
    </div>
  );
}
