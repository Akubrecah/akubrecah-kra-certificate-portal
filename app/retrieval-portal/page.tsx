// @ts-nocheck
"use client"

import { KRAPortal } from "@/components/kra-portal"
import { useUser, RedirectToSignIn } from "@clerk/nextjs"

export default function PortalPage() {
  const { isLoaded, isSignedIn } = useUser()

  return (
    <div className="w-full flex-1 flex flex-col justify-center py-2">
      {isSignedIn ? (
        <div className="max-w-6xl mx-auto w-full">
          <KRAPortal />
        </div>
      ) : (
        <RedirectToSignIn />
      )}
    </div>
  )
}
