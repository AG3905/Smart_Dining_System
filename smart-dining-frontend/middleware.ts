import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value || request.cookies.get('token')?.value;

  // Protect Owner Dashboard (Screens 8 - 16)
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect Super Admin Portal (Screens 18 - 20)
  if (pathname.startsWith('/restaurants') || pathname.startsWith('/audit-log')) {
    if (!token) {
      const adminLoginUrl = new URL('/admin-login', request.url);
      adminLoginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(adminLoginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/restaurants/:path*',
    '/audit-log/:path*',
  ],
};
