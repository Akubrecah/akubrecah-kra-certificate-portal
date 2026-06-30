import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

// Helper to normalize phone numbers to Safaricom Daraja format: 2547XXXXXXXX or 2541XXXXXXXX
function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[\s\-\+]/g, ''); // remove spaces, dashes, plus signs
  
  if (cleaned.startsWith('07') && cleaned.length === 10) {
    return '254' + cleaned.substring(1);
  }
  if (cleaned.startsWith('01') && cleaned.length === 10) {
    return '254' + cleaned.substring(1);
  }
  if (cleaned.startsWith('254') && (cleaned.length === 12)) {
    return cleaned;
  }
  
  return cleaned; // Fallback
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

    const normalizedPhone = normalizePhoneNumber(phone);
    if (!/^254(7|1)\d{8}$/.test(normalizedPhone)) {
      return NextResponse.json(
        { success: false, error: 'Invalid Kenyan phone number. Must be Safaricom (07XXXXXXXX or 01XXXXXXXX)' },
        { status: 400 }
      );
    }

    const consumerKey = process.env.MPESA_CONSUMER_KEY || '';
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET || '';
    const shortCode = process.env.MPESA_SHORTCODE || '';
    const passKey = process.env.MPESA_PASSKEY || '';
    const callbackUrl = process.env.MPESA_CALLBACK_URL || 'https://yourcafe.domain/api/mpesa/callback';
    const env = process.env.MPESA_ENV || 'sandbox';

    // Detect placeholders or missing credentials to trigger simulation
    const isPlaceholder = 
      !consumerKey || 
      !consumerSecret || 
      consumerKey.includes('your-') || 
      consumerSecret.includes('your-');

    if (isPlaceholder) {
      console.log('[M-Pesa STK] Using mock payment flow (placeholder credentials detected)');
      const mockCheckoutId = `ws_CO_MOCK_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      return NextResponse.json({
        success: true,
        isSimulated: true,
        MerchantRequestID: `mock-merchant-req-${Math.floor(Math.random() * 100000)}`,
        CheckoutRequestID: mockCheckoutId,
        ResponseCode: '0',
        ResponseDescription: 'Success. Mock Request accepted for processing',
        CustomerMessage: 'Success. Mock Request accepted for processing'
      });
    }

    const baseUrl = env === 'production' 
      ? 'https://api.safaricom.co.ke' 
      : 'https://sandbox.safaricom.co.ke';

    // 1. Get OAuth Token
    const authString = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const oauthRes = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authString}`,
      },
    });

    if (!oauthRes.ok) {
      const errText = await oauthRes.text();
      console.error('[M-Pesa OAuth Error]:', errText);
      throw new Error(`Failed to generate M-Pesa OAuth token: ${oauthRes.statusText}`);
    }

    const oauthData = await oauthRes.json();
    const accessToken = oauthData.access_token;

    // 2. Generate Password and Timestamp
    const now = new Date();
    const timestamp = now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0') +
      now.getHours().toString().padStart(2, '0') +
      now.getMinutes().toString().padStart(2, '0') +
      now.getSeconds().toString().padStart(2, '0');

    const rawPassword = shortCode + passKey + timestamp;
    const password = Buffer.from(rawPassword).toString('base64');

    // 3. Trigger STK Push
    const stkPayload = {
      BusinessShortCode: parseInt(shortCode),
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline', // Paybill defaults to CustomerPayBillOnline
      Amount: Math.round(amount),
      PartyA: parseInt(normalizedPhone),
      PartyB: parseInt(shortCode),
      PhoneNumber: parseInt(normalizedPhone),
      CallBackURL: callbackUrl,
      AccountReference: reference.substring(0, 12),
      TransactionDesc: description || 'Cyber Cafe Service Payment',
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

    if (!stkRes.ok) {
      console.error('[M-Pesa STK Error Payload]:', stkData);
      return NextResponse.json({
        success: false,
        error: stkData.errorMessage || stkData.ResponseDescription || 'M-Pesa STK Push request failed',
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      ...stkData
    });

  } catch (error: any) {
    console.error('[M-Pesa STK Catch Error]:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error while processing M-Pesa STK Push'
    }, { status: 500 });
  }
}
