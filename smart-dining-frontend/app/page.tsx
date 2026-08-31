'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { Activity, CheckCircle2, AlertCircle, RefreshCw, ExternalLink, Shield, Store, User } from 'lucide-react';

export default function LandingPage() {
  const [healthStatus, setHealthStatus] = useState<{ status?: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ status: string }>('/api/health');
      setHealthStatus(res);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend server');
      setHealthStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header & Health Check Section */}
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 p-6 rounded-2xl shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                Screen 21 (Landing Page)
              </span>
              <h1 className="text-3xl font-extrabold text-white mt-2">Smart Dining Platform</h1>
              <p className="text-slate-400 text-sm mt-1">
                Integrated solution for Customers, Restaurant Owners, and Super Admins.
              </p>
            </div>

            <div className="flex items-center space-x-3 bg-slate-900/90 px-4 py-3 rounded-xl border border-slate-700 w-full md:w-auto">
              <Activity className="w-5 h-5 text-indigo-400 shrink-0" />
              <div>
                <div className="text-xs text-slate-400 font-medium">Backend Health Check</div>
                <div className="flex items-center space-x-2 mt-0.5">
                  {loading && (
                    <span className="flex items-center text-xs text-amber-400 font-medium">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" /> Connecting...
                    </span>
                  )}
                  {!loading && healthStatus && (
                    <span className="flex items-center text-xs text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Status: {JSON.stringify(healthStatus)}
                    </span>
                  )}
                  {!loading && error && (
                    <span className="flex items-center text-xs text-rose-400 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 mr-1" /> Error
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={checkHealth}
                className="ml-auto p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
                title="Retry Connection"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg text-xs font-mono">
              Backend Error: {error}. Ensure smart-dining-backend is running on http://localhost:4000
            </div>
          )}
        </div>

        {/* Screen Inventory Navigation Directory */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Screen Inventory Route Index</span>
            <span className="text-xs font-normal text-slate-400 px-2 py-0.5 bg-slate-800 rounded-md border border-slate-700">
              21 Placeholder Screens
            </span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Customer Portal (Screens 1 - 6) */}
            <div className="bg-slate-800 border border-slate-700/80 rounded-xl p-5 space-y-3">
              <div className="flex items-center space-x-2 text-sky-400 font-semibold text-sm border-b border-slate-700 pb-3">
                <User className="w-4 h-4" />
                <span>Customer Portal (Screens 1 - 6)</span>
              </div>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/book/rest-1" className="flex items-center justify-between text-slate-300 hover:text-sky-300 hover:underline">
                    <span>Screen 1: Book Table</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </Link>
                </li>
                <li>
                  <Link href="/booking/bk-101/confirmation" className="flex items-center justify-between text-slate-300 hover:text-sky-300 hover:underline">
                    <span>Screen 2: Confirmation</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </Link>
                </li>
                <li>
                  <Link href="/booking/bk-101/queue" className="flex items-center justify-between text-slate-300 hover:text-sky-300 hover:underline">
                    <span>Screen 3: Queue Status</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </Link>
                </li>
                <li>
                  <Link href="/booking/bk-101/menu" className="flex items-center justify-between text-slate-300 hover:text-sky-300 hover:underline">
                    <span>Screen 4: Digital Menu</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </Link>
                </li>
                <li>
                  <Link href="/booking/bk-101/cart" className="flex items-center justify-between text-slate-300 hover:text-sky-300 hover:underline">
                    <span>Screen 5: Food Cart</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </Link>
                </li>
                <li>
                  <Link href="/booking/bk-101/checkout" className="flex items-center justify-between text-slate-300 hover:text-sky-300 hover:underline">
                    <span>Screen 6: Checkout</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </Link>
                </li>
              </ul>
            </div>

            {/* Owner Portal (Screens 7 - 16) */}
            <div className="bg-slate-800 border border-slate-700/80 rounded-xl p-5 space-y-3">
              <div className="flex items-center space-x-2 text-amber-400 font-semibold text-sm border-b border-slate-700 pb-3">
                <Store className="w-4 h-4" />
                <span>Owner Portal (Screens 7 - 16)</span>
              </div>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/login" className="flex items-center justify-between text-slate-300 hover:text-amber-300 hover:underline">
                    <span>Screen 7: Owner Login</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="flex items-center justify-between text-slate-300 hover:text-amber-300 hover:underline">
                    <span>Screen 8: Dashboard Overview</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/layout" className="flex items-center justify-between text-slate-300 hover:text-amber-300 hover:underline">
                    <span>Screen 9: Floor Plan Layout</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/queue" className="flex items-center justify-between text-slate-300 hover:text-amber-300 hover:underline">
                    <span>Screen 10: Queue Mgmt</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/orders" className="flex items-center justify-between text-slate-300 hover:text-amber-300 hover:underline">
                    <span>Screen 11: Live Orders</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/bills" className="flex items-center justify-between text-slate-300 hover:text-amber-300 hover:underline">
                    <span>Screen 12: Bills & Payments</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/sales" className="flex items-center justify-between text-slate-300 hover:text-amber-300 hover:underline">
                    <span>Screen 13: Sales Analytics</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/reviews" className="flex items-center justify-between text-slate-300 hover:text-amber-300 hover:underline">
                    <span>Screen 14: Customer Reviews</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/menu" className="flex items-center justify-between text-slate-300 hover:text-amber-300 hover:underline">
                    <span>Screen 15: Menu Builder</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/settings" className="flex items-center justify-between text-slate-300 hover:text-amber-300 hover:underline">
                    <span>Screen 16: Settings</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </Link>
                </li>
              </ul>
            </div>

            {/* Super-Admin Portal (Screens 17 - 20) */}
            <div className="bg-slate-800 border border-slate-700/80 rounded-xl p-5 space-y-3">
              <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-sm border-b border-slate-700 pb-3">
                <Shield className="w-4 h-4" />
                <span>Super Admin (Screens 17 - 20)</span>
              </div>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/admin-login" className="flex items-center justify-between text-slate-300 hover:text-indigo-300 hover:underline">
                    <span>Screen 17: Admin Login</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </Link>
                </li>
                <li>
                  <Link href="/restaurants" className="flex items-center justify-between text-slate-300 hover:text-indigo-300 hover:underline">
                    <span>Screen 18: All Restaurants</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </Link>
                </li>
                <li>
                  <Link href="/restaurants/sample-rest-id" className="flex items-center justify-between text-slate-300 hover:text-indigo-300 hover:underline">
                    <span>Screen 19: Restaurant Detail</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </Link>
                </li>
                <li>
                  <Link href="/audit-log" className="flex items-center justify-between text-slate-300 hover:text-indigo-300 hover:underline">
                    <span>Screen 20: Audit Log</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </Link>
                </li>
              </ul>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
