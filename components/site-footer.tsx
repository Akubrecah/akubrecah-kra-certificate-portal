"use client"

import Link from "next/link"
import { Logo } from "@/components/logo"

export function SiteFooter(): JSX.Element {
  const navigation = [
    {
      title: "Services",
      links: [
        { label: "Home", href: "/" },
        { label: "Certificate Retrieval", href: "/retrieval-portal" },
        { label: "Live PIN Checker", href: "/pin-checker" },
        { label: "Taxpayer Dashboard", href: "/dashboard" },
        { label: "CV Builder", href: "/dashboard/cv-builder" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Legal Center", href: "/legal" },
        { label: "Privacy Policy", href: "/legal/privacy" },
        { label: "Terms of Service", href: "/legal/terms" },
        { label: "Disclaimer", href: "/legal/disclaimer" },
        { label: "Refund Policy", href: "/legal/refund" },
        { label: "Acceptable Use", href: "/legal/aup" },
        { label: "Cookie Policy", href: "/legal/cookies" },
      ],
    },
  ]

  return (
    <footer className="w-full border-t border-outline-variant bg-surface-container pt-8 pb-6 z-50 relative" role="contentinfo">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center md:text-left">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8 mb-8">
          
          <div className="flex flex-col items-center md:items-start gap-4">
            <Link className="transition-transform duration-300 hover:opacity-80" aria-label="Akubrecah KRA Portal" href="/">
              <Logo width={200} height={60} />
            </Link>
            <p className="text-sm text-on-surface-variant max-w-xs text-center md:text-left">
              Professional compliance suite for KRA services and CV building.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-12 text-center md:text-left">
            {navigation.map((group) => (
              <div key={group.title} className="flex flex-col gap-4">
                <h3 className="font-semibold text-on-surface tracking-wide uppercase text-sm">{group.title}</h3>
                <ul className="flex flex-col gap-3">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-on-surface-variant hover:text-primary transition-colors"
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

        <div className="border-t border-outline-variant pt-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs text-on-surface-variant leading-relaxed max-w-2xl text-center md:text-left">
            Akubrecah is an independent third-party service and is <strong>not affiliated with, endorsed by, or connected to</strong> the Kenya Revenue Authority (KRA) or the Government of Kenya. KRA services are available free of charge at <a href="https://itax.kra.go.ke" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-primary transition-colors">itax.kra.go.ke</a>.
          </p>
          <div className="text-xs font-medium text-on-surface-variant whitespace-nowrap">
            &copy; {new Date().getFullYear()} AKUBRECAH. ALL RIGHTS RESERVED.
          </div>
        </div>
      </div>
    </footer>
  )
}