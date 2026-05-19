const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const allDates = await prisma.kRAPinCache.findMany();
  console.log(JSON.stringify(allDates, null, 2));
}
run();
