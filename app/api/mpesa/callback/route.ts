import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 10;

// Initialize global in-memory registry if it doesn't exist.
// This is used to store payment statuses for client-side polling.
const getCallbackRegistry = (): Record<string, any> => {
  const g = global as any;
  if (!g.mpesaCallbacks) {
    g.mpesaCallbacks = {};
  }
  return g.mpesaCallbacks;
};

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log('[M-Pesa Callback] Received payload:', JSON.stringify(payload));

    const body = payload?.Body;
    if (!body || !body.stkCallback) {
      console.warn('[M-Pesa Callback] Invalid payload structure');
      return NextResponse.json({ success: false, error: 'Invalid payload structure' }, { status: 400 });
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = body.stkCallback;

    if (!CheckoutRequestID) {
      console.warn('[M-Pesa Callback] Missing CheckoutRequestID');
      return NextResponse.json({ success: false, error: 'Missing CheckoutRequestID' }, { status: 400 });
    }

    const registry = getCallbackRegistry();

    // Check if the payment was successful
    if (ResultCode === 0) {
      let amount = 0;
      let mpesaReceipt = '';
      let transactionDate = '';
      let phoneNumber = '';

      if (CallbackMetadata && Array.isArray(CallbackMetadata.Item)) {
        for (const item of CallbackMetadata.Item) {
          switch (item.Name) {
            case 'Amount':
              amount = item.Value;
              break;
            case 'MpesaReceiptNumber':
              mpesaReceipt = item.Value;
              break;
            case 'TransactionDate':
              transactionDate = String(item.Value);
              break;
            case 'PhoneNumber':
              phoneNumber = String(item.Value);
              break;
          }
        }
      }

      console.log(`[M-Pesa Callback] Payment Success! Receipt: ${mpesaReceipt}, Amount: ${amount}`);

      registry[CheckoutRequestID] = {
        status: 'success',
        resultCode: ResultCode,
        resultDesc: ResultDesc,
        metadata: {
          amount,
          mpesaReceiptNumber: mpesaReceipt,
          transactionDate,
          phoneNumber
        },
        timestamp: Date.now()
      };
    } else {
      console.warn(`[M-Pesa Callback] Payment Failed! Code: ${ResultCode}, Desc: ${ResultDesc}`);

      registry[CheckoutRequestID] = {
        status: 'failed',
        resultCode: ResultCode,
        resultDesc: ResultDesc,
        timestamp: Date.now()
      };
    }

    // Optional: Prune older callbacks from memory to prevent leaks (keeps last 500 records)
    const keys = Object.keys(registry);
    if (keys.length > 500) {
      // Sort keys by timestamp and delete the oldest 100 entries
      const sortedKeys = keys.sort((a, b) => (registry[a].timestamp || 0) - (registry[b].timestamp || 0));
      for (let i = 0; i < 100; i++) {
        delete registry[sortedKeys[i]];
      }
    }

    return NextResponse.json({ success: true, message: 'Callback received successfully' });

  } catch (error: any) {
    console.error('[M-Pesa Callback Catch Error]:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
