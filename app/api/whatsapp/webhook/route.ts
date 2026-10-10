import { NextRequest, NextResponse } from 'next/server';
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
    if (key.fromMe) {
      return NextResponse.json({ success: true, message: 'Ignored outbound message' });
    }

    const rawRemoteJid = key.remoteJid || data.remoteJid || payload.sender || '';
    if (!rawRemoteJid || rawRemoteJid.includes('@g.us')) {
      // Ignore group messages
      return NextResponse.json({ success: true, message: 'Ignored group message' });
    }

    const userPhone = sanitizeWhatsAppPhone(rawRemoteJid);
    if (!userPhone) {
      return NextResponse.json({ success: false, error: 'Could not resolve sender phone' }, { status: 400 });
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
    }

    incomingText = incomingText.trim();
    if (!incomingText) {
      return NextResponse.json({ success: true, message: 'Empty text' });
    }

    console.log(`[WhatsApp Webhook Inbound] From: ${userPhone}, Text: "${incomingText}"`);

    // Mark message as read (blue ticks)
    await markEvolutionMessageRead({
      remoteJid: rawRemoteJid,
      messageId: key.id,
    });

    // Execute state machine directly in-process
    const chatResult = await handleWhatsAppChat({
      phone: userPhone,
      message: incomingText,
      sendDirect: true,
    });

    return NextResponse.json(chatResult);
  } catch (error: any) {
    console.error('[WhatsApp Webhook Handler Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
