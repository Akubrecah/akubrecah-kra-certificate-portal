import { NextRequest, NextResponse } from 'next/server';
import prisma, { createSystemLog } from '@/lib/prisma';
import { verifyPaystackWebhookSignature } from '@/lib/paystack';
import { getOrCreateDbUser } from '@/lib/subscription';

export const maxDuration = 15;

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    const isValid = verifyPaystackWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.warn('[Paystack Webhook] Invalid webhook signature detected.');
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);

    if (event.event === 'charge.success') {
      const data = event.data;
      const reference = data.reference;
      const amountKes = (data.amount || 0) / 100;
      const metadata = data.metadata || {};
      const clerkId = metadata.clerkId;
      const type = metadata.type || 'pay_per_download';
      const pin = metadata.pin ? String(metadata.pin).toUpperCase().trim() : '';

      if (clerkId) {
        const db = prisma as any;
        const dbUser = await getOrCreateDbUser(clerkId, data.customer?.email);

        if (type === 'subscription') {
          const existingSub = await db.subscription?.findFirst({
            where: { mpesaReceipt: `PAYSTACK_${reference}` },
          });

          if (!existingSub) {
            const now = new Date();
            const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            await db.subscription?.create({
              data: {
                userId: dbUser.id,
                clerkId: dbUser.clerkId,
                status: 'active',
                planName: 'monthly',
                amountPaid: amountKes,
                currency: 'KES',
                mpesaReceipt: `PAYSTACK_${reference}`,
                startsAt: now,
                expiresAt,
              },
            });
            console.log(`[Paystack Webhook] Subscription activated for ${dbUser.email}`);
          }
        } else if (type === 'pay_per_download') {
          const existingDownload = await db.certificateDownload?.findFirst({
            where: { checkoutId: reference },
          });

          if (!existingDownload) {
            await db.certificateDownload?.create({
              data: {
                userId: dbUser.id,
                clerkId: dbUser.clerkId,
                pin: pin || 'KRA_CERT',
                downloadType: 'pay_per_download',
                amountCharged: amountKes,
                currency: 'KES',
                mpesaReceipt: `PAYSTACK_${reference}`,
                checkoutId: reference,
              },
            });
            console.log(`[Paystack Webhook] Download recorded for PIN ${pin}`);

            // Dispatch to WhatsApp if paid by a WhatsApp user
            if (clerkId && clerkId.startsWith('wa_')) {
              const waPhone = clerkId.replace(/^wa_/, '');
              const n8nWebhookUrl = process.env.N8N_KRA_DELIVERY_WEBHOOK || 'https://n8n.vybeafrica.org/webhook/kra-delivery';
              try {
                console.log('[Paystack Webhook] Triggering n8n WhatsApp delivery for:', waPhone);
                await fetch(n8nWebhookUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    checkoutId: reference,
                    mpesaReceipt: `PAYSTACK_${reference}`,
                    amount: amountKes,
                    phone: waPhone,
                    pin: pin || 'KRA_CERT',
                    downloadId: 'dl_' + Date.now(),
                    taxpayerName: metadata.customerName || 'WhatsApp Customer',
                  }),
                });
              } catch (n8nErr: any) {
                console.warn('[Paystack Webhook] n8n delivery trigger notice:', n8nErr.message);
              }
            }
          }
        }

        await createSystemLog({
          level: 'info',
          service: 'Paystack-Webhook',
          message: `Webhook processed charge.success for ref ${reference}`,
          actor: data.customer?.email || 'Paystack',
          details: { reference, amountKes, type, pin },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Paystack Webhook] Error:', error.message);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
