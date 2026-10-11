import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  AlertCircle, 
  CheckCircle2, 
  FileCheck2, 
  ArrowRight, 
  ShieldCheck, 
  Send,
  Info,
  User,
  ExternalLink,
  Lock
} from "lucide-react";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import prisma, { createSystemLog } from "@/lib/prisma";
import ProfileWarningPopup from "@/components/profile-warning-popup";

interface DashboardPageProps {
  searchParams?: Promise<{ notice?: string }>;
}

export default async function TaxpayerDashboard(props: DashboardPageProps) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const user = await currentUser();
  const firstName = user?.firstName || "Client";
  const fullName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.fullName || "Taxpayer";
  const userId = user?.id;
  const email = user?.emailAddresses[0]?.emailAddress;
  const phone = user?.phoneNumbers?.[0]?.phoneNumber || (user?.publicMetadata?.phoneNumber as string) || null;

  // 1. Throttled Login Log tracking (Internal telemetry)
  if (userId) {
    const actor = email || userId;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    try {
      const db = prisma as any;
      if (typeof db.systemLog?.findFirst === "function") {
        const existingLog = await db.systemLog.findFirst({
          where: {
            actor,
            service: "Auth",
            message: "User logged in successfully",
            timestamp: {
              gte: oneHourAgo,
            },
          },
        });

        if (!existingLog) {
          const headersList = await headers();
          const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || '127.0.0.1';
          await createSystemLog({
            level: "info",
            service: "Auth",
            message: "User logged in successfully",
            actor,
            ip,
          });
        }
      }
    } catch (e: any) {
      if (e?.code !== "P2021") console.warn("[Dashboard auth log notice]:", e?.message || e);
    }
  }

  // 2. Profile Completeness evaluation
  const hasName = !!(user?.firstName && user?.lastName) || !!user?.fullName;
  const hasPhone = !!phone;
  const isProfileComplete = hasName && hasPhone;
  let completeness = 0;
  if (hasName) completeness += 50;
  if (hasPhone) completeness += 50;

  // 3. Fetch personal certificate count
  let certificatesCount = 0;
  if (userId) {
    try {
      const actorIds = [userId, email].filter(Boolean) as string[];
      const db = prisma as any;
      if (typeof db.systemLog?.count === "function") {
        certificatesCount = await db.systemLog.count({
          where: {
            actor: { in: actorIds },
            service: "Certificate-Generation",
          },
        });
      }
    } catch (error: any) {
      if (error?.code !== "P2021") console.warn("[Dashboard stats notice]:", error?.message || error);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 w-full font-sans">
      
      {/* Decommission Notification Banner (if routed from legacy CV builder) */}
      {searchParams.notice === "cv_builder_decommissioned" && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-start gap-3 text-sm">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-on-surface">Service Notice: Legacy Resume Builder Decommissioned</p>
            <p className="text-on-surface-variant text-xs leading-relaxed">
              Akubrecah has officially transitioned into a dedicated full-scale Software Engineering & Development company. 
              All in-house statutory compliance tools (KRA Certificate Retrieval, Live PIN Checker, and Returns Filing) 
              remain fully operational below.
            </p>
          </div>
        </div>
      )}

      {/* Streamlined Welcome Header & Account Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-outline-variant/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              Compliance Portal
            </span>
            <span className="text-xs text-on-surface-variant">Akubrecah Taxpayer Suite</span>
          </div>
          <h1 className="text-3xl font-headline font-bold text-on-surface mt-1.5">
            Welcome back, {firstName}
          </h1>
          <p className="text-on-surface-variant mt-1 text-sm md:text-base">
            Access statutory compliance tools, verify taxpayer PIN registry status, and retrieve official KRA certificates.
          </p>
        </div>

        {/* Account Verification Status Badge */}
        <div className="flex items-center gap-3 bg-surface-container-lowest border border-outline-variant p-3.5 px-4 rounded-2xl shadow-soft">
          <div className={`p-2 rounded-xl shrink-0 ${isProfileComplete ? "bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300" : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"}`}>
            {isProfileComplete ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-on-surface">
              {isProfileComplete ? "Taxpayer Profile Verified" : "Profile Setup Pending"}
            </span>
            <span className="text-[11px] text-on-surface-variant">
              {isProfileComplete ? (
                "All services fully active"
              ) : (
                <Link href="/dashboard/profile" className="text-primary hover:underline font-semibold">
                  Complete profile ({completeness}%) &rarr;
                </Link>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* 3 Focused Action Cards (Compliance Hub) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: KRA Certificate Retrieval Portal */}
        <Card className="bg-surface-container-lowest border-outline-variant hover:border-primary/50 shadow-soft hover:shadow-md transition-all duration-200 rounded-2xl flex flex-col justify-between group">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <FileCheck2 className="h-6 w-6" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary text-white">
                KES 20
              </span>
            </div>
            <CardTitle className="text-lg font-headline font-bold text-on-surface group-hover:text-primary transition-colors">
              KRA Certificate Retrieval
            </CardTitle>
            <CardDescription className="text-xs text-on-surface-variant leading-relaxed mt-1">
              Instant official KRA PIN compliance document retrieval by National ID or PIN with verified QR code and direct PDF download.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="pt-3 border-t border-outline-variant/60 flex items-center justify-between text-xs text-on-surface-variant mb-4">
              <span>Automated Gateway</span>
              <span className="font-semibold text-on-surface">
                {certificatesCount > 0 ? `${certificatesCount} Generated` : "Instant PDF"}
              </span>
            </div>
            <Link href="/retrieval-portal" className="block w-full">
              <Button className="w-full h-11 rounded-xl bg-primary text-white font-bold text-xs shadow-xs hover:bg-primary/95 flex items-center justify-center gap-2 group-hover:shadow-md transition-all">
                <span>Launch Retrieval Portal</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Card 2: Live Taxpayer PIN & ID Checker */}
        <Card className="bg-surface-container-lowest border-outline-variant hover:border-red-500/50 shadow-soft hover:shadow-md transition-all duration-200 rounded-2xl flex flex-col justify-between group">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 group-hover:bg-red-600 group-hover:text-white transition-colors">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-green-100 dark:bg-green-950/60 text-green-800 dark:text-green-300 border border-green-500/20">
                Free
              </span>
            </div>
            <CardTitle className="text-lg font-headline font-bold text-on-surface group-hover:text-red-600 transition-colors">
              Live PIN & ID Checker
            </CardTitle>
            <CardDescription className="text-xs text-on-surface-variant leading-relaxed mt-1">
              Verify taxpayer registry status in real time, confirm active tax obligations, and check assigned KRA Tax Station.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="pt-3 border-t border-outline-variant/60 flex items-center justify-between text-xs text-on-surface-variant mb-4">
              <span>Taxpayer Registry</span>
              <span className="font-semibold text-on-surface">Instant Lookup</span>
            </div>
            <Link href="/pin-checker" className="block w-full">
              <Button variant="outline" className="w-full h-11 rounded-xl border-outline-variant font-bold text-xs hover:bg-surface-container hover:text-red-600 flex items-center justify-center gap-2 transition-all">
                <span>Check Taxpayer PIN</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Card 3: Automated Nil Returns Filing */}
        <Card className="bg-surface-container-lowest border-outline-variant hover:border-emerald-500/50 shadow-soft hover:shadow-md transition-all duration-200 rounded-2xl flex flex-col justify-between group">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Send className="h-6 w-6" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
                Statutory
              </span>
            </div>
            <CardTitle className="text-lg font-headline font-bold text-on-surface group-hover:text-emerald-600 transition-colors">
              Automated Nil Returns
            </CardTitle>
            <CardDescription className="text-xs text-on-surface-variant leading-relaxed mt-1">
              Expedited statutory tax submission assistant for individual employment, business, and zero-liability nil returns.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="pt-3 border-t border-outline-variant/60 flex items-center justify-between text-xs text-on-surface-variant mb-4">
              <span>Annual Returns</span>
              <span className="font-semibold text-on-surface">Pipeline Ready</span>
            </div>
            <Link href="/dashboard/filing" className="block w-full">
              <Button variant="outline" className="w-full h-11 rounded-xl border-outline-variant font-bold text-xs hover:bg-surface-container hover:text-emerald-600 flex items-center justify-center gap-2 transition-all">
                <span>Access Tax Filing</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Account Details & Compliance Profile Card */}
      <Card className="bg-surface-container-lowest border-outline-variant shadow-soft rounded-2xl">
        <CardHeader className="pb-4 border-b border-outline-variant/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-headline font-bold flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <span>Taxpayer Profile & Compliance Record</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Your linked taxpayer account information and document records
              </CardDescription>
            </div>
            <Link href="/dashboard/profile">
              <Button variant="outline" size="sm" className="h-8.5 rounded-xl text-xs font-bold border-outline-variant hover:bg-surface-container">
                Manage Profile & Security &rarr;
              </Button>
            </Link>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Account Name</span>
              <p className="text-sm font-bold text-on-surface truncate">{fullName}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Registered Email</span>
              <p className="text-sm font-medium text-on-surface truncate">{email || "Not provided"}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Phone Number</span>
              <p className="text-sm font-medium text-on-surface truncate">
                {phone ? (
                  phone
                ) : (
                  <Link href="/dashboard/profile" className="text-amber-600 dark:text-amber-400 hover:underline text-xs flex items-center gap-1 font-semibold">
                    <AlertCircle className="w-3.5 h-3.5" /> Add phone number
                  </Link>
                )}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Certificates Issued</span>
              <p className="text-sm font-bold text-on-surface">
                {certificatesCount > 0 ? (
                  <span className="text-green-600 dark:text-green-400">{certificatesCount} on file</span>
                ) : (
                  <span className="text-on-surface-variant text-xs font-normal">None generated yet</span>
                )}
              </p>
            </div>
          </div>

          {/* Profile completion progress */}
          {!isProfileComplete && (
            <div className="mt-6 pt-5 border-t border-outline-variant/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-500/5 p-4 rounded-xl border border-amber-500/20">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-on-surface">Complete your taxpayer profile to unlock all statutory downloads</p>
                <p className="text-[11px] text-on-surface-variant">Full legal name and verified phone number are required for compliance certificates.</p>
              </div>
              <Link href="/dashboard/profile">
                <Button size="sm" className="h-8 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0">
                  Complete Setup ({completeness}%)
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Floating warning popup if profile is incomplete */}
      <ProfileWarningPopup isProfileComplete={isProfileComplete} />
    </div>
  );
}
