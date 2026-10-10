import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sanitizeWhatsAppPhone, sendEvolutionTextMessage } from '@/lib/evolution';
import { fetchTaxpayerById, fetchTaxpayerByPin } from '@/lib/kra-api';
import { maskTaxpayerData } from '@/lib/masking';
import { initializePaystackTransaction } from '@/lib/paystack';

export const maxDuration = 60;

function extractKenyanPhone(text: string): string | null {
  if (!text) return null;
  const cleaned = text.replace(/[\s\-\+\(\)]/g, '');
  const match = cleaned.match(/(?:254|\+254|0)?([71]\d{8})/);
  if (match && match[1]) {
    return '254' + match[1];
  }
  return null;
}

function formatDisplayPhone(phone: string): string {
  if (!phone) return '';
  if (phone.startsWith('254') && phone.length === 12) {
    return '0' + phone.substring(3);
  }
  return phone;
}

async function triggerMpesaPush(phone: string, pin: string, amount: number) {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://kra-certificate.vercel.app').replace(/\/$/, '');
  const stkRes = await fetch(`${appUrl}/api/mpesa/stkpush`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone,
      amount,
      reference: pin,
      description: `KRA Cert: ${pin}`,
    }),
  });
  return await stkRes.json();
}

async function createPaystackLink(userPhone: string, pin: string, amount: number, customerName?: string) {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://kra-certificate.vercel.app').replace(/\/$/, '');
  const reference = `PSTK-CERT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  return await initializePaystackTransaction({
    email: `wa_${userPhone.replace(/[^a-zA-Z0-9]/g, '')}@akubrecah.co.ke`,
    amountKes: amount,
    reference,
    callbackUrl: `${appUrl}/checkout/success?ref=${reference}&pin=${pin}`,
    metadata: {
      clerkId: 'wa_' + userPhone,
      type: 'pay_per_download',
      pin,
      amountKes: amount,
      phone: userPhone,
      customerName: customerName || 'WhatsApp Customer',
    },
  });
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
        try {
          if (isPin) {
            taxpayer = await fetchTaxpayerByPin(incomingText.toUpperCase());
          } else {
            taxpayer = await fetchTaxpayerById(incomingText);
          }
        } catch (kraError: any) {
          console.warn('[WhatsApp KRA Lookup Notice]:', kraError.message);
          try {
            if (isPin) {
              const cached = await db.kra_pin_cache?.findUnique({ where: { pin: incomingText.toUpperCase() } });
              if (cached) {
                taxpayer = {
                  pin: cached.pin,
                  taxpayerName: cached.name,
                  idNumber: cached.id_number,
                  station: cached.station,
                  email: cached.email,
                  phoneNumber: cached.phone_number,
                };
              }
            } else {
              const cached = await db.kra_pin_cache?.findFirst({ where: { id_number: incomingText } });
              if (cached) {
                taxpayer = {
                  pin: cached.pin,
                  taxpayerName: cached.name,
                  idNumber: cached.id_number,
                  station: cached.station,
                  email: cached.email,
                  phoneNumber: cached.phone_number,
                };
              }
            }
          } catch {}
        }

        if (!taxpayer || !taxpayer.taxpayerName) {
          replyText = `❌ *No record found* on KRA database for \`${incomingText}\`.\n\nPlease double-check the number and try again, or reply *MENU* to restart.`;
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
          const detectedPhone = extractKenyanPhone(userPhone) || extractKenyanPhone(taxpayer.phoneNumber || '');

          nextStep = 'AWAITING_PAYMENT_METHOD';
          metadata.step = 'AWAITING_PAYMENT_METHOD';
          metadata.pin = cleanPin;
          metadata.idNumber = taxpayer.idNumber || incomingText;
          metadata.taxpayerName = taxpayer.taxpayerName;
          metadata.suggestedPhone = detectedPhone;

          await db.ai_conversations?.update({
            where: { id: conversation.id },
            data: { metadata },
          });

          let menuText = '';
          if (detectedPhone) {
            menuText =
              `*Select Payment Option:*\n` +
              `*1* — 📲 *M-Pesa STK Push* to *${formatDisplayPhone(detectedPhone)}*\n` +
              `*2* — ✏️ *Pay with a DIFFERENT M-Pesa Number*\n` +
              `*3* — 💳 *Card / Bank / Online Checkout Link*\n` +
              `*0* — ❌ *Cancel*\n\n` +
              `👉 *Reply 1* to pay with *${formatDisplayPhone(detectedPhone)}*, send a different M-Pesa number (e.g. *0712345678*), or reply *3* for online card payment.`;
          } else {
            menuText =
              `*Select Payment Option:*\n` +
              `*1* — 📲 *M-Pesa STK Push* (Reply with your M-Pesa number, e.g. *0712345678*)\n` +
              `*2* — 💳 *Card / Bank / Online Checkout Link*\n` +
              `*0* — ❌ *Cancel*\n\n` +
              `👉 *Please send your Safaricom M-Pesa number* (e.g. *0712345678* or *0112345678*) to receive the STK push prompt.`;
          }

          replyText =
            `✅ *Taxpayer Record Found!*\n\n` +
            `• *Name:* ${masked.taxpayerName}\n` +
            `• *PIN:* \`${masked.pin}\`\n` +
            `• *Station:* ${taxpayer.station || 'KRA Main'}\n\n` +
            `*Download Fee:* KES 30.00\n\n` +
            menuText;
        }
      }
    }
    // 4. Step AWAITING_PAYMENT_METHOD / AWAITING_CONFIRMATION / AWAITING_PHONE_NUMBER
    else if (
      currentStep === 'AWAITING_PAYMENT_METHOD' ||
      currentStep === 'AWAITING_CONFIRMATION' ||
      currentStep === 'AWAITING_PHONE_NUMBER'
    ) {
      const pinToDownload = metadata.pin;
      const downloadFee = Number(process.env.PAYSTACK_DOWNLOAD_FEE_KES || 30);
      const explicitPhone = extractKenyanPhone(incomingText);

      // A. Cancellation
      if (lowerText === '0' || lowerText === 'cancel') {
        metadata.step = 'IDLE';
        nextStep = 'IDLE';
        await db.ai_conversations?.update({
          where: { id: conversation.id },
          data: { metadata },
        });
        replyText = `Operation cancelled. Reply *MENU* whenever you are ready.`;
      }
      // B. User explicitly sent a phone number
      else if (explicitPhone) {
        metadata.paymentPhone = explicitPhone;
        const stkData = await triggerMpesaPush(explicitPhone, pinToDownload, downloadFee);

        if (!stkData.success) {
          replyText = `❌ *Could not initiate M-Pesa STK push to ${formatDisplayPhone(explicitPhone)}:*\n${stkData.error || 'Please check the number and try again'}.\n\n• Send another number (e.g. *0712345678*)\n• Reply *3* to pay with Card/Bank link\n• Reply *0* to cancel`;
        } else {
          nextStep = 'AWAITING_PAYMENT';
          metadata.step = 'AWAITING_PAYMENT';
          metadata.checkoutId = stkData.checkoutRequestId || stkData.CheckoutRequestID || stkData.MerchantRequestID || '';

          await db.ai_conversations?.update({
            where: { id: conversation.id },
            data: { metadata },
          });

          replyText =
            `📲 *M-Pesa STK Push Sent!*\n\n` +
            `A payment prompt for *KES ${downloadFee}.00* has been sent to *${formatDisplayPhone(explicitPhone)}*.\n` +
            `Please check your phone screen and enter your M-Pesa PIN.\n\n` +
            `⏳ Once completed, your *KRA PIN Certificate* and *Official Payment Receipt* PDFs will be delivered right here in WhatsApp automatically!`;
        }
      }
      // C. Option 1: Trigger STK Push to default number (or prompt for one)
      else if (lowerText === '1') {
        const targetPhone = metadata.suggestedPhone || metadata.paymentPhone || extractKenyanPhone(userPhone);
        if (targetPhone) {
          metadata.paymentPhone = targetPhone;
          const stkData = await triggerMpesaPush(targetPhone, pinToDownload, downloadFee);

          if (!stkData.success) {
            replyText = `❌ *Could not initiate M-Pesa STK push to ${formatDisplayPhone(targetPhone)}:*\n${stkData.error || 'Please check the number and try again'}.\n\n• Send a different Safaricom number (e.g. *0712345678*)\n• Reply *3* for Card/Bank link\n• Reply *0* to cancel`;
          } else {
            nextStep = 'AWAITING_PAYMENT';
            metadata.step = 'AWAITING_PAYMENT';
            metadata.checkoutId = stkData.checkoutRequestId || stkData.CheckoutRequestID || stkData.MerchantRequestID || '';

            await db.ai_conversations?.update({
              where: { id: conversation.id },
              data: { metadata },
            });

            replyText =
              `📲 *M-Pesa STK Push Sent!*\n\n` +
              `A payment prompt for *KES ${downloadFee}.00* has been sent to *${formatDisplayPhone(targetPhone)}*.\n` +
              `Please check your phone screen and enter your M-Pesa PIN.\n\n` +
              `⏳ Once completed, your *KRA PIN Certificate* and *Official Payment Receipt* PDFs will be delivered right here automatically!`;
          }
        } else {
          nextStep = 'AWAITING_PHONE_NUMBER';
          metadata.step = 'AWAITING_PHONE_NUMBER';
          await db.ai_conversations?.update({
            where: { id: conversation.id },
            data: { metadata },
          });
          replyText =
            `✏️ *Enter M-Pesa Phone Number*\n\n` +
            `Please send the 10-digit Safaricom phone number you want to pay with (e.g. *0712345678* or *0112345678*):`;
        }
      }
      // D. Option 2: Change M-Pesa Number (or Card Link if no phone suggested)
      else if (lowerText === '2') {
        if (metadata.suggestedPhone) {
          nextStep = 'AWAITING_PHONE_NUMBER';
          metadata.step = 'AWAITING_PHONE_NUMBER';
          await db.ai_conversations?.update({
            where: { id: conversation.id },
            data: { metadata },
          });
          replyText =
            `✏️ *Change M-Pesa Number*\n\n` +
            `Please send the Safaricom phone number you want to pay with (e.g. *0712345678* or *0112345678*):`;
        } else {
          // No suggested phone, so option 2 was Card/Bank Link
          const paystackRes = await createPaystackLink(userPhone, pinToDownload, downloadFee, metadata.taxpayerName);
          if (!paystackRes.success || !paystackRes.authorizationUrl) {
            replyText = `❌ *Could not generate online checkout link:*\n${paystackRes.error || 'Please try again later'}.`;
          } else {
            nextStep = 'AWAITING_PAYMENT';
            metadata.step = 'AWAITING_PAYMENT';
            metadata.checkoutId = paystackRes.reference || '';
            await db.ai_conversations?.update({
              where: { id: conversation.id },
              data: { metadata },
            });
            replyText =
              `💳 *Secure Online Payment Link*\n\n` +
              `Click the link below to pay *KES ${downloadFee}.00* with *Debit/Credit Card (Visa, Mastercard)*, *Bank*, or *Apple Pay*:\n` +
              `👉 ${paystackRes.authorizationUrl}\n\n` +
              `⚡ Once payment is approved, your *KRA PIN Certificate* and *Official Payment Receipt* PDFs will be delivered right here in WhatsApp automatically!`;
          }
        }
      }
      // E. Option 3 / Card / Bank / Online Link
      else if (
        lowerText === '3' ||
        lowerText.includes('card') ||
        lowerText.includes('bank') ||
        lowerText.includes('link') ||
        lowerText.includes('paystack')
      ) {
        const paystackRes = await createPaystackLink(userPhone, pinToDownload, downloadFee, metadata.taxpayerName);
        if (!paystackRes.success || !paystackRes.authorizationUrl) {
          replyText = `❌ *Could not generate online checkout link:*\n${paystackRes.error || 'Please try again later'}.`;
        } else {
          nextStep = 'AWAITING_PAYMENT';
          metadata.step = 'AWAITING_PAYMENT';
          metadata.checkoutId = paystackRes.reference || '';
          await db.ai_conversations?.update({
            where: { id: conversation.id },
            data: { metadata },
          });
          replyText =
            `💳 *Secure Online Payment Link*\n\n` +
            `Click the link below to pay *KES ${downloadFee}.00* with *Debit/Credit Card (Visa, Mastercard)*, *Bank*, or *Apple Pay*:\n` +
            `👉 ${paystackRes.authorizationUrl}\n\n` +
            `⚡ Once payment is approved, your *KRA PIN Certificate* and *Official Payment Receipt* PDFs will be delivered right here in WhatsApp automatically!`;
        }
      }
      // F. Fallback guidance
      else {
        replyText =
          `⚠️ *Invalid Selection*\n\n` +
          `• Reply *1* to pay with M-Pesa\n` +
          `• Send a 10-digit phone number (e.g. *0712345678*)\n` +
          `• Reply *3* to pay with Card/Bank link\n` +
          `• Reply *0* to cancel.`;
      }
    }
    // 5. Step AWAITING_PAYMENT: User messages while waiting
    else if (currentStep === 'AWAITING_PAYMENT') {
      const pinToDownload = metadata.pin;
      const downloadFee = Number(process.env.PAYSTACK_DOWNLOAD_FEE_KES || 30);
      const explicitPhone = extractKenyanPhone(incomingText);

      if (lowerText === '0' || lowerText === 'cancel' || lowerText === 'reset' || lowerText === 'menu') {
        metadata.step = 'IDLE';
        nextStep = 'IDLE';
        await db.ai_conversations?.update({
          where: { id: conversation.id },
          data: { metadata },
        });
        replyText = `Session reset. Reply with your *National ID Number* or *KRA PIN* to start a new request.`;
      } else if (explicitPhone) {
        metadata.paymentPhone = explicitPhone;
        const stkData = await triggerMpesaPush(explicitPhone, pinToDownload, downloadFee);
        if (!stkData.success) {
          replyText = `❌ *Could not initiate M-Pesa STK push to ${formatDisplayPhone(explicitPhone)}:*\n${stkData.error || 'Please try again'}.`;
        } else {
          metadata.checkoutId = stkData.checkoutRequestId || stkData.CheckoutRequestID || stkData.MerchantRequestID || '';
          await db.ai_conversations?.update({
            where: { id: conversation.id },
            data: { metadata },
          });
          replyText =
            `📲 *New M-Pesa STK Push Sent!*\n\n` +
            `A payment prompt for *KES ${downloadFee}.00* has been sent to *${formatDisplayPhone(explicitPhone)}*.\n` +
            `Please enter your M-Pesa PIN on your phone.`;
        }
      } else if (lowerText === 'retry' || lowerText === '1') {
        const targetPhone = metadata.paymentPhone || metadata.suggestedPhone;
        if (targetPhone) {
          const stkData = await triggerMpesaPush(targetPhone, pinToDownload, downloadFee);
          replyText = stkData.success
            ? `📲 *Prompt Resent!*\n\nPlease check *${formatDisplayPhone(targetPhone)}* and enter your M-Pesa PIN.`
            : `❌ *Could not resend prompt:*\n${stkData.error || 'Please try another number or use card payment'}.`;
        } else {
          replyText = `Please send your Safaricom number (e.g. *0712345678*) to trigger the M-Pesa prompt.`;
        }
      } else if (lowerText === '3' || lowerText.includes('card') || lowerText.includes('bank') || lowerText.includes('link')) {
        const paystackRes = await createPaystackLink(userPhone, pinToDownload, downloadFee, metadata.taxpayerName);
        if (paystackRes.success && paystackRes.authorizationUrl) {
          replyText =
            `💳 *Online Payment Link:*\n` +
            `👉 ${paystackRes.authorizationUrl}\n\n` +
            `Once completed, your PDFs will be delivered right here!`;
        } else {
          replyText = `Could not generate online link. Please try again or pay via M-Pesa.`;
        }
      } else {
        const paymentPhoneDisplay = metadata.paymentPhone ? formatDisplayPhone(metadata.paymentPhone) : 'your phone';
        replyText =
          `⏳ *Waiting for M-Pesa confirmation...*\n\n` +
          `If you have entered your PIN on *${paymentPhoneDisplay}*, your documents will arrive in this chat shortly.\n\n` +
          `• Reply *RETRY* to resend the prompt\n` +
          `• Send another phone number (e.g. *0712345678*)\n` +
          `• Reply *3* to pay with Card/Bank link\n` +
          `• Reply *MENU* to restart.`;
      }
    }

    // 6. Optional Direct Dispatch to Evolution API
    let sendResult: any = null;
    if (sendDirect && replyText) {
      sendResult = await sendEvolutionTextMessage(userPhone, replyText);
    }

    return {
      success: true,
      userPhone,
      step: nextStep,
      reply: replyText,
      metadata,
      sendResult,
    };
  } catch (error: any) {
    console.error('[WhatsApp Chat Route Error]:', error);
    try {
      const userPhone = sanitizeWhatsAppPhone(rawPhone);
      if (userPhone && sendDirect) {
        await sendEvolutionTextMessage(
          userPhone,
          `⚠️ *KRA System Notice*\n\nUnable to complete lookup for \`${rawMessage}\` at this moment. Please reply with *MENU* to restart.`
        );
      }
    } catch {}
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
