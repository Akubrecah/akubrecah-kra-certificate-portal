const https = require('https');

async function testManufacturer() {
  const pin = 'A001646271W'; // A valid KRA PIN format
  
  // 1. Init Session
  const cookies = await new Promise((resolve) => {
    https.get('https://itax.kra.go.ke/KRA-Portal/', (res) => {
      const setCookie = res.headers['set-cookie'] || [];
      const extracted = {};
      setCookie.forEach(c => {
        const parts = c.split(';')[0].split('=');
        if (parts.length === 2) extracted[parts[0]] = parts[1];
      });
      resolve(extracted);
    });
  });

  const cookieString = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
  const body = `manPin=${encodeURIComponent(pin)}`;

  const options = {
    hostname: 'itax.kra.go.ke',
    port: 443,
    path: '/KRA-Portal/manufacturerAuthorizationController.htm?actionCode=fetchManDtl',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Cookie': cookieString,
      'Referer': 'https://itax.kra.go.ke/KRA-Portal/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('--- RAW MANUFACTURER JSON RESPONSE ---');
        console.log(data);
        console.log('--------------------------------------');
        resolve();
      });
    });
    req.write(body);
    req.end();
  });
}

testManufacturer().catch(console.error);
