'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { useUser } from '@clerk/nextjs'

export function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isLoaded } = useUser()

  const [isKraDomain, setIsKraDomain] = useState(false)
  const [isAdminDomain, setIsAdminDomain] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const host = window.location.hostname.toLowerCase()
      setIsKraDomain(host.startsWith("kra.") || host.includes("kra.akubrecah.com"))
      setIsAdminDomain(host.startsWith("admin.") || host.includes("admin.akubrecah.com"))
    }
  }, [])

  const isStandalonePage = 
    pathname?.startsWith('/sign-in') || 
    pathname?.startsWith('/sign-up') || 
    pathname?.startsWith('/onboarding') || 
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/dashboard') ||
    pathname === '/retrieval-portal' ||
    pathname?.startsWith('/retrieval-portal') ||
    isKraDomain ||
    isAdminDomain

  const hasName = !!(user?.firstName && user?.lastName) || !!user?.fullName
  const hasPhone = (user?.phoneNumbers && user?.phoneNumbers.length > 0) || !!user?.publicMetadata?.phoneNumber
  const isProfileComplete = hasName && hasPhone

  useEffect(() => {
    if (!isLoaded || !user) return

    // Check for onboarding completion on dashboard routes
    if (pathname?.startsWith('/dashboard')) {
      const hasCompletedLocal = localStorage.getItem('hasCompletedOnboarding')
      const hasCompletedClerk = user.publicMetadata?.onboardingComplete

      if (!hasCompletedLocal && !hasCompletedClerk) {
        router.push('/onboarding')
        return
      } else if (hasCompletedClerk && !hasCompletedLocal) {
        localStorage.setItem('hasCompletedOnboarding', 'true')
      }
    }

    // Guard filing service if profile is incomplete
    const isServicePath = pathname?.startsWith('/dashboard/filing')
    if (isServicePath && !isProfileComplete) {
      router.push('/dashboard/profile?message=incomplete_profile')
    }
  }, [pathname, router, user, isLoaded, isProfileComplete])

  if (isStandalonePage) {
    return <main className="flex-grow flex flex-col w-full min-h-screen min-w-0">{children}</main>
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-on-background">
      <SiteHeader />
      <main className="flex-grow flex-1 flex flex-col w-full pt-16">
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}
