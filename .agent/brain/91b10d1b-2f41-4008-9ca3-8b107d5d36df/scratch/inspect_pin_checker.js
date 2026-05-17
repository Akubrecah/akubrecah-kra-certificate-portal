const https = require('https');
const fs = require('fs');

async function inspectPinChecker() {
  console.log('Fetching static Pin Checker page...');
  
  // 1. Get initial session and page HTML
  const { cookies, html } = await new Promise((resolve) => {
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
      const setCookie = res.headers['set-cookie'] || [];
      const extracted = {};
      setCookie.forEach(c => {
        const parts = c.split(';')[0].split('=');
        if (parts.length === 2) extracted[parts[0]] = parts[1];
      });
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ cookies: extracted, html: data }));
    });
  });

  console.log('Cookies retrieved:', cookies);
  
  // Look for the form fields
  console.log('--- Form Tag & Inputs ---');
  const formMatches = html.match(/<form[^>]*>([\s\S]*?)<\/form>/i);
  if (formMatches) {
    const formHtml = formMatches[0];
    const inputs = formHtml.match(/<input[^>]*>/gi) || [];
    inputs.forEach(input => console.log('Input:', input));
  } else {
    console.log('No form found in HTML');
  }

  // Save html for deeper inspection if needed
  fs.writeFileSync('pin-checker-source.html', html);
  console.log('Saved source to pin-checker-source.html');
}

inspectPinChecker().catch(console.error);
