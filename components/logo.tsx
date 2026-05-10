"use client"

import Image from "next/image"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  width?: number
  height?: number
}

/**
 * Akubrecah Brand Logo component.
 * Uses ONLY optimized images for a purely visual brand identity.
 */
export function Logo({ 
  className, 
  width = 120, 
  height = 36
}: LogoProps) {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div style={{ width, height }} className="bg-transparent" />
  }

  const logoSrc = resolvedTheme === 'dark' ? '/akubrecah-logo-dark.png' : '/akubrecah-logo.png'
  const altText = "Akubrecah | Design Print Brand | Build ID: 2026"

  return (
    <div className={cn("relative flex items-center justify-center", className)} style={{ width, height }}>
      <Image
        src={logoSrc}
        alt={altText}
        fill
        priority
        className="object-contain"
      />
    </div>
  )
}
