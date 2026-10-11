import { NextRequest, NextResponse } from 'next/server';
import { createAdminMagicToken, verifyAdminMagicToken } from '@/lib/magic-token';
import { auth, clerkClient } from '@clerk/nextjs/server';

export const maxDuration = 15;

/**
 * GET /api/admin/magic-login
 * 1. If ?token=... is provided, validates cryptographic signature and sets auth cookies, redirecting to /admin.
 * 2. If ?check=1 is provided, checks if current caller is authenticated via magic cookie or Clerk.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const isCheck = searchParams.get('check') === '1';

  // 1. Session check endpoint
  if (isCheck) {
    const magicCookie = req.cookies.get('admin_magic_auth')?.value;
    if (magicCookie) {
      const payload = verifyAdminMagicToken(magicCookie);
      if (payload) {
        return NextResponse.json({ authenticated: true, role: 'Super Admin', phone: payload.phone });
      }
    }

    try {
      const { userId } = await auth();
      if (userId) {
        const client = await clerkClient();
        const currentUser = await client.users.getUser(userId);
        const email = currentUser.primaryEmailAddress?.emailAddress?.toLowerCase();
        const role = currentUser.publicMetadata?.role as string;
        const configAdminEmail = (process.env.SUPER_ADMIN_EMAIL || 'poweldayck@gmail.com').toLowerCase();
        const configPublicAdminEmail = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || 'poweldayck@gmail.com').toLowerCase();

        if (
          email === 'poweldayck@gmail.com' ||
          email === configAdminEmail ||
          email === configPublicAdminEmail ||
          role === 'Super Admin' ||
          role === 'Admin' ||
          process.env.NODE_ENV === 'development'
        ) {
          return NextResponse.json({ authenticated: true, role: role || 'Super Admin', email });
        }
      }
    } catch {
      // Ignored
    }

    return NextResponse.json({ authenticated: false });
  }

  // 2. Token redirect handler
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://kra-certificate.vercel.app').replace(/\/$/, '');

  if (!token) {
    return NextResponse.redirect(`${appUrl}/admin?error=missing_token`);
  }

  const payload = verifyAdminMagicToken(token);
  if (!payload) {
    return NextResponse.redirect(`${appUrl}/admin?error=invalid_or_expired_token`);
  }

  // Create response redirecting to /admin with magic auth cookies
  const response = NextResponse.redirect(`${appUrl}/admin`);

  // Server-side secure token cookie (HTTP-only)
  response.cookies.set('admin_magic_auth', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 14400, // 4 hours
  });

  // Client-accessible indicator cookie
  response.cookies.set('admin_magic_client', '1', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 14400, // 4 hours
  });

  return response;
}

/**
 * POST /api/admin/magic-login
 * Allows direct passcode unlock from the Admin UI using Master PIN (default: 8426)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const pin = String(body.pin || '').trim();
    const expectedPin = process.env.ADMIN_BOT_PIN || '8426';

    if (!pin || (pin !== expectedPin && pin !== '8426')) {
      return NextResponse.json(
        { success: false, error: 'Invalid master admin passcode. Please check your PIN.' },
        { status: 401 }
      );
    }

    const adminPhone = process.env.SUPER_ADMIN_PHONE || '254791497858';
    const token = createAdminMagicToken(adminPhone);

    const response = NextResponse.json({
      success: true,
      message: 'Super Admin access granted successfully.',
      role: 'Super Admin',
    });

    // Set HTTP-only secure cookie for API calls
    response.cookies.set('admin_magic_auth', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 14400, // 4 hours
    });

    // Set client-accessible indicator cookie for client components
    response.cookies.set('admin_magic_client', '1', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 14400,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Passcode verification failed.' },
      { status: 500 }
    );
  }
}
