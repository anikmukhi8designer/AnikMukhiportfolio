
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = process.env.JWT_SECRET_KEY || 'default-dev-secret-key-change-me-at-least-32-chars';
const key = new TextEncoder().encode(SECRET_KEY);

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  
  const isAdminPath = path.startsWith('/admin');
  const isSuperAdminPath = path.startsWith('/admin/super');
  const isLoginPath = path === '/admin/login';
  const isResetRequestPath = path === '/admin/forgot-password';

  const token = req.cookies.get('admin_session')?.value;
  let session: any = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, key);
      session = payload;
    } catch (e) {
      // Invalid token
    }
  }

  // 1. Redirect to Dashboard if already logged in
  if (isLoginPath && session) {
    if (session.is_temp_password) {
        return NextResponse.redirect(new URL('/admin/change-password', req.url));
    }
    return NextResponse.redirect(new URL('/admin/dashboard', req.url));
  }

  // 2. Redirect to Login if accessing admin without session
  if (isAdminPath && !isLoginPath && !isResetRequestPath && !session) {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  // 3. Force Password Change
  if (session && session.is_temp_password && path !== '/admin/change-password' && !path.startsWith('/api/')) {
    return NextResponse.redirect(new URL('/admin/change-password', req.url));
  }

  // 4. Role Based Access
  if (isSuperAdminPath && session?.role !== 'super_admin') {
    return NextResponse.redirect(new URL('/admin/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
