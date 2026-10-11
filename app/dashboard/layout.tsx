"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  LayoutDashboard,
  FileCheck2,
  ShieldCheck,
  Send,
  User,
  ArrowLeft,
  Shield,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const portalNavItems: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/retrieval-portal", label: "KRA Retrieval", icon: FileCheck2, badge: "KES 20" },
  { href: "/pin-checker", label: "PIN Checker", icon: ShieldCheck, badge: "Free" },
  { href: "/dashboard/filing", label: "Tax Filing", icon: Send },
  { href: "/dashboard/profile", label: "My Profile", icon: User },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, isLoaded, isSignedIn } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
  const userRole = user?.publicMetadata?.role as string;
  const configAdminEmail = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "poweldayck@gmail.com").toLowerCase();
  const isAdmin =
    userEmail === "poweldayck@gmail.com" ||
    userEmail === configAdminEmail ||
    userRole === "Super Admin" ||
    userRole === "Admin";

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface font-sans antialiased">
      {/* =========================================================
          DEDICATED PORTAL HEADER (Distraction-Free)
          ========================================================= */}
      <header className="sticky top-0 z-40 h-16 bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant shadow-xs">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          
          {/* Brand + Portal Badge */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <Logo width={120} height={34} className="h-7 sm:h-8 w-auto transition-transform group-hover:scale-[1.02]" />
            </Link>
            <div className="hidden sm:flex items-center">
              <span className="h-4 w-px bg-outline-variant mx-2" />
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                Taxpayer Portal
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {portalNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-primary text-white font-bold shadow-xs"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-primary"}`} />
                  <span>{item.label}</span>
                  {item.badge && !isActive && (
                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-primary/15 text-primary border border-primary/20">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Admin Console Link (if admin) */}
            {isLoaded && isSignedIn && isAdmin && (
              <Link
                href="/admin"
                className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary hover:text-white transition-all"
                title="Admin Control Center"
              >
                <Shield className="h-3 w-3" />
                <span>Admin</span>
              </Link>
            )}

            {/* Exit to Public Website */}
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-on-surface-variant hover:text-primary transition-colors px-2.5 py-1.5 rounded-xl hover:bg-surface-container"
              title="Return to Public Website"
            >
              <span>Public Site</span>
              <ArrowLeft className="h-3 w-3 rotate-180" />
            </Link>

            <ThemeToggle />

            {/* Clerk User Avatar with Profile & Sign Out */}
            {isLoaded && isSignedIn && (
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8 rounded-full ring-2 ring-primary/20",
                  },
                }}
              />
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-on-surface hover:bg-surface-container transition-colors focus:outline-none"
              aria-label="Toggle Portal Navigation"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================
          MOBILE DRAWER / DROPDOWN
          ========================================================= */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 z-30 bg-surface-container-lowest border-b border-outline-variant shadow-xl animate-in slide-in-from-top-2 duration-200">
          <div className="p-4 space-y-2">
            <div className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant px-3 py-1">
              Portal Services
            </div>
            {portalNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-primary text-white font-bold"
                      : "text-on-surface hover:bg-surface-container"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-primary"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-primary/10 text-primary border border-primary/20"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            <div className="pt-3 border-t border-outline-variant/60 flex items-center justify-between px-1">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Public Website</span>
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs font-semibold text-on-surface-variant hover:text-primary flex items-center gap-1"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MAIN PORTAL CONTENT
          ========================================================= */}
      <main className="flex-1 w-full bg-surface-bright min-h-[calc(100vh-8rem)]">
        {children}
      </main>

      {/* =========================================================
          DEDICATED PORTAL FOOTER (Clean & Minimal)
          ========================================================= */}
      <footer className="bg-surface-container-lowest border-t border-outline-variant py-6 px-4 sm:px-6 lg:px-8 text-xs text-on-surface-variant">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <span className="font-bold text-on-surface">Akubrecah Technologies</span>
            <span className="hidden sm:inline text-outline-variant">•</span>
            <span>Secure Statutory & Taxpayer Compliance Gateway</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-semibold">
            <Link href="/legal/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="/legal/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link href="/legal/disclaimer" className="hover:text-primary transition-colors">Disclaimer</Link>
            <Link href="/contact" className="hover:text-primary transition-colors">Support & Inquiries</Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-3 pt-3 border-t border-outline-variant/40 text-[10px] text-center text-on-surface-variant/80">
          Akubrecah Technologies operates independent software engineering solutions and automated compliance gateways. Government services are also accessible directly via official public portals such as{" "}
          <a
            href="https://itax.kra.go.ke"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-bold inline-flex items-center gap-0.5"
          >
            itax.kra.go.ke <ExternalLink className="w-2.5 h-2.5" />
          </a>.
        </div>
      </footer>
    </div>
  );
}
