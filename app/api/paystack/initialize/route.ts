import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { initializePaystackTransaction } from '@/lib/paystack';
import { getOrCreateDbUser } from '@/lib/subscription';

export const maxDuration = 15;

const DEFAULT_SUBSCRIPTION_AMOUNT = 499;
const DEFAULT_DOWNLOAD_FEE = 30;

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please sign in to continue.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { type = 'pay_per_download', pin, callbackUrl } = body;

    if (type !== 'subscription' && type !== 'pay_per_download') {
      return NextResponse.json(
        { success: false, error: 'Invalid payment type. Must be "subscription" or "pay_per_download".' },
        { status: 400 }
      );
    }

    if (type === 'pay_per_download' && !pin) {
      return NextResponse.json(
        { success: false, error: 'PIN is required for single certificate download payment.' },
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

    const subscriptionAmount = Number(process.env.PAYSTACK_SUBSCRIPTION_AMOUNT_KES) || DEFAULT_SUBSCRIPTION_AMOUNT;
    const downloadFee = Number(process.env.PAYSTACK_DOWNLOAD_FEE_KES) || DEFAULT_DOWNLOAD_FEE;
    const amountKes = type === 'subscription' ? subscriptionAmount : downloadFee;

    const reference = `PSTK-${type.toUpperCase().substring(0, 4)}-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

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
