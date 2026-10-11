import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateReceiptPdfBuffer } from '@/lib/certificate-fulfillment';

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
    } = body;

    const db = prisma as any;
    let taxpayerPin = pin;
    let taxpayerName = name;
    let receiptNumber = mpesaReceipt;
    let userPhone = phone;

    if (downloadId) {
      const downloadRecord = await db.certificateDownload?.findFirst({
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

    const pdfBuffer = await generateReceiptPdfBuffer({
      receiptNumber: resolvedReceipt,
      pin: resolvedPin,
      name: resolvedName,
      amount: Number(amount || 30),
      phone: userPhone,
      paymentMethod: 'M-PESA EXPRESS',
    });

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ETR_Receipt_${resolvedReceipt}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('[generate-receipt Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
