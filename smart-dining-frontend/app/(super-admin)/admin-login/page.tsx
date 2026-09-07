'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, setAuthToken } from '@/lib/api';
import { ShieldCheck, AlertCircle, Loader2, ArrowRight, KeyRound } from 'lucide-react';

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please provide both admin email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch<{ token: string; user: any }>('/api/auth/super-admin/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      });

      // Store JWT token & admin user session
      setAuthToken(res.token, res.user);

      // Redirect to Screen 18 (All Restaurants Management)
      router.push('/restaurants');
    } catch (err: any) {
      setError(err.message || 'Invalid admin credentials. Access denied.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAdmin = () => {
    setEmail('admin@smartdining.com');
    setPassword('Password123!');
    setError(null);
  };

  return (
    <div className="max-w-md mx-auto my-12 bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl text-slate-100">

      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-600/30">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <span className="text-xs font-semibold px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
            Screen 17
          </span>
          <h1 className="text-xl font-bold text-white mt-1">Super Admin Authentication</h1>
          <p className="text-slate-400 text-xs">Platform Governance Portal</p>
        </div>
      </div>

      {/* Inline Error Banner */}
      {error && (
        <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-start space-x-2.5 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {/* Login Form */}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
            Super Admin Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@smartdining.com"
            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg transition text-sm flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying Super Admin...</span>
            </>
          ) : (
            <>
              <span>Authenticate Super Admin</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Demo Account Helper */}
      <div className="mt-6 border-t border-slate-700/80 pt-4 flex items-center justify-between">
        <div className="flex items-center space-x-1.5 text-xs text-slate-400">
          <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
          <span>Demo Account:</span>
        </div>
        <button
          type="button"
          onClick={fillDemoAdmin}
          className="text-xs bg-slate-900 hover:bg-slate-700 text-indigo-300 px-3 py-1 rounded border border-slate-700 transition font-mono"
        >
          admin@smartdining.com
        </button>
      </div>

      {/* Return Link */}
      <div className="mt-6 text-center">
        <Link href="/" className="text-xs text-slate-400 hover:text-slate-200 transition">
          ← Return to Landing Page (Screen 21)
        </Link>
      </div>

    </div>
  );
}
