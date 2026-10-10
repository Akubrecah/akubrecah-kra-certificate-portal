import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import prisma from '@/lib/prisma';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      downloadId,
      mpesaReceipt,
      pin,
      name,
      amount = 30,
      phone,
      serviceSecret,
    } = body;

    const db = prisma as any;

    // Optional download record lookup if downloadId is provided
    let downloadRecord: any = null;
    let taxpayerPin = pin;
    let taxpayerName = name;
    let receiptNumber = mpesaReceipt;
    let userPhone = phone;

    if (downloadId) {
      downloadRecord = await db.certificateDownload?.findFirst({
        where: { id: downloadId },
      });
      if (downloadRecord) {
        taxpayerPin = taxpayerPin || downloadRecord.pin;
        receiptNumber = receiptNumber || downloadRecord.mpesaReceipt || 'MPESA_REF';
      }
    }

    if (taxpayerPin && !taxpayerName) {
      const cached = await db.kra_pin_cache?.findFirst({
        where: { pin: String(taxpayerPin).toUpperCase().trim() },
      });
      if (cached) {
        taxpayerName = cached.name;
        userPhone = userPhone || cached.phone_number;
      }
    }

    const resolvedName = taxpayerName || 'Registered Taxpayer';
    const resolvedPin = taxpayerPin ? String(taxpayerPin).toUpperCase() : 'N/A';
    const resolvedReceipt = receiptNumber || 'REC-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    const resolvedAmount = `KES ${Number(amount || 30).toFixed(2)}`;
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Create a new PDF document from scratch using pdf-lib
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 Size in points
    const { width, height } = page.getSize();

    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const PRIMARY_BLUE = rgb(0.08, 0.22, 0.38); // #143861
    const ACCENT_GREEN = rgb(0.12, 0.53, 0.28); // #1f8747
    const TEXT_DARK = rgb(0.15, 0.15, 0.15);
    const TEXT_MUTED = rgb(0.45, 0.45, 0.45);
    const BG_LIGHT = rgb(0.96, 0.97, 0.98);
    const LINE_COLOR = rgb(0.85, 0.88, 0.91);

    // Header Background banner
    page.drawRectangle({
      x: 0,
      y: height - 120,
      width: width,
      height: 120,
      color: PRIMARY_BLUE,
    });

    // Header text
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

    // Receipt Meta Box
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
    page.drawText(resolvedReceipt, { x: 70, y: height - 185, size: 12, font: fontBold, color: TEXT_DARK });

    page.drawText('DATE & TIME:', { x: 230, y: height - 165, size: 9, font: fontBold, color: TEXT_MUTED });
    page.drawText(formattedDate, { x: 230, y: height - 185, size: 11, font: fontRegular, color: TEXT_DARK });

    page.drawText('PAYMENT METHOD:', { x: 410, y: height - 165, size: 9, font: fontBold, color: TEXT_MUTED });
    page.drawText('M-PESA EXPRESS', { x: 410, y: height - 185, size: 11, font: fontBold, color: ACCENT_GREEN });

    // Customer & Taxpayer Details Section
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
    drawRow('Taxpayer Name:', resolvedName, currentY);
    currentY -= 22;
    drawRow('KRA PIN Number:', resolvedPin, currentY);
    if (userPhone) {
      currentY -= 22;
      drawRow('Mobile Phone:', userPhone, currentY);
    }
    currentY -= 22;
    drawRow('Delivery Channel:', 'WhatsApp Direct PDF Delivery', currentY);

    // Line items table
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

    // Total Amount Box
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

    page.drawText('Thank you for using Akubrecah KRA Portal.', {
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

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Receipt_${resolvedReceipt}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('[generate-receipt Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
