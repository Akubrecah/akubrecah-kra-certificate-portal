import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import net from 'net';
import tls from 'tls';
import url from 'url';

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
  });
}

export async function GET(req: NextRequest) {
  try {
    const proxyUrl = process.env.KRA_PROXY_URL || process.env.PROXY_URL || "";
    const isMockMode = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

    let captchaImage = "";
    let sessionToken = "";
    let success = false;

    if (!isMockMode) {
      try {
        // 1. Initialize KRA session
        const cookies = await initKraSession(proxyUrl);
        const cookieString = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');

        // 2. Fetch CAPTCHA image as binary buffer
        const randNum = Math.floor(Math.random() * 10000);
        const captchaBuffer = await fetchCaptchaImage(cookieString, randNum, proxyUrl);

        sessionToken = Buffer.from(cookieString).toString('base64');
        captchaImage = `data:image/png;base64,${captchaBuffer.toString('base64')}`;
        success = true;
      } catch (err: any) {
        console.warn('[captcha] Connection to KRA failed. Falling back to simulation mode:', err.message);
      }
    }

    // 3. Fallback to Simulation Mode if real connection fails or mock mode is requested
    if (!success) {
      const num1 = Math.floor(Math.random() * 9) + 1;
      const num2 = Math.floor(Math.random() * 9) + 1;
      const sum = num1 + num2;

      // Render a clean SVG mathematical challenge resembling the portal captcha
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="50" viewBox="0 0 150 50">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="24" font-weight="bold" fill="#1f2937">
          ${num1} + ${num2} = ?
        </text>
        <line x1="0" y1="12" x2="150" y2="38" stroke="#9ca3af" stroke-width="1.5"/>
        <line x1="0" y1="38" x2="150" y2="12" stroke="#9ca3af" stroke-width="1.5"/>
      </svg>`;

      captchaImage = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

      // Save captcha answer and mock state inside the session token payload
      const mockSession = {
        isMock: true,
        answer: sum,
        createdAt: Date.now()
      };
      sessionToken = Buffer.from(JSON.stringify(mockSession)).toString('base64');
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
