import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import { auth } from '@clerk/nextjs/server';

export const maxDuration = 60;

// ─────────────────────────────────────────────────────────────────────────────
// Raw HTTPS helpers
// ─────────────────────────────────────────────────────────────────────────────

function initKraSession(): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'itax.kra.go.ke',
      port: 443,
      path: '/KRA-Portal/pinChecker.htm?actionCode=loadPage&viewType=static',
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' },
      timeout: 20000,
      rejectUnauthorized: false,
    } as any, (res) => {
      const cookieMap: Record<string, string> = {};
      ((res.headers['set-cookie'] as string[]) || []).forEach((c) => {
        const [nv] = c.split(';');
        const idx = nv.indexOf('=');
        if (idx > 0) cookieMap[nv.substring(0, idx).trim()] = nv.substring(idx + 1).trim();
      });
      // consume body so socket can be reused
      res.resume();
      resolve(cookieMap);
    });
    req.on('error', reject);
    req.end();
  });
}

function httpsPost(path: string, body: string, cookieString: string, contentType = 'application/x-www-form-urlencoded'): Promise<string> {
  return new Promise((resolve, reject) => {
    const buf = Buffer.from(body, 'utf8');
    const req = https.request({
      hostname: 'itax.kra.go.ke',
      port: 443,
      path,
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        'Content-Length': buf.length,
        'Cookie': cookieString,
        'Referer': 'https://itax.kra.go.ke/KRA-Portal/pinChecker.htm',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest',
      },
      timeout: 25000,
      rejectUnauthorized: false,
    } as any, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
    req.on('error', reject);
    req.write(buf);
    req.end();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1: Resolve PIN from ID via DWR
// ─────────────────────────────────────────────────────────────────────────────

async function lookupPinByIdNumber(idNumber: string, cookieString: string): Promise<string | null> {
  const sid = `${randHex(12)}/${randHex(12)}`;
  const wn  = `W${Date.now()}`;

  const body = [
    'callCount=1', `windowName=${wn}`,
    'c0-scriptName=findPinByIdno', 'c0-methodName=findPinByIdnumber', 'c0-id=0',
    `c0-param0=string:${idNumber}`, 'batchId=0', 'instanceId=0',
    'page=%2FKRA-Portal%2FpinChecker.htm', 'httpSessionId=', `scriptSessionId=${sid}`,
  ].join('\n') + '\n';

  const raw = await httpsPost(
    '/KRA-Portal/dwr/call/plaincall/findPinByIdno.findPinByIdnumber.dwr',
    body, cookieString, 'text/plain'
  );
  console.log('[retrieve] PIN lookup raw:', raw.substring(0, 350));

  const m = raw.match(/handleCallback\([^,]+,[^,]+,"([^"]+)"\)/);
  if (m) {
    const val = m[1];
    if (val.includes('#$')) {
      const [masked, rev] = val.split('#$');
      return masked.replace('*****', rev.split('').reverse().join('')).trim().toUpperCase();
    }
    return val.trim().toUpperCase();
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2: Parse ALL taxpayer details from the KRA Pin Checker HTML response
// The HTML returned after CAPTCHA submission contains:
//   - Taxpayer Name, PIN, Registration Date
//   - Physical Address: Building, Street, Town, County, District
//   - Tax Area, Station, PO Box, Postal Code
//   - Phone Number, Email
//   - Obligation Details table (effective dates)
// ─────────────────────────────────────────────────────────────────────────────

interface PinCheckerResult {
  name: string;
  pin: string;
  registeredDate: string;
  obligationDate: string;
  building: string;
  street: string;
  town: string;
  county: string;
  district: string;
  taxArea: string;
  station: string;
  poBox: string;
  postalCode: string;
  phoneNumber: string;
  email: string;
  captchaWrong: boolean;
}

function parsePinCheckerHtml(html: string): PinCheckerResult {
  const result: PinCheckerResult = {
    name: '', pin: '', registeredDate: '', obligationDate: '',
    building: '', street: '', town: '', county: '', district: '',
    taxArea: '', station: '', poBox: '', postalCode: '',
    phoneNumber: '', email: '', captchaWrong: false,
  };

  if (html.includes('Wrong result of the arithmetic operation.') ||
      html.includes('wrong result') ||
      html.includes('captchaError')) {
    result.captchaWrong = true;
    return result;
  }

  // Strip HTML tags for easier text extraction
  const stripTags = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

  // Helper: extract value after a label inside table cells
  // KRA HTML structure: <td>Label</td><td>Value</td>
  const extractAfterLabel = (label: string, searchArea: string): string => {
    const lc = searchArea.toLowerCase();
    const idx = lc.indexOf(label.toLowerCase());
    if (idx === -1) return '';
    // Find the closing </td> after the label, then grab the next <td>
    const afterLabel = searchArea.substring(idx);
    const tdClose = afterLabel.indexOf('</td>');
    if (tdClose === -1) return '';
    const afterClose = afterLabel.substring(tdClose + 5);
    const nextTdOpen = afterClose.indexOf('<td');
    if (nextTdOpen === -1) return '';
    const nextTd = afterClose.substring(nextTdOpen);
    const nextTdClose = nextTd.indexOf('</td>');
    if (nextTdClose === -1) return '';
    return stripTags(nextTd.substring(0, nextTdClose));
  };

  // Find PIN Details section
  const pinDetailsIdx = html.indexOf('PIN Details');
  if (pinDetailsIdx === -1) {
    console.log('[retrieve][parse] PIN Details section not found in HTML');
    return result;
  }

  // Work within the PIN Details section (up to next major section or end)
  const fullSection = html.substring(pinDetailsIdx);
  console.log('[retrieve][parse] fullSection length:', fullSection.length);
  console.log('[retrieve][parse] fullSection snippet:', stripTags(fullSection.substring(0, 800)));

  // Extract Taxpayer Name
  result.name = extractAfterLabel('Taxpayer Name', fullSection)
    || extractAfterLabel('Tax Payer Name', fullSection)
    || extractAfterLabel('Full Name', fullSection);

  // Extract PIN
  result.pin = extractAfterLabel('PIN Number', fullSection)
    || extractAfterLabel('KRA PIN', fullSection)
    || extractAfterLabel('PIN', fullSection);

  // Extract Registration Date (PIN Registration Date or Effective Date)
  result.registeredDate = extractAfterLabel('PIN Registration Date', fullSection)
    || extractAfterLabel('Registration Date', fullSection)
    || extractAfterLabel('Effective Date', fullSection);

  // Validate date format DD/MM/YYYY
  if (result.registeredDate && !/^\d{2}\/\d{2}\/\d{4}$/.test(result.registeredDate)) {
    const m = result.registeredDate.match(/(\d{2}\/\d{2}\/\d{4})/);
    result.registeredDate = m ? m[1] : '';
  }

  // Address fields
  result.building = extractAfterLabel('Building Name', fullSection)
    || extractAfterLabel('Building', fullSection)
    || extractAfterLabel('Plot No', fullSection);

  result.street = extractAfterLabel('Street Name', fullSection)
    || extractAfterLabel('Street', fullSection)
    || extractAfterLabel('Road', fullSection);

  result.town = extractAfterLabel('City/Town', fullSection)
    || extractAfterLabel('Town', fullSection)
    || extractAfterLabel('City', fullSection);

  result.county = extractAfterLabel('County', fullSection);

  result.district = extractAfterLabel('District', fullSection)
    || extractAfterLabel('Sub County', fullSection);

  result.taxArea = extractAfterLabel('Tax Area', fullSection)
    || extractAfterLabel('Tax Area Locality', fullSection)
    || extractAfterLabel('Locality', fullSection);

  result.station = extractAfterLabel('Station', fullSection)
    || extractAfterLabel('KRA Station', fullSection);

  result.poBox = extractAfterLabel('P.O. Box', fullSection)
    || extractAfterLabel('PO Box', fullSection)
    || extractAfterLabel('Post Box', fullSection)
    || extractAfterLabel('Box No', fullSection);

  result.postalCode = extractAfterLabel('Postal Code', fullSection)
    || extractAfterLabel('Post Code', fullSection);

  result.phoneNumber = extractAfterLabel('Mobile No', fullSection)
    || extractAfterLabel('Phone No', fullSection)
    || extractAfterLabel('Telephone', fullSection)
    || extractAfterLabel('Contact No', fullSection);

  result.email = extractAfterLabel('Email', fullSection)
    || extractAfterLabel('Email Address', fullSection);

  // Validate email
  if (result.email && !result.email.includes('@')) result.email = '';

  // Extract obligation effective date (first date in Obligation Details)
  const oblIdx = fullSection.toLowerCase().indexOf('obligation details');
  if (oblIdx !== -1) {
    const oblSection = fullSection.substring(oblIdx, oblIdx + 2000);
    const dateMatches = oblSection.match(/(\d{2}\/\d{2}\/\d{4})/g);
    if (dateMatches && dateMatches.length > 0) {
      result.obligationDate = dateMatches[0];
    }
  }

  // If registration date is still missing, try finding ANY date in PIN Details
  if (!result.registeredDate) {
    const m = fullSection.match(/(\d{2}\/\d{2}\/\d{4})/);
    if (m) result.registeredDate = m[1];
  }

  console.log('[retrieve][parse] Parsed result:', JSON.stringify(result));
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3: DWR for taxpayer details (fallback for fields pin checker might miss)
// ─────────────────────────────────────────────────────────────────────────────

async function fetchTaxpayerByDWR(pin: string, cookieString: string): Promise<Record<string, string> | null> {
  const sid = `${randHex(12)}/${randHex(12)}`;
  const wn  = `W${Date.now()}`;

  const body = [
    'callCount=1', `windowName=${wn}`,
    'c0-scriptName=TaxPayerRDWR', 'c0-methodName=getTaxpayerBasicRdtlsByPin', 'c0-id=0',
    `c0-param0=string:${pin}`, 'batchId=1', 'instanceId=0',
    'page=%2FKRA-Portal%2FpinChecker.htm', 'httpSessionId=', `scriptSessionId=${sid}`,
  ].join('\n') + '\n';

  const raw = await httpsPost(
    '/KRA-Portal/dwr/call/plaincall/TaxPayerRDWR.getTaxpayerBasicRdtlsByPin.dwr',
    body, cookieString, 'text/plain'
  );
  console.log('[retrieve] DWR raw (first 600):', raw.substring(0, 600));
  return parseDWR(raw);
}

function parseDWR(raw: string): Record<string, string> | null {
  if (!raw || raw.trim().length === 0) return null;

  const stringVars: Record<string, string> = {};
  let m: RegExpExecArray | null;
  const svp = /(?:var\s+)?(s\d+)\s*=\s*"([^"]*)"/g;
  while ((m = svp.exec(raw)) !== null) stringVars[m[1]] = m[2];

  const objectFields: Record<string, Record<string, string>> = {};
  const pp = /(s\d+)\.(\w+)\s*=\s*([^;\n]+)/g;
  while ((m = pp.exec(raw)) !== null) {
    const [, obj, key, rawVal] = m;
    let val = rawVal.trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    else if (stringVars[val] !== undefined) val = stringVars[val];
    else if (val === 'null' || val === 'undefined') val = '';
    if (!objectFields[obj]) objectFields[obj] = {};
    objectFields[obj][key] = val;
  }

  const cbMatch = raw.match(/handleCallback\([^,]*,[^,]*,\s*(s\d+|\{[^}]*\})\s*\)/);
  let fields: Record<string, string> = {};
  if (cbMatch) {
    const ref = cbMatch[1].trim();
    if (ref.startsWith('{')) {
      try { fields = JSON.parse(ref.replace(/(\w+)\s*:/g, '"$1":').replace(/'/g, '"')); } catch {}
    } else {
      fields = objectFields[ref] || {};
    }
  }
  if (Object.keys(fields).length === 0) {
    for (const v of Object.values(objectFields)) Object.assign(fields, v);
  }

  if (Object.keys(fields).length === 0) return null;

  const get = (...keys: string[]) => {
    for (const k of keys) {
      for (const [fk, fv] of Object.entries(fields)) {
        if (fk.toLowerCase() === k.toLowerCase() && fv && fv !== 'null' && fv.trim()) return fv.trim();
      }
    }
    return '';
  };

  const firstName  = get('firstName', 'fName', 'first_name');
  const middleName = get('middleName', 'secondName', 'mName');
  const lastName   = get('lastName', 'lName', 'surname');
  const fullName   = [firstName, middleName, lastName].filter(Boolean).join(' ')
    || get('taxpayerName', 'fullName', 'name', 'manufacturerName');

  let email = get('emailAddress', 'emailId', 'email');
  if (!email) { const em = JSON.stringify(fields).match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/); if (em) email = em[0]; }

  return {
    name: fullName,
    email,
    building:    get('buildingName', 'building', 'bldgName', 'physicalAddress'),
    street:      get('streetName', 'street', 'roadName'),
    city:        get('city', 'town', 'cityName', 'townName'),
    county:      get('county', 'countyName'),
    district:    get('district', 'districtName', 'subCounty'),
    taxArea:     get('taxArea', 'taxAreaName', 'taxAreaDesc'),
    poBox:       get('poBox', 'pobox', 'postBox', 'boxNumber'),
    postalCode:  get('postalCode', 'postCode', 'postalcode'),
    station:     get('station', 'stationName', 'stationDesc'),
    phoneNumber: get('mobileNo', 'phoneNumber', 'phone', 'telNo'),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility
// ─────────────────────────────────────────────────────────────────────────────

function randHex(len: number) {
  return [...Array(len)].map(() => Math.floor(Math.random() * 16).toString(16).toUpperCase()).join('');
}

function first(...vals: string[]): string {
  for (const v of vals) if (v && v.trim()) return v.trim();
  return '';
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/kra/retrieve
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { idNumber, pin: directPin, captchaAnswer, sessionToken } = body;

    if (!idNumber && !directPin) {
      return NextResponse.json({ success: false, error: 'ID Number or PIN is required' }, { status: 400 });
    }

    // Decode session cookies from the CAPTCHA step
    let cookieString = '';
    if (sessionToken) {
      try { cookieString = Buffer.from(sessionToken, 'base64').toString('utf-8'); } catch {}
    }
    if (!cookieString) {
      const cookies = await initKraSession();
      cookieString = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
    }
    console.log('[retrieve] Cookies:', cookieString.substring(0, 80));

    // ── 1. Resolve PIN ──────────────────────────────────────────────────────
    let fullPin = directPin ? String(directPin).trim().toUpperCase() : null;
    if (!fullPin && idNumber) {
      fullPin = await lookupPinByIdNumber(String(idNumber).trim(), cookieString);
      if (!fullPin) {
        return NextResponse.json({
          success: false,
          error: 'KRA PIN not found for this ID number. Please verify and try again.'
        }, { status: 404 });
      }
    }
    console.log('[retrieve] Resolved PIN:', fullPin);

    // ── 2. Pin Checker (primary source — gives everything including station) ─
    let pinCheckerData: PinCheckerResult | null = null;
    if (captchaAnswer && captchaAnswer.trim()) {
      const postData = `viewType=static&actionCode=checkPin&vo.pinNo=${encodeURIComponent(fullPin!)}&captcahText=${encodeURIComponent(captchaAnswer.trim())}`;
      const html = await httpsPost('/KRA-Portal/pinChecker.htm', postData, cookieString).catch(() => '');
      console.log('[retrieve] Pin checker HTML length:', html.length);
      if (html.length > 100) {
        console.log('[retrieve] Pin checker HTML snippet:', html.substring(0, 300).replace(/\s+/g, ' '));
        pinCheckerData = parsePinCheckerHtml(html);
        if (pinCheckerData.captchaWrong) {
          return NextResponse.json({
            success: false,
            captchaWrong: true,
            error: 'Wrong CAPTCHA answer. Please reload and try again.',
          }, { status: 422 });
        }
      }
    }

    // ── 3. DWR (secondary — fills gaps if pin checker missed anything) ──────
    const dwrData = await fetchTaxpayerByDWR(fullPin!, cookieString).catch(() => null);
    console.log('[retrieve] DWR data:', JSON.stringify(dwrData));

    // ── 4. Merge: pin checker first, DWR as fallback ─────────────────────
    const pc = pinCheckerData;
    const dw = dwrData;

    const name        = first(pc?.name, dw?.name, '');
    const email       = first(pc?.email, dw?.email, '');
    const building    = first(pc?.building, dw?.building, '');
    const street      = first(pc?.street, dw?.street, '');
    const town        = first(pc?.town, dw?.city, '');
    const county      = first(pc?.county, dw?.county, '');
    const district    = first(pc?.district, dw?.district, '');
    const taxArea     = first(pc?.taxArea, dw?.taxArea, '');
    const station     = first(pc?.station, dw?.station, '');
    const poBox       = first(pc?.poBox, dw?.poBox, '');
    const postalCode  = first(pc?.postalCode, dw?.postalCode, '');
    const phoneNumber = first(pc?.phoneNumber, dw?.phoneNumber, '');
    const registeredDate = first(pc?.registeredDate, pc?.obligationDate, '');

    const result = {
      success: true,
      data: {
        pin:           fullPin,
        name,
        email,
        status:        'Active',
        certificate_url: `https://itax.kra.go.ke/KRA-Portal/dotDownloadCertificate.htm?pin=${fullPin}`,
        building,
        street,
        town,
        county,
        district,
        taxArea,
        station,
        poBox,
        postalCode,
        phoneNumber,
        registeredDate,
      }
    };

    console.log('[retrieve] Final result:', JSON.stringify(result.data));
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[retrieve] Error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
