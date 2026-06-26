import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;

// Reusable helper to write audit logs to database
export async function createSystemLog(data: {
  level: "info" | "warning" | "error";
  service: string;
  message: string;
  actor: string;
  ip?: string;
  details?: Record<string, any>;
}) {
  try {
    const log = await prisma.systemLog.create({
      data: {
        level: data.level,
        service: data.service,
        message: data.message,
        actor: data.actor || "System",
        ip: data.ip || "127.0.0.1",
        details: data.details || {},
      },
    });
    return log;
  } catch (error) {
    console.error("[createSystemLog Error]:", error);
    return null;
  }
}
