import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// Verify that the current user is the super admin (poweldayck@gmail.com)
async function verifySuperAdmin() {
  const { userId } = await auth();
  if (!userId) return null;

  const client = await clerkClient();
  const currentUser = await client.users.getUser(userId);
  const email = currentUser.primaryEmailAddress?.emailAddress?.toLowerCase();
  
  if (email === "poweldayck@gmail.com") {
    return client;
  }
  return null;
}

export async function GET() {
  try {
    const client = await verifySuperAdmin();
    if (!client) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    // Fetch all users from Clerk (limit to 100 for safety)
    const response = await client.users.getUserList({
      limit: 100,
    });

    const rawUsers = Array.isArray(response) ? response : ((response as any).data || []);

    const formattedUsers = rawUsers.map(user => {
      const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress || "";
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
        initials: name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2),
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
    const client = await verifySuperAdmin();
    if (!client) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

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
