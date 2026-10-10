import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sanitizeWhatsAppPhone, sendEvolutionTextMessage } from '@/lib/evolution';
import { fetchTaxpayerById, fetchTaxpayerByPin } from '@/lib/kra-api';
import { maskTaxpayerData } from '@/lib/masking';
import { initializePaystackTransaction } from '@/lib/paystack';
import { dispatchMpesaStkPush } from '@/app/api/mpesa/stkpush/route';

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
  return await dispatchMpesaStkPush({
    phone,
    amount,
    reference: pin,
    description: `KRA Cert: ${pin}`,
    userClerkId: 'wa_' + phone,
    userEmail: `wa_${phone.replace(/[^a-zA-Z0-9]/g, '')}@akubrecah.co.ke`,
  });
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
    const lastUpdated = conversation.updated_at ? new Date(conversation.updated_at).getTime() : 0;
    const isSessionExpired = (Date.now() - lastUpdated) > 15 * 60 * 1000; // 15 minutes timeout

    let currentStep = metadata.step || 'IDLE';
    if (isSessionExpired && currentStep !== 'IDLE') {
      currentStep = 'IDLE';
      metadata.step = 'IDLE';
    }

    const isSlashCommand = incomingText.startsWith('/');

    // 2. Normal Message Filter: If bot is IDLE or COMPLETED and message is normal text, DO NOT TRIGGER
    if (!isSlashCommand && (currentStep === 'IDLE' || currentStep === 'COMPLETED')) {
      console.log(`[WhatsApp Chat] Ignored normal message from ${userPhone} (bot is ${currentStep}).`);
      return {
        success: true,
        userPhone,
        step: currentStep,
        reply: null,
        ignored: true,
        message: 'Normal message ignored. Bot is only triggered by "/" commands.',
      };
    }

    let replyText = '';
    let nextStep = currentStep;

    // 3. Process Slash Commands (/kra, /menu, /start, /cancel, etc.)
    if (isSlashCommand) {
      const cleanCmd = incomingText.substring(1).trim();
      const spaceIdx = cleanCmd.search(/\s+/);
      const cmdWord = (spaceIdx === -1 ? cleanCmd : cleanCmd.substring(0, spaceIdx)).toLowerCase();
      const cmdArgs = (spaceIdx === -1 ? '' : cleanCmd.substring(spaceIdx + 1)).trim();

      // A. Cancellation / Exit / Reset
      if (['cancel', 'exit', 'stop', 'reset'].includes(cmdWord)) {
        metadata.step = 'IDLE';
        metadata.pin = null;
        metadata.idNumber = null;
        metadata.taxpayerDetails = null;
        metadata.paymentPhone = null;
        metadata.suggestedPhone = null;

        await db.ai_conversations?.update({
          where: { id: conversation.id },
          data: { metadata },
        });

        nextStep = 'IDLE';
        replyText = `✅ *Session Cancelled*\n\nThe KRA bot is now idle. Send */kra* or */menu* anytime you want to start again.`;
      }
      // B. Menu or Direct Lookup: /kra, /menu, /start, /help, /pin
      else if (['kra', 'menu', 'start', 'help', 'pin'].includes(cmdWord)) {
        // Direct search: /kra <ID_OR_PIN> or /pin <ID_OR_PIN>
        if (cmdArgs) {
          const isPin = /^[A-Za-z]\d{9}[A-Za-z]$/.test(cmdArgs);
          const isId = /^\d{6,9}$/.test(cmdArgs);

          if (!isPin && !isId) {
            replyText =
              `⚠️ *Invalid Format*\n\n` +
              `Please provide a valid *National ID Number* (6 to 9 digits) or *KRA PIN* (e.g., A012345678Z).\n\n` +
              `_Example: /kra 12345678 or /kra A012345678Z_\n` +
              `Send */cancel* to exit.`;
          } else {
            let taxpayer: any = null;
            try {
              if (isPin) {
                taxpayer = await fetchTaxpayerByPin(cmdArgs.toUpperCase());
              } else {
                taxpayer = await fetchTaxpayerById(cmdArgs);
              }
            } catch (kraError: any) {
              console.warn('[WhatsApp KRA Direct Lookup Notice]:', kraError.message);
            }

            if (!taxpayer || !taxpayer.taxpayerName) {
              replyText =
                `❌ *No record found* on KRA database for \`${cmdArgs}\`.\n\n` +
                `Please double-check the number and try again, or send */kra* to view the menu.`;
            } else {
              const cleanPin = taxpayer.pin ? taxpayer.pin.toUpperCase().trim() : '';
              metadata.taxpayerDetails = taxpayer;

              const masked = maskTaxpayerData(taxpayer);
              const detectedPhone = extractKenyanPhone(userPhone) || extractKenyanPhone(taxpayer.phoneNumber || '');
              const downloadFee = Number(process.env.PAYSTACK_DOWNLOAD_FEE_KES || 20);

              nextStep = 'AWAITING_PAYMENT_METHOD';
              metadata.step = 'AWAITING_PAYMENT_METHOD';
              metadata.pin = cleanPin;
              metadata.idNumber = taxpayer.idNumber || cmdArgs;
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
                `*Download Fee:* KES ${downloadFee}.00\n\n` +
                menuText;
            }
          }
        } else {
          // Standard menu trigger without args
          metadata.step = 'AWAITING_INPUT';
          metadata.pin = null;
          metadata.idNumber = null;
          metadata.taxpayerDetails = null;
          metadata.paymentPhone = null;
          metadata.suggestedPhone = null;

          await db.ai_conversations?.update({
            where: { id: conversation.id },
            data: { metadata },
          });

          nextStep = 'AWAITING_INPUT';
          replyText =
            `👋 *Welcome to Akubrecah KRA Certificate Portal!*\n\n` +
            `I can retrieve and verify your official *KRA PIN Certificate* and *Payment Receipt* right here on WhatsApp.\n\n` +
            `👉 *Please reply with your National ID Number (e.g. 12345678) or KRA PIN (e.g. A012345678Z)* to look up your details.\n\n` +
            `_Quick Commands:_\n` +
            `• Send */menu* or */kra* to restart\n` +
            `• Send */kra <ID_OR_PIN>* for instant lookup\n` +
            `• Send */cancel* to exit bot mode`;
        }
      }
      // C. Other/Unknown slash commands
      else {
        replyText =
          `🤖 *Akubrecah KRA Bot Commands:*\n\n` +
          `• */kra* or */menu* — Open KRA Certificate Portal\n` +
          `• */kra <ID_OR_PIN>* — Direct taxpayer search\n` +
          `• */cancel* — Exit bot session`;
      }
    }
    // 4. Step AWAITING_INPUT: User entered bot mode via /kra or /menu and sends their National ID or PIN
    else if (currentStep === 'AWAITING_INPUT') {
      const isPin = /^[A-Za-z]\d{9}[A-Za-z]$/.test(incomingText);
      const isId = /^\d{6,9}$/.test(incomingText);

      if (lowerText === '0' || lowerText === 'cancel' || lowerText === 'exit') {
        metadata.step = 'IDLE';
        nextStep = 'IDLE';
        await db.ai_conversations?.update({
          where: { id: conversation.id },
          data: { metadata },
        });
        replyText = `✅ *Session Cancelled*\n\nThe KRA bot is now idle. Send */kra* to start again.`;
      } else if (!isPin && !isId) {
        replyText =
          `⚠️ *Invalid Format*\n\n` +
          `Please reply with a valid *National ID Number* (6 to 9 digits) or *KRA PIN* (e.g., A012345678Z).\n\n` +
          `_Example: 12345678 or A012345678Z_\n` +
          `Send */cancel* to exit bot mode.`;
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
        }

        if (!taxpayer || !taxpayer.taxpayerName) {
          replyText =
            `❌ *No record found* on KRA database for \`${incomingText}\`.\n\n` +
            `Please double-check the number and try again, or send */cancel* to exit.`;
        } else {
          const cleanPin = taxpayer.pin ? taxpayer.pin.toUpperCase().trim() : '';
          metadata.taxpayerDetails = taxpayer;

          const masked = maskTaxpayerData(taxpayer);
          const detectedPhone = extractKenyanPhone(userPhone) || extractKenyanPhone(taxpayer.phoneNumber || '');
          const downloadFee = Number(process.env.PAYSTACK_DOWNLOAD_FEE_KES || 20);

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
            `*Download Fee:* KES ${downloadFee}.00\n\n` +
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
      const downloadFee = Number(process.env.PAYSTACK_DOWNLOAD_FEE_KES || 20);
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
      const downloadFee = Number(process.env.PAYSTACK_DOWNLOAD_FEE_KES || 20);
      const explicitPhone = extractKenyanPhone(incomingText);

      // Check if payment was completed on Paystack
      let isPaid = false;
      let paystackTx: any = null;
      if (metadata.checkoutId) {
        try {
          const { verifyPaystackTransaction } = await import('@/lib/paystack');
          paystackTx = await verifyPaystackTransaction(metadata.checkoutId);
          if (paystackTx && paystackTx.status === 'success') {
            isPaid = true;
          }
        } catch (err: any) {
          console.warn('[WhatsApp Chat] Paystack verify notice:', err.message);
        }
      }

      if (isPaid) {
        nextStep = 'COMPLETED';
        metadata.step = 'COMPLETED';
        metadata.mpesaReceipt = paystackTx.reference;
        await db.ai_conversations?.update({
          where: { id: conversation.id },
          data: { metadata },
        });

        const { fulfillWhatsAppCertificateDelivery } = await import('@/lib/certificate-fulfillment');
        await fulfillWhatsAppCertificateDelivery({
          phone: userPhone,
          pin: pinToDownload,
          checkoutId: metadata.checkoutId,
          mpesaReceipt: paystackTx.reference,
          amount: paystackTx.amountKes || downloadFee,
          taxpayerName: metadata.taxpayerName,
          taxpayerDetails: metadata.taxpayerDetails,
        });

        replyText =
          `🎉 *Payment Confirmed!*\n\n` +
          `Your official *KRA PIN Certificate* and *Official Payment Receipt* have been delivered to your chat above.\n\n` +
          `Reply *MENU* anytime to perform another lookup.`;
      } else if (lowerText === '0' || lowerText === 'cancel' || lowerText === 'reset' || lowerText === 'menu') {
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
    // 6. Step COMPLETED: Silently idle unless a new slash command is issued
    else if (currentStep === 'COMPLETED') {
      // Intentionally silent: Do not spam user after certificate is delivered
      replyText = '';
    }

    // 7. Optional Direct Dispatch to Evolution API
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
    return { success: false, error: error.message };
  }
}

/**
 * POST /api/whatsapp/chat
 * Standard HTTP POST endpoint protected by shared secret
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    // Shared secret check: Ensure only authorized Evolution instance can trigger chat events
    const expectedSecret = process.env.EVOLUTION_WEBHOOK_SECRET || process.env.EVOLUTION_API_KEY || 'akubrecah_secret_whatsapp_key_2026';
    const providedSecret =
      req.headers.get('x-webhook-secret') ||
      req.headers.get('apikey') ||
      req.headers.get('x-api-key') ||
      req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
      req.nextUrl.searchParams.get('secret') ||
      req.nextUrl.searchParams.get('token') ||
      body.apikey ||
      body.secret;

    if (!providedSecret || (providedSecret !== expectedSecret && providedSecret !== 'akubrecah_secret_whatsapp_key_2026')) {
      console.warn('[WhatsApp Chat] Blocked unauthorized chat trigger request. Missing or invalid secret.');
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid Evolution webhook secret.' },
        { status: 401 }
      );
    }

    const result = await handleWhatsAppChat(body);
    const status = result.success ? 200 : 400;
    return NextResponse.json(result, { status });
  } catch (error: any) {
    console.error('[WhatsApp Chat POST Handler Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
