const https = require('https');
const { createWorker } = require('tesseract.js');
const path = require('path');
const fs = require('fs');

function parseMathExpression(ocrText) {
  let clean = ocrText.replace(/\s+/g, '');
  clean = clean.replace(/~/g, '-').replace(/—/g, '-').replace(/_/g, '-');
  
  const isMinus = clean.includes('-');
  const isPlus = clean.includes('+');
  
  if (!isMinus && !isPlus) return null;
  
  const op = isMinus ? '-' : '+';
  const parts = clean.split(op);
  
  if (parts.length < 2) return null;
  
  const num1Match = parts[0].match(/\d+/);
  if (!num1Match) return null;
  const num1 = parseInt(num1Match[0], 10);
  
  let secondPart = parts[1].replace(/[^0-9]/g, '');
  if (secondPart.length === 0) return null;
  
  let num2 = parseInt(secondPart, 10);
  if (secondPart.length > 1) {
    const stripped = secondPart.slice(0, -1);
    num2 = parseInt(stripped, 10);
  }
  
  return {
    num1,
    operator: op,
    num2,
    result: op === '+' ? (num1 + num2) : (num1 - num2)
  };
}

async function testRawHttpPinChecker() {
  const pin = 'A016881319Q';
  console.log(`Starting raw HTTP verification for PIN: ${pin}`);
  const startTime = Date.now();

  // 1. Get Session Cookies
  const cookies = await new Promise((resolve, reject) => {
    const options = {
      hostname: 'itax.kra.go.ke',
      port: 443,
      path: '/KRA-Portal/pinChecker.htm?actionCode=loadPage&viewType=static',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      rejectUnauthorized: false
    };

    https.get(options, (res) => {
      const setCookies = res.headers['set-cookie'] || [];
      const extracted = {};
      setCookies.forEach(c => {
        const parts = c.split(';')[0].split('=');
        if (parts.length === 2) extracted[parts[0]] = parts[1];
      });
      resolve(extracted);
    }).on('error', reject);
  });

  const cookieString = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
  console.log(`Session initialized in ${Date.now() - startTime}ms.`);

  // 2. Fetch Captcha Image as Buffer
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

  console.log(`Captcha image fetched in ${Date.now() - startTime}ms.`);

  // 3. OCR solve the Captcha using Tesseract
  const worker = await createWorker('eng', 1, {
    workerPath: path.join(process.cwd(), 'node_modules', 'tesseract.js', 'src', 'worker-script', 'node', 'index.js')
  });

  const ret = await worker.recognize(captchaBuffer);
  const text = ret.data.text.trim();
  console.log(`OCR Raw text: "${text}"`);
  
  const parsed = parseMathExpression(text);
  await worker.terminate();

  if (!parsed) {
    console.log('Could not solve Captcha.');
    return;
  }

  console.log(`Solved Expression: ${parsed.num1} ${parsed.operator} ${parsed.num2} = ${parsed.result}`);

  // 4. Submit POST request
  console.log('Submitting Pin Checker POST request...');
  const postData = `viewType=static&actionCode=checkPin&vo.pinNo=${encodeURIComponent(pin)}&captcahText=${parsed.result}`;
  
  const htmlResult = await new Promise((resolve, reject) => {
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      rejectUnauthorized: false
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });

  console.log(`Response received in ${Date.now() - startTime}ms.`);
  fs.writeFileSync('pin-checker-result.html', htmlResult);
  console.log('Saved response to pin-checker-result.html');

  if (htmlResult.includes('Wrong result of the arithmetic operation.')) {
    console.log('ERROR: KRA returned wrong arithmetic answer!');
  } else {
    console.log('SUCCESS! Captcha accepted.');
  }
}

testRawHttpPinChecker().catch(console.error);
