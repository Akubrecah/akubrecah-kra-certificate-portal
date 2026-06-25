// @ts-nocheck
"use client"

import { KRAPortal } from "@/components/kra-portal"
import { useUser, RedirectToSignIn } from "@clerk/nextjs"

export default function PortalPage() {
  const { isLoaded, isSignedIn } = useUser()

  return (
    <div className="min-h-screen bg-background pt-8 pb-12">
      {isSignedIn ? (
        <div className="max-w-7xl mx-auto w-full px-4">
          <KRAPortal />
        </div>
      ) : (
        <RedirectToSignIn />
      )}
    </div>
  )
}
