import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher([
  '/admin(.*)', 
  '/retrieval(.*)', 
  '/api/admin(.*)',
  '/careers(.*)'
]);

const BLOCKED_SCANNERS = [/sqlmap/i, /nikto/i, /nessus/i, /dirbuster/i, /acunetix/i, /havij/i];

// Simple in-memory rate limiter for edge (resets on cold start)
const rateBuckets = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 100; // requests per window
const RATE_WINDOW_MS = 60 * 1000; // 1 minute

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

function cleanupBuckets() {
  const now = Date.now();
  for (const [key, bucket] of rateBuckets.entries()) {
    if (now > bucket.resetAt + RATE_WINDOW_MS) {
      rateBuckets.delete(key);
    }
  }
}

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;
  
  // 1. Clerk Authentication Protection
  if (isProtectedRoute(request)) {
    await auth.protect();
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || '';

  // 2. Block known vulnerability scanners
  if (BLOCKED_SCANNERS.some(p => p.test(userAgent))) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // 3. Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    if (!checkRateLimit(ip)) {
      return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
        },
      });
    }
  }

  // 4. Path traversal protection
  if (pathname.includes('..') || pathname.includes('%2e')) {
    return new NextResponse('Bad Request', { status: 400 });
  }

  // 5. Create response with security headers
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // CORS for API routes
  if (pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'https://akubrecahentertainment.com',
      'https://www.akubrecahentertainment.com',
    ];

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-HMAC-Signature, X-Timestamp, X-API-Key');
    response.headers.set('Access-Control-Max-Age', '86400');

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: response.headers });
    }
  }

  // Periodic cleanup
  if (Math.random() < 0.01) {
    cleanupBuckets();
  }

  return response;
});

export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
    // Match admin routes
    '/admin/:path*',
    // Match main app routes
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

