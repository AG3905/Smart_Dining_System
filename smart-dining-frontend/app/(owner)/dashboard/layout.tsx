'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getCookie, getStoredUser, clearAuthToken } from '@/lib/api';
import { LayoutDashboard, Grid3X3, Users, UtensilsCrossed, Receipt, TrendingUp, MessageSquare, BookOpen, Settings, LogOut, Utensils, Loader2, UserCheck, Menu, X } from 'lucide-react';

const ownerNavItems = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Floor Plan', href: '/dashboard/layout', icon: Grid3X3 },
  { name: 'Queue', href: '/dashboard/queue', icon: Users },
  { name: 'Live Orders', href: '/dashboard/orders', icon: UtensilsCrossed },
  { name: 'Bills & Payments', href: '/dashboard/bills', icon: Receipt },
  { name: 'Sales Analytics', href: '/dashboard/sales', icon: TrendingUp },
  { name: 'Reviews', href: '/dashboard/reviews', icon: MessageSquare },
  { name: 'Menu Builder', href: '/dashboard/menu', icon: BookOpen },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function OwnerDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const token = getCookie('auth_token') || getCookie('token');
    const storedUser = getStoredUser();
    if (!token || !storedUser || (storedUser.role !== 'owner' && storedUser.role !== 'staff')) {
      clearAuthToken(); router.push('/login');
    } else { setUser(storedUser); setCheckingAuth(false); }
  }, [router]);

  if (checkingAuth) return <div className="flex min-h-screen items-center justify-center bg-slate-50"><Loader2 className="h-7 w-7 animate-spin text-amber-500" /></div>;
  const signOut = () => { clearAuthToken(); router.push('/login'); };

  return <div className="portal-shell flex">
    <button aria-label="Open navigation" onClick={() => setMobileOpen(!mobileOpen)} className="fixed left-4 top-4 z-50 rounded-xl bg-white p-2.5 text-slate-700 shadow-md lg:hidden">{mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
    {mobileOpen && <div onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 bg-slate-900/20 lg:hidden" />}
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5"><div className="rounded-xl bg-amber-500 p-2.5 text-white"><Utensils className="h-5 w-5" /></div><div className="min-w-0"><p className="truncate font-bold text-slate-900">{user?.restaurantName || 'Smart Dining'}</p><p className="flex items-center gap-1 text-xs font-medium text-amber-600"><UserCheck className="h-3 w-3" /> {user?.name || user?.role}</p></div></div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">{ownerNavItems.map(({ name, href, icon: Icon }) => { const active = pathname === href; return <Link onClick={() => setMobileOpen(false)} key={href} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? 'bg-amber-50 text-amber-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}><Icon className={`h-4 w-4 ${active ? 'text-amber-600' : ''}`} />{name}</Link>; })}</nav>
      <div className="border-t border-slate-100 p-4"><button onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600"><LogOut className="h-4 w-4" /> Sign out</button></div>
    </aside>
    <main className="min-w-0 flex-1"><header className="flex h-20 items-center justify-end border-b border-slate-200 bg-white px-6 lg:px-10"><div className="text-right"><p className="text-sm font-semibold text-slate-900">{user?.name || 'Team member'}</p><p className="text-xs capitalize text-slate-500">{user?.role || 'Restaurant team'}</p></div><div className="ml-3 rounded-full bg-amber-100 px-3 py-2 text-sm font-bold text-amber-700">{(user?.name || 'S').charAt(0).toUpperCase()}</div></header><div className="p-5 sm:p-8 lg:p-10">{children}</div></main>
  </div>;
}
