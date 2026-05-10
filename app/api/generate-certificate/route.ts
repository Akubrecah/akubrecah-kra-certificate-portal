// ECHO endpoint: POST /api/generate-certificate?echo=true to see exactly what data arrives
// This helps debug missing fields without generating a full PDF
import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { auth } from '@clerk/nextjs/server';
import { logUserActivity } from '@/lib/activity-logger';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    message: 'POST to this endpoint with your form data, or use ?echo=true on POST to see received data',
    hint: 'Use /api/generate-certificate/test (GET) to download a debug PDF with coordinates'
  });
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId }
    });

    const data = await req.json();
    
    // ECHO MODE: Return received data as JSON for debugging
    if (req.nextUrl.searchParams.get('echo') === 'true') {
      console.log('[ECHO] Full received payload:', JSON.stringify(data, null, 2));
      return NextResponse.json({ received: data });
    }

    const { 
      pin, name, idNumber, email, date, mobileNumber,
      building, street, city, county, district,
      taxArea, station, poBox, postalCode,
      currentDate: providedCurrentDate,
      debug = false
    } = data;

    // Full diagnostic log
    console.log('[CERTIFICATE] ============ DATA RECEIVED ============');
    console.log('[CERTIFICATE] Core:', { pin, name, idNumber, email });
    console.log('[CERTIFICATE] Address:', { building, street, city, county, district, taxArea, station, poBox, postalCode });
    console.log('[CERTIFICATE] All keys received:', Object.keys(data));
    console.log('[CERTIFICATE] ==========================================');

    if (!pin || !name) {
      return NextResponse.json({ error: 'PIN and Name are required' }, { status: 400 });
    }

    // Load the template
    const pdfPath = path.resolve(process.cwd(), 'components/receipt - 2026-03-19T144327.386 (Autosaved).pdf');
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`PDF template not found at ${pdfPath}`);
    }
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Get the first page
    const page = pdfDoc.getPages()[0];
    const { width, height } = page.getSize();

    // Embed fonts
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Robust formatting helper
    const toTitleCase = (str: any) => {
      if (!str) return '';
      const s = String(str);
      return s.toLowerCase().replace(/(?:^|\s|-|\/)\S/g, (m) => m.toUpperCase());
    };

    // Always use a valid date — server date as authoritative fallback
    const todayStr = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY
    const today = (date && String(date).trim()) ? String(date).trim() : todayStr;
    const currentDate = (providedCurrentDate && String(providedCurrentDate).trim()) ? String(providedCurrentDate).trim() : todayStr;

    // Draw coordinate grid for debugging if enabled
    if (debug) {
      for (let x = 0; x < width; x += 50) {
        page.drawLine({ start: { x, y: 0 }, end: { x, y: height }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
        page.drawText(x.toString(), { x, y: 10, size: 8, font: regularFont });
      }
      for (let y = 0; y < height; y += 50) {
        page.drawLine({ start: { x: 0, y }, end: { x: width, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
        page.drawText(y.toString(), { x: 10, y, size: 8, font: regularFont });
      }
    }

    // 1. Core Identity
    // Taxpayer PIN (Top Right)
    page.drawText(String(pin).toUpperCase(), {
      x: 495,
      y: height - 130,
      size: 10,
      font: regularFont,
      color: rgb(0, 0, 0),
    });

    // Date stamp (Top Right — next to PIN)
    page.drawText(today, {
      x: 510,
      y: height - 103,
      size: 10,
      font: regularFont,
      color: rgb(0, 0, 0),
    });

    // Taxpayer Name (UPPERCASE)
    page.drawText(String(name).toUpperCase(), {
      x: 245,
      y: height - 242,
      size: 12,
      font: regularFont,
      color: rgb(0, 0, 0),
    });

    // ID Number - Hidden as requested
    /*
    if (idNumber) {
      page.drawText(String(idNumber), {
        x: 150,
        y: height - 260,
        size: 12,
        font: regularFont,
        color: rgb(0, 0, 0),
      });
    }
    */

    // Email
    if (email) {
      page.drawText(String(email).toUpperCase(), {
        x: 245,
        y: height - 257,
        size: 12,
        font: regularFont,
        color: rgb(0, 0, 0),
      });
    }

    // Mobile Number - Hidden as requested
    /*
    if (mobileNumber) {
      page.drawText(String(mobileNumber), {
        x: 480,
        y: height - 257,
        size: 10,
        font: regularFont,
        color: rgb(0, 0, 0),
      });
    }
    */

    // Log for debugging (will show in server console)
    console.log('[GENERATE-CERTIFICATE] Received data for:', name, pin);
    console.log('[GENERATE-CERTIFICATE] Address fields:', { building, street, city, county, district, taxArea, station, poBox, postalCode });

    // 2. Address Details
    // Enforce business rules for specific counties
    const upperCounty = String(county || '').trim().toUpperCase();
    const isSpecialCounty = upperCounty === 'WEST POKOT' || upperCounty === 'TRANS NZOIA';
    
    let displayTaxArea = taxArea;
    if (upperCounty === 'WEST POKOT') {
      displayTaxArea = 'KAPENGURIA';
    }

    let displayStation = station;
    if (isSpecialCounty) {
      displayStation = 'KITALE';
    }

    const addressFields = [
      { label: 'building',   value: building   ? toTitleCase(String(building))   : '' , x: 354, y: height - 310 },
      { label: 'street',     value: street     ? toTitleCase(String(street))     : '' , x: 121, y: height - 327 },
      { label: 'city',       value: city       ? toTitleCase(String(city))       : '' , x: 364, y: height - 327 },
      { label: 'county',     value: upperCounty                                        , x: 100, y: height - 346 },
      { label: 'district',   value: district   ? toTitleCase(String(district))   : '' , x: 348, y: height - 346 },
      { label: 'taxArea',    value: displayTaxArea ? toTitleCase(String(displayTaxArea)) : '', x: 108, y: height - 365 },
      { label: 'station',    value: displayStation ? String(displayStation).toUpperCase() : '', x: 348, y: height - 365 },
      { label: 'poBox',      value: poBox      ? String(poBox)                   : '' , x: 112, y: height - 382 },
      { label: 'postalCode', value: postalCode ? String(postalCode)              : '' , x: 374, y: height - 382 },
    ];

    addressFields.forEach(field => {
      if (field.value && field.value.trim() !== '') {
        console.log(`[GENERATE-CERTIFICATE] Drawing ${field.label}: "${field.value}" at (${field.x}, ${field.y})`);
        page.drawText(field.value, {
          x: field.x,
          y: field.y,
          size: 11,
          font: regularFont,
          color: rgb(0, 0, 0),
        });
      } else {
        console.log(`[GENERATE-CERTIFICATE] SKIPPED ${field.label}: empty value`);
      }
    });

    // 3. Certificate Issue Date (body — below address block)
    page.drawText(today, {
      x: 270,
      y: height - 455,
      size: 12,
      font: regularFont,
      color: rgb(0, 0, 0),
    });

    const modifiedPdfBytes = await pdfDoc.save();

    // Log activity
    if (dbUser) {
      await logUserActivity({
        userId: dbUser.id,
        activityType: 'document',
        description: `Generated KRA certificate for ${name} (${pin})`,
        status: 'success',
        metadata: { pin, name }
      });
    }

    return new NextResponse(modifiedPdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="KRA_Certificate_${pin}.pdf"`,
        'Cache-Control': 'no-store, max-age=0'
      },
    });

  } catch (error: any) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate certificate', message: error.message }, { status: 500 });
  }
}
