import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminMagicToken } from '@/lib/magic-token';

export const maxDuration = 15;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://kra-certificate.vercel.app').replace(/\/$/, '');

  if (!token) {
    return NextResponse.redirect(`${appUrl}/admin?error=missing_token`);
  }

  const payload = verifyAdminMagicToken(token);
  if (!payload) {
    return NextResponse.redirect(`${appUrl}/admin?error=invalid_or_expired_token`);
  }

  // Create response redirecting to /admin with magic auth cookie set
  const response = NextResponse.redirect(`${appUrl}/admin`);

  // Cookie expires in 2 hours
  response.cookies.set('admin_magic_auth', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7200,
  });

  return response;
}
