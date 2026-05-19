const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  await prisma.kRAPinCache.deleteMany({});
  console.log('Cache cleared');
}
run();
