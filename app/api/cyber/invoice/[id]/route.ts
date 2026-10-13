import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateCyberInvoicePdfBuffer } from '@/lib/cyber-subscription';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Invoice ID is required' }, { status: 400 });
    }

    const db = prisma as any;
    const invoice = await db.cyberInvoice.findUnique({
      where: { id },
      include: {
        cyberCafe: true,
      },
    });

    if (!invoice || !invoice.cyberCafe) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    const pdfBuffer = await generateCyberInvoicePdfBuffer({
      invoiceNumber: invoice.invoiceNumber,
      cafeName: invoice.cyberCafe.cafeName,
      ownerName: invoice.cyberCafe.ownerName,
      whatsappPhone: invoice.cyberCafe.whatsappPhone,
      paymentPhone: invoice.cyberCafe.paymentPhone,
      amount: invoice.amount,
      mpesaReceipt: invoice.mpesaReceipt || "CONFIRMED",
      periodStart: invoice.periodStart,
      periodEnd: invoice.periodEnd,
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${invoice.invoiceNumber}.pdf"`,
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error: any) {
    console.error('[api/cyber/invoice/[id]] Error:', error.message);
    return NextResponse.json({ success: false, error: 'Failed to generate invoice PDF' }, { status: 500 });
  }
}
