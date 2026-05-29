import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import { auth } from '@clerk/nextjs/server';

export const maxDuration = 60;

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers — raw HTTPS only, no Playwright, no Tesseract, no DB
// ─────────────────────────────────────────────────────────────────────────────

function initKraSession(): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'itax.kra.go.ke',
      port: 443,
      path: '/KRA-Portal/pinChecker.htm?actionCode=loadPage&viewType=static',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 20000
    } as any;

    const req = https.request(options, (res) => {
      const rawCookies = res.headers['set-cookie'] || [];
      const cookieMap: Record<string, string> = {};
      (rawCookies as string[]).forEach((cookie) => {
        const [nameValue] = cookie.split(';');
        const eqIdx = nameValue.indexOf('=');
        if (eqIdx > 0) {
          const name = nameValue.substring(0, eqIdx).trim();
          const value = nameValue.substring(eqIdx + 1).trim();
          if (name && value) cookieMap[name] = value;
        }
      });
      resolve(cookieMap);
    });
    req.on('error', reject);
    req.end();
  });
}

function rawPost(options: any, postData: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk: string) => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Look up PIN from ID number via DWR
 */
async function lookupPinByIdNumber(idNumber: string, cookieString: string): Promise<string | null> {
  const scriptSessionId = `${Math.random().toString(36).substr(2, 12).toUpperCase()}/${Math.random().toString(36).substr(2, 12).toUpperCase()}`;
  const windowName = `F${Date.now()}`;

  const body = [
    'callCount=1',
    `windowName=${windowName}`,
    'c0-scriptName=findPinByIdno',
    'c0-methodName=findPinByIdnumber',
    'c0-id=0',
    `c0-param0=string:${idNumber}`,
    'batchId=0',
    'instanceId=0',
    'page=%2FKRA-Portal%2FpinChecker.htm',
    'httpSessionId=',
    `scriptSessionId=${scriptSessionId}`
  ].join('\n') + '\n';

  const options = {
    hostname: 'itax.kra.go.ke',
    port: 443,
    path: '/KRA-Portal/dwr/call/plaincall/findPinByIdno.findPinByIdnumber.dwr',
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      'Content-Length': Buffer.byteLength(body),
      'Cookie': cookieString,
      'Referer': 'https://itax.kra.go.ke/KRA-Portal/pinChecker.htm',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'X-Requested-With': 'XMLHttpRequest'
    },
    timeout: 20000,
    rejectUnauthorized: false
  } as any;

  const raw = await rawPost(options, body);
  console.log('[retrieve] PIN lookup raw:', raw.substring(0, 400));

  const callbackMatch = raw.match(/handleCallback\([^,]+,[^,]+,"([^"]+)"\)/);
  if (callbackMatch) {
    const maskedResponse = callbackMatch[1];
    if (maskedResponse.includes('#$')) {
      const [maskedPin, reversedDigits] = maskedResponse.split('#$');
      const actualDigits = reversedDigits.split('').reverse().join('');
      return maskedPin.replace('*****', actualDigits).trim().toUpperCase();
    }
    return maskedResponse.trim().toUpperCase();
  }
  return null;
}

/**
 * Fetch taxpayer details by PIN via DWR (address, name, email, phone)
 */
async function fetchTaxpayerByDWR(pin: string, cookieString: string): Promise<any> {
  const scriptSessionId = `${Math.random().toString(36).substr(2, 12).toUpperCase()}/${Math.random().toString(36).substr(2, 12).toUpperCase()}`;
  const windowName = `F${Date.now()}`;

  const body = [
    'callCount=1',
    `windowName=${windowName}`,
    'c0-scriptName=TaxPayerRDWR',
    'c0-methodName=getTaxpayerBasicRdtlsByPin',
    'c0-id=0',
    `c0-param0=string:${pin}`,
    'batchId=1',
    'instanceId=0',
    'page=%2FKRA-Portal%2FpinChecker.htm',
    'httpSessionId=',
    `scriptSessionId=${scriptSessionId}`
  ].join('\n') + '\n';

  const options = {
    hostname: 'itax.kra.go.ke',
    port: 443,
    path: '/KRA-Portal/dwr/call/plaincall/TaxPayerRDWR.getTaxpayerBasicRdtlsByPin.dwr',
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      'Content-Length': Buffer.byteLength(body),
      'Cookie': cookieString,
      'Referer': 'https://itax.kra.go.ke/KRA-Portal/pinChecker.htm',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'X-Requested-With': 'XMLHttpRequest'
    },
    timeout: 20000,
    rejectUnauthorized: false
  } as any;

  const raw = await rawPost(options, body);
  console.log('[retrieve] DWR raw:', raw.substring(0, 600));
  return parseDWR(raw);
}

