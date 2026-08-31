'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Building2, ClipboardList, LogOut } from 'lucide-react';

const adminNavItems = [
  { name: 'Super Admin Login (Screen 17)', href: '/admin-login', icon: ShieldCheck },
  { name: 'Restaurants List (Screen 18)', href: '/restaurants', icon: Building2 },
  { name: 'Audit Log (Screen 20)', href: '/audit-log', icon: ClipboardList },
];

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

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
            <p className="text-xs text-slate-400">Platform Management System</p>
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
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
          <Link
            href="/login"
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 transition ml-4 border-l border-slate-800"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </Link>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
