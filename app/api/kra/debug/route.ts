/**
 * GET /api/kra/debug?pin=A008053948T
 * Hits KRA directly for the given PIN and returns the full raw + parsed response as JSON.
 * Use this to inspect what KRA actually sends so we can fix the parser.
 */
import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

function makeKraRequest(options: any, body: string): Promise<{ status: number; raw: string }> {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res: any) => {
      let data = '';
      res.on('data', (chunk: any) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, raw: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function generateScriptSessionId() {
  return Math.random().toString(16).slice(2).toUpperCase() + '/' + Date.now();
}

export async function GET(req: NextRequest) {
  const pin = req.nextUrl.searchParams.get('pin');
  if (!pin) {
    return NextResponse.json({ error: 'Provide ?pin=AXXXXXXXXXZ' }, { status: 400 });
  }

  const results: Record<string, any> = {};

  try {
    // --- Step 1: Get a session cookie ---
    const sessionResp = await makeKraRequest({
      hostname: 'itax.kra.go.ke', port: 443,
      path: '/KRA-Portal/',
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 20000,
    }, '');

    const setCookieHeaders: string[] = (sessionResp as any).cookies || [];
    // Parse cookies from response
    const cookieMap: Record<string, string> = {};
    // We need to access the raw response headers - use a different approach
    results.sessionStatus = sessionResp.status;
    results.sessionRawPreview = sessionResp.raw.substring(0, 200);

    // --- Step 2: Re-do session with proper cookie capture ---
    const cookies = await new Promise<Record<string, string>>((resolve, reject) => {
      const r = https.request({
        hostname: 'itax.kra.go.ke', port: 443, path: '/KRA-Portal/', method: 'GET',
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        timeout: 20000,
      }, (res: any) => {
        res.resume();
        const cookieHeaders: string[] = res.headers['set-cookie'] || [];
        const map: Record<string, string> = {};
        cookieHeaders.forEach((c: string) => {
          const [nv] = c.split(';');
          const [name, ...vals] = nv.split('=');
          if (name?.trim()) map[name.trim()] = vals.join('=').trim();
        });
        resolve(map);
      });
      r.on('error', reject);
      r.end();
    });

    results.cookies = Object.keys(cookies);
    const cookieString = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
    const scriptSessionId = generateScriptSessionId();
    const windowName = 'DWR-' + Math.random().toString(16).slice(2).toUpperCase();

    // --- Step 3: Call getTaxpayerBasicRdtlsByPin ---
    const dwrBody = [
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
      `scriptSessionId=${scriptSessionId}`,
    ].join('\n') + '\n';

    const dwrResp = await makeKraRequest({
      hostname: 'itax.kra.go.ke', port: 443,
      path: '/KRA-Portal/dwr/call/plaincall/TaxPayerRDWR.getTaxpayerBasicRdtlsByPin.dwr',
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'Content-Length': Buffer.byteLength(dwrBody),
        'Cookie': cookieString,
        'Referer': 'https://itax.kra.go.ke/KRA-Portal/pinChecker.htm',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'X-Requested-With': 'XMLHttpRequest',
      },
      timeout: 30000,
    }, dwrBody);

    results.dwr_getTaxpayerBasicRdtlsByPin = {
      status: dwrResp.status,
      rawFull: dwrResp.raw,  // Full raw — so we can see every field name KRA uses
    };

    // --- Step 4: Try manufacturer endpoint ---
    const manBody = `manPin=${encodeURIComponent(pin)}`;
    const manResp = await makeKraRequest({
      hostname: 'itax.kra.go.ke', port: 443,
      path: '/KRA-Portal/manufacturerAuthorizationController.htm?actionCode=fetchManDtl',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Cookie': cookieString,
        'Referer': 'https://itax.kra.go.ke/KRA-Portal/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 20000,
    }, manBody);

    results.manufacturer_fetchManDtl = {
      status: manResp.status,
      rawFull: manResp.raw,
    };

    return NextResponse.json(results, {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}
