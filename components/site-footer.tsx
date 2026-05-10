"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"
import { isAdminUser } from "@/lib/admin-config"
import { Logo } from "@/components/logo"

export function SiteFooter(): JSX.Element {
  useEffect(() => {
    // Component mounted
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

  return (
    <footer className="w-full border-t border-white/5 bg-black/20 pt-10 pb-8" role="contentinfo">
      <div className="container mx-auto px-6 max-w-3xl text-center">
        <div className="flex flex-col items-center gap-8 mb-10">
          <div className="flex flex-col items-center gap-4">
            <Link className="group transition-opacity hover:opacity-80" aria-label="Akubrecah" href="/">
              <Logo width={120} height={36} />
            </Link>
            <div className="flex items-center space-x-3 text-[9px] font-bold uppercase tracking-[0.2em] opacity-40">
              <span>DESIGN PRINT BRAND</span>
              <span className="h-0.5 w-0.5 rounded-full bg-current" />
              <span>BUILD 2026</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-6 w-full max-w-xl mx-auto border-t border-white/5 pt-8">
            {navigation.map((group) => (
              <div key={group.title} className="flex flex-col items-center gap-3">
                <h3 className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{group.title}</h3>
                <ul className="flex flex-col items-center gap-2.5">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link 
                        href={link.href} 
                        className="text-[11px] text-muted-foreground hover:text-white transition-all uppercase tracking-wide opacity-60 hover:opacity-100"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/5 flex flex-col items-center gap-6">
          <p className="text-[8px] font-bold text-muted-foreground/20 uppercase tracking-[0.3em]">
            &copy; {new Date().getFullYear()} AKUBRECAH. ALL RIGHTS RESERVED.
          </p>

          <div className="flex items-center gap-6 p-1 px-4 rounded-full bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest opacity-30">VAULT</span>
              <span className="text-[9px] font-bold text-white tracking-widest uppercase opacity-60">SECURE</span>
            </div>
            <div className="h-3 w-px bg-white/5" />
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest opacity-30">STATUS</span>
              <span className="text-[9px] font-bold text-white tracking-widest uppercase opacity-60">ACTIVE</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}