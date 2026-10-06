import crypto from 'crypto';

export interface PaystackInitializeOptions {
  email: string;
  amountKes: number; // In KES (e.g. 30 for pay-per-download, 499 for monthly)
  reference?: string;
  callbackUrl?: string;
  metadata?: Record<string, any>;
  channels?: string[];
}

export interface PaystackInitializeResult {
  success: boolean;
  authorizationUrl?: string;
  accessCode?: string;
  reference?: string;
  error?: string;
}

export interface PaystackVerifyResult {
  success: boolean;
  status: 'success' | 'failed' | 'abandoned' | 'pending' | 'not_found';
  amountKes: number;
  reference: string;
  paidAt?: string;
  channel?: string;
  customerEmail?: string;
  metadata?: Record<string, any>;
  error?: string;
}

function getPaystackSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY || '';
  if (!key) {
    console.warn('[Paystack] PAYSTACK_SECRET_KEY is not configured in environment variables.');
  }
  return key;
}

/**
 * Initializes a transaction with Paystack.
 * Amounts are converted from KES to subunits (x 100).
 */
export async function initializePaystackTransaction(
  opts: PaystackInitializeOptions
): Promise<PaystackInitializeResult> {
  const secretKey = getPaystackSecretKey();
  if (!secretKey) {
    return {
      success: false,
      error: 'Paystack is not configured. Missing PAYSTACK_SECRET_KEY.',
    };
  }

  const reference = opts.reference || `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const amountSubunits = Math.round(opts.amountKes * 100);

  try {
    const payload = {
      email: opts.email,
      amount: amountSubunits,
      currency: 'KES',
      reference,
      callback_url: opts.callbackUrl,
      channels: opts.channels || ['card', 'mobile_money'],
      metadata: {
        ...opts.metadata,
        amountKes: opts.amountKes,
      },
    };

    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || !data.status) {
      return {
        success: false,
        error: data.message || `Paystack initialization failed with status ${res.status}`,
      };
    }

    return {
      success: true,
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference: data.data.reference,
    };
  } catch (error: any) {
    console.error('[Paystack] Error initializing transaction:', error.message);
    return {
      success: false,
      error: error.message || 'Network error connecting to Paystack.',
    };
  }
}

/**
 * Verifies a transaction using the Paystack Reference.
 */
export async function verifyPaystackTransaction(reference: string): Promise<PaystackVerifyResult> {
  const secretKey = getPaystackSecretKey();
  if (!secretKey) {
    return {
      success: false,
      status: 'failed',
      amountKes: 0,
      reference,
      error: 'Paystack is not configured. Missing PAYSTACK_SECRET_KEY.',
    };
  }

  try {
    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();

    if (!res.ok || !data.status || !data.data) {
      return {
        success: false,
        status: 'not_found',
        amountKes: 0,
        reference,
        error: data.message || 'Transaction not found on Paystack.',
      };
    }

    const tx = data.data;
    const isSuccess = tx.status === 'success';

    return {
      success: isSuccess,
      status: tx.status,
      amountKes: (tx.amount || 0) / 100,
      reference: tx.reference,
      paidAt: tx.paid_at,
      channel: tx.channel,
      customerEmail: tx.customer?.email,
      metadata: tx.metadata || {},
    };
  } catch (error: any) {
    console.error('[Paystack] Error verifying transaction:', error.message);
    return {
      success: false,
      status: 'failed',
      amountKes: 0,
      reference,
      error: error.message || 'Network error verifying Paystack transaction.',
    };
  }
}

/**
 * Validates the HMAC SHA512 signature from a Paystack webhook request.
 */
export function verifyPaystackWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secretKey = getPaystackSecretKey();
  if (!secretKey || !signature) return false;

  const expectedSignature = crypto
    .createHmac('sha512', secretKey)
    .update(rawBody)
    .digest('hex');

  return expectedSignature === signature;
}

/**
 * Normalizes Kenyan mobile numbers to Paystack international format: +2547XXXXXXXX or +2541XXXXXXXX
 */
export function formatPaystackKenyaPhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-\+\(\)]/g, '');
  if ((cleaned.startsWith('7') || cleaned.startsWith('1')) && cleaned.length === 9) {
    return '+254' + cleaned;
  }
  if ((cleaned.startsWith('07') || cleaned.startsWith('01')) && cleaned.length === 10) {
    return '+254' + cleaned.substring(1);
  }
  if (cleaned.startsWith('254') && cleaned.length === 12) {
    return '+' + cleaned;
  }
  if (phone.startsWith('+')) {
    return phone.replace(/[\s\-]/g, '');
  }
  return '+' + cleaned;
}

/**
 * Triggers a real-time Safaricom M-Pesa STK Push directly via Paystack's Charge API.
 * The customer receives an immediate prompt on their phone to enter their M-Pesa PIN.
 */
export async function chargePaystackMpesa(opts: {
  phone: string;
  email: string;
  amountKes: number;
  reference?: string;
  metadata?: Record<string, any>;
}): Promise<{
  success: boolean;
  status?: string;
  reference: string;
  displayText?: string;
  error?: string;
}> {
  const secretKey = getPaystackSecretKey();
  const reference = opts.reference || `PSTK-MPESA-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  if (!secretKey) {
    return {
      success: false,
      reference,
      error: 'Paystack is not configured. Missing PAYSTACK_SECRET_KEY.',
    };
  }

  const formattedPhone = formatPaystackKenyaPhone(opts.phone);
  const amountSubunits = Math.round(opts.amountKes * 100);

  try {
    const payload = {
      email: opts.email,
      amount: amountSubunits,
      currency: 'KES',
      reference,
      mobile_money: {
        phone: formattedPhone,
        provider: 'mpesa',
      },
      metadata: {
        ...opts.metadata,
        amountKes: opts.amountKes,
        phone: formattedPhone,
        channel: 'mpesa_stk_charge',
      },
    };

    const res = await fetch('https://api.paystack.co/charge', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || !data.status) {
      return {
        success: false,
        reference,
        error: data.message || `Paystack M-Pesa charge failed with status ${res.status}`,
      };
    }

    const txData = data.data || {};
    return {
      success: true,
      status: txData.status || 'pay_offline',
      reference: txData.reference || reference,
      displayText: txData.display_text || 'Please complete authorization on your mobile phone',
    };
  } catch (error: any) {
    console.error('[Paystack Charge M-Pesa Error]:', error.message);
    return {
      success: false,
      reference,
      error: error.message || 'Network error triggering M-Pesa STK Push.',
    };
  }
}

