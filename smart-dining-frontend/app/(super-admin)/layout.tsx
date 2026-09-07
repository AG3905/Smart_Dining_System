'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getCookie, getStoredUser, clearAuthToken } from '@/lib/api';
import { ShieldCheck, Building2, ClipboardList, LogOut, Loader2, ShieldAlert } from 'lucide-react';

const adminNavItems = [
  { name: 'Restaurants Directory (Screen 18)', href: '/restaurants', icon: Building2 },
  { name: 'System Audit Log (Screen 20)', href: '/audit-log', icon: ClipboardList },
];

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const token = getCookie('auth_token') || getCookie('token');
    const storedUser = getStoredUser();

    if (!token || !storedUser || storedUser.role !== 'super_admin') {
      clearAuthToken();
      router.push('/admin-login');
    } else {
      setUser(storedUser);
      setCheckingAuth(false);
    }
  }, [router]);

  const handleSignOut = () => {
    clearAuthToken();
    router.push('/admin-login');
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 space-y-4">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-sm font-medium text-slate-400">Verifying Super Admin Session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
      {/* Super Admin Top Header Navigation */}
      <header className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-600 rounded-lg text-white">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base">Super Admin Console</h1>
            <p className="text-xs text-indigo-400 flex items-center gap-1 font-mono">
              <ShieldAlert className="w-3 h-3" /> {user?.name || 'Super Admin'} ({user?.email})
            </p>
          </div>
        </div>

        <nav className="flex items-center space-x-2">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-xs font-medium transition ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}

          <button
            onClick={handleSignOut}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 transition ml-4 border-l border-slate-800"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out (Screen 17)</span>
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
