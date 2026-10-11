import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCaller } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminCaller(req);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized: Admin access required." }, { status: 403 });
    }

    const client = await clerkClient();

    // Fetch all users from Clerk (limit to 100 for safety)
    const response = await client.users.getUserList({
      limit: 100,
    });

    const rawUsers = Array.isArray(response) ? response : ((response as any).data || []);
    
    console.log("[API Admin Users GET] Fetching users list:", {
      totalReturned: rawUsers.length,
      publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      rawIds: rawUsers.map((u: any) => u.id)
    });

    const formattedUsers = rawUsers.map((user: {
      id: string;
      emailAddresses: { id: string; emailAddress: string }[];
      primaryEmailAddressId: string | null;
      firstName: string | null;
      lastName: string | null;
      username: string | null;
      publicMetadata: Record<string, unknown>;
      banned: boolean;
      lastSignInAt: number | null;
    }) => {
      const email = user.emailAddresses.find((e: { id: string; emailAddress: string }) => e.id === user.primaryEmailAddressId)?.emailAddress 
        || user.emailAddresses[0]?.emailAddress 
        || "";
      const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || email.split("@")[0] || "Unknown User";
      const role = (user.publicMetadata?.role as string) || "Registered Taxpayer";
      const status = user.banned ? "Inactive" : "Active";
      const lastLogin = user.lastSignInAt 
        ? new Date(user.lastSignInAt).toLocaleString("en-US", { hour12: true, month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
        : "Never";

      return {
        id: user.id,
        name,
        email,
        role,
        status,
        lastLogin,
        initials: name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2),
      };
    });

    return NextResponse.json({ success: true, users: formattedUsers });
  } catch (error: any) {
    console.error("[API Admin Users GET Error]:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdminCaller(req);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized: Admin access required." }, { status: 403 });
    }

    const client = await clerkClient();

    const { action, userId, role, status } = await req.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
    }

    if (action === "updateRole") {
      if (!role) {
        return NextResponse.json({ success: false, error: "Role is required" }, { status: 400 });
      }
      
      // Update publicMetadata role on Clerk
      await client.users.updateUserMetadata(userId, {
        publicMetadata: { role },
      });
      
      return NextResponse.json({ success: true, message: `Updated user role to ${role}` });
    }

    if (action === "toggleStatus") {
      if (!status) {
        return NextResponse.json({ success: false, error: "Status is required" }, { status: 400 });
      }

      if (status === "Inactive") {
        // Ban user on Clerk
        await client.users.banUser(userId);
      } else {
        // Unban user on Clerk
        await client.users.unbanUser(userId);
      }

      return NextResponse.json({ success: true, message: `User status changed to ${status}` });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("[API Admin Users POST Error]:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
