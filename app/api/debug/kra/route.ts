import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

/**
 * DEBUG ENDPOINT: GET /api/debug/kra?id=12345678
 * Shows the raw KRA response so we can see exactly what data is available.
 * Remove this file before going to production.
 */
export async function GET(req: NextRequest) {
  const idNumber = req.nextUrl.searchParams.get('id');
  const pin = req.nextUrl.searchParams.get('pin');

  if (!idNumber && !pin) {
    return NextResponse.json({ 
      error: 'Provide ?id=YOUR_ID_NUMBER or ?pin=YOUR_KRA_PIN',
      example: '/api/debug/kra?id=30123456'
    });
  }

  const results: Record<string, any> = {};

  try {
    // Step 1: Init session and get cookies
    const cookies = await initSession();
    results.session = { cookieCount: Object.keys(cookies).length, cookies: Object.keys(cookies) };

    const scriptSessionId = generateScriptSessionId();
    const windowName = 'DEBUG-' + Date.now();

    let resolvedPin = pin;

    // Step 2: If ID given, find PIN
    if (idNumber) {
      const pinResponse = await callDWR(cookies, scriptSessionId, windowName, {
        scriptName: 'findPinByIdno',
        methodName: 'findPinByIdnumber',
        params: [`string:${idNumber}`],
        batchId: 0,
        page: '%2FKRA-Portal%2FpinChecker.htm'
      });
      results.step1_pinLookupRaw = pinResponse;

      if (pinResponse && pinResponse.includes('#$')) {
        const [masked, reversed] = pinResponse.split('#$');
        const digits = reversed.split('').reverse().join('');
        resolvedPin = masked.replace('*****', digits);
        results.step1_decodedPin = resolvedPin;
      }
    }

    if (!resolvedPin) {
      return NextResponse.json({ error: 'Could not decode PIN', results });
    }

    // Step 3: Try multiple KRA endpoints to find address data
    const cookieString = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');

    // Endpoint A: TaxPayerRDWR.getTaxpayerBasicRdtlsByPin
    results.endpointA_taxpayerDWR = await rawHttpPost(
      '/KRA-Portal/dwr/call/plaincall/TaxPayerRDWR.getTaxpayerBasicRdtlsByPin.dwr',
      [
        'callCount=1', `windowName=${windowName}`,
        'c0-scriptName=TaxPayerRDWR', 'c0-methodName=getTaxpayerBasicRdtlsByPin',
        'c0-id=0', `c0-param0=string:${resolvedPin}`,
        'batchId=1', 'instanceId=0', 'page=%2FKRA-Portal%2FpinChecker.htm',
        'httpSessionId=', `scriptSessionId=${scriptSessionId}`
      ].join('\n') + '\n',
      cookieString,
      'https://itax.kra.go.ke/KRA-Portal/pinChecker.htm'
    );

    // Endpoint B: findPinByIdno.findNameByPin (gets taxpayer name)
    results.endpointB_nameLookup = await rawHttpPost(
      '/KRA-Portal/dwr/call/plaincall/findPinByIdno.findNameByPin.dwr',
      [
        'callCount=1', `windowName=${windowName}`,
        'c0-scriptName=findPinByIdno', 'c0-methodName=findNameByPin',
        'c0-id=0', `c0-param0=string:${resolvedPin}`,
        'batchId=2', 'instanceId=0', 'page=%2FKRA-Portal%2FpinChecker.htm',
        'httpSessionId=', `scriptSessionId=${scriptSessionId}`
      ].join('\n') + '\n',
      cookieString,
      'https://itax.kra.go.ke/KRA-Portal/pinChecker.htm'
    );

    // Endpoint C: Manufacturer endpoint (JSON)
    results.endpointC_manufacturerJSON = await rawHttpPost(
      '/KRA-Portal/manufacturerAuthorizationController.htm?actionCode=fetchManDtl',
      `manPin=${encodeURIComponent(resolvedPin)}`,
      cookieString,
      'https://itax.kra.go.ke/KRA-Portal/',
      'application/x-www-form-urlencoded; charset=UTF-8'
    );

    // Endpoint D: Taxpayer certificate details
    results.endpointD_certDetails = await rawHttpPost(
      '/KRA-Portal/dwr/call/plaincall/findPinByIdno.findAddressByPin.dwr',
      [
        'callCount=1', `windowName=${windowName}`,
        'c0-scriptName=findPinByIdno', 'c0-methodName=findAddressByPin',
        'c0-id=0', `c0-param0=string:${resolvedPin}`,
        'batchId=3', 'instanceId=0', 'page=%2FKRA-Portal%2FpinChecker.htm',
        'httpSessionId=', `scriptSessionId=${scriptSessionId}`
      ].join('\n') + '\n',
      cookieString,
      'https://itax.kra.go.ke/KRA-Portal/pinChecker.htm'
    );

    return NextResponse.json({ 
      resolvedPin,
      results,
      summary: 'Check each endpoint result above to find which one returns address data'
    }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message, results }, { status: 500 });
  }
}

