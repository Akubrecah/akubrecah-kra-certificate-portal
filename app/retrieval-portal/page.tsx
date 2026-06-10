// @ts-nocheck
"use client"

import { KRAPortal } from "@/components/kra-portal"
import { PageBackground } from "@/components/ui/page-background"
import { useUser, RedirectToSignIn } from "@clerk/nextjs"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export default function PortalPage() {
  const { isLoaded, isSignedIn } = useUser()

  return (
    <PageBackground>
      {isSignedIn ? (
        <div className="max-w-7xl mx-auto w-full px-4 pt-10 pb-20 space-y-6">
          <KRAPortal />
          {/* Quick link to Change Particulars */}
          <div className="flex justify-center pt-2">
            <Link href="/change-particulars">
              <Button
                variant="ghost"
                className="h-8 px-5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5 font-bold text-[9px] uppercase tracking-widest transition-all border border-white/5"
              >
                <RefreshCw className="mr-2 w-3 h-3" />
                Change Particulars (Email / Mobile)
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <RedirectToSignIn />
      )}
    </PageBackground>
  )
}
