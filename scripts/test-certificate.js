// Quick test: generate a certificate with hardcoded test data and save it
// Run: node scripts/test-certificate.js
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function testCertificate() {
  const pdfPath = path.resolve(__dirname, '../components/receipt - 2026-03-19T144327.386 (Autosaved).pdf');
  const pdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const page = pdfDoc.getPages()[0];
  const { width, height } = page.getSize();

  console.log(`Page size: ${width} x ${height}`);

  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const BLACK = rgb(0, 0, 0);

  const today = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY

  // Test data
  const testData = {
    pin: 'A001234567Z',
    name: 'JOHN KAMAU MWANGI',
    idNumber: '30123456',
    email: 'john.kamau@email.com',
    building: 'Test Building',
    street: 'Moi Avenue',
    city: 'Nairobi',
    county: 'NAIROBI',
    district: 'Westlands',
    taxArea: 'Upper Hill',
    station: 'Nairobi',
    poBox: '00100',
    postalCode: '30100',
  };

  const drawText = (text, x, y, size = 11) => {
    console.log(`  Drawing "${text}" at (${x}, ${y})`);
    page.drawText(String(text), { x, y, size, font: regularFont, color: BLACK });
  };

  // Core identity
  drawText(testData.pin.toUpperCase(), 495, height - 130, 10);       // PIN top-right
  drawText(today, 510, height - 103, 10);                            // Date top-right
  drawText(testData.name.toUpperCase(), 245, height - 242, 12);      // Full Name
  drawText(testData.idNumber, 150, height - 260, 12);                // ID Number
  drawText(testData.email.toUpperCase(), 245, height - 257, 12);     // Email

  // Address
  drawText(testData.building, 354, height - 310, 12);
  drawText(testData.street, 121, height - 327, 12);
  drawText(testData.city, 364, height - 327, 12);
  drawText(testData.county, 100, height - 346, 12);
  drawText(testData.district, 348, height - 346, 12);
  drawText(testData.taxArea, 108, height - 365, 12);
  drawText(testData.station, 348, height - 365, 12);
  drawText(testData.poBox, 112, height - 382, 12);
  drawText(testData.postalCode, 374, height - 382, 12);

  // Date in address section (certificate issue date)
  drawText(today, 270, height - 455, 12);

  const outBytes = await pdfDoc.save();
  const outPath = path.resolve(__dirname, '../test-certificate-output.pdf');
  fs.writeFileSync(outPath, outBytes);
  console.log(`\n✅ Test certificate saved to: ${outPath}`);
  console.log('Open it to verify coordinates are correct.');
}

testCertificate().catch(console.error);
