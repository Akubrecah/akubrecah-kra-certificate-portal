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
    } = body;

    if (!pin || !name) {
      return NextResponse.json({ success: false, error: 'PIN and Name are required' }, { status: 400 });
    }

    // 3. Resolve template PDF file path
    let templatePath = path.join(process.cwd(), 'public', 'receipt-template.pdf');
    
    if (!fs.existsSync(templatePath)) {
      // Fallback 1: check root directory
      const rootFallback = path.join(process.cwd(), 'receipt-template.pdf');
      if (fs.existsSync(rootFallback)) {
        templatePath = rootFallback;
      } else {
        // Fallback 2: check relative to current dir
        const relativeFallback = path.join(__dirname, '..', '..', '..', '..', 'public', 'receipt-template.pdf');
        if (fs.existsSync(relativeFallback)) {
          templatePath = relativeFallback;
        } else {
          console.error(`[generate-certificate] Template file not found at path: ${templatePath}`);
          return NextResponse.json({ success: false, error: 'Certificate template file not found on server. Checked paths: ' + templatePath + ', ' + rootFallback + ', ' + relativeFallback }, { status: 500 });
        }
      }
    }

    // 4. Load the PDF document
    const pdfBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const page = pdfDoc.getPages()[0];
    const { height } = page.getSize();

    // Embed standard fonts
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const BLACK = rgb(0, 0, 0);
    const today = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY

    // Helper function to draw text safely
    const drawText = (text: string | null | undefined, x: number, y: number, size = 11) => {
      const value = String(text || '').trim();
      if (!value) return;
      page.drawText(value, { x, y, size, font: regularFont, color: BLACK });
    };

    // 5. Draw details on the PDF exactly like test-certificate.js
    // Core identity
    drawText(pin.toUpperCase(), 495, height - 130, 10);              // PIN top-right
    drawText(today, 510, height - 103, 10);                           // Date top-right
    drawText(name.toUpperCase(), 245, height - 242, 12);             // Full Name
    // ID Number is deliberately not printed on the certificate
    drawText(email ? email.toUpperCase() : '', 245, height - 257, 12); // Email

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

    // Issue Date in address section (Taxpayer registration date / effective date)
    drawText(registeredDate || today, 270, height - 455, 12);

    // 6. Serialize document
    const outBytes = await pdfDoc.save();

    // Track certificate generation event in logs
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
      message: `Compliance certificate generated successfully for PIN ${pin}`,
      actor: userEmail,
      ip,
      details: { pin }
    });

    // 7. Return PDF as binary stream
    return new NextResponse(outBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="KRA_Certificate_${pin}.pdf"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });

  } catch (error: any) {
    console.error('[generate-certificate] Error generating certificate:', error.message);
    return NextResponse.json({ success: false, error: 'Internal server error during certificate generation' }, { status: 500 });
  }
}
