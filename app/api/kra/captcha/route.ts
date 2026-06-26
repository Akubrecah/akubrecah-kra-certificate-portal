import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import net from 'net';
import tls from 'tls';
import url from 'url';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { createSystemLog } from '@/lib/prisma';

export const maxDuration = 30;

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

export async function GET(req: NextRequest) {
  try {
    const proxyUrl = process.env.KRA_PROXY_URL || process.env.PROXY_URL || "";

    const { userId: clerkId } = await auth();
    let userEmail = "Anonymous";
    if (clerkId) {
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(clerkId);
        userEmail = user.primaryEmailAddress?.emailAddress || clerkId;
      } catch {}
    }
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';

    let captchaImage = "";
    let sessionToken = "";
    let success = false;

    try {
      // 1. Initialize KRA session
      const cookies = await initKraSession(proxyUrl);
      if (!cookies || Object.keys(cookies).length === 0) {
        throw new Error('No session cookies returned by KRA portal.');
      }
      const cookieString = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');

      // 2. Fetch CAPTCHA image as binary buffer
      const randNum = Math.floor(Math.random() * 10000);
      const captchaBuffer = await fetchCaptchaImage(cookieString, randNum, proxyUrl);

      sessionToken = Buffer.from(cookieString).toString('base64');
      captchaImage = `data:image/png;base64,${captchaBuffer.toString('base64')}`;
      success = true;

      // Log success
      await createSystemLog({
        level: 'info',
        service: 'KRA-Captcha',
        message: 'KRA Captcha challenge generated and loaded successfully',
        actor: userEmail,
        ip
      });
    } catch (err: any) {
      console.error('[captcha] Connection to KRA failed:', err.message);
      await createSystemLog({
        level: 'error',
        service: 'KRA-Captcha',
        message: `Failed to retrieve CAPTCHA from KRA portal: ${err.message}`,
        actor: userEmail,
        ip,
        details: { error: err.message }
      });
      return NextResponse.json({
        success: false,
        error: 'Failed to retrieve CAPTCHA challenge from KRA portal. Please verify the proxy is active or try again.'
      }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      captchaImage,
      sessionToken,
    });
  } catch (error: any) {
    console.error('[captcha] Critical Error:', error.message);
    return NextResponse.json({ success: false, error: 'Failed to load CAPTCHA. Please try again.' }, { status: 500 });
  }
}

function initKraSession(proxyUrl: string): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    const agent = createProxyAgent(proxyUrl);
    const options = {
      hostname: 'itax.kra.go.ke',
      port: 443,
      path: '/KRA-Portal/pinChecker.htm?actionCode=loadPage&viewType=static',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 10000,
      rejectUnauthorized: false,
      agent
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

function fetchCaptchaImage(cookieString: string, randNum: number, proxyUrl: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const agent = createProxyAgent(proxyUrl);
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
      timeout: 10000,
      rejectUnauthorized: false,
      agent
    } as any;

    https.get(options, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}
