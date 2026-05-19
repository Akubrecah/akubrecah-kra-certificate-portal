const https = require('https');
const fs = require('fs');

async function run() {
  const pin = 'A016881319Q';
  let htmlResult;
  try {
     htmlResult = await new Promise((resolve, reject) => {
          const postData = `viewType=static&actionCode=checkPin&vo.pinNo=${encodeURIComponent(pin)}&captcahText=0`;
          const options = {
            hostname: 'itax.kra.go.ke', port: 443, path: '/KRA-Portal/pinChecker.htm', method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Content-Length': Buffer.byteLength(postData),
              'User-Agent': 'Mozilla/5.0'
            },
            rejectUnauthorized: false
          };
          const req = https.request(options, (res) => {
            let data = ''; res.on('data', chunk => data += chunk); res.on('end', () => resolve(data));
          });
          req.on('error', reject); req.write(postData); req.end();
     });
     // write html to file
     fs.writeFileSync('/Users/Akubrecah/Desktop/Akubrecah KRA/.agent/brain/91b10d1b-2f41-4008-9ca3-8b107d5d36df/scratch/kra_html.html', htmlResult);
     const dateRegex = />\s*(\d{2}\/\d{2}\/\d{4})\s*<\/td>/g;
     const matches = [...htmlResult.matchAll(dateRegex)];
     console.log("All dates:", matches.map(m => m[1]));
  } catch(e) { console.error(e); }
}
run();
