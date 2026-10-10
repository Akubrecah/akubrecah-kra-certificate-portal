import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sanitizeWhatsAppPhone, sendEvolutionTextMessage } from '@/lib/evolution';
import { fetchTaxpayerById, fetchTaxpayerByPin } from '@/lib/kra-api';
import { maskTaxpayerData } from '@/lib/masking';

export const maxDuration = 60;

function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[\s\-\+\(\)]/g, '');
  if ((cleaned.startsWith('7') || cleaned.startsWith('1')) && cleaned.length === 9) {
    return '254' + cleaned;
  }
  if ((cleaned.startsWith('07') || cleaned.startsWith('01')) && cleaned.length === 10) {
    return '254' + cleaned.substring(1);
  }
  return cleaned;
}

export async function handleWhatsAppChat(params: {
  phone: string;
  message: string;
  sendDirect?: boolean;
}) {
  const { phone: rawPhone, message: rawMessage, sendDirect = true } = params;

  if (!rawPhone || !rawMessage) {
    return { success: false, error: 'Both phone and message are required.' };
  }

  try {

    const userPhone = sanitizeWhatsAppPhone(rawPhone);
    const incomingText = String(rawMessage).trim();
    const lowerText = incomingText.toLowerCase();
    const db = prisma as any;

    // 1. Fetch or initialize conversation state in Prisma
    let conversation = await db.ai_conversations?.findFirst({
      where: {
        channel: 'whatsapp',
        user_phone: userPhone,
        status: 'active',
      },
    });

    if (!conversation) {
      const convId = 'wa_' + userPhone + '_' + Date.now();
      conversation = await db.ai_conversations?.create({
        data: {
          id: convId,
          channel: 'whatsapp',
          user_phone: userPhone,
          status: 'active',
          metadata: { step: 'IDLE' },
        },
      });
    }

    const metadata: Record<string, any> = (conversation.metadata as Record<string, any>) || { step: 'IDLE' };
    const currentStep = metadata.step || 'IDLE';

    let replyText = '';
    let nextStep = currentStep;

    // 2. Global Reset / Help triggers
    if (['hi', 'hello', 'habari', 'start', 'menu', 'reset', 'help'].includes(lowerText)) {
      metadata.step = 'IDLE';
      metadata.pin = null;
      metadata.idNumber = null;
      metadata.taxpayerDetails = null;

      await db.ai_conversations?.update({
        where: { id: conversation.id },
        data: { metadata },
      });

      nextStep = 'IDLE';
      replyText =
        `👋 *Welcome to Akubrecah KRA Certificate Portal!*\n\n` +
        `I can retrieve and download your official *KRA PIN Certificate* and *Payment Receipt* right here on WhatsApp.\n\n` +
        `👉 *Please reply with your National ID Number (e.g. 12345678) or KRA PIN (e.g. A012345678Z)* to look up your details.`;
    }
    // 3. Step IDLE: User submits ID Number or KRA PIN
    else if (currentStep === 'IDLE' || /^[A-Za-z]\d{9}[A-Za-z]$/.test(incomingText) || /^\d{6,9}$/.test(incomingText)) {
      const isPin = /^[A-Za-z]\d{9}[A-Za-z]$/.test(incomingText);
      const isId = /^\d{6,9}$/.test(incomingText);

      if (!isPin && !isId) {
        replyText = `⚠️ *Invalid Format*\n\nPlease reply with a valid *National ID Number* (6 to 9 digits) or *KRA PIN* (e.g., A012345678Z).`;
      } else {
        let taxpayer: any = null;
        if (isPin) {
          taxpayer = await fetchTaxpayerByPin(incomingText.toUpperCase());
        } else {
          taxpayer = await fetchTaxpayerById(incomingText);
        }

        if (!taxpayer || !taxpayer.taxpayerName) {
          replyText = `❌ *No record found* on KRA database for \`${incomingText}\`.\n\nPlease check the number and try again, or reply *MENU* to restart.`;
        } else {
          const cleanPin = taxpayer.pin ? taxpayer.pin.toUpperCase().trim() : '';

          // Cache in kra_pin_cache
          if (cleanPin) {
            await db.kra_pin_cache?.upsert({
              where: { pin: cleanPin },
              create: {
                id: 'cache_' + cleanPin,
                pin: cleanPin,
                id_number: taxpayer.idNumber || incomingText,
                name: taxpayer.taxpayerName,
                email: taxpayer.email || '',
                building: taxpayer.building || '',
                street: taxpayer.street || '',
                city: taxpayer.town || '',
                county: taxpayer.county || '',
                district: taxpayer.district || '',
                tax_area: taxpayer.taxArea || '',
                station: taxpayer.station || '',
                po_box: taxpayer.poBox || '',
                postal_code: taxpayer.postalCode || '',
                phone_number: taxpayer.phoneNumber || userPhone,
                registered_date: taxpayer.registrationDate || '',
                updated_at: new Date(),
              },
              update: {
                name: taxpayer.taxpayerName,
                email: taxpayer.email || '',
                building: taxpayer.building || '',
                street: taxpayer.street || '',
                city: taxpayer.town || '',
                county: taxpayer.county || '',
                district: taxpayer.district || '',
                tax_area: taxpayer.taxArea || '',
                station: taxpayer.station || '',
                po_box: taxpayer.poBox || '',
                postal_code: taxpayer.postalCode || '',
                updated_at: new Date(),
              },
            });
          }

          const masked = maskTaxpayerData(taxpayer);
          nextStep = 'AWAITING_CONFIRMATION';
          metadata.step = 'AWAITING_CONFIRMATION';
          metadata.pin = cleanPin;
          metadata.idNumber = taxpayer.idNumber || incomingText;
          metadata.taxpayerName = taxpayer.taxpayerName;

          await db.ai_conversations?.update({
            where: { id: conversation.id },
            data: { metadata },
          });

          replyText =
            `✅ *Taxpayer Record Found!*\n\n` +
            `• *Name:* ${masked.taxpayerName}\n` +
            `• *PIN:* \`${masked.pin}\`\n` +
            `• *Station:* ${taxpayer.station || 'KRA Main'}\n\n` +
            `*Download Fee:* KES 30.00\n\n` +
            `To proceed with payment and instant PDF delivery, reply:\n` +
            `*1* — Pay with this WhatsApp number (*${userPhone}*)\n` +
            `*OR* send another M-Pesa number (e.g. *0712345678*)\n` +
            `*0* — Cancel`;
        }
      }
    }
    // 4. Step AWAITING_CONFIRMATION: User confirms & triggers STK Push
    else if (currentStep === 'AWAITING_CONFIRMATION') {
      if (lowerText === '0' || lowerText === 'cancel') {
        metadata.step = 'IDLE';
        nextStep = 'IDLE';
        await db.ai_conversations?.update({
          where: { id: conversation.id },
          data: { metadata },
        });
        replyText = `Operation cancelled. Reply *MENU* whenever you are ready.`;
      } else {
        let mpesaPhone = userPhone;
        if (lowerText !== '1') {
          const potentialPhone = normalizePhoneNumber(incomingText);
          if (/^254(7|1)\d{8}$/.test(potentialPhone)) {
            mpesaPhone = potentialPhone;
          } else {
            replyText = `⚠️ Please reply *1* to pay with ${userPhone}, or send a valid 10-digit Safaricom number (e.g. 0712345678).`;
          }
        }

        if (!replyText) {
          const pinToDownload = metadata.pin;
          const downloadFee = Number(process.env.PAYSTACK_DOWNLOAD_FEE_KES || 30);
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kra-certificate.vercel.app';

          const stkRes = await fetch(`${appUrl.replace(/\/$/, '')}/api/mpesa/stkpush`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: mpesaPhone,
              amount: downloadFee,
              reference: pinToDownload,
              description: `KRA Cert: ${pinToDownload}`,
            }),
          });

          const stkData = await stkRes.json();

          if (!stkData.success) {
            replyText = `❌ *Could not initiate M-Pesa STK push:*\n${stkData.error || 'Please try again later'}.`;
          } else {
            nextStep = 'AWAITING_PAYMENT';
            metadata.step = 'AWAITING_PAYMENT';
            metadata.checkoutId = stkData.checkoutRequestId || stkData.data?.checkoutRequestId || '';
            metadata.paymentPhone = mpesaPhone;

            await db.ai_conversations?.update({
              where: { id: conversation.id },
              data: { metadata },
            });

            replyText =
              `📲 *M-Pesa STK Prompt Sent!*\n\n` +
              `A prompt for *KES ${downloadFee}.00* has been sent to *${mpesaPhone}*.\n` +
              `Please enter your M-Pesa PIN on your phone.\n\n` +
              `⏳ Once completed, your *KRA PIN Certificate* and *Official Payment Receipt* PDFs will be delivered right here automatically!`;
          }
        }
      }
    }
    // 5. Step AWAITING_PAYMENT: User messages while waiting
    else if (currentStep === 'AWAITING_PAYMENT') {
      replyText =
        `⏳ *Waiting for M-Pesa confirmation...*\n\n` +
        `If you have entered your PIN, your documents will arrive in this chat shortly.\n` +
        `Reply *RESET* to start a new request.`;
    }

    // 6. Optional Direct Dispatch to Evolution API
    if (sendDirect && replyText) {
      await sendEvolutionTextMessage(userPhone, replyText);
    }

    return {
      success: true,
      userPhone,
      step: nextStep,
      reply: replyText,
      metadata,
    };
  } catch (error: any) {
    console.error('[WhatsApp Chat Route Error]:', error);
    return { success: false, error: error.message };
  }
}

/**
 * POST /api/whatsapp/chat
 * Standard HTTP POST endpoint
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await handleWhatsAppChat(body);
    const status = result.success ? 200 : 400;
    return NextResponse.json(result, { status });
  } catch (error: any) {
    console.error('[WhatsApp Chat POST Handler Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
