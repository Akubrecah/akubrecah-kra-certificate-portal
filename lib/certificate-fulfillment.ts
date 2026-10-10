import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import prisma, { createSystemLog } from '@/lib/prisma';
import { getOrCreateDbUser } from '@/lib/subscription';
import { sanitizeWhatsAppPhone, sendEvolutionDocument, sendEvolutionTextMessage } from '@/lib/evolution';

export interface TaxpayerPdfData {
  pin: string;
  name?: string;
  idNumber?: string;
  email?: string;
  building?: string;
  street?: string;
  city?: string;
  county?: string;
  district?: string;
  taxArea?: string;
  station?: string;
  poBox?: string;
  postalCode?: string;
  registeredDate?: string;
  phoneNumber?: string;
}

/**
 * Generate official KRA PIN Certificate PDF as Buffer using template
 */
export async function generateCertificatePdfBuffer(data: TaxpayerPdfData): Promise<Buffer> {
  const possiblePaths = [
    path.join(process.cwd(), 'public', 'receipt-template.pdf'),
    path.join(process.cwd(), 'receipt-template.pdf'),
    path.join(__dirname, '..', '..', 'public', 'receipt-template.pdf'),
    path.join(__dirname, '..', 'public', 'receipt-template.pdf'),
  ];

  let templatePath = possiblePaths.find((p) => fs.existsSync(p));
  if (!templatePath) {
    throw new Error('Certificate template (receipt-template.pdf) not found on server.');
  }

  const templateBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const page = pdfDoc.getPages()[0];
  const { height } = page.getSize();

  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const BLACK = rgb(0, 0, 0);
  const today = new Date().toLocaleDateString('en-GB');

  const drawText = (text: string | null | undefined, x: number, y: number, size = 11) => {
    const value = String(text || '').trim();
    if (!value) return;
    page.drawText(value, { x, y, size, font: regularFont, color: BLACK });
  };

  const resolvedPin = (data.pin || 'KRA_CERT').toUpperCase();
  const resolvedName = (data.name || 'Registered Taxpayer').toUpperCase();
  const resolvedEmail = data.email ? data.email.toUpperCase() : '';

  // Draw Core Identity
  drawText(resolvedPin, 495, height - 130, 10);
  drawText(today, 510, height - 103, 10);
  drawText(resolvedName, 245, height - 242, 12);
  drawText(resolvedEmail, 245, height - 257, 12);

  // Address Details
  drawText(data.building || '', 354, height - 310, 12);
  drawText(data.street || '', 121, height - 327, 12);
  drawText(data.city || '', 364, height - 327, 12);
  drawText(data.county || '', 100, height - 346, 12);
  drawText(data.district || '', 348, height - 346, 12);
  drawText(data.taxArea || '', 108, height - 365, 12);
  drawText(data.station || '', 348, height - 365, 12);
  drawText(data.poBox || '', 112, height - 382, 12);
  drawText(data.postalCode || '', 374, height - 382, 12);

  // Registration Date
  drawText(data.registeredDate || today, 270, height - 455, 12);

  const outBytes = await pdfDoc.save();
  return Buffer.from(outBytes);
}

/**
 * Generate official transaction receipt PDF as Buffer
 */
