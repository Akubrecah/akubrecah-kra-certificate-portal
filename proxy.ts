import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/security',
  '/blog(.*)',
  '/faq',
  '/about',
  '/terms(.*)',
  '/privacy(.*)',
  '/careers(.*)',
  '/api/public(.*)'
]);

const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
  '/api/admin(.*)'
]);

const isProtectedRoute = createRouteMatcher([
  '/admin(.*)',
  '/dashboard(.*)',
  '/retrieval-portal(.*)',
  '/onboarding(.*)',
  '/api/admin(.*)',
  '/api/user(.*)'
]);

const BLOCKED_SCANNERS = [/sqlmap/i, /nikto/i, /nessus/i, /dirbuster/i, /acunetix/i, /havij/i];
const SUPER_ADMIN_EMAIL = 'poweldayck@gmail.com';

// Simple in-memory rate limiter for edge
const rateBuckets = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 100;
const RATE_WINDOW_MS = 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  bucket.count++;
  return bucket.count <= RATE_LIMIT;
}

export default clerkMiddleware(async (auth, request) => {
  const { userId, sessionClaims, redirectToSignIn, sessionStatus } = await auth({ 
    treatPendingAsSignedOut: false 
  });
  const { pathname } = request.nextUrl;
  
  const isTaskRoute = pathname.startsWith('/session-tasks');

  // 1. Clerk Authentication Protection
  // If not signed in AND not pending, redirect to sign-in for protected routes
  if (!userId && sessionStatus !== 'pending' && isProtectedRoute(request)) {
    return redirectToSignIn({ returnBackUrl: request.url });
  }

  // 2. Allow session task routes if authenticated or pending
  if (isTaskRoute && (userId || sessionStatus === 'pending')) {
    return NextResponse.next();
  }

  // 2. Admin Route Authentication (Fine-grained role check happens in Layout)
  if (userId && isAdminRoute(request)) {
    // We allow the request to proceed to the page/layout
    // The AdminLayout (app/admin/layout.tsx) will do the final isAdminUser check
    // using the full Clerk User object which is more reliable than sessionClaims.
    return NextResponse.next();
  }

  // 3. Redirect signed-in users away from auth pages
  if (userId && (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up'))) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || '';

  // 4. Block known vulnerability scanners
  if (BLOCKED_SCANNERS.some(p => p.test(userAgent))) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // 5. Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    if (!checkRateLimit(ip)) {
      return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': '60' },
      });
    }
  }

  // 6. Path traversal protection
  if (pathname.includes('..') || pathname.includes('%2e')) {
    return new NextResponse('Bad Request', { status: 400 });
  }

  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  return response;
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/:path*',
  ],
};