/**
 * Fetch manufacturer details via JSON endpoint
 */
async function fetchManufacturerDetails(pin: string, cookieString: string): Promise<any> {
  const body = `manPin=${encodeURIComponent(pin)}`;
  const options = {
    hostname: 'itax.kra.go.ke',
    port: 443,
    path: '/KRA-Portal/manufacturerAuthorizationController.htm?actionCode=fetchManDtl',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Content-Length': Buffer.byteLength(body),
      'Cookie': cookieString,
      'Referer': 'https://itax.kra.go.ke/KRA-Portal/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    timeout: 20000,
    rejectUnauthorized: false
  } as any;

  const raw = await rawPost(options, body);
  try {
    const parsed = JSON.parse(raw);
    const merged: any = {};
    if (parsed && typeof parsed === 'object') {
      Object.values(parsed).forEach((val: any) => {
        if (val && typeof val === 'object' && !Array.isArray(val)) {
          Object.assign(merged, val);
        }
      });
    }
    return Object.keys(merged).length > 0 ? merged : null;
  } catch {
    return null;
  }
}

/**
 * Submit PIN checker form with the user-provided CAPTCHA answer and parse results
 */
async function fetchPinCheckerData(pin: string, captchaAnswer: string, cookieString: string): Promise<{ registeredDate: string | null; obligationDate: string | null }> {
  const postData = `viewType=static&actionCode=checkPin&vo.pinNo=${encodeURIComponent(pin)}&captcahText=${encodeURIComponent(captchaAnswer)}`;

  const options = {
    hostname: 'itax.kra.go.ke',
    port: 443,
    path: '/KRA-Portal/pinChecker.htm',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData),
      'Cookie': cookieString,
      'Referer': 'https://itax.kra.go.ke/KRA-Portal/pinChecker.htm?actionCode=loadPage&viewType=static',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
    rejectUnauthorized: false,
    timeout: 20000
  } as any;

  const html = await rawPost(options, postData);
  console.log('[retrieve] Pin checker response length:', html.length);

  if (html.includes('Wrong result of the arithmetic operation.')) {
    throw new Error('CAPTCHA_WRONG');
  }

  let registeredDate: string | null = null;
  let obligationDate: string | null = null;

  const pinDetailsIdx = html.indexOf('PIN Details');
  if (pinDetailsIdx !== -1) {
    const section = html.substring(pinDetailsIdx);

    // Try "Registration Date" label in PIN Details section
    const regLabelIdx = section.toLowerCase().indexOf('registration date');
    if (regLabelIdx !== -1) {
      const regSection = section.substring(regLabelIdx, regLabelIdx + 300);
      const m = regSection.match(/(\d{2}\/\d{2}\/\d{4})/);
      if (m) registeredDate = m[1];
    }

    // Also check Obligation Details for effective date
    const oblIdx = section.toLowerCase().indexOf('obligation details');
    if (oblIdx !== -1) {
      const oblSection = section.substring(oblIdx, oblIdx + 1000);
      const m = oblSection.match(/(\d{2}\/\d{2}\/\d{4})/);
      if (m) obligationDate = m[1];
    }

    // Fallback: first date anywhere in PIN Details
    if (!registeredDate) {
      const m = section.match(/(\d{2}\/\d{2}\/\d{4})/);
      if (m) registeredDate = m[1];
    }
  }

  return { registeredDate, obligationDate };
}

// ─────────────────────────────────────────────────────────────────────────────
// DWR parser (standalone, no kraService dependency)
// ─────────────────────────────────────────────────────────────────────────────

