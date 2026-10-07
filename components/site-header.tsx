"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserButton, useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Code2,
  Smartphone,
  Cloud,
  Layers,
  FileCheck2,
  ShieldCheck,
  Send,
  FileText,
  ChevronDown,
  Menu,
  X,
  Sparkles,
  LayoutDashboard,
  Shield,
  ArrowRight,
  ExternalLink,
  Laptop
} from "lucide-react"

export function SiteHeader() {
  const pathname = usePathname()
  const { isLoaded, isSignedIn, user } = useUser()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Track scroll state for dynamic glass header treatment
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase()
  const userRole = user?.publicMetadata?.role as string
  const configAdminEmail = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "poweldayck@gmail.com").toLowerCase()

  const isAdmin =
    userEmail === "poweldayck@gmail.com" ||
    userEmail === configAdminEmail ||
    userRole === "Super Admin" ||
    userRole === "Admin"

  const services = [
    {
      title: "Web Engineering",
      desc: "High-performance full-stack web platforms, Next.js & enterprise web apps",
      href: "/#services",
      icon: Laptop,
    },
    {
      title: "Mobile App Development",
      desc: "Native iOS & Android, React Native & offline-capable mobile ecosystems",
      href: "/#services",
      icon: Smartphone,
    },
    {
      title: "Cloud & DevOps Architecture",
      desc: "Microservices, automated CI/CD pipelines, containerization & AWS scaling",
      href: "/#services",
      icon: Cloud,
    },
    {
      title: "Custom Enterprise Software",
      desc: "Bespoke internal systems, high-throughput APIs, integrations & workflow automation",
      href: "/#services",
      icon: Layers,
    },
  ]

  const products = [
    {
      title: "KRA Certificate Portal",
      desc: "Instant national ID & PIN compliance document retrieval & verification",
      href: "/retrieval-portal",
      icon: FileCheck2,
      badge: "Flagship",
    },
    {
      title: "Live PIN & ID Checker",
      desc: "Real-time automated taxpayer status & registry validation engine",
      href: "/pin-checker",
      icon: ShieldCheck,
      badge: "Live",
    },
    {
      title: "Automated Tax Filing",
      desc: "Streamlined nil returns & statutory submission pipeline",
      href: "/dashboard/filing",
      icon: Send,
    },
  ]

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-200 ${
        scrolled
          ? "bg-surface-container-lowest/90 backdrop-blur-md shadow-sm border-b border-outline-variant/80"
          : "bg-surface-container-lowest border-b border-outline-variant"
      } h-16`}
    >
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Logo width={140} height={42} className="h-8 md:h-9 w-auto transition-transform group-hover:scale-102" />
            <div className="hidden lg:flex flex-col border-l border-outline-variant pl-2.5 py-0.5">
              <span className="text-[10px] font-black tracking-widest text-primary uppercase leading-tight">Technologies</span>
              <span className="text-[9px] text-on-surface-variant font-medium leading-tight">Software Engineering</span>
            </div>
          </Link>
        </div>

        {/* Center: Desktop Navigation Bar */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
          
          {/* Services Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-on-surface hover:text-primary hover:bg-surface-container transition-colors focus:outline-none">
                <span>Services</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-80 p-2 bg-surface-container-lowest border border-outline-variant shadow-xl rounded-xl animate-in fade-in-50 zoom-in-95">
              <DropdownMenuLabel className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider px-2 py-1">
                Engineering Capabilities
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-1 bg-outline-variant/60" />
              {services.map((item) => {
                const Icon = item.icon
                return (
                  <DropdownMenuItem key={item.title} asChild className="p-0 rounded-lg focus:bg-surface-container">
                    <Link
                      href={item.href}
                      className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-surface-container transition-colors w-full group cursor-pointer"
                    >
                      <div className="p-1.5 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors mt-0.5">
                        <Icon className="h-4 w-4 shrink-0" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">
                          {item.title}
                        </span>
                        <span className="text-[11px] text-on-surface-variant line-clamp-1">
                          {item.desc}
                        </span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* In-House Products & Tools Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-on-surface hover:text-primary hover:bg-surface-container transition-colors focus:outline-none">
                <span>Products & Tools</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-84 p-2 bg-surface-container-lowest border border-outline-variant shadow-xl rounded-xl animate-in fade-in-50 zoom-in-95">
              <DropdownMenuLabel className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider px-2 py-1 flex items-center justify-between">
                <span>In-House Products & GovTech</span>
                <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-black">Live</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-1 bg-outline-variant/60" />
              {products.map((item) => {
                const Icon = item.icon
                return (
                  <DropdownMenuItem key={item.title} asChild className="p-0 rounded-lg focus:bg-surface-container">
                    <Link
                      href={item.href}
                      className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-surface-container transition-colors w-full group cursor-pointer"
                    >
                      <div className="p-1.5 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors mt-0.5">
                        <Icon className="h-4 w-4 shrink-0" />
                      </div>
                      <div className="flex flex-col flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">
                            {item.title}
                          </span>
                          {item.badge && (
                            <span className="text-[10px] font-semibold text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400 px-1.5 py-0.2 rounded border border-red-500/20">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-on-surface-variant line-clamp-1">
                          {item.desc}
                        </span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Solutions Link */}
          <Link
            href="/#solutions"
            className="px-3 py-2 rounded-lg text-xs font-semibold text-on-surface hover:text-primary hover:bg-surface-container transition-colors"
          >
            Solutions
          </Link>

          {/* Process Link */}
          <Link
            href="/#process"
            className="px-3 py-2 rounded-lg text-xs font-semibold text-on-surface hover:text-primary hover:bg-surface-container transition-colors"
          >
            Methodology
          </Link>

          {/* About Link */}
          <Link
            href="/#about"
            className="px-3 py-2 rounded-lg text-xs font-semibold text-on-surface hover:text-primary hover:bg-surface-container transition-colors"
          >
            About
          </Link>

          {/* Logged-In User Dashboard Link */}
          {isLoaded && isSignedIn && (
            <Link
              href="/dashboard"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
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

        {/* Right Action Area */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {isLoaded && isSignedIn ? (
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Link href="/admin/system-health">
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary hover:text-white transition-all cursor-pointer">
                    <Shield className="h-3 w-3" />
                    Admin Central
                  </span>
                </Link>
              )}

              <div className="text-right hidden md:block">
                <p className="text-xs font-bold text-on-surface leading-tight">
                  {user?.fullName || user?.firstName || "Client Account"}
                </p>
                <p className="text-[10px] text-on-surface-variant leading-tight">
                  {user?.primaryEmailAddress?.emailAddress || ""}
                </p>
              </div>

              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9 rounded-full ring-2 ring-primary/20",
                  },
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
              <Link href="/sign-up">
                <Button size="sm" className="h-9 px-4 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/95 shadow-sm flex items-center gap-1.5">
                  <span>Start a Project</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          ) : null}

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-on-surface hover:bg-surface-container transition-colors focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bg-surface-container-lowest border-b border-outline-variant shadow-2xl p-4 max-h-[calc(100vh-4rem)] overflow-y-auto animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-4">
            
            {/* Quick Actions for Signed In / Signed Out */}
            {isLoaded && isSignedIn ? (
              <div className="p-3 rounded-xl bg-surface-container flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-on-surface">{user?.fullName || "Welcome back"}</span>
                  <span className="text-[11px] text-on-surface-variant">{user?.primaryEmailAddress?.emailAddress}</span>
                </div>
                <Link href="/dashboard">
                  <Button size="sm" className="h-8 px-3 rounded-lg text-xs bg-primary text-white">
                    Console
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/sign-in" className="w-full">
                  <Button variant="outline" size="sm" className="w-full text-xs font-semibold rounded-xl">
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up" className="w-full">
                  <Button size="sm" className="w-full text-xs font-bold bg-primary text-white rounded-xl">
                    Start a Project
                  </Button>
                </Link>
              </div>
            )}

            {/* In-House Tools Highlight Box */}
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck2 className="h-3.5 w-3.5" />
                  In-House Tools & Portals
                </span>
                <span className="text-[10px] bg-primary text-white px-1.5 py-0.2 rounded font-bold">Active</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                <Link
                  href="/retrieval-portal"
                  className="flex items-center justify-between p-2 rounded-lg bg-surface-container-lowest text-xs font-bold text-on-surface hover:text-primary transition-colors"
                >
                  <span>KRA Certificate Portal</span>
                  <ArrowRight className="h-3.5 w-3.5 text-primary" />
                </Link>
                <Link
                  href="/pin-checker"
                  className="flex items-center justify-between p-2 rounded-lg bg-surface-container-lowest text-xs font-bold text-on-surface hover:text-primary transition-colors"
                >
                  <span>Live PIN & ID Checker</span>
                  <ArrowRight className="h-3.5 w-3.5 text-primary" />
                </Link>
                <Link
                  href="/dashboard/filing"
                  className="flex items-center justify-between p-2 rounded-lg bg-surface-container-lowest text-xs font-bold text-on-surface hover:text-primary transition-colors"
                >
                  <span>Tax Returns Filing</span>
                  <ArrowRight className="h-3.5 w-3.5 text-primary" />
                </Link>
              </div>
            </div>

            {/* Engineering Services Menu */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider px-2">
                Services
              </span>
              {services.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-container text-xs font-semibold text-on-surface"
                  >
                    <Icon className="h-4 w-4 text-primary" />
                    <span>{item.title}</span>
                  </Link>
                )
              })}
            </div>

            {/* Company Links */}
            <div className="space-y-1 pt-2 border-t border-outline-variant/60">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider px-2">
                Company & Overview
              </span>
              <Link href="/#solutions" className="block p-2 text-xs font-semibold text-on-surface hover:text-primary">
                Industry Solutions
              </Link>
              <Link href="/#process" className="block p-2 text-xs font-semibold text-on-surface hover:text-primary">
                Engineering Methodology
              </Link>
              <Link href="/#about" className="block p-2 text-xs font-semibold text-on-surface hover:text-primary">
                About Akubrecah Technologies
              </Link>
              {isAdmin && (
                <Link href="/admin/system-health" className="flex items-center gap-2 p-2 text-xs font-bold text-primary">
                  <Shield className="h-3.5 w-3.5" />
                  Admin Central
                </Link>
              )}
            </div>

          </div>
        </div>
      )}
    </header>
  )
}