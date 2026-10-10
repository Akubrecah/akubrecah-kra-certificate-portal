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

      // Asynchronously process database record and dispatch to n8n for WhatsApp delivery
      (async () => {
        try {
          const prismaModule = await import('@/lib/prisma');
          const db = prismaModule.default as any;
          const { getOrCreateDbUser } = await import('@/lib/subscription');

          // 1. Look up any WhatsApp conversation awaiting payment with this checkoutId
          let conversation: any = null;
          try {
            const conversations = await db.ai_conversations?.findMany({
              where: {
                channel: 'whatsapp',
                status: 'active',
              },
            });
            conversation = conversations?.find((c: any) => {
              const meta = c.metadata as any;
              return meta?.checkoutId === CheckoutRequestID || meta?.paymentPhone === phoneNumber;
            });
          } catch (e: any) {
            console.warn('[M-Pesa Callback] Conversation lookup notice:', e.message);
          }

          const resolvedPin = conversation?.metadata?.pin || 'KRA_CERT';
          const targetPhone = conversation?.user_phone || phoneNumber;
          const taxpayerName = conversation?.metadata?.taxpayerName || '';

          // 2. Create CertificateDownload record
          const dbUser = await getOrCreateDbUser(
            'wa_' + targetPhone,
            `wa_${targetPhone}@akubrecah.co.ke`,
            taxpayerName || 'WhatsApp Taxpayer'
          );

          let downloadRecord: any = null;
          if (db.certificateDownload) {
            downloadRecord = await db.certificateDownload.create({
              data: {
                userId: dbUser.id,
                clerkId: 'wa_' + targetPhone,
                pin: resolvedPin.toUpperCase(),
                downloadType: 'pay_per_download',
                amountCharged: Number(amount || 30),
                currency: 'KES',
                mpesaReceipt: mpesaReceipt,
                checkoutId: CheckoutRequestID,
              },
            });
          }

          const downloadId = downloadRecord?.id || 'dl_' + Date.now();

          // 3. Update conversation step to COMPLETED
          if (conversation) {
            const meta = (conversation.metadata as any) || {};
            meta.step = 'COMPLETED';
            meta.mpesaReceipt = mpesaReceipt;
            meta.downloadId = downloadId;
            await db.ai_conversations?.update({
              where: { id: conversation.id },
              data: { metadata: meta },
            });
          }

          // 4. Trigger n8n Workflow for PDF generation and WhatsApp delivery
          const n8nWebhookUrl = process.env.N8N_KRA_DELIVERY_WEBHOOK || 'https://n8n.vybeafrica.org/webhook/kra-delivery';
          const payload = {
            checkoutId: CheckoutRequestID,
            mpesaReceipt,
            amount,
            phone: targetPhone,
            pin: resolvedPin,
            downloadId,
            taxpayerName,
          };

          try {
            console.log('[M-Pesa Callback] Triggering n8n delivery webhook:', n8nWebhookUrl);
            await fetch(n8nWebhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
          } catch (n8nErr: any) {
            console.warn('[M-Pesa Callback] n8n trigger warning:', n8nErr.message);
          }
        } catch (dbErr: any) {
          console.error('[M-Pesa Callback DB Handler Error]:', dbErr.message);
        }
      })().catch((err) => console.error('[M-Pesa Callback Async Error]:', err));
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