export async function generateReceiptPdfBuffer(opts: {
  receiptNumber: string;
  pin: string;
  name: string;
  amount: number;
  phone?: string;
  paymentMethod?: string;
}): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 Size
  const { width, height } = page.getSize();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const PRIMARY_BLUE = rgb(0.08, 0.22, 0.38); // #143861
  const ACCENT_GREEN = rgb(0.12, 0.53, 0.28); // #1f8747
  const TEXT_DARK = rgb(0.15, 0.15, 0.15);
  const TEXT_MUTED = rgb(0.45, 0.45, 0.45);
  const BG_LIGHT = rgb(0.96, 0.97, 0.98);
  const LINE_COLOR = rgb(0.85, 0.88, 0.91);

  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const resolvedAmount = `KES ${Number(opts.amount || 30).toFixed(2)}`;

  // Header banner
  page.drawRectangle({
    x: 0,
    y: height - 120,
    width: width,
    height: 120,
    color: PRIMARY_BLUE,
  });

  page.drawText('AKUBRECAH CERTIFICATE PORTAL', {
    x: 50,
    y: height - 55,
    size: 18,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText('OFFICIAL TRANSACTION RECEIPT', {
    x: 50,
    y: height - 78,
    size: 11,
    font: fontRegular,
    color: rgb(0.85, 0.9, 0.95),
  });

  page.drawText('STATUS: PAID', {
    x: width - 150,
    y: height - 65,
    size: 12,
    font: fontBold,
    color: rgb(0.4, 0.9, 0.5),
  });

  // Meta Box
  page.drawRectangle({
    x: 50,
    y: height - 210,
    width: width - 100,
    height: 70,
    color: BG_LIGHT,
    borderColor: LINE_COLOR,
    borderWidth: 1,
  });

  page.drawText('RECEIPT NO:', { x: 70, y: height - 165, size: 9, font: fontBold, color: TEXT_MUTED });
  page.drawText(opts.receiptNumber, { x: 70, y: height - 185, size: 12, font: fontBold, color: TEXT_DARK });

  page.drawText('DATE & TIME:', { x: 230, y: height - 165, size: 9, font: fontBold, color: TEXT_MUTED });
  page.drawText(formattedDate, { x: 230, y: height - 185, size: 11, font: fontRegular, color: TEXT_DARK });

  page.drawText('PAYMENT METHOD:', { x: 410, y: height - 165, size: 9, font: fontBold, color: TEXT_MUTED });
  page.drawText(opts.paymentMethod || 'M-PESA / PAYSTACK', { x: 410, y: height - 185, size: 11, font: fontBold, color: ACCENT_GREEN });

  // Customer Details
  let currentY = height - 250;
  page.drawText('CUSTOMER & SERVICE DETAILS', {
    x: 50,
    y: currentY,
    size: 12,
    font: fontBold,
    color: PRIMARY_BLUE,
  });

  currentY -= 15;
  page.drawLine({
    start: { x: 50, y: currentY },
    end: { x: width - 50, y: currentY },
    thickness: 1,
    color: LINE_COLOR,
  });

  const drawRow = (label: string, value: string, yPos: number) => {
    page.drawText(label, { x: 60, y: yPos, size: 10, font: fontRegular, color: TEXT_MUTED });
    page.drawText(value, { x: 220, y: yPos, size: 10, font: fontBold, color: TEXT_DARK });
  };

  currentY -= 25;
  drawRow('Taxpayer Name:', opts.name || 'Registered Taxpayer', currentY);
  currentY -= 22;
  drawRow('KRA PIN Number:', opts.pin.toUpperCase(), currentY);
  if (opts.phone) {
    currentY -= 22;
    drawRow('Mobile Phone:', opts.phone, currentY);
  }
  currentY -= 22;
  drawRow('Delivery Channel:', 'WhatsApp Direct PDF Delivery', currentY);

  // Line Items Table
  currentY -= 40;
  page.drawRectangle({
    x: 50,
    y: currentY - 25,
    width: width - 100,
    height: 25,
    color: PRIMARY_BLUE,
  });

  page.drawText('ITEM DESCRIPTION', { x: 65, y: currentY - 17, size: 9, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('QTY', { x: 380, y: currentY - 17, size: 9, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('AMOUNT (KES)', { x: 440, y: currentY - 17, size: 9, font: fontBold, color: rgb(1, 1, 1) });

  currentY -= 45;
  page.drawText('KRA PIN Registration Certificate Retrieval & Verification', {
    x: 65,
    y: currentY,
    size: 10,
    font: fontRegular,
    color: TEXT_DARK,
  });
  page.drawText('1', { x: 390, y: currentY, size: 10, font: fontRegular, color: TEXT_DARK });
  page.drawText(resolvedAmount, { x: 440, y: currentY, size: 10, font: fontBold, color: TEXT_DARK });

  currentY -= 20;
  page.drawLine({
    start: { x: 50, y: currentY },
    end: { x: width - 50, y: currentY },
    thickness: 1,
    color: LINE_COLOR,
  });

  // Total Paid Box
  currentY -= 40;
  page.drawRectangle({
    x: width - 260,
    y: currentY - 30,
    width: 210,
    height: 35,
    color: BG_LIGHT,
    borderColor: ACCENT_GREEN,
    borderWidth: 1.5,
  });

  page.drawText('TOTAL PAID:', { x: width - 245, y: currentY - 18, size: 11, font: fontBold, color: PRIMARY_BLUE });
  page.drawText(resolvedAmount, { x: width - 145, y: currentY - 18, size: 12, font: fontBold, color: ACCENT_GREEN });

  // Footer
  page.drawLine({
    start: { x: 50, y: 100 },
    end: { x: width - 50, y: 100 },
    thickness: 1,
    color: LINE_COLOR,
  });

  page.drawText('Thank you for choosing Akubrecah KRA Portal.', {
    x: 50,
    y: 80,
    size: 9,
    font: fontBold,
    color: TEXT_DARK,
  });
  page.drawText('This receipt serves as official electronic proof of service payment. Generated automatically via WhatsApp Portal.', {
    x: 50,
    y: 65,
    size: 8,
    font: fontRegular,
    color: TEXT_MUTED,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * End-to-end WhatsApp document delivery orchestrator.
 * Generates both Certificate and Receipt PDFs, then dispatches them directly to the user on WhatsApp.
 */
export async function fulfillWhatsAppCertificateDelivery(opts: {
  phone: string;
  pin: string;
  checkoutId: string;
  mpesaReceipt?: string;
  amount?: number;
  taxpayerName?: string;
  taxpayerDetails?: any;
}): Promise<{ success: boolean; error?: string }> {
  const { phone, pin, checkoutId, amount = 20 } = opts;
  const db = prisma as any;
  const userPhone = sanitizeWhatsAppPhone(phone);
  const cleanPin = pin ? pin.toUpperCase().trim() : 'KRA_CERT';
  const receiptNum = opts.mpesaReceipt || `REC-${Date.now().toString(36).toUpperCase()}`;

  console.log(`[Fulfillment] Initiating WhatsApp document delivery for PIN ${cleanPin} to ${userPhone}`);

  try {
    // 1. Resolve taxpayer details: prefer passed in-memory taxpayerDetails
    let details: any = opts.taxpayerDetails || null;
    if (!details && db.kra_pin_cache && cleanPin) {
      try {
        details = await db.kra_pin_cache.findFirst({
          where: { pin: cleanPin },
        });
      } catch (cacheErr: any) {
        console.warn('[Fulfillment] Cache query notice:', cacheErr.message);
      }
    }
    details = details || {};

    const resolvedName = opts.taxpayerName || details.name || details.taxpayerName || 'Registered Taxpayer';

    // 2. Ensure CertificateDownload record exists in database
    const dbUser = await getOrCreateDbUser(
      'wa_' + userPhone,
      `wa_${userPhone}@akubrecah.co.ke`,
      resolvedName
    );

    let downloadRecord = await db.certificateDownload?.findFirst({
      where: { checkoutId },
    });

    if (!downloadRecord && db.certificateDownload) {
      downloadRecord = await db.certificateDownload.create({
        data: {
          userId: dbUser.id,
          clerkId: 'wa_' + userPhone,
          pin: cleanPin,
          downloadType: 'pay_per_download',
          amountCharged: amount,
          currency: 'KES',
          mpesaReceipt: receiptNum,
          checkoutId: checkoutId,
        },
      });
    }

    // 3. Generate Certificate PDF Buffer (pure in-memory)
    const certBuffer = await generateCertificatePdfBuffer({
      pin: cleanPin,
      name: resolvedName,
      idNumber: details.id_number || details.idNumber,
      email: details.email,
      building: details.building,
      street: details.street,
      city: details.city || details.town,
      county: details.county,
      district: details.district,
      taxArea: details.tax_area || details.taxArea,
      station: details.station,
      poBox: details.po_box || details.poBox,
      postalCode: details.postal_code || details.postalCode,
      registeredDate: details.registered_date || details.registrationDate,
      phoneNumber: details.phone_number || details.phoneNumber || userPhone,
    });

    // 4. Generate Receipt PDF Buffer
    const receiptBuffer = await generateReceiptPdfBuffer({
      receiptNumber: receiptNum,
      pin: cleanPin,
      name: resolvedName,
      amount: amount,
      phone: userPhone,
      paymentMethod: 'M-PESA EXPRESS',
    });

    // 5. Send Certificate PDF via Evolution API
    const certRes = await sendEvolutionDocument({
      phone: userPhone,
      pdfBuffer: certBuffer,
      fileName: `KRA_PIN_Certificate_${cleanPin}.pdf`,
      caption: `📄 *Official KRA PIN Registration Certificate*\nPIN: \`${cleanPin}\`\nName: *${resolvedName}*`,
    });

    if (!certRes.success) {
      console.error('[Fulfillment] Failed to send certificate document:', certRes.error);
    }

    // Small delay to ensure message ordering in WhatsApp
    await new Promise((r) => setTimeout(r, 1200));

    // 6. Send Receipt PDF via Evolution API
    const receiptRes = await sendEvolutionDocument({
      phone: userPhone,
      pdfBuffer: receiptBuffer,
      fileName: `Payment_Receipt_${receiptNum}.pdf`,
      caption: `🧾 *Official Payment Receipt*\nReceipt: \`${receiptNum}\`\nAmount: *KES ${amount.toFixed(2)}*`,
    });

    if (!receiptRes.success) {
      console.error('[Fulfillment] Failed to send receipt document:', receiptRes.error);
    }

    await new Promise((r) => setTimeout(r, 1000));

    // 7. Send final confirmation text message
    await sendEvolutionTextMessage(
      userPhone,
      `🎉 *Delivery Complete!*\n\n` +
      `Your *KRA PIN Certificate* and *Official Payment Receipt* have been delivered above.\n\n` +
      `• *Taxpayer:* ${resolvedName}\n` +
      `• *PIN:* \`${cleanPin}\`\n` +
      `• *Receipt No:* \`${receiptNum}\`\n\n` +
      `Thank you for using Akubrecah KRA Portal. Send */kra* or */menu* anytime to start a new lookup.`
    );

    // 8. Update conversation step to COMPLETED and end active session
    let conversation = await db.ai_conversations?.findFirst({
      where: {
        channel: 'whatsapp',
        user_phone: userPhone,
        status: 'active',
      },
    });

    if (!conversation && checkoutId) {
      try {
        const convs = await db.ai_conversations?.findMany({
          where: {
            channel: 'whatsapp',
            status: 'active',
          },
        });
        conversation = convs?.find((c: any) => {
          const meta = c.metadata as any;
          return meta?.checkoutId === checkoutId;
        });
      } catch (findErr: any) {
        console.warn('[Fulfillment] Conversation checkoutId fallback lookup notice:', findErr.message);
      }
    }

    if (conversation) {
      const meta = (conversation.metadata as any) || {};
      meta.step = 'COMPLETED';
      meta.activeSession = false;
      meta.mpesaReceipt = receiptNum;
      meta.completedAt = new Date().toISOString();
      await db.ai_conversations?.update({
        where: { id: conversation.id },
        data: {
          metadata: meta,
          updated_at: new Date(),
        },
      });
    }

    await createSystemLog({
      level: 'info',
      service: 'WhatsApp-Fulfillment',
      message: `Delivered KRA Certificate and Receipt to WhatsApp ${userPhone} for PIN ${cleanPin}`,
      actor: `wa_${userPhone}`,
      details: { pin: cleanPin, checkoutId, receiptNum, amount },
    });

    return { success: true };
  } catch (error: any) {
    console.error('[Fulfillment Exception]:', error.message);
    return { success: false, error: error.message };
  }
}
