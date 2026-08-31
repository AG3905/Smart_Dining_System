'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Utensils
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

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Owner Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
        <div className="p-4 border-b border-slate-800 flex items-center space-x-3">
          <div className="p-2 bg-amber-500 rounded-lg text-white">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm">Owner Console</h2>
            <p className="text-xs text-slate-400">Smart Dining Portal</p>
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
          <Link
            href="/login"
            className="flex items-center space-x-2 text-xs font-medium text-slate-400 hover:text-rose-400 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out (Screen 7)</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
