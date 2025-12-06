
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = process.env.JWT_SECRET_KEY || 'default-dev-secret-key-change-me';
const key = new TextEncoder().encode(SECRET_KEY);

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  
  // 1. Define Protected Paths
  const isAdminPath = path.startsWith('/admin');
  const isSuperAdminPath = path.startsWith('/admin/super');
  const isLoginPath = path === '/admin/login';
  const isResetRequestPath = path === '/admin/forgot-password';

  // 2. Get Token
  const token = req.cookies.get('admin_session')?.value;

  // 3. Verify Token
  let session = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, key);
      session = payload;
    } catch (e) {
      // Invalid token
    }
  }

  // 4. Redirect Logic
  
  // If trying to access login while logged in
  if (isLoginPath && session) {
    if (session.is_temp_password) {
        return NextResponse.redirect(new URL('/admin/change-password', req.url));
    }
    return NextResponse.redirect(new URL('/admin/dashboard', req.url));
  }

  // If trying to access protected route without session
  if (isAdminPath && !isLoginPath && !isResetRequestPath && !session) {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  // Force Password Change Check
  if (session && session.is_temp_password && path !== '/admin/change-password' && path !== '/api/auth/change-password') {
    return NextResponse.redirect(new URL('/admin/change-password', req.url));
  }

  // Role Based Access Control
  if (isSuperAdminPath && session?.role !== 'super_admin') {
    return NextResponse.redirect(new URL('/admin/dashboard', req.url)); // Access Denied
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
