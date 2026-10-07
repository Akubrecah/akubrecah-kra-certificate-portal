"use client"

import Link from "next/link"
import { Logo } from "@/components/logo"
import { Code2, Laptop, Smartphone, Cloud, FileCheck2, ShieldCheck, Mail, MapPin } from "lucide-react"

export function SiteFooter(): JSX.Element {
  const currentYear = new Date().getFullYear()

  const legalLinks = [
    { label: "Privacy Policy", href: "/legal/privacy" },
    { label: "Terms of Service", href: "/legal/terms" },
    { label: "Disclaimer", href: "/legal/disclaimer" },
    { label: "Refund Policy", href: "/legal/refund" },
  ]

  return (
    <footer className="w-full border-t border-outline-variant/60 bg-surface-container-lowest/80 backdrop-blur-md pt-12 pb-8 z-40 relative text-xs text-on-surface-variant" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-outline-variant/60">
          
          {/* Col 1 & 2: Brand Information */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-block hover:opacity-90 transition-opacity" aria-label="Akubrecah Technologies">
              <Logo width={150} height={42} />
            </Link>
            <p className="text-xs text-on-surface-variant leading-relaxed max-w-sm">
              Akubrecah Technologies is a full-cycle software engineering and digital innovation company. 
              We architect high-impact web applications, native & cross-platform mobile apps, cloud platforms, 
              and mission-critical automated systems — proudly powering government and enterprise automation across East Africa.
            </p>
            <div className="flex items-center gap-4 text-xs font-semibold text-on-surface">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                Nairobi, Kenya
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-primary" />
                engineering@akubrecah.com
              </span>
            </div>
          </div>

          {/* Col 3: Engineering Services */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Engineering Services
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/#services" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  Web Applications (Next.js/React)
                </Link>
              </li>
              <li>
                <Link href="/#services" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  Mobile Apps (iOS & Android)
                </Link>
              </li>
              <li>
                <Link href="/#services" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  Cloud Infrastructure & DevOps
                </Link>
              </li>
              <li>
                <Link href="/#services" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  Custom Enterprise Architecture
                </Link>
              </li>
              <li>
                <Link href="/#services" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  High-Throughput API Design
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: In-House Products & Tools */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
              In-House Products
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/retrieval-portal" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  KRA Certificate Retrieval
                </Link>
              </li>
              <li>
                <Link href="/pin-checker" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  Live Taxpayer PIN Checker
                </Link>
              </li>
              <li>
                <Link href="/dashboard/filing" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Automated Nil Returns Filing
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-primary transition-colors">
                  Client & Engineering Console
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 5: Company & Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Company
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/#about" className="hover:text-primary transition-colors">
                  About Akubrecah
                </Link>
              </li>
              <li>
                <Link href="/#process" className="hover:text-primary transition-colors">
                  Development Lifecycle
                </Link>
              </li>
              <li>
                <Link href="/#solutions" className="hover:text-primary transition-colors">
                  Fintech & GovTech Solutions
                </Link>
              </li>
              <li>
                <Link href="/#contact" className="hover:text-primary transition-colors font-bold text-primary">
                  Start a Project &rarr;
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Sub-bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-on-surface-variant/80">
            &copy; {currentYear} Akubrecah Technologies. All rights reserved. Engineering excellence made in Nairobi.
          </p>

          <nav aria-label="Legal navigation" className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[11px] hover:text-primary transition-colors underline-offset-4 hover:underline"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Micro Disclaimer */}
        <div className="mt-4 pt-3 border-t border-outline-variant/40 text-center sm:text-left">
          <p className="text-[10px] text-on-surface-variant/60 leading-tight">
            Akubrecah Technologies operates independent software engineering solutions and third-party automated compliance gateways. 
            Government services are also accessible directly via official public portals such as <a href="https://itax.kra.go.ke" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">itax.kra.go.ke</a>.
          </p>
        </div>

      </div>
    </footer>
  )
}