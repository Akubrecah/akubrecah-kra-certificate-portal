import { NextRequest, NextResponse } from 'next/server';
import { sanitizeWhatsAppPhone } from '@/lib/evolution';

export const maxDuration = 60;

/**
 * POST /api/whatsapp/webhook
 *
 * Evolution API Webhook Receiver.
 * Receives MESSAGES_UPSERT events from Evolution API and delegates
 * processing to the /api/whatsapp/chat state router.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    const event = payload.event;
    const data = payload.data || payload;

    // Ignore events that are not message events or are sent by the bot itself
    if (event && event !== 'messages.upsert') {
      return NextResponse.json({ success: true, message: 'Ignored non-message event' });
    }

    const key = data.key || {};
    if (key.fromMe) {
      return NextResponse.json({ success: true, message: 'Ignored outbound message' });
    }

    const rawRemoteJid = key.remoteJid || data.remoteJid || '';
    if (!rawRemoteJid || rawRemoteJid.includes('@g.us')) {
      // Ignore group messages
      return NextResponse.json({ success: true, message: 'Ignored group message' });
    }

    const userPhone = sanitizeWhatsAppPhone(rawRemoteJid);
    if (!userPhone) {
      return NextResponse.json({ success: false, error: 'Could not resolve sender phone' }, { status: 400 });
    }

    // Extract incoming message text
    let incomingText = '';
    if (data.message?.conversation) {
      incomingText = data.message.conversation;
    } else if (data.message?.extendedTextMessage?.text) {
      incomingText = data.message.extendedTextMessage.text;
    } else if (typeof data.text === 'string') {
      incomingText = data.text;
    }

    incomingText = incomingText.trim();
    if (!incomingText) {
      return NextResponse.json({ success: true, message: 'Empty text' });
    }

    // Delegate to the chat state router
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const chatRes = await fetch(`${appUrl.replace(/\/$/, '')}/api/whatsapp/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: userPhone,
        message: incomingText,
        sendDirect: true,
      }),
    });

    const chatData = await chatRes.json();
    return NextResponse.json(chatData);
  } catch (error: any) {
    console.error('[WhatsApp Webhook Handler Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
