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
      title: "Services",
      links: [
        { label: "Home", href: "/" },
        { label: "Retrieval Portal", href: "/retrieval-portal" },
        { label: "Security Protocol", href: "/security" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Blog Intel", href: "/blog" },
        { label: "Careers", href: "/careers" },
        { label: "FAQ Intel", href: "/faq" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About Intel", href: "/about" },
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Use", href: "/terms" },
        ...(isAdmin ? [{ label: "Admin Console", href: "/admin/dashboard" }] : []),
      ],
    },
  ]

  return (
    <footer className="w-full border-t border-border bg-muted/20 pt-16 pb-12" role="contentinfo">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <div className="flex flex-col items-center gap-8 mb-10">
          <div className="flex flex-col items-center gap-4">
            <Link className="group transition-transform duration-500 hover:scale-105" aria-label="Akubrecah" href="/">
              <Logo width={240} height={72} />
            </Link>
            <div className="flex items-center space-x-3 text-[9px] font-bold uppercase tracking-[0.2em] opacity-70">
              <span>DESIGN PRINT BRAND</span>
              <span className="h-0.5 w-0.5 rounded-full bg-current" />
              <span>BUILD 2026</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-6 w-full max-w-4xl mx-auto border-t border-border pt-8">
            {navigation.map((group) => (
              <div key={group.title} className="flex flex-col items-center gap-3">
                <h3 className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{group.title}</h3>
                <ul className="flex flex-col items-center gap-2.5">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link 
                        href={link.href} 
                        className="text-[11px] text-muted-foreground hover:text-foreground transition-all uppercase tracking-wide opacity-80 hover:opacity-100"
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
        
        <div className="pt-8 border-t border-border flex flex-col items-center gap-6">
          <p className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-[0.3em]">
            &copy; {new Date().getFullYear()} AKUBRECAH. ALL RIGHTS RESERVED.
          </p>

          <div className="flex items-center gap-6 p-1 px-4 rounded-full bg-muted/30 border border-border">
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest opacity-30">VAULT</span>
              <span className="text-[9px] font-bold text-foreground tracking-widest uppercase opacity-90">SECURE</span>
            </div>
            <div className="h-3 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest opacity-30">STATUS</span>
              <span className="text-[9px] font-bold text-foreground tracking-widest uppercase opacity-90">ACTIVE</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}