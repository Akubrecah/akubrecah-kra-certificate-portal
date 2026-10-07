import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const maxDuration = 30;

// Verify that the caller is a Super Admin or Admin
async function verifyAdminCaller() {
  const { userId } = await auth();
  if (!userId) return null;

  try {
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
      return { userId, email, role: role || "Admin" };
    }
  } catch (err: any) {
    console.error("[verifyAdminCaller] Error:", err.message);
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminCaller();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized: Admin access required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 500);

    const db = prisma as any;

    // 1. Fetch unmasked cached taxpayer records
    const whereCache: any = {};
    if (query) {
      whereCache.OR = [
        { pin: { contains: query, mode: "insensitive" } },
        { id_number: { contains: query, mode: "insensitive" } },
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { phone_number: { contains: query, mode: "insensitive" } },
        { station: { contains: query, mode: "insensitive" } },
        { county: { contains: query, mode: "insensitive" } },
        { city: { contains: query, mode: "insensitive" } },
      ];
    }

    const cachedTaxpayers = await db.kra_pin_cache?.findMany({
      where: whereCache,
      orderBy: { updated_at: "desc" },
      take: limit,
    }) || [];

    // 2. Fetch certificate downloads audit records
    const whereDownloads: any = {};
    if (query) {
      whereDownloads.OR = [
        { pin: { contains: query, mode: "insensitive" } },
        { mpesaReceipt: { contains: query, mode: "insensitive" } },
        { checkoutId: { contains: query, mode: "insensitive" } },
      ];
    }

    const downloads = await db.certificateDownload?.findMany({
      where: whereDownloads,
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    }) || [];

    // 3. Fetch KRA audit logs
    const kraLogs = await db.SystemLog?.findMany({
      where: {
        OR: [
          { service: { in: ["KRA-Retrieve", "Certificate-Generation", "Paystack-Download", "Paystack-Subscription", "KRA-Live-PIN-Checker"] } },
          { message: { contains: "PIN", mode: "insensitive" } },
          { message: { contains: "Certificate", mode: "insensitive" } },
        ],
      },
      orderBy: { timestamp: "desc" },
      take: 50,
    }) || [];

    // 4. Calculate KPIs
    const totalTaxpayers = await db.kra_pin_cache?.count() || 0;
    const totalDownloads = await db.certificateDownload?.count() || 0;

    const revenueAggregate = await db.certificateDownload?.aggregate({
      _sum: {
        amountCharged: true,
      },
    }) || { _sum: { amountCharged: 0 } };

    const totalRevenueKes = revenueAggregate._sum.amountCharged || totalDownloads * 20;

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalTaxpayers,
          totalDownloads,
          totalRevenueKes,
          recentDownloadsCount: downloads.length,
          recentTaxpayersCount: cachedTaxpayers.length,
        },
        taxpayers: cachedTaxpayers,
        downloads,
        logs: kraLogs,
      },
    });

  } catch (error: any) {
    console.error("[admin/kra-retrievals GET] Error:", error.message);
    return NextResponse.json({ success: false, error: "Internal server error fetching retrieval data." }, { status: 500 });
  }
}
