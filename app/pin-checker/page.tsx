"use client"

import { KraPinChecker } from "@/components/kra-pin-checker"
import { useUser, RedirectToSignIn } from "@clerk/nextjs"
import { Loader2 } from "lucide-react"

export default function PinCheckerPage() {
  const { isLoaded, isSignedIn } = useUser()

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Loading KRA Verification Gateway...</p>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />
  }

  return (
    <div className="w-full flex-1 flex flex-col justify-center py-2">
      <div className="max-w-5xl mx-auto w-full">
        <KraPinChecker />
      </div>
    </div>
  )
}
