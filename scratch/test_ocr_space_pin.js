import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const kraService = require('../lib/services/kraService').default;

async function run() {
  const pin = 'A016881319Q';
  console.log('Fetching live exact date for PIN:', pin);
  const exactDate = await kraService.fetchEffectiveDateFromPinChecker(pin);
  console.log('Exact Date returned:', exactDate);
}
run();
