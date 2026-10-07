import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { initializePaystackTransaction } from '@/lib/paystack';
import { getOrCreateDbUser, isAdminUser } from '@/lib/subscription';

export const maxDuration = 15;

const DEFAULT_DOWNLOAD_FEE = 20;

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please sign in to continue.' },
        { status: 401 }
      );
    }

    // Admin users never need to pay — reject payment attempts.
    const adminCheck = await isAdminUser(userId);
    if (adminCheck) {
      return NextResponse.json(
        { success: false, error: 'Admin accounts have full access and do not require payment.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { type = 'pay_per_download', pin, callbackUrl } = body;

    // Monthly subscriptions have been decommissioned in favor of a single transparent KES 20 fee
    if (type === 'subscription') {
      return NextResponse.json(
        { success: false, error: 'Monthly subscriptions are discontinued. KRA certificate retrieval is now only KES 20 per download.' },
        { status: 400 }
      );
    }

    if (!pin) {
      return NextResponse.json(
        { success: false, error: 'KRA PIN is required for certificate download payment.' },
        { status: 400 }
      );
    }

    // Resolve user email and full name from Clerk
    let userEmail = 'user@akubrecah.co.ke';
    let userName = 'Customer';
    try {
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(userId);
      userEmail = clerkUser.primaryEmailAddress?.emailAddress || userEmail;
      userName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || userName;
    } catch (e: any) {
      console.warn('[Paystack Initialize] Clerk user fetch fallback:', e.message);
    }

    // Ensure user exists in Prisma database
    const dbUser = await getOrCreateDbUser(userId, userEmail, userName);

    const amountKes = Number(process.env.PAYSTACK_DOWNLOAD_FEE_KES) || DEFAULT_DOWNLOAD_FEE;
    const reference = `PSTK-CERT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin || 'http://localhost:3000';
    const finalCallbackUrl = callbackUrl || `${appUrl}/?paystack_ref=${reference}&type=${type}`;

    const result = await initializePaystackTransaction({
      email: userEmail,
      amountKes,
      reference,
      callbackUrl: finalCallbackUrl,
      metadata: {
        userId: dbUser?.id || userId,
        clerkId: userId,
        type,
        pin: pin ? String(pin).toUpperCase().trim() : null,
        amountKes,
        customerName: userName,
      },
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to initialize Paystack checkout.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      authorizationUrl: result.authorizationUrl,
      accessCode: result.accessCode,
      reference: result.reference,
      amountKes,
      type,
    });
  } catch (error: any) {
    console.error('[Paystack Initialize] Error:', error.message);
    return NextResponse.json(
      { success: false, error: 'Internal server error initializing payment.' },
      { status: 500 }
    );
  }
}
