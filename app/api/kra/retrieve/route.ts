import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import { auth, clerkClient } from '@clerk/nextjs/server';
import net from 'net';
import tls from 'tls';
import url from 'url';
import { createSystemLog } from '@/lib/prisma';
import { fetchTaxpayerByPin, fetchTaxpayerById } from '@/lib/kra-api';
import { getKraStationForCounty, formatKraStation, sanitizeTaxArea } from '@/lib/kra-stations';
import { getUserSubscriptionStatus } from '@/lib/subscription';
import { maskTaxpayerData } from '@/lib/masking';

export const maxDuration = 60;

// ─────────────────────────────────────────────────────────────────────────────
// Pure Node.js Proxy Agent Generator (HTTP CONNECT)
// ─────────────────────────────────────────────────────────────────────────────

function createProxyAgent(proxyUrl: string): any {
  if (!proxyUrl) return undefined;
  
  return new https.Agent({
    createConnection: (opts: any, callback: any) => {
      const proxyParsed = url.parse(proxyUrl);
      const proxyHost = proxyParsed.hostname || '';
      const proxyPort = parseInt(proxyParsed.port || '8080', 10);

      const socket = net.connect(proxyPort, proxyHost, () => {
        let connectReq = `CONNECT ${opts.host}:${opts.port} HTTP/1.1\r\n` +
                         `Host: ${opts.host}:${opts.port}\r\n`;
        if (proxyParsed.auth) {
          const base64Auth = Buffer.from(proxyParsed.auth).toString('base64');
          connectReq += `Proxy-Authorization: Basic ${base64Auth}\r\n`;
        }
        connectReq += '\r\n';
        socket.write(connectReq);
      });

      let buffer = '';
      const onData = (chunk: Buffer) => {
        buffer += chunk.toString('utf8');
        if (buffer.includes('\r\n\r\n')) {
          socket.off('data', onData);
          socket.off('error', onError);
          if (buffer.startsWith('HTTP/1.1 200') || buffer.startsWith('HTTP/1.0 200')) {
            const secureSocket = tls.connect({
              socket,
              servername: opts.host,
              rejectUnauthorized: false,
            });
            callback(null, secureSocket);
          } else {
            socket.destroy();
            callback(new Error(`Proxy CONNECT failed: ${buffer.split('\r\n')[0]}`));
          }
        }
      };

      const onError = (err: Error) => {
        socket.destroy();
        callback(err);
      };

      socket.on('data', onData);
      socket.on('error', onError);
    }
  } as any);
}

// ─────────────────────────────────────────────────────────────────────────────
// Raw HTTPS helpers
// ─────────────────────────────────────────────────────────────────────────────

function initKraSession(proxyUrl?: string): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    const agent = proxyUrl ? createProxyAgent(proxyUrl) : undefined;
    const req = https.request({
      hostname: 'itax.kra.go.ke',
      port: 443,
      path: '/KRA-Portal/pinChecker.htm?actionCode=loadPage&viewType=static',
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' },
      timeout: 8000,
      rejectUnauthorized: false,
      agent
    } as any, (res) => {
      const cookieMap: Record<string, string> = {};
      ((res.headers['set-cookie'] as string[]) || []).forEach((c) => {
        const [nv] = c.split(';');
        const idx = nv.indexOf('=');
        if (idx > 0) cookieMap[nv.substring(0, idx).trim()] = nv.substring(idx + 1).trim();
      });
      res.resume();
      resolve(cookieMap);
    });
    req.on('timeout', () => {
      req.destroy(new Error('KRA session init timed out'));
    });
    req.on('error', reject);
    req.end();
  });
}

