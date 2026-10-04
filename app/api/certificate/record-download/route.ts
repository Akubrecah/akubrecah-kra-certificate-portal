import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export const maxDuration = 10;

/**
 * POST /api/certificate/record-download
 *
 * Records a certificate download after a confirmed payment or via active subscription.
 * Returns a one-time downloadToken that the generate-certificate route validates.
 *
 * Body:
 *   - pin: string           — the KRA PIN being downloaded
 *   - checkoutId?: string   — Daraja CheckoutRequestID (required for pay_per_download)
 *   - subscriptionId?: string — active subscription id (required for subscription type)
 *   - downloadType: 'subscription' | 'pay_per_download'
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { pin, checkoutId, subscriptionId, downloadType } = body;

    if (!pin || !downloadType) {
      return NextResponse.json({ success: false, error: 'pin and downloadType are required' }, { status: 400 });
    }

    const db = prisma as any;

    // 1. Resolve DB user
    const dbUser = await db.users?.findFirst({ where: { clerkId: userId } });
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User record not found. Please complete your profile.' }, { status: 404 });
    }

    const now = new Date();

    // 2. Validate access type server-side — never trust client
    if (downloadType === 'subscription') {
      const activeSub = await db.subscriptions?.findFirst({
        where: {
          userId: dbUser.id,
          status: 'active',
          expiresAt: { gt: now },
        },
      });
      if (!activeSub) {
        return NextResponse.json({ success: false, error: 'No active subscription found.' }, { status: 403 });
      }

      // Record the subscription download
      const record = await db.certificateDownload?.create({
        data: {
          userId: dbUser.id,
          clerkId: userId,
          pin: pin.toUpperCase(),
          downloadType: 'subscription',
          amountCharged: 0,
          currency: 'KES',
          subscriptionId: activeSub.id,
        },
      });

      return NextResponse.json({ success: true, downloadId: record.id });

    } else if (downloadType === 'pay_per_download') {
      if (!checkoutId) {
        return NextResponse.json({ success: false, error: 'checkoutId is required for pay_per_download' }, { status: 400 });
      }

      // Prevent duplicate: check if this checkoutId was already used
      const existing = await db.certificateDownload?.findFirst({
        where: { checkoutId },
      });
      if (existing) {
        // Already downloaded — return the existing record id so the client can proceed
        return NextResponse.json({ success: true, downloadId: existing.id, alreadyRecorded: true });
      }

      // Verify payment was actually successful in the in-memory registry
      const g = global as any;
      const registry: Record<string, any> = g.mpesaCallbacks || {};
      const payment = registry[checkoutId];

      if (!payment || payment.status !== 'success') {
        return NextResponse.json({ success: false, error: 'Payment not confirmed. Please complete M-Pesa payment first.' }, { status: 402 });
      }

      // Record the pay-per-download
      const record = await db.certificateDownload?.create({
        data: {
          userId: dbUser.id,
          clerkId: userId,
          pin: pin.toUpperCase(),
          downloadType: 'pay_per_download',
          amountCharged: payment.metadata?.amount || 30,
          currency: 'KES',
          mpesaReceipt: payment.metadata?.mpesaReceiptNumber || null,
          checkoutId,
        },
      });

      return NextResponse.json({ success: true, downloadId: record.id });

    } else {
      return NextResponse.json({ success: false, error: 'Invalid downloadType' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[record-download] Error:', error.message);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
