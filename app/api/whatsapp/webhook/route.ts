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
    const payload = await req.json();

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
