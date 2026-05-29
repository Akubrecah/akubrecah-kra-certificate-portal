import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

export const maxDuration = 30;

/**
 * GET /api/kra/captcha
 * 
 * Initializes a KRA session and fetches a fresh CAPTCHA image.
 * Returns the image as base64 + a session token (base64-encoded cookies)
 * so the client can display the CAPTCHA to the user and re-send it on submit.
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Initialize KRA session
    const cookies = await initKraSession();
    const cookieString = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');

    // 2. Fetch CAPTCHA image as binary buffer
    const randNum = Math.floor(Math.random() * 10000);
    const captchaBuffer = await new Promise<Buffer>((resolve, reject) => {
      const options = {
        hostname: 'itax.kra.go.ke',
        port: 443,
        path: `/KRA-Portal/GenerateCaptchaServlet.do?sourcePage=LOGIN&rand=${randNum}`,
        method: 'GET',
        headers: {
          'Cookie': cookieString,
          'Referer': 'https://itax.kra.go.ke/KRA-Portal/pinChecker.htm?actionCode=loadPage&viewType=static',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        rejectUnauthorized: false
      } as any;

      https.get(options, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      }).on('error', reject);
    });

    // 3. Encode session token as base64 so frontend can send it back
    const sessionToken = Buffer.from(cookieString).toString('base64');
    const captchaBase64 = `data:image/png;base64,${captchaBuffer.toString('base64')}`;

    return NextResponse.json({
      success: true,
      captchaImage: captchaBase64,
      sessionToken,
    });
  } catch (error: any) {
    console.error('[captcha] Error:', error.message);
    return NextResponse.json({ success: false, error: 'Failed to load CAPTCHA. Please try again.' }, { status: 500 });
  }
}

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
      timeout: 15000
    } as any;

    const req = https.request(options, (res) => {
      const rawCookies = res.headers['set-cookie'] || [];
      const cookieMap: Record<string, string> = {};
      rawCookies.forEach((cookie: string) => {
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
