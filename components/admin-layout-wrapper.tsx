'use client'

import { usePathname } from 'next/navigation'
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-grow w-full">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6">
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
