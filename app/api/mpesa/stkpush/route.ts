import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { chargePaystackMpesa, formatPaystackKenyaPhone } from '@/lib/paystack';

export const maxDuration = 30;

// Helper to normalize phone numbers to Safaricom Daraja format: 2547XXXXXXXX or 2541XXXXXXXX
export function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[\s\-\+\(\)]/g, '');
  if ((cleaned.startsWith('7') || cleaned.startsWith('1')) && cleaned.length === 9) {
    return '254' + cleaned;
  }
  if ((cleaned.startsWith('07') || cleaned.startsWith('01')) && cleaned.length === 10) {
    return '254' + cleaned.substring(1);
  }
  if (cleaned.startsWith('254') && cleaned.length === 12) {
    return cleaned;
  }
  return cleaned;
}

/**
 * Direct in-process M-Pesa STK Push dispatcher.
 * Used by both HTTP API route and WhatsApp in-process chat state machine.
 */
export async function dispatchMpesaStkPush({
  phone,
  amount,
  reference,
  description,
  userClerkId = 'anonymous',
  userEmail = 'customer@akubrecah.co.ke',
  callbackUrl,
}: {
  phone: string;
  amount: number;
  reference: string;
  description?: string;
  userClerkId?: string;
  userEmail?: string;
  callbackUrl?: string;
}): Promise<{
  success: boolean;
  checkoutRequestId?: string;
  CheckoutRequestID?: string;
  MerchantRequestID?: string;
  CustomerMessage?: string;
  gateway?: string;
  error?: string;
}> {
  try {
    const normalizedPhone = normalizePhoneNumber(phone);
    if (!/^254(7|1)\d{8}$/.test(normalizedPhone)) {
      return {
        success: false,
        error: 'Invalid Kenyan phone number. Must be Safaricom (07XXXXXXXX or 01XXXXXXXX)',
      };
    }

    const consumerKey = process.env.MPESA_CONSUMER_KEY || '';
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET || '';
    const shortCode = process.env.MPESA_SHORTCODE || '';
    const passKey = process.env.MPESA_PASSKEY || '';
    const env = process.env.MPESA_ENV || 'production';

    const hasDaraja = Boolean(
      consumerKey &&
      consumerSecret &&
      shortCode &&
      passKey &&
      !consumerKey.includes('your-') &&
      !consumerSecret.includes('your-')
    );

    // 1. If Safaricom Daraja credentials are fully configured, use Daraja
    if (hasDaraja) {
      const finalCallbackUrl = process.env.MPESA_CALLBACK_URL || callbackUrl || 'https://kra-certificate.vercel.app/api/mpesa/callback';
      const baseUrl = env === 'production' 
        ? 'https://api.safaricom.co.ke' 
        : 'https://sandbox.safaricom.co.ke';

      const authString = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
      const oauthRes = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        method: 'GET',
        headers: { 'Authorization': `Basic ${authString}` },
      });

      if (oauthRes.ok) {
        const oauthData = await oauthRes.json();
        const accessToken = oauthData.access_token;

        const now = new Date();
        const timestamp = now.getFullYear().toString() +
          (now.getMonth() + 1).toString().padStart(2, '0') +
          now.getDate().toString().padStart(2, '0') +
          now.getHours().toString().padStart(2, '0') +
          now.getMinutes().toString().padStart(2, '0') +
          now.getSeconds().toString().padStart(2, '0');

        const rawPassword = shortCode + passKey + timestamp;
        const password = Buffer.from(rawPassword).toString('base64');

        const stkPayload = {
          BusinessShortCode: parseInt(shortCode),
          Password: password,
          Timestamp: timestamp,
          TransactionType: process.env.MPESA_TRANSACTION_TYPE || 'CustomerPayBillOnline',
          Amount: Math.round(Number(amount)),
          PartyA: parseInt(normalizedPhone),
          PartyB: parseInt(shortCode),
          PhoneNumber: parseInt(normalizedPhone),
          CallBackURL: finalCallbackUrl,
          AccountReference: reference.substring(0, 12),
          TransactionDesc: description || 'KRA Certificate Payment',
        };

        console.log('[M-Pesa STK] Dispatching payload to Daraja:', { ...stkPayload, Password: '***' });

        const stkRes = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(stkPayload),
        });

        const stkData = await stkRes.json();
        if (stkRes.ok) {
          const reqId = stkData.CheckoutRequestID || stkData.checkoutRequestId;
          return {
            success: true,
            checkoutRequestId: reqId,
            CheckoutRequestID: reqId,
            MerchantRequestID: stkData.MerchantRequestID || reqId,
            CustomerMessage: stkData.CustomerMessage || stkData.ResponseDescription || 'STK Push sent',
            gateway: 'daraja',
          };
        }
      }
    }

    // 2. Paystack M-Pesa STK Push
    if (process.env.PAYSTACK_SECRET_KEY) {
      console.log('[M-Pesa STK] Dispatching real STK Push via Paystack Charge API for phone:', normalizedPhone);
      const cleanPin = reference.replace(/^CERT-/, '').trim().toUpperCase();

      const paystackRes = await chargePaystackMpesa({
        phone: formatPaystackKenyaPhone(normalizedPhone),
        email: userEmail || `${normalizedPhone}@akubrecah.co.ke`,
        amountKes: Math.round(Number(amount)) || 30,
        reference: `PSTK-MPESA-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        metadata: {
          clerkId: userClerkId,
          type: 'pay_per_download',
          pin: cleanPin,
          phone: normalizedPhone,
          description: description || `KRA Certificate - ${cleanPin}`,
        },
      });

      if (!paystackRes.success) {
        console.error('[Paystack M-Pesa Charge Failed]:', paystackRes.error);
        return {
          success: false,
          error: paystackRes.error || 'Failed to trigger M-Pesa STK Push on your phone.',
        };
      }

      return {
        success: true,
        checkoutRequestId: paystackRes.reference,
        CheckoutRequestID: paystackRes.reference,
        MerchantRequestID: paystackRes.reference,
        CustomerMessage: paystackRes.displayText || 'STK Push sent. Please check your phone and enter M-Pesa PIN.',
        gateway: 'paystack_mpesa',
      };
    }

    return {
      success: false,
      error: 'Payment gateway not configured. Please configure PAYSTACK_SECRET_KEY or MPESA credentials.',
    };
  } catch (err: any) {
    console.error('[dispatchMpesaStkPush Error]:', err.message);
    return {
      success: false,
      error: err.message || 'Internal error processing M-Pesa payment.',
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, amount, reference, description } = body;

    if (!phone || !amount || !reference) {
      return NextResponse.json(
        { success: false, error: 'Phone number, amount, and reference are required' },
        { status: 400 }
      );
    }

    let userClerkId = 'anonymous';
    let userEmail = 'customer@akubrecah.co.ke';
    try {
      const { userId } = await auth();
      if (userId) {
        userClerkId = userId;
        const { isAdminUser } = await import('@/lib/subscription');
        if (await isAdminUser(userId)) {
          return NextResponse.json(
            { success: false, error: 'Admin accounts have full access and do not require payment.' },
            { status: 403 }
          );
        }
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);
        userEmail = clerkUser.primaryEmailAddress?.emailAddress || userEmail;
      }
    } catch {}

    const result = await dispatchMpesaStkPush({
      phone,
      amount,
      reference,
      description,
      userClerkId,
      userEmail,
    });

    const status = result.success ? 200 : 400;
    return NextResponse.json(result, { status });
  } catch (error: any) {
    console.error('[M-Pesa STK Catch Error]:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error while processing M-Pesa STK Push',
    }, { status: 500 });
  }
}
