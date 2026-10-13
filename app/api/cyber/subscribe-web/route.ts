import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { dispatchMpesaStkPush, normalizePhoneNumber } from '@/app/api/mpesa/stkpush/route';
import { initializePaystackTransaction } from '@/lib/paystack';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please sign in to subscribe.' }, { status: 401 });
    }

    const clerkId = session.userId;
    const user = await currentUser();
    const userEmail = user?.emailAddresses?.[0]?.emailAddress || 'client@akubrecah.co.ke';

    const body = await req.json();
    const {
      cafeName,
      ownerName,
      whatsappPhone,
      paymentPhone,
      method = 'mpesa', // 'mpesa' | 'paystack'
    } = body;

    if (!cafeName?.trim() || !ownerName?.trim() || !whatsappPhone?.trim() || !paymentPhone?.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Please provide Cyber Cafe Name, Owner Name, WhatsApp Number, and Payment Phone Number.',
      }, { status: 400 });
    }

    const cleanWaPhone = normalizePhoneNumber(whatsappPhone);
    const cleanPayPhone = normalizePhoneNumber(paymentPhone);

    const db = prisma as any;

    // Check if a cafe record already exists for this user or WhatsApp phone
    let cafe = await db.cyberCafe.findFirst({
      where: {
        OR: [
          { clerkUserId: clerkId },
          { whatsappPhone: cleanWaPhone },
        ],
      },
    });

    if (cafe) {
      cafe = await db.cyberCafe.update({
        where: { id: cafe.id },
        data: {
          cafeName: cafeName.trim(),
          ownerName: ownerName.trim(),
          whatsappPhone: cleanWaPhone,
          paymentPhone: cleanPayPhone,
          clerkUserId: clerkId,
          updatedAt: new Date(),
        },
      });
    } else {
      cafe = await db.cyberCafe.create({
        data: {
          cafeName: cafeName.trim(),
          ownerName: ownerName.trim(),
          whatsappPhone: cleanWaPhone,
          paymentPhone: cleanPayPhone,
          status: 'pending',
          clerkUserId: clerkId,
        },
      });
    }

    // 1. M-Pesa STK Push
    if (method === 'mpesa') {
      const stkResult = await dispatchMpesaStkPush({
        phone: cleanPayPhone,
        amount: 500,
        reference: `CYBER_${cafe.id.slice(0, 8)}`,
        description: `Cyber Cafe Monthly Plan - ${cafeName.trim()}`,
        userClerkId: clerkId,
        userEmail,
      });

      if (!stkResult.success) {
        return NextResponse.json({
          success: false,
          error: stkResult.error || 'Failed to dispatch M-Pesa STK Push.',
        }, { status: 400 });
      }

      const checkoutId = stkResult.checkoutRequestId || stkResult.CheckoutRequestID;

      // Tag the cafe with the checkoutId for webhook reconciliation
      if (checkoutId) {
        await db.cyberCafe.update({
          where: { id: cafe.id },
          data: { notes: `CHECKOUT_ID:${checkoutId}` },
        });
      }

      return NextResponse.json({
        success: true,
        gateway: 'mpesa',
        checkoutRequestId: checkoutId,
        message: `M-Pesa STK Push sent to ${cleanPayPhone}. Please enter your M-Pesa PIN on your phone to complete your KES 500 monthly subscription.`,
      });
    }

    // 2. Paystack Card / Mobile Money
    if (method === 'paystack') {
      const origin = req.headers.get('origin') || 'https://kra-certificate.vercel.app';
      const callbackUrl = `${origin}/retrieval-portal?cyber_ref=true&cafe_id=${cafe.id}`;

      const paystackRes = await initializePaystackTransaction({
        email: userEmail,
        amountKes: 500,
        callbackUrl,
        metadata: {
          cyberCafeId: cafe.id,
          clerkUserId: clerkId,
          type: 'cyber_monthly',
          cafeName: cafe.cafeName,
        },
      });

      if (!paystackRes.success || !paystackRes.authorizationUrl) {
        return NextResponse.json({
          success: false,
          error: paystackRes.error || 'Failed to initialize Paystack checkout.',
        }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        gateway: 'paystack',
        authorizationUrl: paystackRes.authorizationUrl,
        reference: paystackRes.reference,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid payment method selected.' }, { status: 400 });
  } catch (error: any) {
    console.error('[api/cyber/subscribe-web] Error:', error.message);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
