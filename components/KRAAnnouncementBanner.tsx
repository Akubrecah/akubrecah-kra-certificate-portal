"use client"

import { AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"

export default function KRAAnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<string | null>(null)

  useEffect(() => {
    // Set the KRA announcement message
    // This message is based on current KRA policy (March 2026)
    const currentDate = new Date()
    const marchDeadline = new Date('2026-03-31')
    
    if (currentDate < marchDeadline) {
      setAnnouncement(
        "⚠️ Important Notice: KRA is currently reconciling 2025 data from eTIMS and withholding tax records. NIL returns for the 2025 tax year can only be filed after March 31, 2026. You can still file NIL returns for 2024 and earlier years. ⚠️"
      )
    }
  }, [])

  if (!announcement) return null

  return (
    <div role="alert" aria-live="polite" className="sticky top-0 z-[60] w-full bg-gradient-to-r from-[#1F6F5B] to-[#145A47] text-white shadow-2xl border-b border-white/5 overflow-hidden">
      <div className="flex items-center py-4">
        <div className="flex-shrink-0 pl-6">
          <AlertCircle className="h-6 w-6 text-[#F2E600] animate-pulse" />
        </div>
        
        {/* Scrolling marquee container */}
        <div className="flex-1 overflow-hidden mx-4 pr-4">
          <div className="animate-marquee whitespace-nowrap inline-block">
            <span className="text-xs sm:text-sm md:text-base font-medium px-8">
              {announcement}
            </span>
            <span className="text-xs sm:text-sm md:text-base font-medium px-8">
              {announcement}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
