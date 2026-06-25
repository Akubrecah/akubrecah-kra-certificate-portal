import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";

export default async function TaxpayerDashboard() {
  const user = await currentUser();
  const firstName = user?.firstName || "Taxpayer";

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold text-on-surface">Welcome back, {firstName}</h1>
        <p className="text-on-surface-variant mt-2 text-lg">Here is an overview of your tax status and obligations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-surface-container-lowest border-outline-variant shadow-soft rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-on-surface-variant uppercase tracking-wider">Compliance Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <span className="text-2xl font-bold text-on-surface">Compliant</span>
            </div>
            <p className="text-sm text-on-surface-variant mt-2">All required returns have been filed.</p>
          </CardContent>
        </Card>

        <Card className="bg-surface-container-lowest border-outline-variant shadow-soft rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-on-surface-variant uppercase tracking-wider">Pending Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-on-surface">0 Tasks</span>
            </div>
            <p className="text-sm text-on-surface-variant mt-2">You are up to date.</p>
          </CardContent>
        </Card>

        <Card className="bg-surface-container-lowest border-outline-variant shadow-soft rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-on-surface-variant uppercase tracking-wider">Recent Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-on-surface" />
              <span className="text-2xl font-bold text-on-surface">Valid</span>
            </div>
            <p className="text-sm text-on-surface-variant mt-2">Compliance Certificate is valid.</p>
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
                <FileText className="h-5 w-5 text-primary" />
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
          </CardContent>
        </Card>

        <Card className="bg-surface-container-lowest border-outline-variant shadow-soft rounded-lg col-span-1">
          <CardHeader>
            <CardTitle className="text-xl font-headline">Recent Activity</CardTitle>
            <CardDescription>Your latest transactions and filings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { title: "Nil Return Filed", date: "Jan 15, 2026", status: "Success" },
                { title: "Compliance Certificate Issued", date: "Jan 10, 2026", status: "Success" },
                { title: "Profile Updated", date: "Dec 05, 2025", status: "Success" },
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between border-b border-outline-variant pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-on-surface">{activity.title}</p>
                    <p className="text-sm text-on-surface-variant">{activity.date}</p>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    {activity.status}
                  </span>
                </div>
              ))}
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
