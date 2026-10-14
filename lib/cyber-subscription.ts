import prisma from '@/lib/prisma';
import QRCode from 'qrcode';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { sendEvolutionDocument, sendEvolutionTextMessage } from '@/lib/evolution';

export interface CyberCafeStatusResult {
  isRegistered: boolean;
  isActive: boolean;
  daysRemaining: number;
  cafe: {
    id: string;
    cafeName: string;
    ownerName: string;
    whatsappPhone: string;
    paymentPhone: string;
    status: string;
    startsAt: Date | null;
    expiresAt: Date | null;
    totalDownloads: number;
    dailyDownloads: number;
  } | null;
  dailyQuotaExceeded: boolean;
  dailyLimit: number;
}

export function formatKenyaPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-\+\(\)@s\.whatsapp\.net]/g, '');
  if ((cleaned.startsWith('7') || cleaned.startsWith('1')) && cleaned.length === 9) {
    return '254' + cleaned;
  }
  if ((cleaned.startsWith('07') || cleaned.startsWith('01')) && cleaned.length === 10) {
    return '254' + cleaned.substring(1);
  }
  if (cleaned.startsWith('254') && cleaned.length === 12) {
    return cleaned;
  }
  return cleaned;
}

export function displayPhone(phone: string): string {
  if (!phone) return '';
  if (phone.startsWith('254') && phone.length === 12) {
    return '0' + phone.substring(3);
  }
  return phone;
}

/**
 * Look up a Cyber Cafe by their WhatsApp number and check subscription validity.
 */
