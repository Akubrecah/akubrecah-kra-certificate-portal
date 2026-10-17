"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CustomSignIn } from "@/components/custom-sign-in"
import { KRASignIn } from "@/components/kra-sign-in"

function SignInContent() {
  const [isKra, setIsKra] = useState(false)
  const [mounted, setMounted] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    if (typeof window !== "undefined") {
      const host = window.location.hostname.toLowerCase()
      const isKraDomain = 
        host.startsWith("kra.") || 
        host.includes("kra.akubrecah.com") || 
        searchParams.get("portal") === "kra"
      setIsKra(isKraDomain)
    }
    setMounted(true)
  }, [searchParams])

  if (!mounted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (isKra) {
    return <KRASignIn />
  }

  return <CustomSignIn />
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  )
}
