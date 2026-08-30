import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Add paths that do not require authentication
const publicPaths = ['/login', '/favicon.ico', '/api/auth'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the current path is public
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check for the auth token cookie
  const token = request.cookies.get('spatial_auth_token');

  // If no token, redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Apply middleware to all routes except standard static files and Next.js internals
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     */
    '/((?!_next/static|_next/image).*)',
  ],
};
