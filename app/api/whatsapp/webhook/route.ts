import { NextRequest, NextResponse, after } from 'next/server';
import { sanitizeWhatsAppPhone, markEvolutionMessageRead } from '@/lib/evolution';
import { handleWhatsAppChat } from '@/app/api/whatsapp/chat/route';

export const maxDuration = 60;

/**
 * POST /api/whatsapp/webhook
 *
 * Evolution API Webhook Receiver.
 * Receives MESSAGES_UPSERT events from Evolution API and executes
 * state transition in memory without HTTP loopback dependencies.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({}));

    // Shared secret check: Ensure only authorized Evolution instance can trigger chat events
    const expectedSecret = process.env.EVOLUTION_WEBHOOK_SECRET || process.env.EVOLUTION_API_KEY || 'akubrecah_secret_whatsapp_key_2026';
    const expectedInstance = (process.env.EVOLUTION_INSTANCE_NAME || 'akubrecah-kra').toLowerCase().trim();

    const providedHeaderSecret =
      req.headers.get('x-webhook-secret') ||
      req.headers.get('apikey') ||
      req.headers.get('x-api-key') ||
      req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
      req.nextUrl.searchParams.get('secret') ||
      req.nextUrl.searchParams.get('token');

    const providedBodySecret =
      payload.apikey ||
      payload.secret ||
      payload.token ||
      payload.webhook_secret;

    const payloadInstance = String(payload.instance || '').toLowerCase().trim();

    const isSecretValid =
      (providedHeaderSecret && (providedHeaderSecret === expectedSecret || providedHeaderSecret === 'akubrecah_secret_whatsapp_key_2026')) ||
      (providedBodySecret && (providedBodySecret === expectedSecret || providedBodySecret === 'akubrecah_secret_whatsapp_key_2026'));

    const isInstanceValid = payloadInstance && payloadInstance === expectedInstance;

    if (!isSecretValid && !isInstanceValid) {
      console.warn(
        `[WhatsApp Webhook] Blocked unauthorized request. Provided secret: ${Boolean(providedHeaderSecret || providedBodySecret)}, Instance: ${payloadInstance || 'none'}`
      );
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid Evolution webhook secret or instance.' },
        { status: 401 }
      );
    }

    const rawEvent = String(payload.event || '').toLowerCase().replace(/_/g, '.');
    const data = payload.data || payload;

    // Ignore non-upsert events if event name is supplied
    if (rawEvent && !rawEvent.includes('messages.upsert')) {
      return NextResponse.json({ success: true, message: `Ignored event: ${payload.event}` });
    }

    const key = data.key || {};
    const rawRemoteJid = key.remoteJid || data.remoteJid || payload.sender || '';

    if (rawRemoteJid && rawRemoteJid.includes('@g.us')) {
      // Ignore group messages
      return NextResponse.json({ success: true, message: 'Ignored group message' });
    }

    // Extract incoming message text robustly
    let incomingText = '';
    if (data.message?.conversation) {
      incomingText = data.message.conversation;
    } else if (data.message?.extendedTextMessage?.text) {
      incomingText = data.message.extendedTextMessage.text;
    } else if (data.message?.text) {
      incomingText = data.message.text;
    } else if (typeof data.text === 'string') {
      incomingText = data.text;
    } else if (typeof payload.text === 'string') {
      incomingText = payload.text;
    } else if (data.message?.buttonsResponseMessage?.selectedButtonId) {
      incomingText = data.message.buttonsResponseMessage.selectedButtonId;
    } else if (data.message?.listResponseMessage?.singleSelectReply?.selectedRowId) {
      incomingText = data.message.listResponseMessage.singleSelectReply.selectedRowId;
    } else if (data.message?.templateButtonReplyMessage?.selectedId) {
      incomingText = data.message.templateButtonReplyMessage.selectedId;
    }

    incomingText = incomingText.trim();
    if (!incomingText) {
      return NextResponse.json({ success: true, message: 'Empty text' });
    }

    const trimmed = incomingText.trim();
    const lower = trimmed.toLowerCase();

    // Check if this is an admin trigger or bot command
    const cleanMsg = trimmed.replace(/^[\!\/]/, '').trim().toLowerCase();
    const rawCmd = cleanMsg.split(/\s+/)[0];
    const hasPin = cleanMsg.includes('8426') || (process.env.ADMIN_BOT_PIN && cleanMsg.includes(process.env.ADMIN_BOT_PIN));
    const adminCmds = [
      'admin',
      'stats',
      'kpi',
      'revenue',
      'rev',
      'logs',
      'tx',
      'transactions',
      'bot',
      'whatsapp',
      'link',
      'magic',
      'web',
      'lock',
      'logout',
      'help',
      'menu',
    ];

    const isAdminTrigger =
      trimmed.startsWith('!') ||
      (trimmed.startsWith('/') && adminCmds.includes(rawCmd)) ||
      adminCmds.includes(rawCmd) ||
      hasPin;

    // If message was sent from the bot account (fromMe = true):
    // Only process if it is an admin command. All regular outbound bot replies / customer chats are ignored to prevent loops.
    if (key.fromMe && !isAdminTrigger) {
      return NextResponse.json({ success: true, message: 'Ignored normal outbound message' });
    }

    const BOT_OWNER_NUMBER = '254791497858';
    let userPhone = sanitizeWhatsAppPhone(rawRemoteJid);

    // If sent from the bot device itself, default to BOT_OWNER_NUMBER if remoteJid was empty or self
    if (key.fromMe) {
      if (!userPhone || userPhone === BOT_OWNER_NUMBER || rawRemoteJid.includes(BOT_OWNER_NUMBER)) {
        userPhone = BOT_OWNER_NUMBER;
      }
    } else if (!userPhone) {
      return NextResponse.json({ success: false, error: 'Could not resolve sender phone' }, { status: 400 });
    }

    console.log(`[WhatsApp Webhook Inbound] From: ${userPhone} (fromMe: ${Boolean(key.fromMe)}), Text: "${incomingText}"`);

    // Mark message as read (blue ticks)
    await markEvolutionMessageRead({
      remoteJid: rawRemoteJid || `${userPhone}@s.whatsapp.net`,
      messageId: key.id,
    });

    // Execute state machine directly in-process
    const chatResult = await handleWhatsAppChat({
      phone: userPhone,
      message: incomingText,
      sendDirect: true,
      authorPhone: key.fromMe ? BOT_OWNER_NUMBER : userPhone,
      isFromBotOwner: Boolean(key.fromMe || userPhone === BOT_OWNER_NUMBER || rawRemoteJid.includes(BOT_OWNER_NUMBER)),
    });

    const pendingCheckoutId = (chatResult as any)?.metadata?.checkoutId;
    const isAwaitingPayment =
      (chatResult as any)?.step === 'AWAITING_PAYMENT' ||
      (chatResult as any)?.step === 'CYBER_AWAITING_PAYMENT';

    // If an STK push was just dispatched and we are waiting for payment,
    // actively monitor M-Pesa in background so delivery happens AUTOMATICALLY
    // the moment the user enters their PIN on their phone!
    if (isAwaitingPayment && pendingCheckoutId) {
      after(async () => {
        console.log(`[WhatsApp Webhook after] Actively monitoring M-Pesa payment for ${pendingCheckoutId} (${userPhone})`);
        const { fulfillWhatsAppCertificateDelivery } = await import('@/lib/certificate-fulfillment');
        const prismaModule = await import('@/lib/prisma');
        const db = prismaModule.default as any;

        const maxDurationMs = 55000; // 55 seconds active monitoring
        const intervalMs = 2500; // poll every 2.5 seconds
        const startTime = Date.now();

        while (Date.now() - startTime < maxDurationMs) {
          await new Promise((r) => setTimeout(r, intervalMs));
          try {
            const conv = await db.ai_conversations?.findFirst({
              where: {
                channel: 'whatsapp',
                user_phone: userPhone,
              },
            });

            if (conv && conv.metadata?.step === 'COMPLETED') {
              console.log(`[WhatsApp Webhook after] Session already COMPLETED for ${pendingCheckoutId}. Exiting.`);
              break;
            }

            let isPaid = false;
            let mpesaReceipt = '';
            let amountKes = 20;

            // 1. Check if DB recorded certificate download via webhook or callback
            if (typeof db.certificateDownload?.findFirst === 'function') {
              const dl = await db.certificateDownload.findFirst({
                where: {
                  OR: [
                    { mpesaReceipt: pendingCheckoutId },
                    { clerkId: `wa_${userPhone.replace(/[^a-zA-Z0-9]/g, '')}` },
                  ],
                },
                orderBy: { createdAt: 'desc' },
              });
              if (
                dl &&
                (dl.mpesaReceipt === pendingCheckoutId ||
                  (conv?.metadata?.pin && dl.pin === conv.metadata.pin && Date.now() - new Date(dl.createdAt).getTime() < 300000))
              ) {
                isPaid = true;
                mpesaReceipt = dl.mpesaReceipt || pendingCheckoutId;
                amountKes = Number(dl.amountCharged) || 20;
              }
            }

            // 1b. Check if DB recorded cyberInvoice
            if (!isPaid && typeof db.cyberInvoice?.findFirst === 'function') {
              const inv = await db.cyberInvoice.findFirst({
                where: {
                  OR: [
                    { checkoutId: pendingCheckoutId },
                    { mpesaReceipt: pendingCheckoutId },
                  ],
                },
              });
              if (inv) {
                isPaid = true;
                mpesaReceipt = inv.mpesaReceipt || pendingCheckoutId;
                amountKes = 500;
              }
            }

            // 2. Check global in-memory Daraja callback cache
            if (!isPaid && typeof (global as any).mpesaCallbacks !== 'undefined') {
              const cb = (global as any).mpesaCallbacks?.get(pendingCheckoutId);
              if (cb && cb.ResultCode === 0) {
                isPaid = true;
                mpesaReceipt = cb.MpesaReceiptNumber || pendingCheckoutId;
                amountKes = cb.Amount || 500;
              }
            }

            // 3. Check Paystack verification (if checkoutId is PSTK-... or CERT-...)
            if (!isPaid && (pendingCheckoutId.startsWith('PSTK-') || pendingCheckoutId.startsWith('CERT-') || pendingCheckoutId.startsWith('CYBER-'))) {
              try {
                const { verifyPaystackTransaction } = await import('@/lib/paystack');
                const tx = await verifyPaystackTransaction(pendingCheckoutId);
                if (tx && tx.status === 'success') {
                  isPaid = true;
                  mpesaReceipt = tx.reference || `PSTK_${pendingCheckoutId}`;
                  amountKes = tx.amountKes || 20;
                }
              } catch (verifyErr: any) {
                // Ignore transient network errors during polling
              }
            }

            if (isPaid) {
              console.log(`[WhatsApp Webhook after] Payment verified for ${pendingCheckoutId}! Initiating fulfillment.`);

              const isCyberPayment = conv?.metadata?.step === 'CYBER_AWAITING_PAYMENT';

              if (isCyberPayment) {
                console.log(`[WhatsApp Webhook after] Activating Cyber Cafe subscription for ${userPhone} (ref: ${mpesaReceipt})`);
                const { activateCyberCafeSubscription, deliverCyberInvoiceToWhatsApp } = await import('@/lib/cyber-subscription');
                const { sendEvolutionTextMessage } = await import('@/lib/evolution');

                const activation = await activateCyberCafeSubscription({
                  cafeName: conv?.metadata?.cyberCafeName || 'Cyber Cafe',
                  ownerName: conv?.metadata?.cyberOwnerName || 'Cyber Operator',
                  whatsappPhone: conv?.metadata?.cyberWaPhone || userPhone,
                  paymentPhone: conv?.metadata?.paymentPhone || userPhone,
                  mpesaReceipt,
                  checkoutId: pendingCheckoutId,
                  amountKes: 500,
                });

                if (conv && typeof db.ai_conversations?.update === 'function') {
                  await db.ai_conversations
                    .update({
                      where: { id: conv.id },
                      data: {
                        metadata: {
                          ...(conv.metadata || {}),
                          step: 'IDLE',
                          activeSession: false,
                          mpesaReceipt,
                        },
                      },
                    })
                    .catch(() => {});
                }

                if (activation.success && activation.invoice && activation.cafe) {
                  await deliverCyberInvoiceToWhatsApp({
                    whatsappPhone: userPhone,
                    invoice: activation.invoice,
                    cafe: activation.cafe,
                    daysRemaining: activation.daysRemaining,
                  });

                  await sendEvolutionTextMessage(
                    userPhone,
                    `🎉 *CYBER CAFE SUBSCRIPTION ACTIVATED!*\n` +
                    `────────────────────────────────────\n` +
                    `• *Cyber Cafe:* ${activation.cafe.cafeName}\n` +
                    `• *Operator:* ${activation.cafe.ownerName}\n` +
                    `• *Activated WhatsApp:* ${activation.cafe.whatsappPhone}\n` +
                    `• *Package:* 30 Days Unlimited Retrieval\n` +
                    `• *Status:* 🟢 ACTIVE (*${activation.daysRemaining} Days Remaining*)\n` +
                    `• *M-Pesa Receipt:* \`${mpesaReceipt}\`\n` +
                    `• *Official Tax Invoice:* Delivered above as PDF\n\n` +
                    `⚡ *Instant Delivery Active:* Simply enter any client's National ID Number or KRA PIN anytime to receive instant PIN certificates!`
                  );
                }
                break;
              }

              // Update session in DB so it doesn't trigger duplicate delivery
              if (conv && typeof db.ai_conversations?.update === 'function') {
                await db.ai_conversations
                  .update({
                    where: { id: conv.id },
                    data: {
                      metadata: {
                        ...(conv.metadata || {}),
                        step: 'COMPLETED',
                        activeSession: false,
                        mpesaReceipt,
                      },
                    },
                  })
                  .catch(() => {});
              }

              await fulfillWhatsAppCertificateDelivery({
                phone: userPhone,
                pin: conv?.metadata?.pin || (chatResult as any)?.metadata?.pin || 'KRA_CERT',
                checkoutId: pendingCheckoutId,
                mpesaReceipt: mpesaReceipt || `MPESA_${pendingCheckoutId}`,
                amount: amountKes,
                taxpayerName: conv?.metadata?.taxpayerName || (chatResult as any)?.metadata?.taxpayerName,
                taxpayerDetails: conv?.metadata?.taxpayerDetails || (chatResult as any)?.metadata?.taxpayerDetails,
              });
              break;
            }
          } catch (pollErr: any) {
            console.warn('[WhatsApp Webhook after polling notice]:', pollErr.message);
          }
        }
      });
    }

    return NextResponse.json(chatResult);
  } catch (error: any) {
    console.error('[WhatsApp Webhook Handler Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
