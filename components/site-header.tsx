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
   NAV TYPES & DATA  (parent pages + child sub-routes inside them)
────────────────────────────────────────────────────────────── */
interface NavSubItem {
  title: string
  desc: string
  href: string
  icon: any
  badge?: string
}

interface NavGroup {
  heading: string
  items: NavSubItem[]
}

interface NavItem {
  label: string
  href: string
  badge?: string
  groups?: NavGroup[] | null
  footer?: { label: string; href: string }
}

const navData: NavItem[] = [
  {
    label: "About",
    href: "/about",
    groups: null,   // simple link — no dropdown
  },
  {
    label: "KRA PIN to Retrieval",
    href: "/retrieval-portal",
    badge: "KES 20",
    groups: [
      {
        heading: "Statutory Retrieval Suite",
        items: [
          {
            title: "Certificate Retrieval",
            desc: "Instant compliance document download by PIN or ID",
            href: "/retrieval-portal",
            icon: FileCheck2,
            badge: "KES 20",
          },
          {
            title: "Live PIN & ID Checker",
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
    footer: { label: "Launch Retrieval Portal (KES 20) →", href: "/retrieval-portal" },
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
    label: "Products",
    href: "/products",
    groups: [
      {
        heading: "In-House Products",
        items: [
          {
            title: "KRA Certificate Portal",
            desc: "Instant compliance certificate retrieval by ID or PIN",
            href: "/retrieval-portal",
            icon: FileCheck2,
            badge: "KES 20",
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
  item: NavItem
  open: boolean
  onClose: () => void
}) {
  if (!item.groups || !open) return null
  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 top-full pt-2 z-50 animate-in fade-in-20 slide-in-from-top-1 duration-150"
      style={{ minWidth: 350 }}
      role="menu"
    >
      {/* Dropdown Container with Hover Bridge */}
      <div className="bg-surface-container-lowest border border-outline-variant shadow-2xl shadow-black/10 rounded-2xl overflow-hidden backdrop-blur-xl">
        {item.groups.map((group) => (
          <div key={group.heading} className="p-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant px-2.5 py-1 mb-1">
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
                    <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors shrink-0 mt-0.5">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                          {sub.title}
                        </span>
                        {sub.badge && (
                          <span className="shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-primary text-white">
                            {sub.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-on-surface-variant line-clamp-1 mt-0.5">{sub.desc}</p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-on-surface-variant opacity-0 group-hover:opacity-100 shrink-0 mt-1 transition-opacity" />
                  </Link>
                )
              })}
            </div>
          </div>
        ))}

        {/* Footer CTA link */}
        {item.footer && (
          <div className="border-t border-outline-variant/60 bg-surface-container/30 px-4 py-2.5">
            <Link
              href={item.footer.href}
              onClick={onClose}
              className="flex items-center justify-between text-xs font-bold text-primary hover:underline"
            >
              <span>{item.footer.label}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   DESKTOP NAV ITEM (hover-bridge + click trigger)
────────────────────────────────────────────────────────────── */
function DesktopNavItem({
  item,
  pathname,
}: {
  item: NavItem
  pathname: string
}) {
  const [open, setOpen] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const isActive =
    pathname === item.href ||
    (item.href !== "/" && pathname.startsWith(item.href))

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (item.groups && item.groups.length > 0) {
      setOpen(true)
    }
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpen(false)
    }, 160)
  }

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handler)
    return () => {
      document.removeEventListener("mousedown", handler)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [open])

  if (!item.groups) {
    return (
      <Link
        href={item.href}
        className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
          isActive
            ? "text-primary bg-primary/10 font-bold"
            : "text-on-surface hover:text-primary hover:bg-surface-container"
        }`}
      >
        <span>{item.label}</span>
        {item.badge && (
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
            {item.badge}
          </span>
        )}
      </Link>
    )
  }

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger container */}
      <div
        className={`flex items-center rounded-xl transition-all ${
          isActive
            ? "text-primary bg-primary/10 font-bold"
            : open
            ? "text-primary bg-surface-container"
            : "text-on-surface hover:text-primary hover:bg-surface-container"
        }`}
      >
        <Link
          href={item.href}
          className="pl-3 pr-1 py-2 text-xs font-semibold flex items-center gap-1.5"
        >
          <span>{item.label}</span>
          {item.badge && (
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
              {item.badge}
            </span>
          )}
        </Link>
        <button
          onClick={(e) => {
            e.stopPropagation()
            setOpen((v) => !v)
          }}
          className={`pr-2.5 pl-1 py-2 focus:outline-none transition-transform duration-200 cursor-pointer ${
            open ? "rotate-180 text-primary" : "text-on-surface-variant hover:text-primary"
          }`}
          aria-label={`Toggle ${item.label} menu`}
          aria-expanded={open}
        >
          <ChevronDown className="h-3.5 w-3.5" />
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
  item: NavItem
  onClose: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  if (!item.groups) {
    return (
      <Link
        href={item.href}
        onClick={onClose}
        className="flex items-center justify-between min-h-[44px] px-3.5 py-3 rounded-2xl hover:bg-surface-container text-sm font-bold text-on-surface transition-colors"
      >
        <div className="flex items-center gap-2">
          <span>{item.label}</span>
          {item.badge && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
              {item.badge}
            </span>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-on-surface-variant" />
      </Link>
    )
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-outline-variant/60 bg-surface-container-lowest">
      {/* Section header */}
      <div className="flex items-center justify-between min-h-[44px]">
        <Link
          href={item.href}
          onClick={onClose}
          className="flex-1 px-4 py-3 text-sm font-bold text-on-surface flex items-center gap-2"
        >
          <span>{item.label}</span>
          {item.badge && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
              {item.badge}
            </span>
          )}
        </Link>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-on-surface-variant focus:outline-none"
          aria-label={`Toggle ${item.label} submenu`}
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${expanded ? "rotate-180 text-primary" : ""}`}
          />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-outline-variant/60 bg-surface-container/30 px-3 py-2 space-y-1">
          {item.groups.map((group) => (
            <div key={group.heading} className="py-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant px-2 py-1">
                {group.heading}
              </p>
              {group.items.map((sub) => {
                const Icon = sub.icon
                return (
                  <Link
                    key={sub.title}
                    href={sub.href}
                    onClick={onClose}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-container transition-colors group min-h-[44px]"
                  >
                    <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">
                          {sub.title}
                        </span>
                        {sub.badge && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-primary text-white">
                            {sub.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-on-surface-variant line-clamp-1">{sub.desc}</p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-on-surface-variant ml-auto shrink-0" />
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
            : "bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant"
        } h-16`}
      >
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 xl:gap-4 flex-nowrap min-w-0">

          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <Logo width={140} height={42} className="h-8 md:h-9 w-auto transition-transform group-hover:scale-[1.02]" />
            <div className="hidden 2xl:flex flex-col border-l border-outline-variant pl-2.5 py-0.5">
              <span className="text-[10px] font-black tracking-widest text-primary uppercase leading-tight">Technologies</span>
              <span className="text-[9px] text-on-surface-variant font-medium leading-tight">Software Engineering</span>
            </div>
          </Link>

          {/* Desktop Nav — hierarchical (lg screens and above) */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 shrink-0">
            {navData.map((item) => (
              <DesktopNavItem key={item.label} item={item} pathname={pathname} />
            ))}
          </nav>

          {/* Right: Auth + Theme + Hamburger */}
          <div className="flex items-center gap-2 shrink-0 flex-nowrap">
            <ThemeToggle />

            {isLoaded && isSignedIn ? (
              <div className="flex items-center gap-2 flex-nowrap">
                {isAdmin && (
                  <Link href="/admin/system-health">
                    <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary hover:text-white transition-all cursor-pointer shrink-0">
                      <Shield className="h-3 w-3" />
                      Admin
                    </span>
                  </Link>
                )}
                <Link href="/dashboard">
                  <Button size="sm" className="h-8.5 px-3 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary/90 flex items-center gap-1.5 shrink-0">
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Console</span>
                  </Button>
                </Link>
                <UserButton
                  appearance={{
                    elements: { avatarBox: "w-8.5 h-8.5 rounded-full ring-2 ring-primary/20" },
                  }}
                />
              </div>
            ) : isLoaded && !isSignedIn ? (
              <div className="hidden sm:flex items-center gap-2 flex-nowrap">
                <Link href="/sign-in">
                  <Button variant="ghost" size="sm" className="h-9 px-3.5 rounded-xl text-xs font-semibold text-on-surface hover:text-primary shrink-0">
                    Sign In
                  </Button>
                </Link>
                <Link href="/contact" className="hidden xl:block">
                  <Button size="sm" className="h-9 px-4 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/95 shadow-sm flex items-center gap-1.5 shrink-0">
                    Start a Project <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            ) : null}

            {/* Hamburger (visible on mobile and tablet < lg) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-on-surface hover:bg-surface-container transition-colors focus:outline-none cursor-pointer"
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
            className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Slide-in panel */}
          <div className="lg:hidden fixed inset-x-0 top-16 z-50 bg-surface-container-lowest max-h-[calc(100vh-4rem)] overflow-y-auto animate-in slide-in-from-top-2 duration-200 shadow-2xl border-b border-outline-variant">
            <div className="p-4 space-y-3.5">

              {/* Auth quick row */}
              {isLoaded && isSignedIn ? (
                <div className="p-3.5 rounded-2xl bg-surface-container flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-on-surface">{user?.fullName || "Welcome back"}</p>
                    <p className="text-[11px] text-on-surface-variant truncate max-w-[200px]">{user?.primaryEmailAddress?.emailAddress}</p>
                  </div>
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button size="sm" className="h-8 px-3.5 rounded-xl text-xs bg-primary text-white font-bold">Console</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/sign-in" className="w-full" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full h-10 text-xs font-semibold rounded-xl">Sign In</Button>
                  </Link>
                  <Link href="/contact" className="w-full" onClick={() => setMobileMenuOpen(false)}>
                    <Button size="sm" className="w-full h-10 text-xs font-bold bg-primary text-white rounded-xl">Start a Project</Button>
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
                  className="flex items-center gap-2 px-3.5 py-3 rounded-2xl text-xs font-bold text-primary hover:bg-primary/10 transition-colors"
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