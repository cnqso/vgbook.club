import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

// Force middleware to run in Node.js runtime instead of Edge runtime
export const runtime = 'nodejs';

export function middleware(request: NextRequest) {
  // Check if the request is for a protected route
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    console.log('Middleware: Checking dashboard access for:', request.nextUrl.pathname);
    const token = request.cookies.get('auth-token')?.value;
    console.log('Middleware: Token present:', !!token);
    
    if (!token) {
      console.log('Middleware: No token, redirecting to home');
      return NextResponse.redirect(new URL('/', request.url));
    }

    const user = verifyToken(token);
    console.log('Middleware: Token verification result:', !!user);
    if (!user) {
      console.log('Middleware: Invalid token, redirecting to home');
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    console.log('Middleware: Access granted for user:', user.username);
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/dashboard/:path*',
};
