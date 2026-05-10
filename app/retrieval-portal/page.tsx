// @ts-nocheck
"use client"

import { KRAPortal } from "@/components/kra-portal"
import { PageBackground } from "@/components/ui/page-background"
import { useUser, RedirectToSignIn } from "@clerk/nextjs"

export default function PortalPage() {
  const { isLoaded, isSignedIn } = useUser()

  return (
    <PageBackground>
      {isSignedIn ? (
        <div className="max-w-7xl mx-auto w-full px-4 pt-10 pb-20">
          <KRAPortal />
        </div>
      ) : (
        <RedirectToSignIn />
      )}

    </PageBackground>
  )
}
