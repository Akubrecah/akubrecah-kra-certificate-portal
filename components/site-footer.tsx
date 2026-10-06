"use client"

import Link from "next/link"
import { Logo } from "@/components/logo"

export function SiteFooter(): JSX.Element {
  const legalLinks = [
    { label: "Privacy Policy", href: "/legal/privacy" },
    { label: "Terms of Service", href: "/legal/terms" },
    { label: "Disclaimer", href: "/legal/disclaimer" },
    { label: "Refund Policy", href: "/legal/refund" },
  ]

  return (
    <footer className="w-full border-t border-outline-variant/60 bg-surface-container/70 backdrop-blur-sm py-4 z-40 relative text-xs text-on-surface-variant" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Logo & Copyright */}
        <div className="flex items-center gap-3">
          <Link href="/" className="hover:opacity-85 transition-opacity" aria-label="Akubrecah KRA Portal">
            <Logo width={120} height={36} />
          </Link>
          <span className="hidden sm:inline text-outline-muted">|</span>
          <span className="text-[11px] text-on-surface-variant/80">
            &copy; {new Date().getFullYear()} AKUBRECAH. All rights reserved.
          </span>
        </div>

        {/* Legal Links */}
        <nav aria-label="Legal navigation" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          {legalLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[12px] hover:text-primary transition-colors underline-offset-4 hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Micro Disclaimer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2 text-center md:text-left">
        <p className="text-[10px] text-on-surface-variant/60 leading-tight">
          Akubrecah is an independent third-party automation service, not affiliated with or endorsed by Kenya Revenue Authority (KRA). KRA services are directly accessible at{" "}
          <a href="https://itax.kra.go.ke" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
            itax.kra.go.ke
          </a>.
        </p>
      </div>
    </footer>
  )
}