function httpsPost(path: string, body: string, cookieString: string, contentType = 'application/x-www-form-urlencoded', proxyUrl?: string, isAjax = false): Promise<string> {
  return new Promise((resolve, reject) => {
    const buf = Buffer.from(body, 'utf8');
    const agent = proxyUrl ? createProxyAgent(proxyUrl) : undefined;
    const headers: Record<string, any> = {
      'Content-Type': contentType,
      'Content-Length': buf.length,
      'Origin': 'https://itax.kra.go.ke',
      'Referer': isAjax ? 'https://itax.kra.go.ke/KRA-Portal/' : 'https://itax.kra.go.ke/KRA-Portal/pinChecker.htm',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': isAjax ? 'application/json, text/javascript, */*; q=0.01' : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    };
    if (cookieString && cookieString.trim()) {
      headers['Cookie'] = cookieString.trim();
    }
    if (isAjax) {
      headers['X-Requested-With'] = 'XMLHttpRequest';
    }

    const req = https.request({
      hostname: 'itax.kra.go.ke',
      port: 443,
      path,
      method: 'POST',
      headers,
      timeout: 10000,
      rejectUnauthorized: false,
      agent
    } as any, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
    req.on('timeout', () => {
      req.destroy(new Error('KRA httpsPost request timed out'));
    });
    req.on('error', reject);
    req.write(buf);
    req.end();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1: Resolve PIN from ID via DWR
// ─────────────────────────────────────────────────────────────────────────────

async function lookupPinByIdNumber(idNumber: string, cookieString: string, proxyUrl?: string): Promise<string | null> {
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
    body, cookieString, 'text/plain', proxyUrl
  );
  console.log('[retrieve] PIN lookup raw:', raw ? raw.substring(0, 350) : 'EMPTY');

  const m = raw.match(/handleCallback\([^,]+,[^,]+,"([^"]+)"\)/);
  if (m) {
    const val = m[1];
    if (val.includes('#$')) {
      const [masked, rev] = val.split('#$');
      return masked.replace('*****', rev.trim()).trim().toUpperCase();
    }
    return val.trim().toUpperCase();
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2: Parse ALL taxpayer details from the KRA Pin Checker HTML response
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
  obligations?: Array<{
    name: string;
    status: string;
    effectiveFrom: string;
    effectiveTo?: string;
  }>;
}

function parsePinCheckerHtml(html: string): PinCheckerResult {
  const result: PinCheckerResult = {
    name: '', pin: '', registeredDate: '', obligationDate: '',
    building: '', street: '', town: '', county: '', district: '',
    taxArea: '', station: '', poBox: '', postalCode: '',
    phoneNumber: '', email: '', captchaWrong: false,
    obligations: [],
  };

  const hasTaxpayerDetails = html.toLowerCase().includes('taxpayer name') ||
                             html.toLowerCase().includes('tax payer name') ||
                             html.toLowerCase().includes('pin details') ||
                             html.toLowerCase().includes('taxpayer details');
  const hasCaptchaForm = html.includes('captcahText') ||
                         html.includes('Security Stamp') ||
                         html.includes('ajaxCaptchaLoad') ||
                         html.includes('Wrong result');

  const isNotFound = html.includes('System is not able to process your request') ||
                     html.includes('No Record Found') ||
                     html.includes('Invalid PIN Number');

  if (isNotFound) {
    return result;
  }

  if (!hasTaxpayerDetails && hasCaptchaForm) {
    result.captchaWrong = true;
    return result;
  }

  const stripTags = (s: string) =>
    s
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ')
      .replace(/&copy;/g, '')
      .replace(/&gt;/g, '>')
      .replace(/&lt;/g, '<')
      .replace(/\s+/g, ' ')
      .trim();

  // 1. Extract table rows and find labeled key-value pairs
  const rowMatches = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
  const kvPairs: Record<string, string> = {};

  for (const row of rowMatches) {
    const cellMatches = row.match(/<td[^>]*>[\s\S]*?<\/td>/gi) || [];
    const textCells = cellMatches.map(c => stripTags(c));
    for (let i = 0; i < textCells.length - 1; i += 2) {
      const lbl = textCells[i].replace(/[:*]/g, '').trim();
      const val = textCells[i + 1].trim();
      if (lbl && val) {
        kvPairs[lbl.toLowerCase()] = val;
      }
    }
  }

  const findVal = (...labels: string[]): string => {
    for (const l of labels) {
      const key = l.toLowerCase();
      if (kvPairs[key]) return kvPairs[key];
      const found = Object.keys(kvPairs).find(k => k === key || k.endsWith(key) || k.includes(key));
      if (found && kvPairs[found]) return kvPairs[found];
    }
    return '';
  };

  // Direct regex for PIN to avoid capturing breadcrumb links
  const pinMatch = html.match(/\b([A-Z]\d{9}[A-Z])\b/i);
  result.pin = pinMatch ? pinMatch[1].toUpperCase() : '';

  result.name = findVal('taxpayer name', 'tax payer name', 'full name');
  result.station = findVal('taxpayer station', 'station', 'kra station');
  result.building = findVal('building name', 'building', 'plot no');
  result.street = findVal('street name', 'street', 'road');
  result.town = findVal('city/town', 'town', 'city');
  result.county = findVal('county');
  result.district = findVal('district', 'sub county');
  result.taxArea = findVal('tax area', 'tax area locality', 'locality');
  result.poBox = findVal('p.o. box', 'po box', 'post box', 'box no');
  result.postalCode = findVal('postal code', 'post code');
  result.phoneNumber = findVal('mobile no', 'phone no', 'telephone', 'contact no');
  result.email = findVal('email', 'email address');

  // 2. Extract Obligations and Effective From Date
  const oblIdx = html.toLowerCase().indexOf('obligation details');
  const targetOBLSection = oblIdx !== -1 ? html.substring(oblIdx) : html;
  const oblRows = targetOBLSection.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];

  for (const row of oblRows) {
    const cellMatches = row.match(/<td[^>]*>[\s\S]*?<\/td>/gi) || [];
    const cells = cellMatches.map(c => stripTags(c));
    if (cells.length >= 3) {
      const oblName = cells[0];
      const oblStatus = cells[1];
      const effFrom = cells[2];
      const effTo = cells[3] || '';
      if (oblName && !oblName.toLowerCase().includes('obligation name') && /^\d{2}\/\d{2}\/\d{4}$/.test(effFrom)) {
        result.obligations?.push({
          name: oblName,
          status: oblStatus,
          effectiveFrom: effFrom,
          effectiveTo: effTo
        });
      }
    }
  }

  // Find primary active obligation date
  if (result.obligations && result.obligations.length > 0) {
    const activeObl = result.obligations.find(o => 
      o.status.toLowerCase() === 'registered' || 
      o.status.toLowerCase() === 'active'
    ) || result.obligations[0];
    if (activeObl && activeObl.effectiveFrom) {
      result.obligationDate = activeObl.effectiveFrom;
      result.registeredDate = activeObl.effectiveFrom;
    }
  }

  const directReg = findVal('pin registration date', 'registration date', 'effective from date');
  if (directReg) {
    const m = directReg.match(/(\d{2}\/\d{2}\/\d{4})/);
    if (m && !result.registeredDate) result.registeredDate = m[1];
  }

  if (result.email && (result.email.toLowerCase().includes('callcentre@kra.go.ke') || !result.email.includes('@'))) {
    result.email = '';
  }

  console.log('[retrieve][parse] Parsed result:', JSON.stringify(result));
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3: Fetch details from Manufacturer endpoint
// ─────────────────────────────────────────────────────────────────────────────

interface ManufacturerResult {
  name: string;
  email: string;
  phoneNumber: string;
  building: string;
  street: string;
  town: string;
  county: string;
  district: string;
  taxArea: string;
  poBox: string;
  postalCode: string;
}

async function fetchManufacturerDetails(pin: string, cookieString?: string, proxyUrl?: string): Promise<ManufacturerResult | null> {
  const body = `manPin=${encodeURIComponent(pin)}`;
  try {
    const raw = await httpsPost(
      '/KRA-Portal/manufacturerAuthorizationController.htm?actionCode=fetchManDtl',
      body,
      cookieString || '',
      'application/x-www-form-urlencoded; charset=UTF-8',
      proxyUrl,
      true
    );
    
    if (!raw || raw.trim().length === 0) return null;
    const parsedData = JSON.parse(raw);
    if (parsedData && !parsedData.isError) {
      const cleanField = (val: any) => {
        if (val === undefined || val === null) return '';
        const s = String(val).trim();
        if (!s || s.toLowerCase() === 'na' || s.toLowerCase() === 'n/a' || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined' || s === '0') return '';
        return s;
      };

      const basic = parsedData.timsManBasicRDtlDTO || {};
      const business = parsedData.manBusinessRDtlDTO || {};
      const contact = parsedData.manContactRDtlDTO || {};
      const address = parsedData.manAddRDtlDTO || {};

      const firstName = cleanField(basic.firstName);
      const middleName = cleanField(basic.middleName);
      const lastName = cleanField(basic.lastName);
      const directFullName = cleanField(
        [firstName, middleName, lastName].filter(Boolean).join(' ') 
        || basic.manufacturerName 
        || business.businessName 
        || ''
      );

      const directEmail = cleanField(contact.mainEmail || contact.secondaryEmail);
      const directPhone = cleanField(contact.mobileNo || contact.telephoneNo);
      const directCounty = cleanField(address.county);
      const directTown = cleanField(address.cityTown || address.town);
      const directDistrict = cleanField(address.district);
      const rawDirectTaxArea = cleanField(address.taxAreaLocality);
      const directTaxArea = sanitizeTaxArea(rawDirectTaxArea, directCounty, directTown);
      const directBuilding = cleanField(address.buldgNo || address.descriptiveAddress);
      const directStreet = cleanField(address.streetRoad);
      const directPoBox = cleanField(address.poBox);
      const directPostalCode = cleanField(address.postalCode);

      if (directFullName || directEmail || directCounty || directTown) {
        return {
          name: directFullName,
          email: directEmail,
          phoneNumber: directPhone,
          building: directBuilding,
          street: directStreet,
          town: directTown,
          county: directCounty,
          district: directDistrict,
          taxArea: directTaxArea,
          poBox: directPoBox,
          postalCode: directPostalCode,
        };
      }

      const mergedData: Record<string, any> = {};
      Object.values(parsedData).forEach(val => {
        if (val && typeof val === 'object' && !Array.isArray(val)) {
          Object.assign(mergedData, val);
        }
      });
      
      const get = (...keys: string[]) => {
        for (const k of keys) {
          const val = mergedData[k];
          const s = cleanField(val);
          if (s) return s;
        }
        const objKeys = Object.keys(mergedData);
        for (const k of keys) {
          const match = objKeys.find(ok => ok.toLowerCase() === k.toLowerCase());
          if (match) {
            const s = cleanField(mergedData[match]);
            if (s) return s;
          }
        }
        return '';
      };

      const fn = get('firstName', 'first_name', 'fName');
      const mn = get('middleName', 'middle_name', 'secondName', 'mName');
      const ln = get('lastName', 'last_name', 'surname', 'lName');
      const fullName = cleanField([fn, mn, ln].filter(Boolean).join(' ')
        || get('taxpayerName', 'fullName', 'manufacturerName', 'name'));

      let email = cleanField(get('mainEmail', 'secondaryEmail', 'emailAddress', 'emailId', 'email'));
      if (!email) {
        const allStrings = JSON.stringify(mergedData);
        const emailMatch = allStrings.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch) email = emailMatch[0];
      }

      const phoneNumber = cleanField(get('mobileNo', 'telephoneNo', 'phoneNumber', 'phone', 'contactNo'));

      return {
        name: fullName || '',
        email: email || '',
        phoneNumber: phoneNumber || '',
        building: get('buildingName', 'building', 'bldgName', 'physicalAddress'),
        street: get('streetName', 'street', 'roadName'),
        town: get('city', 'town', 'cityName', 'townName'),
        county: get('county', 'countyName'),
        district: get('district', 'districtName', 'subCounty'),
        taxArea: get('taxArea', 'taxAreaName', 'taxAreaDesc'),
        poBox: get('poBox', 'pobox', 'postBox'),
        postalCode: get('postalCode', 'postalcode', 'postCode'),
      };
    }
  } catch (e: any) {
    console.error('[retrieve] Error fetching/parsing manufacturer details:', e.message);
  }
  return null;
}

const COUNTY_TOWN_MAP: Record<string, string> = {
  'mombasa': 'Mombasa',
  'kwale': 'Kwale',
  'kilifi': 'Kilifi',
  'tana river': 'Hola',
  'lamu': 'Lamu',
  'taita taveta': 'Wundanyi',
  'taita-taveta': 'Wundanyi',
  'garissa': 'Garissa',
  'wajir': 'Wajir',
  'mandera': 'Mandera',
  'marsabit': 'Marsabit',
  'isiolo': 'Isiolo',
  'meru': 'Meru',
  'tharaka nithi': 'Chuka',
  'tharaka-nithi': 'Chuka',
  'embu': 'Embu',
  'kitui': 'Kitui',
  'machakos': 'Machakos',
  'makueni': 'Wote',
  'nyandarua': 'Ol Kalou',
  'nyeri': 'Nyeri',
  'kirinyaga': 'Kerugoya',
  'murang\'a': 'Murang\'a',
  'muranga': 'Murang\'a',
  'kiambu': 'Kiambu',
  'turkana': 'Lodwar',
  'west pokot': 'Kapenguria',
  'west-pokot': 'Kapenguria',
  'samburu': 'Maralal',
  'trans nzoia': 'Kitale',
  'trans-nzoia': 'Kitale',
  'uasin gishu': 'Eldoret',
  'uasin-gishu': 'Eldoret',
  'elgeyo marakwet': 'Iten',
  'elgeyo-marakwet': 'Iten',
  'nandi': 'Kapsabet',
  'baringo': 'Kabarnet',
  'laikipia': 'Nanyuki',
  'nakuru': 'Nakuru',
  'narok': 'Narok',
  'kajiado': 'Kajiado',
  'kericho': 'Kericho',
  'bomet': 'Bomet',
  'kakamega': 'Kakamega',
  'vihiga': 'Mbale',
  'bungoma': 'Bungoma',
  'busia': 'Busia',
  'siaya': 'Siaya',
  'kisumu': 'Kisumu',
  'homa bay': 'Homa Bay',
  'homa-bay': 'Homa Bay',
  'migori': 'Migori',
  'kisii': 'Kisii',
  'nyamira': 'Nyamira',
  'nairobi': 'Nairobi',
};

// ─────────────────────────────────────────────────────────────────────────────
// Utility
// ─────────────────────────────────────────────────────────────────────────────

function randHex(len: number) {
  return [...Array(len)].map(() => Math.floor(Math.random() * 16).toString(16).toUpperCase()).join('');
}

function first(...vals: any[]): string {
  for (const v of vals) {
    if (v !== undefined && v !== null) {
      const s = String(v).trim();
      if (s.length > 0 && s.toLowerCase() !== 'na' && s.toLowerCase() !== 'n/a' && s.toLowerCase() !== 'null' && s.toLowerCase() !== 'undefined') {
        return s;
      }
    }
  }
  return '';
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/kra/retrieve
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    let clerkId: string | null = null;
    let userEmail = 'guest@akubrecah.co.ke';
    try {
      const session = await auth();
      clerkId = session?.userId || null;
      if (clerkId) {
        userEmail = clerkId;
        const client = await clerkClient();
        const user = await client.users.getUser(clerkId);
        userEmail = user.primaryEmailAddress?.emailAddress || clerkId;
      }
    } catch (authErr: any) {
      // In development or decoupled requests, allow authenticated or proxy bypass
    }

    // Check if user is super admin
    let isAdmin = false;
    if (clerkId) {
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(clerkId);
        const email = user.primaryEmailAddress?.emailAddress?.toLowerCase();
        const configAdminEmail = (process.env.SUPER_ADMIN_EMAIL || "poweldayck@gmail.com").toLowerCase();
        const configPublicAdminEmail = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "poweldayck@gmail.com").toLowerCase();
        if (email === "poweldayck@gmail.com" || email === configAdminEmail || email === configPublicAdminEmail || user.publicMetadata?.role === "Super Admin" || user.publicMetadata?.role === "Admin") {
          isAdmin = true;
        }
      } catch {}
    } else if (process.env.NODE_ENV === "development") {
      // In development, allow admin bypass without Clerk auth
      isAdmin = true;
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';

    const body = await req.json();
    const { idNumber, pin: directPin, captchaAnswer, sessionToken, engineMode = 'auto' } = body;

    if (!idNumber && !directPin) {
      return NextResponse.json({ success: false, error: 'ID Number or PIN is required' }, { status: 400 });
    }

    const proxyUrl = process.env.KRA_PROXY_URL || process.env.PROXY_URL || "";

    // ── 1. If 'api' or 'auto' mode, attempt Official KRA Live API ─────────────
    let liveApiTaxpayer: any = null;
    try {
      if (directPin) {
        liveApiTaxpayer = await fetchTaxpayerByPin(String(directPin).trim().toUpperCase());
      } else if (idNumber) {
        liveApiTaxpayer = await fetchTaxpayerById(String(idNumber).trim());
      }
    } catch (liveApiErr: any) {
      console.warn('[retrieve] Live API gateway notice:', liveApiErr.message);
    }

    // ── 2. Resolve PIN & Session Cookies ─────────────────────────────────────
    let fullPin = (engineMode !== 'dwr' && liveApiTaxpayer?.pin) ? liveApiTaxpayer.pin : (directPin ? String(directPin).trim().toUpperCase() : null);

    let cookieString = "";
    let freshCookieString = "";

    // 1. Decode sessionToken if provided by client (from /api/kra/captcha)
    if (sessionToken) {
      try {
        cookieString = Buffer.from(sessionToken, 'base64').toString('utf8');
      } catch (err) {
        console.error('[retrieve] Failed to decode sessionToken:', err);
      }
    }

    // 2. If cookieString is still empty, initialize a fresh session
    if (!cookieString) {
      try {
        const cookies = await initKraSession(proxyUrl);
        cookieString = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
      } catch (err: any) {
        console.warn('[retrieve] iTax session init notice:', err.message);
      }
    }

    // Fresh separate session for DWR & manufacturer lookups
    freshCookieString = cookieString;
    try {
      const freshCookies = await initKraSession(proxyUrl);
      freshCookieString = Object.entries(freshCookies).map(([k, v]) => `${k}=${v}`).join('; ');
    } catch {}

    if (!fullPin && idNumber) {
      try {
        fullPin = await lookupPinByIdNumber(String(idNumber).trim(), freshCookieString, proxyUrl);
      } catch (err: any) {
        console.warn('[retrieve] DWR PIN lookup failed:', err.message);
      }
    }

    // If fullPin was resolved and we don't have live API taxpayer details yet, query Live API with fullPin
    if (fullPin && !liveApiTaxpayer && engineMode !== 'dwr') {
      try {
        liveApiTaxpayer = await fetchTaxpayerByPin(fullPin);
      } catch (err: any) {
        console.warn('[retrieve] Post-ID Live API lookup notice:', err.message);
      }
    }

    // ── 3. Run Concurrent Lookups: Pin Checker and Manufacturer ────────────
    let pinCheckerData: PinCheckerResult | null = null;
    let manData: ManufacturerResult | null = null;
    let parseError = false;

    if (fullPin) {
      try {
        if (captchaAnswer && captchaAnswer.trim()) {
          const postData = `viewType=static&actionCode=checkPin&vo.pinNo=${encodeURIComponent(fullPin)}&captcahText=${encodeURIComponent(captchaAnswer.trim())}`;
          console.log('[retrieve] Using cookieString for pinChecker:', cookieString);
          console.log('[retrieve] Posting to pinChecker with postData:', postData);
          
          const [pcHtml, manResult] = await Promise.all([
            httpsPost('/KRA-Portal/pinChecker.htm', postData, cookieString, 'application/x-www-form-urlencoded', proxyUrl).catch((e: any) => {
              console.warn('[retrieve] pinChecker httpsPost error:', e.message);
              return '';
            }),
            fetchManufacturerDetails(fullPin, freshCookieString, proxyUrl).catch(() => null),
          ]);

          if (pcHtml.length > 100) {
            console.log('[retrieve] pinChecker raw response snippet:', pcHtml.substring(0, 600));
            pinCheckerData = parsePinCheckerHtml(pcHtml);
            console.log('[retrieve] pinChecker parsed name:', pinCheckerData.name, 'pin:', pinCheckerData.pin);
            if (pinCheckerData.captchaWrong && !liveApiTaxpayer) {
              await createSystemLog({
                level: 'warning',
                service: 'KRA-Retrieve',
                message: `Wrong captcha answer entered for PIN ${fullPin}`,
                actor: userEmail,
                ip,
                details: { pin: fullPin, captchaAnswer }
              });
              return NextResponse.json({
                success: false,
                captchaWrong: true,
                error: 'Wrong CAPTCHA answer. Please reload and try again.',
              }, { status: 422 });
            }
          }
          manData = manResult;
        } else {
          manData = await fetchManufacturerDetails(fullPin, freshCookieString, proxyUrl).catch(() => null);
        }
      } catch (err: any) {
        console.warn('[retrieve] iTax details fetch notice:', err.message);
        parseError = true;
      }
    }

    // ── 4. Merge fields: Live API + Manufacturer + Pin Checker ─────────────
    const pc = pinCheckerData;
    const man = manData;
    const api = liveApiTaxpayer;

    // Prefer unmasked name from manufacturer/API over masked pinChecker name (e.g. "Powel M*****")
    let name = first(man?.name, api?.taxpayerName, pc?.name, '');

    if (!fullPin) {
      console.error('[retrieve] Live & DWR retrieval returned no taxpayer record.');
      return NextResponse.json({
        success: false,
        error: 'KRA record not found. Please verify the ID number or PIN and try again.'
      }, { status: 404 });
    }

    const registeredDate = first(pc?.registeredDate, pc?.obligationDate, api?.registrationDate, '');

    // If name or registration date is not yet extracted, prompt for CAPTCHA
    if ((!name || !registeredDate) && (!captchaAnswer || !captchaAnswer.trim())) {
      console.log(`[retrieve] PIN ${fullPin} resolved. Prompting for security stamp to retrieve official details.`);
      return NextResponse.json({
        success: false,
        captchaRequired: true,
        pin: fullPin,
        error: `PIN ${fullPin} identified. Please solve the security stamp to retrieve your official registration date and station.`
      }, { status: 422 });
    }

    if (!name) {
      name = first(man?.name, api?.taxpayerName, pc?.name, 'Registered Taxpayer');
    }

    const county         = first(man?.county, pc?.county, api?.county, '');
    const normalizedCounty = county ? county.toLowerCase().replace(/\bcounty\b/g, '').replace(/[-\s]+/g, ' ').trim() : '';
    const defaultTown    = normalizedCounty ? (COUNTY_TOWN_MAP[normalizedCounty] || county) : '';
    const town           = first(man?.town, pc?.town, api?.town, defaultTown);
    const district       = first(man?.district, pc?.district, api?.district, '');

    // Station: Prefer authentic station from pinChecker.htm (e.g. KITALE -> Kitale TSO), then API, then county matrix
    const rawStation     = first(pc?.station, api?.station, '');
    const station        = rawStation ? formatKraStation(rawStation) : (county ? getKraStationForCounty(county) : '');

    // Tax Area: sanitize to prevent cross-county leakage (e.g. Endebbes in West Pokot)
    const rawTaxArea     = first(man?.taxArea, pc?.taxArea, api?.taxArea, '');
    const taxArea        = sanitizeTaxArea(rawTaxArea, county, town);
    
    const building       = first(man?.building, pc?.building, api?.building, '');
    const street         = first(man?.street, pc?.street, api?.street, '');
    const poBox          = first(man?.poBox, pc?.poBox, api?.poBox, '');
    const postalCode     = first(man?.postalCode, pc?.postalCode, api?.postalCode, '');
    const email          = first(man?.email, pc?.email, api?.email, '');
    const phoneNumber    = first(man?.phoneNumber, pc?.phoneNumber, api?.phoneNumber, '');

    // Cache unmasked record in database for legitimate certificate generation
    try {
      const prismaModule = await import('@/lib/prisma');
      const db = prismaModule.default as any;
      if (db.kra_pin_cache) {
        await db.kra_pin_cache.upsert({
          where: { pin: fullPin },
          update: {
            id_number: idNumber ? String(idNumber).trim() : undefined,
            name: name || '',
            email: email || null,
            building: building || null,
            street: street || null,
            city: town || null,
            county: county || null,
            district: district || null,
            tax_area: taxArea || null,
            po_box: poBox || null,
            postal_code: postalCode || null,
            station: station || null,
            phone_number: phoneNumber || null,
            registered_date: registeredDate || null,
            updated_at: new Date(),
          },
          create: {
            id: `CACHE_${fullPin}_${Date.now()}`,
            pin: fullPin,
            id_number: idNumber ? String(idNumber).trim() : null,
            name: name || '',
            email: email || null,
            building: building || null,
            street: street || null,
            city: town || null,
            county: county || null,
            district: district || null,
            tax_area: taxArea || null,
            po_box: poBox || null,
            postal_code: postalCode || null,
            station: station || null,
            phone_number: phoneNumber || null,
            registered_date: registeredDate || null,
            updated_at: new Date(),
          },
        });
      }
    } catch (cacheErr: any) {
      console.warn('[retrieve] Cache upsert notice:', cacheErr?.message);
    }

    // Verify user subscription status
    const { isSubscribed } = await getUserSubscriptionStatus(clerkId);

    const fullTaxpayerRecord = {
      pin:           fullPin,
      name:          name || '',
      email:         email || '',
      status:        'Active',
      certificate_url: `https://itax.kra.go.ke/KRA-Portal/dotDownloadCertificate.htm?pin=${fullPin}`,
      building:      building || '',
      street:        street || '',
      town:          town || '',
      county:        county || '',
      district:      district || '',
      taxArea:       taxArea || '',
      station:       station || '',
      poBox:         poBox || '',
      postalCode:    postalCode || '',
      phoneNumber:   phoneNumber || '',
      registeredDate: registeredDate || '',
    };

    // Apply strict server-side masking if user is not subscribed
    const clientTaxpayerData = maskTaxpayerData(fullTaxpayerRecord, isSubscribed, isAdmin);

    const result = {
      success: true,
      data: clientTaxpayerData,
      isSubscribed,
    };

    console.log('[retrieve] Final masked result:', JSON.stringify(result.data));
    await createSystemLog({
      level: 'info',
      service: 'KRA-Retrieve',
      message: `Taxpayer details retrieved (${isSubscribed ? 'Full' : 'Masked'}) for PIN ${fullPin}`,
      actor: userEmail,
      ip,
      details: { pin: fullPin, isSubscribed, county, station }
    });
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[retrieve] Critical retrieve handler error:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unable to retrieve details. Please verify your credentials and try again.',
    }, { status: 400 });
  }
}
