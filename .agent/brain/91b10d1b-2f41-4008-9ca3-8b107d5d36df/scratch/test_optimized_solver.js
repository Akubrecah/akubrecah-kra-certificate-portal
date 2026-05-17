async function runTest() {
  console.log('Testing optimized CAPTCHA solver...');
  const startTime = Date.now();
  
  // Dynamically import the ES module kraService
  const { default: kraService } = await import('../../../../lib/services/kraService.js');
  
  const pin = 'A016881319Q';
  const date = await kraService.fetchEffectiveDateFromPinChecker(pin);
  
  console.log(`Test completed in: ${(Date.now() - startTime) / 1000} seconds`);
  console.log('Returned Date:', date);
}

runTest().catch(console.error);
