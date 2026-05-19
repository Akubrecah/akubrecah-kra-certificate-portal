const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const users = await prisma.user.findMany({ include: { activities: true } });
  console.log("Users:", users.length);
  const nullDates = await prisma.kRAPinCache.findMany({ where: { registeredDate: null } });
  console.log("Null dates:", nullDates.length);
  const allDates = await prisma.kRAPinCache.findMany();
  console.log("All dates:", allDates.length);
}
run();
