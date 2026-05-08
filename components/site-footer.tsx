"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useUser } from "@clerk/nextjs"
import { isAdminUser } from "@/lib/admin-config"

export function SiteFooter(): JSX.Element {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  
  const { user } = useUser()
  const isAdmin = isAdminUser(user)

  const navigation = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "/features" },
        { label: "FAQ", href: "/faq" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "/about" },
        { label: "Blog", href: "/blog" },
        { label: "Careers", href: "/careers" },
        ...(isAdmin ? [{ label: "Admin Dashboard", href: "/admin/dashboard" }] : []),
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy", href: "/privacy" },
        { label: "Terms", href: "/terms" },
        { label: "Security", href: "/security" },
      ],
    },
  ]
  
  const currentTheme = mounted ? resolvedTheme : 'light'
  const logoSrc = currentTheme === 'dark' ? "/akubrecah-logo-dark.png" : "/akubrecah-logo.png"

  return (
    <footer className="w-full border-t border-border bg-background pt-8 sm:pt-10 pb-6" role="contentinfo">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8 pb-8 border-b border-white/5">
          <div className="flex flex-col items-center md:items-start gap-4 text-center md:text-left">
            <Link className="group flex items-center gap-2.5 text-xl font-bold text-foreground" aria-label="Akubrecah - Home" href="/">
              <Image 
                alt="Akubrecah Logo" 
                loading="lazy" 
                width={150} 
                height={45} 
                className="object-contain w-auto h-auto" 
                src={logoSrc} 
              />
            </Link>
            <p className="text-sm text-muted-foreground font-black uppercase tracking-[0.2em] opacity-40">Official KRA PIN Retrieval Portal</p>
          </div>
          
          <div className="flex items-center gap-10">
            <div className="flex flex-col items-center md:items-end gap-1">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Vault Protection</span>
              <span className="text-xs font-black text-[#1F6F5B] uppercase tracking-widest">AES-256 Encrypted</span>
            </div>
            <div className="h-10 w-px bg-white/5" />
            <div className="flex flex-col items-center md:items-end gap-1">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Processing</span>
              <span className="text-xs font-black text-[#F2E600] uppercase tracking-widest">100% Local</span>
            </div>
          </div>
        </div>
        
        <div className="pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground text-center md:text-left">© {new Date().getFullYear()} Akubrecah Entertainment. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link className="text-xs text-muted-foreground hover:text-brand-cyan transition-colors" href="/terms">Terms</Link>
            <Link className="text-xs text-muted-foreground hover:text-brand-cyan transition-colors" href="/privacy">Privacy</Link>
            <Link className="text-xs text-muted-foreground hover:text-brand-cyan transition-colors" href="/security">Security</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}