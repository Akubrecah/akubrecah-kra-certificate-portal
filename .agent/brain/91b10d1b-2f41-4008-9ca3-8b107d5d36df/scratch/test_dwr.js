const https = require('https');

async function testDWR() {
  const pin = 'A001646271W'; // Standard valid PIN format or similar
  
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
  const scriptSessionId = 'E867568A57D844A88BAE9EEF7166A5CD/' + Date.now();
  const windowName = 'DWR-A867568A57';

  const body = [
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
    `scriptSessionId=${scriptSessionId}`
  ].join('\n') + '\n';

  const options = {
    hostname: 'itax.kra.go.ke',
    port: 443,
    path: '/KRA-Portal/dwr/call/plaincall/TaxPayerRDWR.getTaxpayerBasicRdtlsByPin.dwr',
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      'Content-Length': Buffer.byteLength(body),
      'Cookie': cookieString,
      'Referer': 'https://itax.kra.go.ke/KRA-Portal/pinChecker.htm',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'X-Requested-With': 'XMLHttpRequest'
    }
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('--- RAW DWR RESPONSE ---');
        console.log(data);
        console.log('------------------------');
        resolve();
      });
    });
    req.write(body);
    req.end();
  });
}

testDWR().catch(console.error);
