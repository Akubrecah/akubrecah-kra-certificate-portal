const https = require('https');
const fs = require('fs');

async function downloadCaptcha() {
  // 1. Get Session Cookies
  const cookies = await new Promise((resolve) => {
    https.get('https://itax.kra.go.ke/KRA-Portal/pinChecker.htm?actionCode=loadPage&viewType=static', (res) => {
      const setCookies = res.headers['set-cookie'] || [];
      const extracted = {};
      setCookies.forEach(c => {
        const parts = c.split(';')[0].split('=');
        if (parts.length === 2) extracted[parts[0]] = parts[1];
      });
      resolve(extracted);
    });
  });

  const cookieString = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
  
  // 2. Fetch Captcha Image
  const randNum = Math.floor(Math.random() * 1000);
  const captchaBuffer = await new Promise((resolve) => {
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
    });
  });

  fs.writeFileSync('captcha-test.png', captchaBuffer);
  console.log('Saved captcha-test.png');
}

downloadCaptcha().catch(console.error);