// ---- HTTP helpers ----

function rawHttpPost(path: string, body: string, cookieString: string, referer: string, contentType = 'text/plain'): Promise<string> {
  return new Promise((resolve) => {
    const options = {
      hostname: 'itax.kra.go.ke',
      port: 443,
      path,
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        'Content-Length': Buffer.byteLength(body),
        'Cookie': cookieString,
        'Referer': referer,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'X-Requested-With': 'XMLHttpRequest'
      },
      timeout: 30000,
      rejectUnauthorized: false,
    };

    const req = (https as any).request(options, (res: any) => {
      let data = '';
      res.on('data', (chunk: any) => data += chunk);
      res.on('end', () => resolve(data.substring(0, 2000))); // First 2000 chars
    });
    req.on('error', (e: any) => resolve(`ERROR: ${e.message}`));
    req.write(body);
    req.end();
  });
}

function initSession(): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'itax.kra.go.ke', port: 443,
      path: '/KRA-Portal/pinChecker.htm', method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 30000, rejectUnauthorized: false
    };
    const req = (https as any).request(options, (res: any) => {
      const cookies: Record<string, string> = {};
      const setCookies = res.headers['set-cookie'] || [];
      setCookies.forEach((c: string) => {
        const part = c.split(';')[0];
        const [k, v] = part.split('=');
        if (k && v) cookies[k.trim()] = v.trim();
      });
      res.resume();
      res.on('end', () => resolve(cookies));
    });
    req.on('error', reject);
    req.end();
  });
}

async function callDWR(cookies: Record<string, string>, scriptSessionId: string, windowName: string, params: any): Promise<string | null> {
  return new Promise((resolve) => {
    const cookieString = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
    const body = [
      'callCount=1', `windowName=${windowName}`,
      `c0-scriptName=${params.scriptName}`, `c0-methodName=${params.methodName}`,
      'c0-id=0', ...params.params.map((p: string, i: number) => `c0-param${i}=${p}`),
      `batchId=${params.batchId}`, 'instanceId=0',
      `page=${params.page || '%2FKRA-Portal%2FpinChecker.htm'}`,
      'httpSessionId=', `scriptSessionId=${scriptSessionId}`
    ].join('\n') + '\n';

    const options = {
      hostname: 'itax.kra.go.ke', port: 443,
      path: `/KRA-Portal/dwr/call/plaincall/${params.scriptName}.${params.methodName}.dwr`,
      method: 'POST',
      headers: { 'Content-Type': 'text/plain', 'Cookie': cookieString, 'Referer': 'https://itax.kra.go.ke/KRA-Portal/', 'User-Agent': 'Mozilla/5.0' },
      timeout: 30000, rejectUnauthorized: false
    };

    const req = (https as any).request(options, (res: any) => {
      let data = '';
      res.on('data', (chunk: any) => data += chunk);
      res.on('end', () => {
        const callbackMatch = data.match(/handleCallback\([^,]+,[^,]+,"([^"]+)"\)/);
        if (callbackMatch) return resolve(callbackMatch[1]);
        const stringMatch = data.match(/s\d+="([^"]+)"/);
        resolve(stringMatch ? stringMatch[1] : data.substring(0, 500));
      });
    });
    req.on('error', (e: any) => resolve(null));
    req.write(body);
    req.end();
  });
}

function generateScriptSessionId() {
  return Math.random().toString(16).slice(2).toUpperCase() + '/' + Date.now();
}