export async function getCyberCafeStatus(whatsappPhone: string): Promise<CyberCafeStatusResult> {
  const cleanPhone = formatKenyaPhone(whatsappPhone);
  const db = prisma as any;

  try {
    const cafe = await db.cyberCafe.findFirst({
      where: {
        OR: [
          { whatsappPhone: cleanPhone },
          { whatsappPhone: cleanPhone.startsWith('254') ? '0' + cleanPhone.substring(3) : cleanPhone },
        ],
      },
      include: {
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!cafe) {
      return {
        isRegistered: false,
        isActive: false,
        daysRemaining: 0,
        cafe: null,
        dailyQuotaExceeded: false,
        dailyLimit: 100,
      };
    }

    const now = new Date();
    const expiresAt = cafe.expiresAt ? new Date(cafe.expiresAt) : null;
    const isActive = Boolean(cafe.status === 'active' && expiresAt && expiresAt > now);

    let daysRemaining = 0;
    if (isActive && expiresAt) {
      const diffMs = expiresAt.getTime() - now.getTime();
      daysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    const todayStr = now.toISOString().split('T')[0];
    const currentDaily = cafe.lastDownloadDate === todayStr ? (cafe.dailyDownloads || 0) : 0;
    const dailyQuotaExceeded = currentDaily >= 100;

    return {
      isRegistered: true,
      isActive,
      daysRemaining,
      cafe: {
        id: cafe.id,
        cafeName: cafe.cafeName,
        ownerName: cafe.ownerName,
        whatsappPhone: cafe.whatsappPhone,
        paymentPhone: cafe.paymentPhone,
        status: cafe.status,
        startsAt: cafe.startsAt,
        expiresAt: cafe.expiresAt,
        totalDownloads: cafe.totalDownloads || 0,
        dailyDownloads: currentDaily,
      },
      dailyQuotaExceeded,
      dailyLimit: 100,
    };
  } catch (error: any) {
    console.error('[getCyberCafeStatus] Error checking cyber cafe status:', error.message);
    return {
      isRegistered: false,
      isActive: false,
      daysRemaining: 0,
      cafe: null,
      dailyQuotaExceeded: false,
      dailyLimit: 100,
    };
  }
}

/**
 * Increment downloads counters for an active cyber cafe.
 */
export async function incrementCyberCafeDownloadCount(cafeId: string): Promise<void> {
  const db = prisma as any;
  const todayStr = new Date().toISOString().split('T')[0];

  try {
    const existing = await db.cyberCafe.findUnique({ where: { id: cafeId } });
    if (!existing) return;

    const isSameDay = existing.lastDownloadDate === todayStr;
    const newDaily = isSameDay ? (existing.dailyDownloads + 1) : 1;

    await db.cyberCafe.update({
      where: { id: cafeId },
      data: {
        totalDownloads: { increment: 1 },
        dailyDownloads: newDaily,
        lastDownloadDate: todayStr,
        updatedAt: new Date(),
      },
    });
  } catch (err: any) {
    console.warn('[incrementCyberCafeDownloadCount] Notice:', err.message);
  }
}

/**
 * Activates or renews a Cyber Cafe 30-day unlimited package (KES 500).
 * Stacks 30 days onto remaining time if renewing before expiry.
 */
export async function activateCyberCafeSubscription(params: {
  cafeName: string;
  ownerName: string;
  whatsappPhone: string;
  paymentPhone: string;
  mpesaReceipt?: string;
  checkoutId?: string;
  amountKes?: number;
  clerkUserId?: string;
}): Promise<{
  success: boolean;
  cafe: any;
  invoice: any;
  daysRemaining: number;
  isRenewal: boolean;
  error?: string;
}> {
  const {
    cafeName,
    ownerName,
    whatsappPhone,
    paymentPhone,
    mpesaReceipt = `CYBER-${Date.now()}`,
    checkoutId,
    amountKes = 500,
    clerkUserId,
  } = params;

  const cleanWaPhone = formatKenyaPhone(whatsappPhone);
  const cleanPayPhone = formatKenyaPhone(paymentPhone);
  const db = prisma as any;

  try {
    const now = new Date();
    const existing = await db.cyberCafe.findFirst({
      where: {
        OR: [
          { whatsappPhone: cleanWaPhone },
          { whatsappPhone: cleanWaPhone.startsWith('254') ? '0' + cleanWaPhone.substring(3) : cleanWaPhone },
          ...(clerkUserId ? [{ clerkUserId }] : []),
        ],
      },
    });

    let newStartsAt = now;
    let newExpiresAt: Date;
    let periodStart = now;
    let isRenewal = false;

    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

    if (existing && existing.expiresAt && new Date(existing.expiresAt) > now) {
      // Stack +30 days on top of current expiry date
      isRenewal = true;
      periodStart = new Date(existing.expiresAt);
      newExpiresAt = new Date(new Date(existing.expiresAt).getTime() + THIRTY_DAYS_MS);
      newStartsAt = existing.startsAt || now;
    } else {
      newExpiresAt = new Date(now.getTime() + THIRTY_DAYS_MS);
    }

    let cafe: any;
    if (existing) {
      cafe = await db.cyberCafe.update({
        where: { id: existing.id },
        data: {
          cafeName: cafeName || existing.cafeName,
          ownerName: ownerName || existing.ownerName,
          whatsappPhone: cleanWaPhone,
          paymentPhone: cleanPayPhone,
          status: 'active',
          startsAt: newStartsAt,
          expiresAt: newExpiresAt,
          clerkUserId: clerkUserId || existing.clerkUserId,
          updatedAt: now,
        },
      });
    } else {
      cafe = await db.cyberCafe.create({
        data: {
          cafeName,
          ownerName,
          whatsappPhone: cleanWaPhone,
          paymentPhone: cleanPayPhone,
          status: 'active',
          startsAt: newStartsAt,
          expiresAt: newExpiresAt,
          clerkUserId: clerkUserId || null,
          totalDownloads: 0,
          dailyDownloads: 0,
        },
      });
    }

    // Generate unique invoice number: INV-CYBER-YYYY-XXXXX
    const year = now.getFullYear();
    const randCode = Math.floor(10000 + Math.random() * 90000);
    const invoiceNumber = `INV-CYBER-${year}-${randCode}`;

    const invoice = await db.cyberInvoice.create({
      data: {
        invoiceNumber,
        cyberCafeId: cafe.id,
        amount: Number(amountKes),
        currency: 'KES',
        mpesaReceipt,
        checkoutId,
        status: 'paid',
        periodStart,
        periodEnd: newExpiresAt,
        notes: `30-Day Cyber Cafe Unlimited Package for ${cafe.cafeName}`,
      },
    });

    const daysRemaining = Math.max(1, Math.ceil((newExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    return {
      success: true,
      cafe,
      invoice,
      daysRemaining,
      isRenewal,
    };
  } catch (error: any) {
    console.error('[activateCyberCafeSubscription] Error:', error.message);
    return {
      success: false,
      cafe: null,
      invoice: null,
      daysRemaining: 0,
      isRenewal: false,
      error: error.message,
    };
  }
}

/**
 * Generates an official, legal Fiscal Tax Invoice PDF (A4 standard)
 * for the Cyber Cafe monthly KES 500 subscription.
 */
export async function generateCyberInvoicePdfBuffer(opts: {
  invoiceNumber: string;
  cafeName: string;
  ownerName: string;
  whatsappPhone: string;
  paymentPhone: string;
  amount: number;
  mpesaReceipt: string;
  periodStart: Date;
  periodEnd: Date;
  dateStr?: string;
}): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  // Standard A4 dimensions in points: 595.28 x 841.89
  const width = 595.28;
  const height = 841.89;
  const page = pdfDoc.addPage([width, height]);

  const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const cleanCafe = (opts.cafeName || 'CYBER CAFE').toUpperCase().trim();
  const cleanOwner = (opts.ownerName || 'AUTHORIZED AGENT').toUpperCase().trim();
  const cleanInvoice = opts.invoiceNumber;
  const cleanReceipt = opts.mpesaReceipt;
  const totalAmount = Number(opts.amount || 500);

  // 16% VAT Calculation
  const netAmount = (totalAmount / 1.16).toFixed(2);
  const vatAmount = (totalAmount - Number(netAmount)).toFixed(2);

  const issueDate = opts.dateStr || new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const periodStartStr = new Date(opts.periodStart).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const periodEndStr = new Date(opts.periodEnd).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const PRIMARY = rgb(0.05, 0.45, 0.25); // Emerald Green
  const DARK = rgb(0.08, 0.08, 0.08);
  const MUTED = rgb(0.4, 0.4, 0.4);
  const LIGHT_GRAY = rgb(0.95, 0.96, 0.97);
  const BORDER_COLOR = rgb(0.85, 0.88, 0.9);

  // Top Accent Banner
  page.drawRectangle({
    x: 0,
    y: height - 12,
    width,
    height: 12,
    color: PRIMARY,
  });

  // Header Title
  page.drawText('AKUBRECAH TECHNOLOGIES LTD', {
    x: 50,
    y: height - 55,
    size: 16,
    font: fontHelveticaBold,
    color: PRIMARY,
  });

  page.drawText('Official KRA Compliance & Tax Portal Service Provider', {
    x: 50,
    y: height - 72,
    size: 9.5,
    font: fontHelvetica,
    color: MUTED,
  });

  page.drawText('PIN: P052184920K  |  VAT NO: 052184920K  |  TEL: +254 791 497 858', {
    x: 50,
    y: height - 86,
    size: 8.5,
    font: fontHelvetica,
    color: MUTED,
  });

  // INVOICE / RECEIPT Badge
  const badgeWidth = 175;
  const badgeHeight = 44;
  page.drawRectangle({
    x: width - 50 - badgeWidth,
    y: height - 85,
    width: badgeWidth,
    height: badgeHeight,
    color: LIGHT_GRAY,
    borderColor: BORDER_COLOR,
    borderWidth: 1,
  });

  page.drawText('OFFICIAL TAX INVOICE', {
    x: width - 50 - badgeWidth + 14,
    y: height - 58,
    size: 11,
    font: fontHelveticaBold,
    color: PRIMARY,
  });

  page.drawText(`STATUS: PAID IN FULL`, {
    x: width - 50 - badgeWidth + 14,
    y: height - 74,
    size: 8.5,
    font: fontHelveticaBold,
    color: PRIMARY,
  });

  // Divider Line
  page.drawLine({
    start: { x: 50, y: height - 105 },
    end: { x: width - 50, y: height - 105 },
    thickness: 1,
    color: BORDER_COLOR,
  });

  // 2-Column Info Box: (Invoice Details & Billed To)
  const boxY = height - 215;
  const boxH = 95;

  // Left: Billed To
  page.drawRectangle({
    x: 50,
    y: boxY,
    width: 240,
    height: boxH,
    color: LIGHT_GRAY,
    borderColor: BORDER_COLOR,
    borderWidth: 1,
  });

  page.drawText('BILLED TO (CYBER CAFE):', {
    x: 62,
    y: boxY + boxH - 18,
    size: 8.5,
    font: fontHelveticaBold,
    color: PRIMARY,
  });

  page.drawText(cleanCafe, {
    x: 62,
    y: boxY + boxH - 34,
    size: 11,
    font: fontHelveticaBold,
    color: DARK,
  });

  page.drawText(`Contact: ${cleanOwner}`, {
    x: 62,
    y: boxY + boxH - 49,
    size: 9,
    font: fontHelvetica,
    color: DARK,
  });

  page.drawText(`Activated WhatsApp: ${displayPhone(opts.whatsappPhone)}`, {
    x: 62,
    y: boxY + boxH - 64,
    size: 9,
    font: fontHelvetica,
    color: DARK,
  });

  page.drawText(`Payment M-Pesa: ${displayPhone(opts.paymentPhone)}`, {
    x: 62,
    y: boxY + boxH - 79,
    size: 8.5,
    font: fontHelvetica,
    color: MUTED,
  });

  // Right: Invoice Meta
  page.drawRectangle({
    x: width - 50 - 240,
    y: boxY,
    width: 240,
    height: boxH,
    color: LIGHT_GRAY,
    borderColor: BORDER_COLOR,
    borderWidth: 1,
  });

  page.drawText('INVOICE & PAYMENT DETAILS:', {
    x: width - 50 - 240 + 12,
    y: boxY + boxH - 18,
    size: 8.5,
    font: fontHelveticaBold,
    color: PRIMARY,
  });

  page.drawText(`Invoice No: ${cleanInvoice}`, {
    x: width - 50 - 240 + 12,
    y: boxY + boxH - 34,
    size: 9.5,
    font: fontHelveticaBold,
    color: DARK,
  });

  page.drawText(`Date Issued: ${issueDate}`, {
    x: width - 50 - 240 + 12,
    y: boxY + boxH - 49,
    size: 9,
    font: fontHelvetica,
    color: DARK,
  });

  page.drawText(`M-Pesa Receipt: ${cleanReceipt}`, {
    x: width - 50 - 240 + 12,
    y: boxY + boxH - 64,
    size: 9,
    font: fontHelveticaBold,
    color: PRIMARY,
  });

  page.drawText(`Validity: ${periodStartStr} - ${periodEndStr}`, {
    x: width - 50 - 240 + 12,
    y: boxY + boxH - 79,
    size: 8.5,
    font: fontHelvetica,
    color: MUTED,
  });

  // Table of Charges
  const tableY = height - 260;
  const tableW = width - 100;

  // Header row
  page.drawRectangle({
    x: 50,
    y: tableY - 24,
    width: tableW,
    height: 24,
    color: PRIMARY,
  });

  page.drawText('DESCRIPTION', { x: 62, y: tableY - 16, size: 9, font: fontHelveticaBold, color: rgb(1, 1, 1) });
  page.drawText('QTY', { x: 340, y: tableY - 16, size: 9, font: fontHelveticaBold, color: rgb(1, 1, 1) });
  page.drawText('NET RATE', { x: 400, y: tableY - 16, size: 9, font: fontHelveticaBold, color: rgb(1, 1, 1) });
  page.drawText('TOTAL (KES)', { x: 485, y: tableY - 16, size: 9, font: fontHelveticaBold, color: rgb(1, 1, 1) });

  // Row 1
  const row1Y = tableY - 60;
  page.drawRectangle({
    x: 50,
    y: row1Y - 15,
    width: tableW,
    height: 50,
    color: rgb(1, 1, 1),
    borderColor: BORDER_COLOR,
    borderWidth: 1,
  });

  page.drawText('Cyber Cafe Monthly Unlimited Package', {
    x: 62,
    y: row1Y + 18,
    size: 10,
    font: fontHelveticaBold,
    color: DARK,
  });

  page.drawText(`• 30 Days Unlimited KRA PIN Certificate Retrievals via WhatsApp Bot`, {
    x: 62,
    y: row1Y + 3,
    size: 8.5,
    font: fontHelvetica,
    color: MUTED,
  });

  page.drawText(`• Valid: ${periodStartStr} to ${periodEndStr} (30 Days)`, {
    x: 62,
    y: row1Y - 9,
    size: 8,
    font: fontHelvetica,
    color: MUTED,
  });

  page.drawText('1 Month', { x: 340, y: row1Y + 8, size: 9, font: fontHelvetica, color: DARK });
  page.drawText(`${netAmount}`, { x: 400, y: row1Y + 8, size: 9, font: fontHelvetica, color: DARK });
  page.drawText(`${totalAmount.toFixed(2)}`, { x: 485, y: row1Y + 8, size: 9.5, font: fontHelveticaBold, color: DARK });

  // Totals Breakdown Box
  const summaryY = row1Y - 120;
  const summaryW = 220;
  const summaryX = width - 50 - summaryW;

  const drawSummaryRow = (label: string, value: string, yPos: number, isBold = false) => {
    const f = isBold ? fontHelveticaBold : fontHelvetica;
    const c = isBold ? DARK : MUTED;
    const s = isBold ? 10 : 9;
    page.drawText(label, { x: summaryX + 10, y: yPos, size: s, font: f, color: c });
    const valWidth = f.widthOfTextAtSize(value, s);
    page.drawText(value, { x: summaryX + summaryW - 10 - valWidth, y: yPos, size: s, font: f, color: c });
  };

  page.drawRectangle({
    x: summaryX,
    y: summaryY,
    width: summaryW,
    height: 95,
    color: LIGHT_GRAY,
    borderColor: BORDER_COLOR,
    borderWidth: 1,
  });

  drawSummaryRow('Subtotal (Net):', `KES ${netAmount}`, summaryY + 72);
  drawSummaryRow('VAT (16% Inclusive):', `KES ${vatAmount}`, summaryY + 52);
  page.drawLine({
    start: { x: summaryX + 10, y: summaryY + 40 },
    end: { x: summaryX + summaryW - 10, y: summaryY + 40 },
    thickness: 1,
    color: BORDER_COLOR,
  });
  drawSummaryRow('TOTAL PAID:', `KES ${totalAmount.toFixed(2)}`, summaryY + 22, true);

  // QR Code for verification
  const verifyUrl = `https://kra-certificate.vercel.app/retrieval-portal?invoice=${encodeURIComponent(cleanInvoice)}&receipt=${encodeURIComponent(cleanReceipt)}`;
  try {
    const qrPng = await QRCode.toBuffer(verifyUrl, {
      type: 'png',
      width: 140,
      margin: 1,
      color: { dark: '#111827', light: '#ffffff' },
    });
    const qrImg = await pdfDoc.embedPng(qrPng);
    const qrSize = 75;
    page.drawImage(qrImg, {
      x: 62,
      y: summaryY + 10,
      width: qrSize,
      height: qrSize,
    });

    page.drawText('SCAN TO VERIFY FISCAL AUTHENTICITY', {
      x: 62,
      y: summaryY - 3,
      size: 7,
      font: fontHelveticaBold,
      color: PRIMARY,
    });
  } catch (qrErr: any) {
    console.warn('[generateCyberInvoicePdfBuffer] QR generation notice:', qrErr.message);
  }

  // Terms and Official Seal
  const footerY = 70;
  page.drawLine({
    start: { x: 50, y: footerY + 45 },
    end: { x: width - 50, y: footerY + 45 },
    thickness: 1,
    color: BORDER_COLOR,
  });

  page.drawText('IMPORTANT NOTES FOR CYBER CAFES:', {
    x: 50,
    y: footerY + 30,
    size: 8,
    font: fontHelveticaBold,
    color: DARK,
  });

  page.drawText(
    '1. Your subscription grants unlimited KRA PIN Certificate retrievals on WhatsApp for 30 consecutive days.\n' +
    '2. Simply send any client National ID number or KRA PIN to receive instantaneous official PDF certificates.\n' +
    '3. Keep this electronic tax invoice for your business records and tax deduction compliance.',
    {
      x: 50,
      y: footerY + 16,
      size: 7.5,
      font: fontHelvetica,
      color: MUTED,
      lineHeight: 11,
    }
  );

  page.drawText('*** THANK YOU FOR EMPOWERING KENYAN TAXPAYERS WITH AKUBRECAH PORTAL ***', {
    x: 100,
    y: 25,
    size: 7.5,
    font: fontHelveticaBold,
    color: PRIMARY,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Deliver the generated Tax Invoice PDF directly to the Cyber Cafe's WhatsApp
 */
export async function deliverCyberInvoiceToWhatsApp(params: {
  whatsappPhone: string;
  invoice: any;
  cafe: any;
  daysRemaining: number;
}): Promise<boolean> {
  const { whatsappPhone, invoice, cafe, daysRemaining } = params;

  try {
    const invoicePdf = await generateCyberInvoicePdfBuffer({
      invoiceNumber: invoice.invoiceNumber,
      cafeName: cafe.cafeName,
      ownerName: cafe.ownerName,
      whatsappPhone: cafe.whatsappPhone,
      paymentPhone: cafe.paymentPhone,
      amount: invoice.amount,
      mpesaReceipt: invoice.mpesaReceipt || 'MPESA-AUTO',
      periodStart: invoice.periodStart,
      periodEnd: invoice.periodEnd,
    });

    const res = await sendEvolutionDocument({
      phone: whatsappPhone,
      pdfBuffer: invoicePdf,
      fileName: `Tax_Invoice_${invoice.invoiceNumber}.pdf`,
      caption: `🧾 *Tax Invoice (${invoice.invoiceNumber})*\n• ${cafe.cafeName} | KES ${Number(invoice.amount).toFixed(2)}\n• Ref: ${invoice.mpesaReceipt} | Active: ${daysRemaining} days`,
    });

    return res.success;
  } catch (err: any) {
    console.error('[deliverCyberInvoiceToWhatsApp] Error delivering invoice:', err.message);
    return false;
  }
}
