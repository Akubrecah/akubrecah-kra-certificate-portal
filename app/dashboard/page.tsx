import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { ShieldAlert, ArrowRight, Lock } from 'lucide-react'

export default async function DashboardPage() {
  const { sessionStatus } = await auth({ treatPendingAsSignedOut: false })
  const isPending = sessionStatus === 'pending'

  return (
    <div className="container py-24">
      <div className="mx-auto max-w-7xl space-y-12">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tighter bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text text-transparent">
            Your Dashboard
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Welcome to your Akubrecah Entertainment dashboard. Here you can view your filing history, track current submissions, and manage your account.
          </p>
        </div>

        {isPending && (
          <div className="relative overflow-hidden rounded-3xl border border-yellow-500/20 bg-yellow-500/5 p-8 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-500/10 text-yellow-500">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-bold text-yellow-500">Action Required: Secure Your Account</h3>
                <p className="mt-1 text-muted-foreground">
                  Your session is currently in a pending state. To unlock full dashboard access and secure your compliance data, please complete your account setup.
                </p>
              </div>
              <Link 
                href="/session-tasks/setup-mfa" 
                className="flex items-center gap-2 rounded-full bg-yellow-500 px-6 py-3 font-bold text-black hover:bg-yellow-400 transition-all hover:scale-105"
              >
                Complete Setup <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {/* Background Accent */}
            <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-yellow-500/10 blur-3xl" />
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-2">
          {/* Filing History - Restricted if pending */}
          <div className={`group relative overflow-hidden rounded-3xl border border-border/50 bg-background/50 p-8 transition-all ${isPending ? 'opacity-75 grayscale' : 'hover:border-primary/50'}`}>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Recent Filings</h2>
              <p className="text-muted-foreground">View your recent nil returns submissions and download receipts.</p>
              
              {isPending ? (
                <div className="flex items-center gap-2 text-sm font-medium text-yellow-500 bg-yellow-500/10 w-fit px-3 py-1 rounded-full">
                  <Lock className="h-3 w-3" /> Locked until setup complete
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="h-2 w-full rounded-full bg-secondary/50" />
                  <div className="h-2 w-3/4 rounded-full bg-secondary/50" />
                </div>
              )}
            </div>
          </div>

          {/* Account Summary - Restricted if pending */}
          <div className={`group relative overflow-hidden rounded-3xl border border-border/50 bg-background/50 p-8 transition-all ${isPending ? 'opacity-75 grayscale' : 'hover:border-primary/50'}`}>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Account Summary</h2>
              <p className="text-muted-foreground">Manage your account settings, tax PINs, and notification preferences.</p>
              
              {isPending ? (
                <div className="flex items-center gap-2 text-sm font-medium text-yellow-500 bg-yellow-500/10 w-fit px-3 py-1 rounded-full">
                  <Lock className="h-3 w-3" /> Locked until setup complete
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="h-2 w-full rounded-full bg-secondary/50" />
                  <div className="h-2 w-1/2 rounded-full bg-secondary/50" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


