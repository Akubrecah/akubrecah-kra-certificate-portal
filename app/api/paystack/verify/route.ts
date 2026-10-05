import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma, { createSystemLog } from '@/lib/prisma';
import { verifyPaystackTransaction } from '@/lib/paystack';
import { getOrCreateDbUser } from '@/lib/subscription';

export const maxDuration = 15;

export async function POST(req: NextRequest) {
  try {
    const { userId: authClerkId } = await auth();
    const body = await req.json();
    const { reference } = body;

    if (!reference || typeof reference !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Payment reference is required.' },
        { status: 400 }
      );
    }

    // Verify with Paystack API
    const verification = await verifyPaystackTransaction(reference);

    if (!verification.success || verification.status !== 'success') {
      return NextResponse.json({
        success: false,
        verified: false,
        status: verification.status,
        error: verification.error || 'Payment has not been confirmed by Paystack.',
      }, { status: 402 });
    }

    const metadata = verification.metadata || {};
    const clerkId = authClerkId || metadata.clerkId;

    if (!clerkId) {
      return NextResponse.json(
        { success: false, error: 'Unable to associate payment with user account.' },
        { status: 400 }
      );
    }

    const db = prisma as any;
    const dbUser = await getOrCreateDbUser(clerkId, verification.customerEmail);

    const type = metadata.type || 'pay_per_download';
    const pin = metadata.pin ? String(metadata.pin).toUpperCase().trim() : '';

    if (type === 'subscription') {
      // Check if already recorded to avoid duplicate entry
      const existingSub = await db.subscription?.findFirst({
        where: {
          mpesaReceipt: `PAYSTACK_${reference}`,
        },
      });

      if (existingSub) {
        return NextResponse.json({
          success: true,
          verified: true,
          type: 'subscription',
          subscriptionId: existingSub.id,
          expiresAt: existingSub.expiresAt,
          alreadyRecorded: true,
        });
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30-day validity

      const subRecord = await db.subscription?.create({
        data: {
          userId: dbUser.id,
          clerkId: dbUser.clerkId,
          status: 'active',
          planName: 'monthly',
          amountPaid: verification.amountKes,
          currency: 'KES',
          mpesaReceipt: `PAYSTACK_${reference}`,
          startsAt: now,
          expiresAt,
        },
      });

      await createSystemLog({
        level: 'info',
        service: 'Paystack-Subscription',
        message: `Monthly subscription activated for user ${dbUser.email} via Paystack`,
        actor: dbUser.email,
        details: { reference, amount: verification.amountKes, expiresAt },
      });

      return NextResponse.json({
        success: true,
        verified: true,
        type: 'subscription',
        subscriptionId: subRecord?.id,
        expiresAt,
      });

    } else {
      // Pay-per-download flow
      const existingDownload = await db.certificateDownload?.findFirst({
        where: {
          checkoutId: reference,
        },
      });

      if (existingDownload) {
        return NextResponse.json({
          success: true,
          verified: true,
          type: 'pay_per_download',
          downloadId: existingDownload.id,
          pin: existingDownload.pin,
          alreadyRecorded: true,
        });
      }

      const downloadRecord = await db.certificateDownload?.create({
        data: {
          userId: dbUser.id,
          clerkId: dbUser.clerkId,
          pin: pin || 'KRA_CERT',
          downloadType: 'pay_per_download',
          amountCharged: verification.amountKes,
          currency: 'KES',
          mpesaReceipt: `PAYSTACK_${reference}`,
          checkoutId: reference,
        },
      });

      await createSystemLog({
        level: 'info',
        service: 'Paystack-Download',
        message: `Certificate download authorized for PIN ${pin} via Paystack`,
        actor: dbUser.email,
        details: { reference, pin, amount: verification.amountKes },
      });

      return NextResponse.json({
        success: true,
        verified: true,
        type: 'pay_per_download',
        downloadId: downloadRecord?.id,
        pin,
      });
    }

  } catch (error: any) {
    console.error('[Paystack Verify] Error:', error.message);
    return NextResponse.json(
      { success: false, error: 'Internal server error verifying payment.' },
      { status: 500 }
    );
  }
}
