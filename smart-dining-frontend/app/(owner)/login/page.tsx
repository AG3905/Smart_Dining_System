'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, setAuthToken } from '@/lib/api';
import { Utensils, AlertCircle, Loader2, ArrowRight, KeyRound } from 'lucide-react';

export default function OwnerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please fill in both email and password fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch<{ token: string; user: any }>('/api/auth/restaurant/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      });

      // Save token and user info
      setAuthToken(res.token, res.user);

      // Redirect to Screen 8 (Owner Overview Dashboard)
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl max-w-md w-full text-slate-100">

        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-amber-500 rounded-xl text-white shadow-lg shadow-amber-500/20">
            <Utensils className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold px-2.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30">
              Screen 7
            </span>
            <h1 className="text-xl font-bold text-white mt-1">Restaurant Staff Login</h1>
            <p className="text-slate-400 text-xs">Owner & Operations Portal</p>
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
              Staff / Owner Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@labellaitalia.com"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
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
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:opacity-50 text-white font-semibold rounded-lg transition text-sm flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Accounts Quick-Fill Helper */}
        <div className="mt-6 border-t border-slate-700/80 pt-4">
          <div className="flex items-center space-x-1.5 text-xs text-slate-400 mb-2">
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-medium">Quick Demo Accounts (Password: Password123!):</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fillDemoAccount('owner@labellaitalia.com')}
              className="text-xs bg-slate-900 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded border border-slate-700 transition"
            >
              La Bella Owner
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('owner@tokyosushibar.com')}
              className="text-xs bg-slate-900 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded border border-slate-700 transition"
            >
              Tokyo Sushi Owner
            </button>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-xs text-slate-400 hover:text-slate-200 transition">
            ← Return to Landing Page (Screen 21)
          </Link>
        </div>

      </div>
    </div>
  );
}
