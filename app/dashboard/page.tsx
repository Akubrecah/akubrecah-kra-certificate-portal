import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  ArrowRight, 
  ShieldCheck, 
  Code2, 
  Laptop, 
  Smartphone, 
  Send,
  Sparkles,
  Info
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
  const userId = user?.id;
  const email = user?.emailAddresses[0]?.emailAddress;

  // 1. Throttled Login Log tracking
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
      } else {
        console.warn("[Dashboard] systemLog model not available — schema may not be pushed yet.");
      }
    } catch (e: any) {
      if (e?.code !== "P2021") console.warn("[Dashboard auth log notice]:", e?.message || e);
    }
  }

  // 2. Profile Completeness evaluation
  const hasName = !!(user?.firstName && user?.lastName) || !!user?.fullName;
  const hasPhone = (user?.phoneNumbers && user?.phoneNumbers.length > 0) || !!user?.publicMetadata?.phoneNumber;
  const isProfileComplete = hasName && hasPhone;
  let completeness = 0;
  if (hasName) completeness += 50;
  if (hasPhone) completeness += 50;

  // 3. Fetch activity details and live logs
  let activities: { title: string; date: string; status: string }[] = [];

  let loginsCount = 0;
  let searchesCount = 0;
  let certificatesCount = 0;

  if (userId) {
    try {
      const actorIds = [userId, email].filter(Boolean) as string[];

      const db = prisma as any;
      if (typeof db.systemLog?.findMany === "function") {
        const dbLogs = await db.systemLog.findMany({
          where: {
            actor: { in: actorIds },
          },
          orderBy: {
            timestamp: "desc",
          },
          take: 5,
        });

        if (dbLogs && dbLogs.length > 0) {
          activities = dbLogs.map((log: any) => {
            let title = log.message;
            if (log.service === "Auth") title = "Account Login";
            else if (log.service === "KRA-Retrieve") title = "KRA PIN Retrieve";
            else if (log.service === "Certificate-Generation") title = "Certificate Issued";

            return {
              title,
              date: new Date(log.timestamp).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
              status: log.level === "error" ? "Failed" : "Success",
            };
          });
        }

        loginsCount = await db.systemLog.count({
          where: {
            actor: { in: actorIds },
            service: "Auth",
          },
        });

        searchesCount = await db.systemLog.count({
          where: {
            actor: { in: actorIds },
            service: "KRA-Retrieve",
          },
        });

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
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 w-full">
      
      {/* Decommission Notification Banner (if routed from legacy CV builder) */}
      {searchParams.notice === "cv_builder_decommissioned" && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-start gap-3 text-sm">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-on-surface">Service Notice: Legacy Resume Builder Decommissioned</p>
            <p className="text-on-surface-variant text-xs leading-relaxed">
              Akubrecah has officially transitioned into a dedicated full-scale Software Engineering & Development company. 
              The legacy CV builder has been phased out. All in-house statutory compliance tools (KRA Certificate Retrieval, 
              Live PIN Checker, and Returns Filing) and digital engineering services remain fully operational below.
            </p>
          </div>
        </div>
      )}

      {/* Header & Usage Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              Client & Engineering Portal
            </span>
            <span className="text-xs text-on-surface-variant">Akubrecah Technologies</span>
          </div>
          <h1 className="text-3xl font-headline font-bold text-on-surface mt-1">Welcome back, {firstName}</h1>
          <p className="text-on-surface-variant mt-1 text-sm md:text-base">
            Access in-house statutory tools, manage engineering project requests, and monitor activity.
          </p>
        </div>

        {/* Live Activity Usage Statistics Bar */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 bg-surface-container-lowest border border-outline-variant p-4 rounded-2xl shadow-soft text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-on-surface-variant text-xs">Logins:</span>
            <span className="font-bold text-on-surface">{loginsCount}</span>
          </div>
          <div className="h-4 w-[1px] bg-outline-variant hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-on-surface-variant text-xs">KRA Searches:</span>
            <span className="font-bold text-on-surface">{searchesCount}</span>
          </div>
          <div className="h-4 w-[1px] bg-outline-variant hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-on-surface-variant text-xs">Certificates:</span>
            <span className="font-bold text-on-surface">{certificatesCount}</span>
          </div>
        </div>
      </div>

      {/* Grid: 4 Core Modules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Account Profile & Compliance */}
        <Card className="bg-surface-container-lowest border-outline-variant shadow-soft rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Account Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              {isProfileComplete ? (
                <CheckCircle2 className="h-7 w-7 text-green-600 shrink-0" />
              ) : (
                <AlertCircle className="h-7 w-7 text-amber-500 shrink-0" />
              )}
              <span className="text-xl font-bold text-on-surface">
                {isProfileComplete ? "Verified" : "Profile Setup"}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-2">
              {isProfileComplete ? "Account details active." : `Profile is ${completeness}% complete.`}
            </p>
          </CardContent>
        </Card>

        {/* Card 2: In-House GovTech Suite */}
        <Card className="bg-surface-container-lowest border-outline-variant shadow-soft rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Statutory Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-7 w-7 text-primary shrink-0" />
              <span className="text-xl font-bold text-on-surface">Active</span>
            </div>
            <p className="text-xs text-on-surface-variant mt-2">
              <Link href="/retrieval-portal" className="text-primary hover:underline font-semibold">
                Launch KRA Certificate Portal &rarr;
              </Link>
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Recent Compliance Documents */}
        <Card className="bg-surface-container-lowest border-outline-variant shadow-soft rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Certificates Issued</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <FileText className="h-7 w-7 text-on-surface shrink-0" />
              <span className="text-2xl font-bold text-on-surface">
                {certificatesCount}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-2">
              {certificatesCount > 0 ? "Compliance document generated." : "No certificates issued yet."}
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Software Engineering Services */}
        <Card className="bg-surface-container-lowest border-outline-variant shadow-soft rounded-xl border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Laptop className="h-3.5 w-3.5" />
              Engineering Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-on-surface">Web & Mobile</span>
            </div>
            <p className="text-xs text-on-surface-variant mt-2">
              <Link href="/#services" className="text-primary hover:underline font-semibold">
                Consult on bespoke systems &rarr;
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Launchers & Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Quick Launchers */}
        <Card className="bg-surface-container-lowest border-outline-variant shadow-soft rounded-2xl col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-headline font-bold">Quick Launch Tools & Portals</CardTitle>
            <CardDescription className="text-xs">Direct access to in-house production utilities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link 
              href="/retrieval-portal" 
              className="flex items-center justify-between p-3.5 rounded-xl border border-outline-variant hover:bg-surface-container hover:border-primary/40 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-bold text-on-surface text-sm group-hover:text-primary transition-colors">
                    KRA Certificate Retrieval Portal
                  </span>
                  <span className="text-xs text-on-surface-variant">Retrieve by ID / PIN & Download official PDF</span>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-on-surface-variant group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link 
              href="/pin-checker" 
              className="flex items-center justify-between p-3.5 rounded-xl border border-outline-variant hover:bg-surface-container hover:border-red-500/40 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 group-hover:bg-red-600 group-hover:text-white transition-colors">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-bold text-on-surface text-sm group-hover:text-red-600 transition-colors">
                    Live PIN & National ID Checker
                  </span>
                  <span className="text-xs text-on-surface-variant">Instant taxpayer registry status & tax station check</span>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-on-surface-variant group-hover:text-red-600 group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link 
              href="/dashboard/filing" 
              className="flex items-center justify-between p-3.5 rounded-xl border border-outline-variant hover:bg-surface-container transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Send className="h-5 w-5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-bold text-on-surface text-sm group-hover:text-emerald-600 transition-colors">
                    Automated Nil Returns Filing
                  </span>
                  <span className="text-xs text-on-surface-variant">Expedited statutory tax submission assistant</span>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-on-surface-variant group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link 
              href="/#contact" 
              className="flex items-center justify-between p-3.5 rounded-xl border border-outline-variant hover:bg-surface-container transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <Code2 className="h-5 w-5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-bold text-on-surface text-sm group-hover:text-primary transition-colors">
                    Schedule Engineering Consultation
                  </span>
                  <span className="text-xs text-on-surface-variant">Discuss bespoke web, mobile & enterprise architectures</span>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-on-surface-variant group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>
          </CardContent>
        </Card>

        {/* Live System Activity Log */}
        <Card className="bg-surface-container-lowest border-outline-variant shadow-soft rounded-2xl col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-headline font-bold">Recent Account Activity</CardTitle>
            <CardDescription className="text-xs">Security audit trail & session logs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.length > 0 ? (
                activities.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between border-b border-outline-variant/60 pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="font-bold text-on-surface text-xs">{activity.title}</p>
                      <p className="text-[11px] text-on-surface-variant">{activity.date}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${
                      activity.status === "Success" 
                        ? "bg-green-100 dark:bg-green-950/60 text-green-800 dark:text-green-300 border border-green-500/20" 
                        : "bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-500/20"
                    }`}>
                      {activity.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-on-surface-variant text-xs">
                  No recent activity found.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Floating warning popup if profile is incomplete */}
      <ProfileWarningPopup isProfileComplete={isProfileComplete} />
    </div>
  );
}
