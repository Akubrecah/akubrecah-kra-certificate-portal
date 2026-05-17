const https = require('https');

async function initKraSession() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'itax.kra.go.ke',
            port: 443,
            path: '/KRA-Portal/',
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            rejectUnauthorized: false
        };
        https.get(options, (res) => {
            const cookies = res.headers['set-cookie'] || [];
            const cookieMap = {};
            cookies.forEach((cookie) => {
                const [nameValue] = cookie.split(';');
                const [name, value] = nameValue.split('=');
                if (name && value) cookieMap[name] = value;
            });
            resolve(cookieMap);
        }).on('error', reject);
    });
}

async function testOCR() {
    try {
        console.log('Initializing KRA session...');
        const cookies = await initKraSession();
        const cookieString = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
        console.log('Session initialized with cookies:', cookieString);

        console.log('Fetching CAPTCHA image...');
        const randNum = Math.floor(Math.random() * 1000);
        const captchaBuffer = await new Promise((resolve, reject) => {
            const options = {
                hostname: 'itax.kra.go.ke',
                port: 443,
                path: `/KRA-Portal/GenerateCaptchaServlet.do?sourcePage=LOGIN&rand=${randNum}`,
                method: 'GET',
                headers: {
                    'Cookie': cookieString,
                    'Referer': 'https://itax.kra.go.ke/KRA-Portal/pinChecker.htm?actionCode=loadPage&viewType=static',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                rejectUnauthorized: false
            };
            https.get(options, (res) => {
                const chunks = [];
                res.on('data', chunk => chunks.push(chunk));
                res.on('end', () => resolve(Buffer.concat(chunks)));
            }).on('error', reject);
        });

        console.log(`Fetched CAPTCHA. Size: ${captchaBuffer.length} bytes.`);
        const base64Image = `data:image/png;base64,${captchaBuffer.toString('base64')}`;

        console.log('Sending to OCR.space API...');
        const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
        const apikey = 'helloworld'; // OCR.space fallback key

        const payload = [
            `--${boundary}`,
            'Content-Disposition: form-data; name="apikey"',
            '',
            apikey,
            `--${boundary}`,
            'Content-Disposition: form-data; name="language"',
            '',
            'eng',
            `--${boundary}`,
            'Content-Disposition: form-data; name="base64Image"',
            '',
            base64Image,
            `--${boundary}--`,
            ''
        ].join('\r\n');

        const ocrResult = await new Promise((resolve, reject) => {
            const options = {
                hostname: 'api.ocr.space',
                port: 443,
                path: '/parse/image',
                method: 'POST',
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${boundary}`,
                    'Content-Length': Buffer.byteLength(payload)
                }
            };
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(JSON.parse(data)));
            });
            req.on('error', reject);
            req.write(payload);
            req.end();
        });

        console.log('OCR.space Response:', JSON.stringify(ocrResult));
        if (ocrResult && ocrResult.ParsedResults && ocrResult.ParsedResults.length > 0) {
            const text = ocrResult.ParsedResults[0].ParsedText.trim();
            console.log('Detected CAPTCHA Text:', text);
        } else {
            console.log('Failed to parse text from CAPTCHA.');
        }
    } catch (e) {
        console.error('Error running test:', e);
    }
}

testOCR();
