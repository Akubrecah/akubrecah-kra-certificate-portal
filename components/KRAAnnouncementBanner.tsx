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
        "Notice: NIL returns for the 2025 tax year can be filed starting April 1st, 2026. You can still file for previous years now."
      )
    }
  }, [])

  if (!announcement) return null

  return (
    <div role="alert" aria-live="polite" className="sticky top-0 z-[60] w-full bg-primary text-white border-b border-white/10 shadow-none">
      <div className="flex items-center py-1 h-8">
        <div className="flex-shrink-0 pl-4">
          <AlertCircle className="h-4 w-4 text-white" />
        </div>
        
        <div className="flex-1 overflow-hidden mx-4">
          <div className="animate-marquee whitespace-nowrap inline-block">
            <span className="text-[9px] font-bold uppercase tracking-widest px-8">
              {announcement}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest px-8">
              {announcement}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
