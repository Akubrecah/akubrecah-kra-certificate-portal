'use client'

import { usePathname } from 'next/navigation'
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-grow pt-0 pb-4">
        <div className="container mx-auto max-w-3xl px-4 flex flex-col items-center">
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
