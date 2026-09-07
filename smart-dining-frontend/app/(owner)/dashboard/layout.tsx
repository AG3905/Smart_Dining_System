'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getCookie, getStoredUser, clearAuthToken } from '@/lib/api';
import {
  LayoutDashboard,
  Grid,
  Users,
  UtensilsCrossed,
  Receipt,
  TrendingUp,
  MessageSquare,
  BookOpen,
  Settings,
  LogOut,
  Utensils,
  Loader2,
  UserCheck
} from 'lucide-react';

const ownerNavItems = [
  { name: 'Overview (Screen 8)', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Floor Plan Layout (Screen 9)', href: '/dashboard/layout', icon: Grid },
  { name: 'Queue Management (Screen 10)', href: '/dashboard/queue', icon: Users },
  { name: 'Live Orders (Screen 11)', href: '/dashboard/orders', icon: UtensilsCrossed },
  { name: 'Bills & Payments (Screen 12)', href: '/dashboard/bills', icon: Receipt },
  { name: 'Sales & Analytics (Screen 13)', href: '/dashboard/sales', icon: TrendingUp },
  { name: 'Reviews (Screen 14)', href: '/dashboard/reviews', icon: MessageSquare },
  { name: 'Menu Builder (Screen 15)', href: '/dashboard/menu', icon: BookOpen },
  { name: 'Settings (Screen 16)', href: '/dashboard/settings', icon: Settings },
];

export default function OwnerDashboardLayout({
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

    if (!token || !storedUser || (storedUser.role !== 'owner' && storedUser.role !== 'staff')) {
      clearAuthToken();
      router.push('/login');
    } else {
      setUser(storedUser);
      setCheckingAuth(false);
    }
  }, [router]);

  const handleSignOut = () => {
    clearAuthToken();
    router.push('/login');
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-100 space-y-4">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-sm font-medium text-slate-400">Verifying Owner Credentials...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Owner Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0">
        <div className="p-4 border-b border-slate-800 flex items-center space-x-3">
          <div className="p-2 bg-amber-500 rounded-lg text-white">
            <Utensils className="w-5 h-5" />
          </div>
          <div className="truncate">
            <h2 className="font-bold text-white text-sm truncate">
              {user?.restaurantName || 'Owner Console'}
            </h2>
            <p className="text-xs text-amber-400 font-medium capitalize flex items-center gap-1">
              <UserCheck className="w-3 h-3" /> {user?.name || user?.role}
            </p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {ownerNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-amber-500 text-white font-semibold shadow-sm'
                    : 'hover:bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-2 text-xs font-medium text-slate-400 hover:text-rose-400 transition w-full text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out (Screen 7)</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
