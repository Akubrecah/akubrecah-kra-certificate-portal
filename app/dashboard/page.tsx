import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { ShieldAlert, ArrowRight, Lock, Fingerprint, FileText, Settings, History } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FadeIn } from "@/components/core/fade-in"
import { Badge } from "@/components/ui/badge"

export default async function DashboardPage() {
  const { sessionStatus } = await auth({ treatPendingAsSignedOut: false })
  const isPending = sessionStatus === 'pending'

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="mx-auto max-w-7xl space-y-10">
        {/* Header Section */}
        <FadeIn className="space-y-3 text-center">
          <div className="flex justify-center">
            <Badge className="bg-primary/5 text-primary border border-primary/10 font-medium px-2 py-0.5 rounded-full text-[8px] tracking-[0.2em] uppercase">
              Authenticated Session
            </Badge>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight uppercase leading-tight">
            Welcome <br />
            <span className="text-primary font-bold">Back.</span>
          </h1>
          <p className="text-[10px] text-muted-foreground font-normal leading-normal opacity-80 uppercase tracking-[0.15em] max-w-xl mx-auto">
            Everything you need for your KRA services in one place. Choose a service below to get started.
          </p>
        </FadeIn>

        {/* Warning Banner for Pending Setup */}
        {isPending && (
          <FadeIn delay={0.2}>
            <div className="relative overflow-hidden rounded-2xl border border-orange-500/10 bg-orange-500/5 p-6 backdrop-blur-md">
              <div className="flex flex-col items-center gap-4 relative z-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10 text-orange-500">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-[10px] font-bold text-orange-500 uppercase tracking-[0.2em]">Action Required</h3>
                  <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wide opacity-80">
                    Secure your account to unlock all dashboard features.
                  </p>
                </div>
                <Link href="/session-tasks/setup-mfa">
                  <Button className="h-8 px-8 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-[9px] uppercase tracking-widest shadow-none">
                    Complete Setup <ArrowRight className="ml-2 h-3 w-3" />
                  </Button>
                </Link>
              </div>
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange-500/5 blur-[80px]" />
            </div>
          </FadeIn>
        )}

        {/* Core Services Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Retrieval Portal Card */}
          <FadeIn delay={0.3}>
            <Card className="group relative overflow-hidden rounded-2xl border-white/5 bg-background/50 transition-all hover:border-primary/20 h-full flex flex-col items-center text-center p-2">
              <CardHeader className="p-6 pb-2 flex flex-col items-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform border border-primary/10">
                  <Fingerprint className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-[11px] font-bold uppercase tracking-[0.2em]">KRA Certificate</CardTitle>
                  <CardDescription className="text-[9px] text-muted-foreground font-medium uppercase tracking-wide opacity-70 leading-relaxed">
                    Retrieve or Generate your <br />official KRA Certificate.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-2 mt-auto w-full">
                <Link href="/retrieval-portal">
                  <Button className="w-full h-8 rounded-full bg-primary text-white font-bold text-[9px] uppercase tracking-widest transition-all shadow-none">
                    Generate Now <ArrowRight className="ml-2 h-3 w-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </FadeIn>

          {/* File Return Card - Disabled */}
          <FadeIn delay={0.4}>
            <Card className="group relative overflow-hidden rounded-2xl border-white/5 bg-background/50 h-full flex flex-col items-center text-center p-2 opacity-50 grayscale">
              <CardHeader className="p-6 pb-2 flex flex-col items-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground border border-white/5">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-[11px] font-bold uppercase tracking-[0.2em]">File Return</CardTitle>
                  <CardDescription className="text-[9px] text-muted-foreground font-medium uppercase tracking-wide opacity-70 leading-relaxed">
                    Annual KRA Nil returns <br />filing is coming soon.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-2 mt-auto w-full">
                <Button disabled className="w-full h-8 rounded-full bg-secondary text-muted-foreground font-bold text-[8px] uppercase tracking-widest transition-all shadow-none cursor-not-allowed">
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </FadeIn>

          {/* Locked Actions (History & Settings) */}
          <FadeIn delay={0.5}>
            <Card className={`relative overflow-hidden rounded-2xl border-white/5 bg-background/50 h-full flex flex-col items-center text-center p-2 ${isPending ? 'opacity-50' : 'hover:border-primary/20 transition-all'}`}>
              <CardHeader className="p-6 pb-2 flex flex-col items-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground border border-white/5">
                  <History className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-[11px] font-bold uppercase tracking-[0.2em]">History</CardTitle>
                  <CardDescription className="text-[9px] text-muted-foreground font-medium uppercase tracking-wide opacity-70 leading-relaxed">
                    View previous filings and <br />manage your settings.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-2 mt-auto w-full">
                {isPending ? (
                  <div className="flex items-center justify-center gap-2 py-2 rounded-full bg-secondary/20 text-muted-foreground text-[8px] font-bold uppercase tracking-[0.2em]">
                    <Lock className="h-3 w-3" /> Locked
                  </div>
                ) : (
                  <Button variant="outline" className="w-full h-8 rounded-full border-white/10 font-bold text-[9px] uppercase tracking-widest">
                    View Records
                  </Button>
                )}
              </CardContent>
            </Card>
          </FadeIn>
        </div>

        {/* Support Section */}
        <FadeIn delay={0.6}>
          <div className="flex flex-col items-center justify-center p-10 rounded-2xl bg-secondary/10 border border-white/5 text-center space-y-6">
            <div className="space-y-1">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em]">Inquiries?</h4>
              <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wide opacity-80">Our support team is here to assist with any tax-related questions.</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/faq">
                <Button variant="ghost" className="h-7 rounded-full px-4 text-[8px] font-bold uppercase tracking-widest">Help Center</Button>
              </Link>
              <div className="w-px h-3 bg-white/10" />
              <Link href="/contact">
                <Button variant="outline" className="h-7 rounded-full px-6 border-white/10 text-[8px] font-bold uppercase tracking-widest">Contact Us</Button>
              </Link>
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  )
}
