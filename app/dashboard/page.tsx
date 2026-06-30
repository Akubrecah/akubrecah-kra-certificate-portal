import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, FileText, ArrowRight, HelpCircle, Briefcase } from "lucide-react";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import prisma, { createSystemLog } from "@/lib/prisma";
import ProfileWarningPopup from "@/components/profile-warning-popup";

export default async function TaxpayerDashboard() {
  const user = await currentUser();
  const firstName = user?.firstName || "Taxpayer";
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
    } catch (e) {
      console.error("Error writing auth log:", e);
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
      } else {
        console.warn("[Dashboard] systemLog model not available — stats cannot be populated yet.");
      }
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-headline font-bold text-on-surface">Welcome back, {firstName}</h1>
          <p className="text-on-surface-variant mt-2 text-lg">Here is an overview of your tax status and obligations.</p>
        </div>

        {/* Live Activity Usage Statistics Bar */}
        <div className="flex flex-wrap items-center gap-6 bg-surface-container-lowest border border-outline-variant p-4 rounded-2xl shadow-soft text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-on-surface-variant">Logins:</span>
            <span className="font-bold text-on-surface">{loginsCount}</span>
          </div>
          <div className="h-4 w-[1px] bg-outline-variant hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-on-surface-variant">KRA Searches:</span>
            <span className="font-bold text-on-surface">{searchesCount}</span>
          </div>
          <div className="h-4 w-[1px] bg-outline-variant hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-on-surface-variant">Certificates:</span>
            <span className="font-bold text-on-surface">{certificatesCount}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Profile / Compliance */}
        <Card className="bg-surface-container-lowest border-outline-variant shadow-soft rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-on-surface-variant uppercase tracking-wider">Compliance Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              {isProfileComplete ? (
                <CheckCircle2 className="h-8 w-8 text-green-600 shrink-0" />
              ) : (
                <AlertCircle className="h-8 w-8 text-amber-500 shrink-0" />
              )}
              <span className="text-xl font-bold text-on-surface">
                {isProfileComplete ? "Compliant" : "Action Required"}
              </span>
            </div>
            <p className="text-sm text-on-surface-variant mt-2">
              {isProfileComplete ? "All required returns filed." : `Profile is ${completeness}% complete.`}
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Pending Tasks */}
        <Card className="bg-surface-container-lowest border-outline-variant shadow-soft rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-on-surface-variant uppercase tracking-wider">Pending Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              {isProfileComplete ? (
                <CheckCircle2 className="h-8 w-8 text-green-600 shrink-0" />
              ) : (
                <AlertCircle className="h-8 w-8 text-primary shrink-0" />
              )}
              <span className="text-2xl font-bold text-on-surface">
                {isProfileComplete ? "0 Tasks" : "1 Task"}
              </span>
            </div>
            <p className="text-sm text-on-surface-variant mt-2">
              {isProfileComplete ? (
                "You are up to date."
              ) : (
                <Link href="/dashboard/profile" className="text-primary hover:underline font-medium">
                  Complete your profile details.
                </Link>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Recent Certificates */}
        <Card className="bg-surface-container-lowest border-outline-variant shadow-soft rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-on-surface-variant uppercase tracking-wider">Recent Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-on-surface" />
              <span className="text-2xl font-bold text-on-surface">
                {certificatesCount > 0 ? "Valid" : "None"}
              </span>
            </div>
            <p className="text-sm text-on-surface-variant mt-2">
              {certificatesCount > 0 ? "Compliance Certificate is valid." : "Generate a certificate."}
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Professional Resume / CV */}
        <Card className="bg-surface-container-lowest border-outline-variant shadow-soft rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-on-surface-variant uppercase tracking-wider">Professional Resume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Briefcase className="h-8 w-8 text-primary shrink-0" />
              <span className="text-xl font-bold text-on-surface">
                {isProfileComplete ? "Active" : "Incomplete"}
              </span>
            </div>
            <p className="text-sm text-on-surface-variant mt-2">
              {isProfileComplete ? (
                <Link href="/dashboard/cv-builder" className="text-primary hover:underline font-medium">
                  ATS CV builder is ready.
                </Link>
              ) : (
                "Fill details to unlock CV builder."
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="bg-surface-container-lowest border-outline-variant shadow-soft rounded-lg col-span-1">
          <CardHeader>
            <CardTitle className="text-xl font-headline">Quick Actions</CardTitle>
            <CardDescription>Frequently used services</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/dashboard/filing" className="flex items-center justify-between p-4 rounded border border-outline-variant hover:bg-surface-container transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary animate-pulse" />
                <span className="font-medium text-on-surface">File Returns</span>
              </div>
              <ArrowRight className="h-5 w-5 text-on-surface-variant" />
            </Link>
            <Link href="/retrieval-portal" className="flex items-center justify-between p-4 rounded border border-outline-variant hover:bg-surface-container transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <span className="font-medium text-on-surface">KRA Certificate</span>
              </div>
              <ArrowRight className="h-5 w-5 text-on-surface-variant" />
            </Link>
            <Link href="/dashboard/cv-builder" className="flex items-center justify-between p-4 rounded border border-outline-variant hover:bg-surface-container transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <span className="font-medium text-on-surface">CV Builder</span>
              </div>
              <ArrowRight className="h-5 w-5 text-on-surface-variant" />
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-surface-container-lowest border-outline-variant shadow-soft rounded-lg col-span-1">
          <CardHeader>
            <CardTitle className="text-xl font-headline">Recent Activity</CardTitle>
            <CardDescription>Your latest transactions and filings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {activities.length > 0 ? (
                activities.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between border-b border-outline-variant pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-on-surface">{activity.title}</p>
                      <p className="text-sm text-on-surface-variant">{activity.date}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      activity.status === "Success" 
                        ? "bg-[var(--success-bg)] text-[var(--success-green)]" 
                        : "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300"
                    }`}>
                      {activity.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-on-surface-variant text-sm">
                  No recent activity found.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Floating warning message popup (rendered on client if profile details are incomplete) */}
      <ProfileWarningPopup isProfileComplete={isProfileComplete} />
    </div>
  );
}
