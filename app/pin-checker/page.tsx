"use client";

import { KraPinChecker } from "@/components/kra-pin-checker";
import { useUser, RedirectToSignIn } from "@clerk/nextjs";
import { Loader2, ShieldAlert, ArrowLeft, FileCheck2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PinCheckerPage() {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-on-surface-variant">Verifying access credentials...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
  const userRole = user?.publicMetadata?.role as string;
  const configAdminEmail = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "poweldayck@gmail.com").toLowerCase();
  const isAdmin =
    userEmail === "poweldayck@gmail.com" ||
    userEmail === configAdminEmail ||
    userRole === "Super Admin" ||
    userRole === "Admin";

  // Enforce Admin Only Access
  if (!isAdmin) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 sm:p-8 text-center space-y-6 shadow-soft font-sans">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-headline font-bold text-on-surface">
              Administrative Access Only
            </h1>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              The live taxpayer PIN verification engine is reserved exclusively for authorized administrative audit sessions. Regular taxpayers can retrieve official KRA PIN certificates directly below.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Link href="/retrieval-portal" className="block w-full">
              <Button className="w-full h-11 rounded-xl bg-primary text-white font-bold text-xs shadow-xs hover:bg-primary/95 flex items-center justify-center gap-2">
                <FileCheck2 className="w-4 h-4" />
                <span>Launch Certificate Retrieval (KES 20)</span>
              </Button>
            </Link>

            <Link href="/dashboard" className="block w-full">
              <Button variant="outline" className="w-full h-11 rounded-xl border-outline-variant font-bold text-xs text-on-surface hover:bg-surface-container flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Dashboard</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Admin View
  return (
    <div className="w-full flex-1 flex flex-col justify-center py-6 px-4">
      <div className="max-w-5xl mx-auto w-full space-y-4">
        <div className="flex items-center justify-between p-3 px-4 rounded-xl bg-primary/5 border border-primary/20 text-xs">
          <span className="font-bold text-primary flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Admin Telemetry & Verification Gateway Active
          </span>
          <span className="text-[11px] font-semibold text-on-surface-variant">Authorized Audit Access</span>
        </div>
        <KraPinChecker />
      </div>
    </div>
  );
}
