import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { verifyAdminMagicToken } from "./magic-token";

export interface AdminCaller {
  userId: string;
  email: string;
  role: string;
}

/**
 * Universal Admin Authentication Verifier
 * Supports:
 * 1. Master PIN header (x-admin-pin) or query parameter (?pin=8426)
 * 2. Service secret (x-service-secret)
 * 3. WhatsApp / Passcode magic cookie (admin_magic_auth)
 * 4. Clerk session (Super Admin email poweldayck@gmail.com or role)
 */
export async function verifyAdminCaller(req?: NextRequest): Promise<AdminCaller | null> {
  // 1. Check direct PIN header or query
  if (req) {
    const providedPin = req.headers.get("x-admin-pin") || req.nextUrl?.searchParams?.get("pin");
    const expectedPin = process.env.ADMIN_BOT_PIN || "8426";
    if (providedPin && (providedPin === expectedPin || providedPin === "8426")) {
      return { userId: "admin_pin_user", email: "admin@akubrecah.co.ke", role: "Super Admin" };
    }

    // 2. Check service secret
    const serviceSecret = req.headers.get("x-service-secret") || req.nextUrl?.searchParams?.get("secret");
    if (
      serviceSecret &&
      (serviceSecret === "akubrecah_secret_whatsapp_key_2026" ||
        serviceSecret === process.env.EVOLUTION_API_KEY)
    ) {
      return { userId: "service_admin", email: "admin@akubrecah.co.ke", role: "Super Admin" };
    }

    // 3. Check WhatsApp / Passcode Magic Cookie
    const magicCookie = req.cookies.get("admin_magic_auth")?.value;
    if (magicCookie) {
      const verified = verifyAdminMagicToken(magicCookie);
      if (verified) {
        return { userId: "wa_admin_" + verified.phone, email: "admin@akubrecah.co.ke", role: "Super Admin" };
      }
    }
  }

  // 4. Check Clerk authentication
  try {
    const { userId } = await auth();
    if (userId) {
      const client = await clerkClient();
      const currentUser = await client.users.getUser(userId);
      const email = currentUser.primaryEmailAddress?.emailAddress?.toLowerCase();
      const role = (currentUser.publicMetadata?.role as string) || "Admin";
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
        return { userId, email: email || "admin@akubrecah.co.ke", role: role || "Super Admin" };
      }
    }
  } catch (err: any) {
    console.error("[verifyAdminCaller] Clerk check error:", err?.message);
  }

  return null;
}
