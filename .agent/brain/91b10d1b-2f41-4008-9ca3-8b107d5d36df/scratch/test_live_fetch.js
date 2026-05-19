const { default: kraService } = require('/Users/Akubrecah/Desktop/Akubrecah KRA/lib/services/kraService.js');
async function run() {
  const date = await kraService.fetchEffectiveDateFromPinChecker('A016881319Q');
  console.log("Live date:", date);
}
run();
