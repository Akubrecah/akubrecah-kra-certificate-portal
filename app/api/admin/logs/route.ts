import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma, { createSystemLog } from "@/lib/prisma";

// Verify that the current user is the super admin or admin role
async function verifySuperAdmin() {
  const { userId } = await auth();
  if (!userId) return null;

  const client = await clerkClient();
  const currentUser = await client.users.getUser(userId);
  const email = currentUser.primaryEmailAddress?.emailAddress?.toLowerCase();
  const role = currentUser.publicMetadata?.role as string;
  const configAdminEmail = (process.env.SUPER_ADMIN_EMAIL || "poweldayck@gmail.com").toLowerCase();
  const configPublicAdminEmail = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "poweldayck@gmail.com").toLowerCase();

  if (
    email === "poweldayck@gmail.com" ||
    email === configAdminEmail ||
    email === configPublicAdminEmail ||
    role === "Super Admin" ||
    role === "Admin" ||
    process.env.NODE_ENV === "development"
  ) {
    return client;
  }
  return null;
}

// GET handler to fetch latest logs
export async function GET(req: NextRequest) {
  try {
    const client = await verifySuperAdmin();
    if (!client) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const level = searchParams.get("level") || "all";

    const where: any = {};
    if (level !== "all") {
      where.level = level;
    }

    // Fetch logs from Neon Database via Prisma
    const db = prisma as any;
    const logs = await db.systemLog.findMany({
      where,
      take: limit > 200 ? 200 : limit,
      orderBy: {
        timestamp: "desc",
      },
    });

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    console.error("[API System Logs GET Error]:", error);
    // If the database has not been initialized yet (tables not pushed), return an empty list or clear error
    if (error.code === "P2021" || error.message?.includes("relation") || error.message?.includes("does not exist")) {
      return NextResponse.json({ 
        success: true, 
        logs: [], 
        warning: "Database tables are not initialized yet. Please run: npx prisma db push" 
      });
    }
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}

// POST handler to insert a custom log entry
export async function POST(req: NextRequest) {
  try {
    const client = await verifySuperAdmin();
    if (!client) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { level, service, message, actor, ip, details } = body;

    if (!level || !service || !message || !actor) {
      return NextResponse.json({ success: false, error: "Missing required log fields" }, { status: 400 });
    }

    const log = await createSystemLog({ level, service, message, actor, ip, details });
    if (!log) {
      return NextResponse.json({ success: false, error: "Failed to create log entry in database" }, { status: 500 });
    }

    return NextResponse.json({ success: true, log });
  } catch (error: any) {
    console.error("[API System Logs POST Error]:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
