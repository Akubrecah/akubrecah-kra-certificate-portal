import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { createSystemLog } from "@/lib/prisma";

// Verify that the current user is the super admin or has admin role configuration
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
    process.env.NODE_ENV === "development" // Bypass auth checks in local development for convenience
  ) {
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

    const CSV_PATH = path.resolve(process.cwd(), "old clerk.csv");
    if (!fs.existsSync(CSV_PATH)) {
      return NextResponse.json({ success: false, error: `CSV file not found at ${CSV_PATH}` }, { status: 404 });
    }

    // 1. Parse CSV
    const content = fs.readFileSync(CSV_PATH, "utf8");
    const lines = content.split(/\r?\n/);
    const headers = lines[0].split(",").map(h => h.trim());
    const usersToMigrate: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(",");
      const user: any = {};
      headers.forEach((header, index) => {
        user[header] = parts[index] ? parts[index].trim() : "";
      });
      usersToMigrate.push(user);
    }

    console.log(`[API Migration] Parsed ${usersToMigrate.length} users from old clerk.csv`);

    // 2. Fetch existing users in target instance to prevent duplicates
    const existingUsersList = await client.users.getUserList({ limit: 100 });
    const existingUsers = Array.isArray(existingUsersList) 
      ? existingUsersList 
      : ((existingUsersList as any).data || []);
      
    const targetEmails = new Set<string>();
    existingUsers.forEach(user => {
      user.emailAddresses.forEach(e => {
        targetEmails.add(e.emailAddress.toLowerCase());
      });
    });

    const results = {
      total: usersToMigrate.length,
      success: [] as string[],
      skipped: [] as string[],
      failed: [] as { email: string; error: string }[],
    };

    // 3. Migrate users
    for (const user of usersToMigrate) {
      const email = user.primary_email_address;
      if (!email) {
        results.skipped.push(`Missing email for user: ${user.first_name || "unknown"}`);
        continue;
      }

      if (targetEmails.has(email.toLowerCase())) {
        results.skipped.push(`${email} (already exists)`);
        continue;
      }

      const payload: any = {
        emailAddress: [email],
        firstName: user.first_name || undefined,
        lastName: user.last_name || undefined,
        username: user.username || undefined,
        skipPasswordChecks: true,
      };

      if (user.password_digest && user.password_hasher) {
        payload.passwordDigest = user.password_digest;
        payload.passwordHasher = user.password_hasher;
      } else {
        payload.password = "Password2026!";
      }

      try {
        const created = await client.users.createUser(payload);
        results.success.push(`${email} -> ID: ${created.id}`);
      } catch (err: any) {
        console.error(`[API Migration] Failed to migrate ${email}:`, err);
        
        let errorMsg = err.message || JSON.stringify(err);
        if (err.errors && Array.isArray(err.errors)) {
          errorMsg = err.errors.map((e: any) => `${e.code}: ${e.message} ${e.longMessage || ""}`).join(" | ");
        }
        
        results.failed.push({
          email,
          error: errorMsg,
        });
      }

      // Small delay to respect rate limit
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Write failed results to a log file for diagnosis
    if (results.failed.length > 0) {
      const logPath = path.resolve(process.cwd(), "migration-errors.log");
      const logContent = results.failed.map(f => `Email: ${f.email}\nError: ${f.error}\n`).join("\n");
      fs.writeFileSync(logPath, logContent, "utf8");
    }

    // Log the user migration summary to Neon Database
    await createSystemLog({
      level: results.failed.length > 0 ? "warning" : "info",
      service: "UserMigration",
      message: `User migration from old clerk.csv completed: ${results.success.length} succeeded, ${results.skipped.length} skipped, ${results.failed.length} failed.`,
      actor: "SystemAdmin",
      details: {
        successCount: results.success.length,
        skippedCount: results.skipped.length,
        failedCount: results.failed.length,
      }
    });

    return NextResponse.json({
      success: true,
      message: "Migration completed",
      results,
    });
  } catch (error: any) {
    console.error("[API Migration Error]:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
