'use client';

import Link from 'next/link';

export default function OwnerLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-md max-w-md w-full">
        <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full">Screen 7</span>
        <h1 className="text-2xl font-bold text-slate-900 mt-3">Restaurant Owner Login</h1>
        <p className="text-slate-600 text-sm mt-1">Access your restaurant management console.</p>

        <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1">Email</label>
            <input
              type="email"
              placeholder="owner@restaurant.com"
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <Link
            href="/dashboard"
            className="block w-full py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white font-medium text-center rounded-md transition text-sm"
          >
            Sign In to Dashboard
          </Link>
        </form>
      </div>
    </div>
  );
}
