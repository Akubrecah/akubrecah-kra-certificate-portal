const kraService = require('../lib/services/kraService').default;

async function testLiveLookup() {
    const pin = 'A016881319Q';
    console.log(`Starting live KRA static Pin Checker exact date query for PIN: ${pin}...`);
    const startTime = Date.now();
    try {
        const exactDate = await kraService.fetchEffectiveDateFromPinChecker(pin);
        const duration = Date.now() - startTime;
        console.log('----------------------------------------------------');
        if (exactDate) {
            console.log(`SUCCESS! Extracted exact registration date: ${exactDate}`);
        } else {
            console.log('FAILED! Unable to extract exact date.');
        }
        console.log(`Query completed in ${duration}ms`);
    } catch (e) {
        console.error('Error running live test:', e);
    }
}

testLiveLookup();
