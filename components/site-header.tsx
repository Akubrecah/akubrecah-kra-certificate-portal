"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserButton, useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import {
  Code2,
  Smartphone,
  Cloud,
  Layers,
  FileCheck2,
  ShieldCheck,
  Send,
  ChevronDown,
  Menu,
  X,
  LayoutDashboard,
  Shield,
  ArrowRight,
  Laptop,
  Zap,
  Globe,
  Users,
  Info,
  Phone,
  MapPin,
  ChevronRight,
} from "lucide-react"

/* ──────────────────────────────────────────────────────────────
   NAV DATA  (parent pages + child sub-routes inside them)
────────────────────────────────────────────────────────────── */
const navData = [
  {
    label: "About",
    href: "/about",
    groups: null,   // simple link — no dropdown
  },
  {
    label: "Services",
    href: "/services",          // parent page
    groups: [
      {
        heading: "Engineering Capabilities",
        items: [
          {
            title: "Web Engineering",
            desc: "High-performance full-stack web platforms & Next.js apps",
            href: "/services#web",
            icon: Laptop,
          },
          {
            title: "Mobile App Development",
            desc: "Native iOS & Android, React Native ecosystems",
            href: "/services#mobile",
            icon: Smartphone,
          },
          {
            title: "Cloud & DevOps",
            desc: "Microservices, CI/CD pipelines & AWS/GCP scaling",
            href: "/services#cloud",
            icon: Cloud,
          },
          {
            title: "Enterprise Software",
            desc: "Bespoke internal systems, high-throughput APIs",
            href: "/services#enterprise",
            icon: Layers,
          },
        ],
      },
    ],
    footer: { label: "All Services →", href: "/services" },
  },
  {
    label: "Products & Tools",
    href: "/products",
    groups: [
      {
        heading: "In-House GovTech Suite",
        items: [
          {
            title: "KRA Certificate Portal",
            desc: "Instant compliance certificate retrieval by ID or PIN",
            href: "/retrieval-portal",
            icon: FileCheck2,
            badge: "Flagship",
          },
          {
            title: "Live PIN & ID Validator",
            desc: "Real-time taxpayer registry verification engine",
            href: "/pin-checker",
            icon: ShieldCheck,
            badge: "Live",
          },
          {
            title: "Automated Tax Filing",
            desc: "Nil returns & statutory submission pipeline",
            href: "/dashboard/filing",
            icon: Send,
          },
        ],
      },
    ],
    footer: { label: "All Products →", href: "/products" },
  },
  {
    label: "Solutions",
    href: "/solutions",
    groups: [
      {
        heading: "By Industry",
        items: [
          {
            title: "Financial Technology",
            desc: "M-Pesa, payment gateways & fintech infrastructure",
            href: "/solutions#fintech",
            icon: Zap,
          },
          {
            title: "Government & GovTech",
            desc: "Statutory portals & citizen-facing digital services",
            href: "/solutions#govtech",
            icon: Shield,
          },
          {
            title: "Enterprise Operations",
            desc: "ERP modules, automation & document workflows",
            href: "/solutions#enterprise",
            icon: Users,
          },
          {
            title: "SaaS Product Engineering",
            desc: "Full-cycle MVP to scale for software startups",
            href: "/solutions#saas",
            icon: Globe,
          },
        ],
      },
    ],
    footer: { label: "All Solutions →", href: "/solutions" },
  },
  {
    label: "Contact",
    href: "/contact",
    groups: null,
  },
]