function parseDWR(raw: string): any {
  if (!raw || raw.trim().length === 0) return null;

  const stringVars: Record<string, string> = {};
  const strVarPattern = /(?:var\s+)?(s\d+)\s*=\s*"([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = strVarPattern.exec(raw)) !== null) {
    stringVars[m[1]] = m[2];
  }

  const objectFields: Record<string, Record<string, string>> = {};
  const propPattern = /(s\d+)\.(\w+)\s*=\s*([^;\n]+)/g;
  while ((m = propPattern.exec(raw)) !== null) {
    const objVar = m[1], key = m[2];
    let val = m[3].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    else if (stringVars[val] !== undefined) val = stringVars[val];
    else if (val === 'null' || val === 'undefined') val = '';
    if (!objectFields[objVar]) objectFields[objVar] = {};
    objectFields[objVar][key] = val;
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
    for (const vars of Object.values(objectFields)) Object.assign(fields, vars);
  }

  if (Object.keys(fields).length === 0) return null;

  const get = (...keys: string[]) => {
    for (const k of keys) {
      const v = fields[k] || Object.entries(fields).find(([ok]) => ok.toLowerCase() === k.toLowerCase())?.[1];
      if (v && v !== 'null' && v !== 'undefined' && String(v).trim()) return String(v).trim();
    }
    return '';
  };

  const firstName = get('firstName', 'first_name', 'fName');
  const middleName = get('middleName', 'secondName', 'mName');
  const lastName = get('lastName', 'last_name', 'surname', 'lName');
  const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ')
    || get('taxpayerName', 'fullName', 'name', 'manufacturerName');

  let email = get('emailAddress', 'emailId', 'email');
  if (!email) {
    const m2 = JSON.stringify(fields).match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (m2) email = m2[0];
  }

  return {
    name: fullName || null,
    email,
    building: get('buildingName', 'building', 'bldgName', 'physicalAddress'),
    street: get('streetName', 'street', 'roadName'),
    city: get('city', 'town', 'cityName', 'townName'),
    county: get('county', 'countyName'),
    district: get('district', 'districtName', 'subCounty'),
    taxArea: get('taxArea', 'taxAreaName', 'taxAreaDesc'),
    poBox: get('poBox', 'pobox', 'postBox', 'boxNumber'),
    postalCode: get('postalCode', 'postalcode', 'postCode'),
    station: get('station', 'stationName', 'stationDesc'),
    phoneNumber: get('mobileNo', 'phoneNumber', 'phone', 'telNo'),
  };
}

function mergeFields(...sources: (any | null)[]) {
  const get = (key: string) => {
    for (const src of sources) {
      const v = src?.[key];
      if (v && String(v).trim()) return String(v).trim();
    }
    return '';
  };
  return {
    name: get('name'),
    email: get('email'),
    building: get('building'),
    street: get('street'),
    city: get('city'),
    county: get('county'),
    district: get('district'),
    taxArea: get('taxArea'),
    poBox: get('poBox'),
    postalCode: get('postalCode'),
    station: get('station'),
    phoneNumber: get('phoneNumber'),
  };
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

    // Decode the session token (base64-encoded cookie string from /api/kra/captcha)
    let cookieString = '';
    if (sessionToken) {
      try {
        cookieString = Buffer.from(sessionToken, 'base64').toString('utf-8');
      } catch {
        cookieString = '';
      }
    }

    // If no session token, initialize a fresh session
    if (!cookieString) {
      const cookies = await initKraSession();
      cookieString = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
    }

    let fullPin = directPin ? String(directPin).trim().toUpperCase() : null;

    // Step 1: Resolve PIN from ID number if needed
    if (!fullPin && idNumber) {
      fullPin = await lookupPinByIdNumber(String(idNumber).trim(), cookieString);
      if (!fullPin) {
        return NextResponse.json({ success: false, error: 'KRA PIN not found for the provided ID number. Please verify your ID.' }, { status: 404 });
      }
    }

    console.log('[retrieve] Resolved PIN:', fullPin);

    // Step 2: Run DWR + Manufacturer lookups concurrently
    const [dwrData, manData] = await Promise.all([
      fetchTaxpayerByDWR(fullPin!, cookieString).catch(() => null),
      fetchManufacturerDetails(fullPin!, cookieString).catch(() => null),
    ]);

    const merged = mergeFields(dwrData, manData);

    // Step 3: If captchaAnswer provided, submit pin checker to get exact registration date
    let registeredDate = '';
    let captchaError = '';

    if (captchaAnswer && captchaAnswer.trim()) {
      try {
        const pinCheckerData = await fetchPinCheckerData(fullPin!, captchaAnswer.trim(), cookieString);
        registeredDate = pinCheckerData.registeredDate || pinCheckerData.obligationDate || '';
        console.log('[retrieve] Exact date from pin checker:', registeredDate);
      } catch (err: any) {
        if (err.message === 'CAPTCHA_WRONG') {
          captchaError = 'Wrong CAPTCHA answer. Please reload and try again.';
        } else {
          console.warn('[retrieve] Pin checker failed:', err.message);
        }
      }
    }

    const name = merged.name || (idNumber ? '' : '');

    const result = {
      success: true,
      captchaError: captchaError || undefined,
      data: {
        pin: fullPin,
        name,
        email: merged.email,
        status: 'Active',
        certificate_url: `https://itax.kra.go.ke/KRA-Portal/dotDownloadCertificate.htm?pin=${fullPin}`,
        building: merged.building,
        street: merged.street,
        town: merged.city,
        county: merged.county,
        district: merged.district,
        taxArea: merged.taxArea,
        station: merged.station,
        poBox: merged.poBox,
        postalCode: merged.postalCode,
        phoneNumber: merged.phoneNumber,
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
