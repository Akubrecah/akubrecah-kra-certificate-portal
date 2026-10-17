import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/security',
  '/blog(.*)',
  '/articles(.*)',
  '/projects(.*)',
  '/contact(.*)',
  '/faq',
  '/about',
  '/products(.*)',
  '/retrieval-portal(.*)',
  '/terms(.*)',
  '/privacy(.*)',
  '/careers(.*)',
  '/api/public(.*)',
  '/api/health(.*)',
  '/api/projects(.*)',
  '/api/articles(.*)',
  '/api/kra(.*)',
  '/api/mpesa(.*)',
  '/api/certificate(.*)',
  '/api/generate-certificate(.*)',
  '/api/paystack(.*)',
  '/api/whatsapp(.*)',
  '/api/analytics(.*)',
  '/api/github(.*)',
  '/api/admin/magic-login(.*)'
]);

const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
  '/api/admin(.*)'
]);

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/pin-checker(.*)',
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
  // Health checks: internal monitoring and load balancers
  if (pathname.startsWith('/api/health')) {
    return { limit: 1200, windowMs: 60 * 1000, tierKey: 'health' };
  }
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

  // 6. Subdomain routing & Strict Domain Isolation
  const host = (request.headers.get('x-forwarded-host') || request.headers.get('host') || '').toLowerCase();
  const isKraSubdomain = host.startsWith('kra.') || host.includes('kra.akubrecah.com');

  // Case A: Accessing KRA routes on the main domain -> redirect to kra.akubrecah.com
  if (!isKraSubdomain) {
    if (
      pathname === '/retrieval-portal' ||
      pathname.startsWith('/retrieval-portal/') ||
      pathname === '/pin-checker' ||
      pathname.startsWith('/pin-checker/') ||
      pathname === '/filing-success' ||
      pathname.startsWith('/filing-success/') ||
      pathname === '/dashboard/filing' ||
      pathname.startsWith('/dashboard/filing/')
    ) {
      const targetUrl = new URL(pathname === '/retrieval-portal' ? '/' : pathname, 'https://kra.akubrecah.com');
      targetUrl.search = request.nextUrl.search;
      return NextResponse.redirect(targetUrl, 307);
    }
  }

  // Case B: Accessing on kra.akubrecah.com
  let response: NextResponse;
  if (isKraSubdomain) {
    // 1. Authentication Gating: User must be signed in to access the KRA portal
    const isPublicAuthRoute =
      pathname.startsWith('/sign-in') ||
      pathname.startsWith('/sign-up') ||
      pathname.startsWith('/api/') ||
      pathname.startsWith('/session-tasks') ||
      pathname.startsWith('/legal/') ||
      pathname === '/privacy' ||
      pathname === '/terms' ||
      pathname.startsWith('/favicon') ||
      pathname.startsWith('/robots') ||
      pathname.startsWith('/sitemap');

    if (!userId && !isPublicAuthRoute) {
      const signInUrl = new URL('/sign-in', request.url);
      signInUrl.searchParams.set('redirect_url', request.url);
      return NextResponse.redirect(signInUrl, 307);
    }

    // 2. Root '/' rewrites to the flagship portal hub
    if (pathname === '/') {
      response = NextResponse.rewrite(new URL('/retrieval-portal', request.url));
    }
    // 3. Clean URL: redirect '/retrieval-portal' to root '/' on the subdomain
    else if (pathname === '/retrieval-portal' || pathname === '/retrieval-portal/') {
      const cleanUrl = new URL('/', request.url);
      cleanUrl.search = request.nextUrl.search;
      return NextResponse.redirect(cleanUrl, 307);
    }
    // 4. Filing shortcut: redirect '/dashboard/filing' to root with filing view
    else if (pathname === '/dashboard/filing' || pathname === '/dashboard/filing/') {
      const filingUrl = new URL('/?view=filing', request.url);
      return NextResponse.redirect(filingUrl, 307);
    }
    // 5. Redirect marketing & agency routes back to the main domain
    else if (
      pathname.startsWith('/about') ||
      pathname.startsWith('/projects') ||
      pathname.startsWith('/articles') ||
      pathname.startsWith('/services') ||
      pathname.startsWith('/careers') ||
      pathname.startsWith('/products')
    ) {
      const agencyUrl = new URL(pathname + request.nextUrl.search, 'https://akubrecah.com');
      return NextResponse.redirect(agencyUrl, 307);
    } else {
      response = NextResponse.next();
    }
  } else {
    response = NextResponse.next();
  }

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
