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
  '/products(.*)',
  '/retrieval-portal(.*)',
  '/pin-checker(.*)',
  '/terms(.*)',
  '/privacy(.*)',
  '/careers(.*)',
  '/api/public(.*)',
  '/api/kra(.*)',
  '/api/mpesa(.*)',
  '/api/certificate(.*)',
  '/api/generate-certificate(.*)',
  '/api/paystack(.*)',
  '/api/whatsapp(.*)',
  '/api/analytics(.*)',
  '/api/admin/magic-login(.*)'
]);

const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
  '/api/admin(.*)'
]);

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/onboarding(.*)',
  '/checkout(.*)',
  '/filing-success(.*)',
  '/api/user(.*)'
]);

const BLOCKED_SCANNERS = [/sqlmap/i, /nikto/i, /nessus/i, /dirbuster/i, /acunetix/i, /havij/i];
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'poweldayck@gmail.com';

// Memory-safe bounded LRU rate limiter with automatic TTL pruning
interface RateBucket {
  count: number;
  resetAt: number;
}

const MAX_BUCKETS = 5000;
const rateBuckets = new Map<string, RateBucket>();

function getTierLimit(pathname: string): { limit: number; windowMs: number; tierKey: string } {
  // Strictest tier: Financial triggers, browser automation, and file uploads
  if (
    pathname.startsWith('/api/mpesa/stkpush') ||
    pathname.startsWith('/api/kra/nil-return') ||
    pathname.startsWith('/api/kra/upload-id')
  ) {
    return { limit: 10, windowMs: 60 * 1000, tierKey: 'strict' };
  }
  // Lookup / verification tier: 30 requests/minute
  if (
    pathname.startsWith('/api/kra/retrieve') ||
    pathname.startsWith('/api/kra/live-verify') ||
    pathname.startsWith('/api/kra/captcha')
  ) {
    return { limit: 30, windowMs: 60 * 1000, tierKey: 'lookup' };
  }
  // General API tier: 100 requests/minute
  return { limit: 100, windowMs: 60 * 1000, tierKey: 'general' };
}

function checkRateLimit(ip: string, pathname: string): { allowed: boolean; limit: number; remaining: number; resetSec: number } {
  const now = Date.now();
  const { limit, windowMs, tierKey } = getTierLimit(pathname);
  const key = `${ip}:${tierKey}`;

  // Periodic pruning of expired entries to prevent monotonic memory leaks
  if (rateBuckets.size > 1000) {
    for (const [k, b] of rateBuckets.entries()) {
      if (now > b.resetAt) {
        rateBuckets.delete(k);
      }
    }
  }

  // Bounded LRU eviction: strictly enforce upper memory bound
  if (rateBuckets.size >= MAX_BUCKETS) {
    const oldestKey = rateBuckets.keys().next().value;
    if (oldestKey) rateBuckets.delete(oldestKey);
  }

  const bucket = rateBuckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    const resetAt = now + windowMs;
    rateBuckets.set(key, { count: 1, resetAt });
    return { allowed: true, limit, remaining: limit - 1, resetSec: Math.ceil(windowMs / 1000) };
  }

  bucket.count++;
  const remaining = Math.max(0, limit - bucket.count);
  const resetSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  return { allowed: bucket.count <= limit, limit, remaining, resetSec };
}

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;
  const isTaskRoute = pathname.startsWith('/session-tasks');

  // 1. Clerk Authentication Protection
  if (isProtectedRoute(request) && !isTaskRoute) {
    await auth.protect();
  }

  const { userId } = await auth();

  // 2. Redirect signed-in users away from auth pages
  if (userId && (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up'))) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || '';

  // 3. Block known vulnerability scanners
  if (BLOCKED_SCANNERS.some(p => p.test(userAgent))) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // 4. Rate limiting for API routes with standard headers
  let rateLimitHeaders: Record<string, string> | null = null;
  if (pathname.startsWith('/api/')) {
    const rate = checkRateLimit(ip, pathname);
    rateLimitHeaders = {
      'X-RateLimit-Limit': String(rate.limit),
      'X-RateLimit-Remaining': String(rate.remaining),
      'X-RateLimit-Reset': String(rate.resetSec),
    };

    if (!rate.allowed) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests. Please slow down and try again later.',
          retryAfterSeconds: rate.resetSec,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(rate.resetSec),
            ...rateLimitHeaders,
          },
        }
      );
    }
  }

  // 5. Path traversal protection
  if (pathname.includes('..') || pathname.includes('%2e')) {
    return new NextResponse('Bad Request', { status: 400 });
  }

  const response = NextResponse.next();
  if (rateLimitHeaders) {
    for (const [headerKey, headerVal] of Object.entries(rateLimitHeaders)) {
      response.headers.set(headerKey, headerVal);
    }
  }
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
