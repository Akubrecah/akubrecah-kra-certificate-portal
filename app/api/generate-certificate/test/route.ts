/**
 * GET /api/generate-certificate/test
 * Generates a PDF with HARD-CODED test data to verify field coordinates work.
 * If this PDF shows all fields, the issue is in the data pipeline (KRA retrieval), not the PDF generator.
 * If this PDF also shows empty fields, the coordinate mapping needs to be fixed.
 */
import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    const pdfPath = path.resolve(process.cwd(), 'components/receipt - 2026-03-19T144327.386 (Autosaved).pdf');
    if (!fs.existsSync(pdfPath)) {
      return NextResponse.json({ error: `PDF template not found at: ${pdfPath}` }, { status: 500 });
    }

    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const page = pdfDoc.getPages()[0];
    const { width, height } = page.getSize();
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    console.log(`[TEST-PDF] Page size: ${width} x ${height}`);

    // Hard-coded test data — all fields should appear on the PDF
    const testData = {
      pin:        'A001234567Z',
      name:       'JOHN KAMAU TEST',
      idNumber:   '12345678',
      email:      'test@example.com',
      mobileNumber: '0712345678',
      building:   'TIMES TOWER',
      street:     'HAILE SELASSIE AVENUE',
      city:       'NAIROBI',
      county:     'NAIROBI',
      district:   'WESTLANDS',
      taxArea:    'NAIROBI NORTH',
      station:    'UPPERHILL',
      poBox:      '12345',
      postalCode: '00100',
    };

    const today = new Date().toLocaleDateString('en-GB');
    const testRegDate = '12/10/2018';

    // Draw coordinate grid so we can see exact positions
    for (let x = 0; x < width; x += 50) {
      page.drawLine({ start: { x, y: 0 }, end: { x, y: height }, thickness: 0.3, color: rgb(0.85, 0.85, 0.85) });
      page.drawText(String(x), { x: x + 1, y: 5, size: 6, font: regularFont, color: rgb(0.5, 0.5, 0.5) });
    }
    for (let y = 0; y < height; y += 50) {
      page.drawLine({ start: { x: 0, y }, end: { x: width, y }, thickness: 0.3, color: rgb(0.85, 0.85, 0.85) });
      page.drawText(String(y), { x: 2, y: y + 1, size: 6, font: regularFont, color: rgb(0.5, 0.5, 0.5) });
    }

    // ====== DRAW ALL FIELDS (same logic as main route) ======
    page.drawText(testData.pin, { x: 495, y: height - 130, size: 10, font: regularFont, color: rgb(0, 0, 0) });
    page.drawText(today,        { x: 510, y: height - 103, size: 10, font: regularFont, color: rgb(0, 0, 0) });
    page.drawText(testData.name, { x: 245, y: height - 242, size: 12, font: regularFont, color: rgb(0, 0, 0) });
    page.drawText(testData.idNumber, { x: 150, y: height - 260, size: 12, font: regularFont, color: rgb(0, 0, 0) });
    page.drawText(testData.email, { x: 245, y: height - 257, size: 10, font: regularFont, color: rgb(0, 0, 0) });
    page.drawText(testData.mobileNumber, { x: 480, y: height - 257, size: 10, font: regularFont, color: rgb(0, 0, 0) });

    // Address fields
    const addressFields = [
      { label: 'building',   value: testData.building,   x: 354, y: height - 310 },
      { label: 'street',     value: testData.street,     x: 121, y: height - 327 },
      { label: 'city',       value: testData.city,       x: 364, y: height - 327 },
      { label: 'county',     value: testData.county,     x: 100, y: height - 346 },
      { label: 'district',   value: testData.district,   x: 348, y: height - 346 },
      { label: 'taxArea',    value: testData.taxArea,    x: 108, y: height - 365 },
      { label: 'station',    value: testData.station,    x: 348, y: height - 365 },
      { label: 'poBox',      value: testData.poBox,      x: 112, y: height - 382 },
      { label: 'postalCode', value: testData.postalCode, x: 374, y: height - 382 },
    ];

    addressFields.forEach(({ label, value, x, y }) => {
      console.log(`[TEST-PDF] Drawing ${label}="${value}" at (${x}, ${y}), height=${height}`);
      page.drawText(value, { x, y, size: 11, font: regularFont, color: rgb(0, 0, 0) });
    });

    page.drawText(testRegDate, { x: 270, y: height - 455, size: 12, font: regularFont, color: rgb(0, 0, 0) });

    const modifiedPdfBytes = await pdfDoc.save();

    return new NextResponse(modifiedPdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="KRA_Certificate_TEST.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('[TEST-PDF] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
