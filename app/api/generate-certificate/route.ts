import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { createSystemLog } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce Clerk authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // 2. Parse request payload
    const body = await req.json();
    const {
      pin,
      name,
      idNumber,
      email,
      building,
      street,
      city,
      county,
      district,
      taxArea,
      station,
      poBox,
      postalCode,
      mobileNumber,
      registeredDate,
      downloadId, // Required — server-issued after payment/subscription validation
    } = body;

    if (!pin || !name) {
      return NextResponse.json({ success: false, error: 'PIN and Name are required' }, { status: 400 });
    }

    // 3. Server-side authorization: require a valid downloadId
    if (!downloadId) {
      return NextResponse.json(
        { success: false, error: 'Download authorization required. Please complete the payment or subscription flow.' },
        { status: 403 }
      );
    }

    const prismaModule = await import('@/lib/prisma');
    const db = prismaModule.default as any;

    // Resolve DB user
    const dbUser = await db.users?.findFirst({ where: { clerkId: userId } });
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User record not found.' }, { status: 404 });
    }

    // Validate the download record belongs to this user and PIN
    const downloadRecord = await db.certificateDownload?.findFirst({
      where: {
        id: downloadId,
        userId: dbUser.id,
        pin: pin.toUpperCase(),
      },
    });

    if (!downloadRecord) {
      return NextResponse.json(
        { success: false, error: 'Invalid or unauthorized download. Please retry the payment flow.' },
        { status: 403 }
      );
    }

    // 4. Resolve template PDF file path
    let templatePath = path.join(process.cwd(), 'public', 'receipt-template.pdf');

    if (!fs.existsSync(templatePath)) {
      const rootFallback = path.join(process.cwd(), 'receipt-template.pdf');
      if (fs.existsSync(rootFallback)) {
        templatePath = rootFallback;
      } else {
        const relativeFallback = path.join(__dirname, '..', '..', '..', '..', 'public', 'receipt-template.pdf');
        if (fs.existsSync(relativeFallback)) {
          templatePath = relativeFallback;
        } else {
          console.error(`[generate-certificate] Template file not found: ${templatePath}`);
          return NextResponse.json({ success: false, error: 'Certificate template not found on server.' }, { status: 500 });
        }
      }
    }

    // 5. Load PDF and draw
    const pdfBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
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

    // Core identity
    drawText(pin.toUpperCase(), 495, height - 130, 10);
    drawText(today, 510, height - 103, 10);
    drawText(name.toUpperCase(), 245, height - 242, 12);
    drawText(email ? email.toUpperCase() : '', 245, height - 257, 12);

    // Address
    drawText(building, 354, height - 310, 12);
    drawText(street, 121, height - 327, 12);
    drawText(city, 364, height - 327, 12);
    drawText(county, 100, height - 346, 12);
    drawText(district, 348, height - 346, 12);
    drawText(taxArea, 108, height - 365, 12);
    drawText(station, 348, height - 365, 12);
    drawText(poBox, 112, height - 382, 12);
    drawText(postalCode, 374, height - 382, 12);

    // Registration / effective date
    drawText(registeredDate || today, 270, height - 455, 12);

    // 6. Serialize
    const outBytes = await pdfDoc.save();

    // Audit log
    let userEmail = userId;
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      userEmail = user.primaryEmailAddress?.emailAddress || userId;
    } catch {}

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';

    await createSystemLog({
      level: 'info',
      service: 'Certificate-Generation',
      message: `Compliance certificate generated for PIN ${pin}`,
      actor: userEmail,
      ip,
      details: { pin, downloadId, downloadType: downloadRecord.downloadType },
    });

    return new NextResponse(outBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="KRA_Certificate_${pin}.pdf"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });

  } catch (error: any) {
    console.error('[generate-certificate] Error:', error.message);
    return NextResponse.json({ success: false, error: 'Internal server error during certificate generation' }, { status: 500 });
  }
}