/* ──────────────────────────────────────────────────────────────
   DESKTOP MEGA DROPDOWN PANEL
────────────────────────────────────────────────────────────── */
function MegaMenu({
  item,
  open,
  onClose,
}: {
  item: (typeof navData)[0]
  open: boolean
  onClose: () => void
}) {
  if (!item.groups || !open) return null
  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 animate-in fade-in-30 zoom-in-95 duration-150"
      style={{ minWidth: 340 }}
    >
      {/* Arrow pointer */}
      <div className="mx-auto w-3 h-1.5 overflow-hidden mb-1">
        <div className="w-3 h-3 bg-surface-container-lowest border-t border-l border-outline-variant rotate-45 translate-y-1 mx-auto" />
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant shadow-2xl rounded-2xl overflow-hidden">
        {item.groups.map((group) => (
          <div key={group.heading} className="p-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant px-2 py-1 mb-1">
              {group.heading}
            </p>
            <div className="space-y-0.5">
              {group.items.map((sub) => {
                const Icon = sub.icon
                return (
                  <Link
                    key={sub.title}
                    href={sub.href}
                    onClick={onClose}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-surface-container transition-colors group cursor-pointer"
                  >
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors mt-0.5 shrink-0">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                          {sub.title}
                        </span>
                        {"badge" in sub && sub.badge && (
                          <span className="shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-primary text-white">
                            {sub.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-on-surface-variant line-clamp-1">{sub.desc}</p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-on-surface-variant opacity-0 group-hover:opacity-100 shrink-0 mt-0.5 transition-opacity" />
                  </Link>
                )
              })}
            </div>
          </div>
        ))}

        {/* Footer CTA link */}
        {item.footer && (
          <div className="border-t border-outline-variant/60 px-4 py-2.5">
            <Link
              href={item.footer.href}
              onClick={onClose}
              className="flex items-center justify-between text-xs font-bold text-primary hover:underline"
            >
              {item.footer.label}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   DESKTOP NAV ITEM (simple link or dropdown trigger)
────────────────────────────────────────────────────────────── */
function DesktopNavItem({
  item,
  pathname,
}: {
  item: (typeof navData)[0]
  pathname: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isActive =
    pathname === item.href ||
    (item.href !== "/" && pathname.startsWith(item.href))

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  if (!item.groups) {
    return (
      <Link
        href={item.href}
        className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
          isActive
            ? "text-primary bg-primary/10"
            : "text-on-surface hover:text-primary hover:bg-surface-container"
        }`}
      >
        {item.label}
      </Link>
    )
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger: clicking the label visits the page, the chevron toggles dropdown */}
      <div
        className={`flex items-center rounded-lg transition-colors ${
          isActive ? "text-primary" : "text-on-surface hover:text-primary"
        }`}
      >
        <Link
          href={item.href}
          className="px-3 py-2 text-xs font-semibold"
        >
          {item.label}
        </Link>
        <button
          onClick={() => setOpen((v) => !v)}
          className={`pr-2 py-2 focus:outline-none transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          aria-label={`Open ${item.label} menu`}
        >
          <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        </button>
      </div>

      <MegaMenu item={item} open={open} onClose={() => setOpen(false)} />
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   MOBILE ACCORDION SECTION
────────────────────────────────────────────────────────────── */
function MobileNavSection({
  item,
  onClose,
}: {
  item: (typeof navData)[0]
  onClose: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  if (!item.groups) {
    return (
      <Link
        href={item.href}
        onClick={onClose}
        className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-surface-container text-sm font-bold text-on-surface"
      >
        {item.label}
        <ChevronRight className="h-4 w-4 text-on-surface-variant" />
      </Link>
    )
  }

  return (
    <div className="rounded-xl overflow-hidden border border-outline-variant/60">
      {/* Section header → navigates to the parent page or toggles accordion */}
      <div className="flex items-center justify-between">
        <Link
          href={item.href}
          onClick={onClose}
          className="flex-1 px-4 py-3.5 text-sm font-bold text-on-surface"
        >
          {item.label}
        </Link>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="px-3 py-3.5 text-on-surface-variant focus:outline-none"
          aria-label={`Toggle ${item.label} submenu`}
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-outline-variant/60 bg-surface-container/40 px-3 py-2 space-y-0.5">
          {item.groups.map((group) => (
            <div key={group.heading}>
              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant px-2 py-1.5">
                {group.heading}
              </p>
              {group.items.map((sub) => {
                const Icon = sub.icon
                return (
                  <Link
                    key={sub.title}
                    href={sub.href}
                    onClick={onClose}
                    className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-surface-container transition-colors group"
                  >
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">
                          {sub.title}
                        </span>
                        {"badge" in sub && sub.badge && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-primary text-white">
                            {sub.badge}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-on-surface-variant ml-auto" />
                  </Link>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   SITE HEADER
────────────────────────────────────────────────────────────── */
export function SiteHeader() {
  const pathname = usePathname()
  const { isLoaded, isSignedIn, user } = useUser()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [mobileMenuOpen])

  const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase()
  const userRole = user?.publicMetadata?.role as string
  const configAdminEmail = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "poweldayck@gmail.com").toLowerCase()
  const isAdmin =
    userEmail === "poweldayck@gmail.com" ||
    userEmail === configAdminEmail ||
    userRole === "Super Admin" ||
    userRole === "Admin"

  return (
    <>
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-200 ${
          scrolled
            ? "bg-surface-container-lowest/90 backdrop-blur-xl shadow-sm border-b border-outline-variant/80"
            : "bg-surface-container-lowest border-b border-outline-variant"
        } h-16`}
      >
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">

          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <Logo width={140} height={42} className="h-8 md:h-9 w-auto transition-transform group-hover:scale-[1.02]" />
            <div className="hidden lg:flex flex-col border-l border-outline-variant pl-2.5 py-0.5">
              <span className="text-[10px] font-black tracking-widest text-primary uppercase leading-tight">Technologies</span>
              <span className="text-[9px] text-on-surface-variant font-medium leading-tight">Software Engineering</span>
            </div>
          </Link>

          {/* Desktop Nav — hierarchical */}
          <nav className="hidden md:flex items-center gap-0.5 lg:gap-1">
            {navData.map((item) => (
              <DesktopNavItem key={item.label} item={item} pathname={pathname} />
            ))}

            {/* Authenticated: Client Console link */}
            {isLoaded && isSignedIn && (
              <Link
                href="/dashboard"
                className={`flex items-center gap-1.5 ml-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  pathname === "/dashboard" || pathname?.startsWith("/dashboard/")
                    ? "bg-primary text-white shadow-sm"
                    : "bg-primary/10 text-primary hover:bg-primary/15"
                }`}
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>Client Console</span>
              </Link>
            )}
          </nav>

          {/* Right: Auth + Theme + Hamburger */}
          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />

            {isLoaded && isSignedIn ? (
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Link href="/admin/system-health">
                    <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary hover:text-white transition-all cursor-pointer">
                      <Shield className="h-3 w-3" />
                      Admin
                    </span>
                  </Link>
                )}
                <div className="text-right hidden lg:block">
                  <p className="text-xs font-bold text-on-surface leading-tight">
                    {user?.fullName || user?.firstName || "Client Account"}
                  </p>
                  <p className="text-[10px] text-on-surface-variant leading-tight">
                    {user?.primaryEmailAddress?.emailAddress || ""}
                  </p>
                </div>
                <UserButton
                  appearance={{
                    elements: { avatarBox: "w-9 h-9 rounded-full ring-2 ring-primary/20" },
                  }}
                />
              </div>
            ) : isLoaded && !isSignedIn ? (
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/sign-in">
                  <Button variant="ghost" size="sm" className="h-9 px-3.5 rounded-xl text-xs font-semibold text-on-surface hover:text-primary">
                    Sign In
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="sm" className="h-9 px-4 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/95 shadow-sm flex items-center gap-1.5">
                    Start a Project <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            ) : null}

            {/* Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-on-surface hover:bg-surface-container transition-colors focus:outline-none"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Drawer ── */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Slide-in panel */}
          <div className="md:hidden fixed inset-x-0 top-16 z-50 bg-surface-container-lowest max-h-[calc(100vh-4rem)] overflow-y-auto animate-in slide-in-from-top-2 duration-200 shadow-2xl border-b border-outline-variant">
            <div className="p-4 space-y-3">

              {/* Auth quick row */}
              {isLoaded && isSignedIn ? (
                <div className="p-3 rounded-2xl bg-surface-container flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-on-surface">{user?.fullName || "Welcome back"}</p>
                    <p className="text-[11px] text-on-surface-variant">{user?.primaryEmailAddress?.emailAddress}</p>
                  </div>
                  <Link href="/dashboard">
                    <Button size="sm" className="h-8 px-3 rounded-lg text-xs bg-primary text-white">Console</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/sign-in" className="w-full">
                    <Button variant="outline" size="sm" className="w-full text-xs font-semibold rounded-xl">Sign In</Button>
                  </Link>
                  <Link href="/contact" className="w-full">
                    <Button size="sm" className="w-full text-xs font-bold bg-primary text-white rounded-xl">Start a Project</Button>
                  </Link>
                </div>
              )}

              {/* Hierarchical nav sections */}
              <div className="space-y-2">
                {navData.map((item) => (
                  <MobileNavSection key={item.label} item={item} onClose={() => setMobileMenuOpen(false)} />
                ))}
              </div>

              {/* Admin link */}
              {isLoaded && isSignedIn && isAdmin && (
                <Link
                  href="/admin/system-health"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-primary hover:bg-primary/10"
                >
                  <Shield className="h-4 w-4" /> Admin Central
                </Link>
              )}

            </div>
          </div>
        </>
      )}
    </>
  )
}