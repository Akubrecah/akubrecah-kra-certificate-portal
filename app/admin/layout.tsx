"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Mail,
  FolderGit2,
  BookOpen,
  FileCheck2,
  Activity,
  Users,
  ShieldCheck,
  Terminal,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowLeft,
  LogOut,
  Search,
  Bell,
  HelpCircle,
  Shield,
  KeyRound,
  Lock,
  ExternalLink,
  Sparkles
} from "lucide-react";

interface NavLinkItem {
  href: string;
  label: string;
  icon: any;
  badge?: string;
}

const navLinks: NavLinkItem[] = [
  { href: "/admin", label: "Executive Overview", icon: LayoutDashboard },
  { href: "/admin/inquiries", label: "Client Inquiries & CRM", icon: Mail },
  { href: "/admin/projects", label: "Projects & Repositories", icon: FolderGit2 },
  { href: "/admin/articles", label: "Articles & Field Notes", icon: BookOpen },
  { href: "/admin/kra-retrievals", label: "KRA Retrievals", icon: FileCheck2 },
  { href: "/admin/system-health", label: "System Health", icon: Activity },
  { href: "/admin/user-management", label: "User Management", icon: Users },
  { href: "/admin/role-access", label: "Role Access", icon: ShieldCheck },
  { href: "/admin/system-logs", label: "System Logs", icon: Terminal },
  { href: "/admin/settings", label: "Website Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isResizing, setIsResizing] = useState(false);

  const [hasMagicAuth, setHasMagicAuth] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [pathname]);

  // Load and persist sidebar state
  useEffect(() => {
    setIsMounted(true);
    const storedCollapsed = localStorage.getItem("admin-sidebar-collapsed");
    if (storedCollapsed) {
      setIsCollapsed(storedCollapsed === "true");
    } else if (typeof window !== "undefined") {
      const width = window.innerWidth;
      if (width >= 768 && width < 1024) {
        setIsCollapsed(true); // Slim by default on tablets
      }
    }

    const storedWidth = localStorage.getItem("admin-sidebar-width");
    if (storedWidth) {
      setSidebarWidth(parseInt(storedWidth, 10));
    }
  }, []);

  const toggleSidebar = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem("admin-sidebar-collapsed", String(next));
  };

  const startResizing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const resetWidth = () => {
    const defaultWidth = 256;
    setSidebarWidth(defaultWidth);
    localStorage.setItem("admin-sidebar-width", String(defaultWidth));
  };

  // Draggable sidebar resizer
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const clientX = e.clientX;
      const minW = Math.max(180, window.innerWidth * 0.12);
      const maxW = Math.min(420, window.innerWidth * 0.30);
      if (clientX >= minW && clientX <= maxW) {
        setSidebarWidth(clientX);
        localStorage.setItem("admin-sidebar-width", String(clientX));
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const clientX = e.touches[0].clientX;
      const minW = Math.max(180, window.innerWidth * 0.12);
      const maxW = Math.min(420, window.innerWidth * 0.30);
      if (clientX >= minW && clientX <= maxW) {
        setSidebarWidth(clientX);
        localStorage.setItem("admin-sidebar-width", String(clientX));
      }
    };

    const stopResizing = () => {
      setIsResizing(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopResizing);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", stopResizing);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopResizing);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", stopResizing);
    };
  }, [isResizing]);

  // Auth checking optimization: Resolve immediately if user is already verified via Clerk or Cookie
  useEffect(() => {
    // 1. Client cookie
    if (
      typeof document !== "undefined" &&
      (document.cookie.includes("admin_magic_client=1") || document.cookie.includes("admin_magic_auth="))
    ) {
      setHasMagicAuth(true);
      setCheckingAuth(false);
      return;
    }

    // 2. Clerk account Super Admin bypass
    const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
    const userRole = user?.publicMetadata?.role as string;
    const configPublicAdminEmail = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "poweldayck@gmail.com").toLowerCase();

    if (
      userEmail === "poweldayck@gmail.com" ||
      userEmail === configPublicAdminEmail ||
      userRole === "Super Admin" ||
      userRole === "Admin"
    ) {
      setHasMagicAuth(true);
      setCheckingAuth(false);
      return;
    }

    // 3. Query session endpoint with timeout protection
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    fetch("/api/admin/magic-login?check=1", { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setHasMagicAuth(true);
        }
      })
      .catch(() => {})
      .finally(() => {
        clearTimeout(timeout);
        setCheckingAuth(false);
      });
  }, [user, isLoaded]);

  const handlePinUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) {
      setPinError("Please enter your admin PIN.");
      return;
    }

    setIsVerifyingPin(true);
    setPinError("");

    try {
      const res = await fetch("/api/admin/magic-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinInput.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setHasMagicAuth(true);
      } else {
        setPinError(data.error || "Incorrect PIN. Default is 8426.");
      }
    } catch {
      setPinError("Network error. Please try again.");
    } finally {
      setIsVerifyingPin(false);
    }
  };

  // Render seamless skeleton shell during initial check (NO distorted text ligatures, NO layout jump)
  if (!isLoaded || checkingAuth) {
    return (
      <div className="min-h-screen flex bg-surface-container-lowest text-on-surface">
        {/* Desktop Sidebar Skeleton */}
        <aside className="hidden md:flex flex-col w-64 border-r border-outline-variant/60 p-5 space-y-6 bg-surface animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-container-high" />
            <div className="space-y-1.5 flex-1">
              <div className="h-4 bg-surface-container-high rounded w-3/4" />
              <div className="h-2.5 bg-surface-container-high rounded w-1/2" />
            </div>
          </div>
          <div className="h-10 bg-surface-container-high rounded-xl" />
          <div className="space-y-2 flex-1 pt-2">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-9 bg-surface-container-high rounded-xl" />
            ))}
          </div>
        </aside>

        {/* Content Shell Skeleton */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 border-b border-outline-variant/60 bg-surface px-6 flex items-center justify-between animate-pulse">
            <div className="h-8 bg-surface-container-high rounded-full w-64" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-surface-container-high" />
              <div className="w-8 h-8 rounded-full bg-surface-container-high" />
            </div>
          </header>
          <main className="p-6 sm:p-8 space-y-6 flex-1 bg-surface-bright animate-pulse">
            <div className="h-8 bg-surface-container rounded-xl w-72" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-surface-container rounded-3xl" />
              ))}
            </div>
            <div className="h-96 bg-surface-container rounded-3xl" />
          </main>
        </div>
      </div>
    );
  }

  // Enforce Admin Authorization
  const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
  const userRole = user?.publicMetadata?.role as string;
  const configPublicAdminEmail = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "poweldayck@gmail.com").toLowerCase();

  const isSuperAdmin = 
    hasMagicAuth ||
    userEmail === "poweldayck@gmail.com" || 
    userEmail === configPublicAdminEmail ||
    userRole === "Super Admin" ||
    userRole === "Admin";

  // Master Admin Passcode Gate (if unauthenticated)
  if (!isSuperAdmin && !hasMagicAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest p-4 relative overflow-hidden font-sans">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[130px] pointer-events-none" />

        <div className="w-full max-w-md bg-surface border border-outline-variant p-6 sm:p-8 rounded-3xl shadow-2xl relative z-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary mb-3">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-on-surface tracking-tight">Admin Command Center</h1>
            <p className="text-xs text-on-surface-variant max-w-xs mx-auto leading-relaxed">
              Official KRA Portal Administration. Enter your master PIN to unlock executive access.
            </p>
          </div>

          <form onSubmit={handlePinUnlock} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                Master Admin Passcode
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={8}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError("");
                }}
                placeholder="Enter 4-digit PIN (default: 8426)"
                autoFocus
                className="w-full h-12 px-4 rounded-xl bg-surface-container text-center font-mono text-lg font-black tracking-widest text-on-surface placeholder:text-on-surface-variant/40 border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {pinError && (
                <p className="text-xs font-bold text-red-600 dark:text-red-400 mt-2 text-center">{pinError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isVerifyingPin}
              className="w-full h-12 rounded-xl bg-primary text-white font-bold text-sm shadow-md hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isVerifyingPin ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Passcode...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Unlock Admin Dashboard</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-outline-variant/60 text-center space-y-2">
            <Link
              href="/sign-in?redirect_url=/admin"
              className="text-xs font-bold text-primary hover:underline block"
            >
              Or Sign In with Clerk Super Admin Account →
            </Link>
            <Link href="/" className="text-[11px] text-on-surface-variant hover:text-on-surface block">
              ← Return to Public Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex bg-surface-container-lowest text-on-surface font-sans antialiased overflow-x-hidden"
      style={{
        ["--sidebar-width" as any]: isCollapsed ? "80px" : `${sidebarWidth}px`
      }}
    >
      {/* Resizing Guide HUD when dragging sidebar width */}
      {isResizing && (
        <>
          <div className="fixed inset-0 cursor-col-resize z-50 select-none pointer-events-auto" />
          <div 
            className="fixed top-0 bottom-0 w-[2px] bg-primary z-50 pointer-events-none"
            style={{ left: `${sidebarWidth}px` }}
          />
          <div 
            className="fixed top-1/3 z-50 bg-neutral-950 text-white font-mono text-xs px-3.5 py-2 rounded-xl shadow-2xl flex flex-col gap-0.5 select-none pointer-events-none -translate-x-1/2"
            style={{ left: `${sidebarWidth}px` }}
          >
            <span className="font-bold text-[10px] text-zinc-400 uppercase tracking-wider">Width</span>
            <span className="text-white font-black">{sidebarWidth}px</span>
          </div>
        </>
      )}

      {/* =========================================================
          DESKTOP & TABLET SIDEBAR
          ========================================================= */}
      <aside 
        className={`hidden md:flex flex-col fixed left-0 top-0 h-full bg-surface border-r border-outline-variant z-30 select-none overflow-hidden ${
          isResizing ? "" : "transition-all duration-200 ease-out"
        } ${isCollapsed ? "px-2.5 py-5" : "px-4 py-5"}`}
        style={{ width: "var(--sidebar-width)" }}
      >
        {/* Resize Handle */}
        {!isCollapsed && (
          <div
            onMouseDown={startResizing}
            onTouchStart={startResizing}
            onDoubleClick={resetWidth}
            className={`absolute top-0 right-0 w-1.5 h-full cursor-col-resize z-30 transition-colors ${
              isResizing ? "bg-primary" : "hover:bg-primary/40 bg-transparent"
            }`}
            title="Drag to resize, double-click to reset"
          />
        )}

        {/* Toggle Collapse Button */}
        <button
          onClick={toggleSidebar}
          className="absolute top-6 -right-3 w-6 h-6 rounded-full border border-outline-variant bg-surface shadow-md flex items-center justify-center cursor-pointer hover:bg-surface-container-high transition-colors z-40 text-on-surface-variant hover:text-primary focus:outline-none"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Brand / Logo */}
        <div className={`mb-6 px-1 flex items-center gap-3 transition-all ${isCollapsed ? "justify-center" : ""}`}>
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary shadow-xs">
            <Shield className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h1 className="text-sm font-extrabold text-on-surface tracking-tight leading-tight truncate">
                Admin Central
              </h1>
              <p className="text-[10px] text-on-surface-variant truncate">
                KRA Portal System v2.1
              </p>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto space-y-1 pr-0.5">
          {navLinks.map((link) => {
            const Icon = link.icon;
            // Precise active link detection: Only the single matching route is highlighted
            const isActive = link.href === "/admin" 
              ? pathname === "/admin" 
              : pathname === link.href || pathname.startsWith(link.href + "/");

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center rounded-xl transition-all duration-150 text-xs font-semibold group relative focus:outline-none ${
                  isCollapsed ? "justify-center p-3" : "gap-3 px-3 py-2.5"
                } ${
                  isActive
                    ? "bg-primary text-white font-bold shadow-md shadow-primary/20"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                }`}
                title={isCollapsed ? link.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? "text-white" : "group-hover:scale-110"}`} />

                {!isCollapsed && (
                  <span className="truncate whitespace-nowrap">{link.label}</span>
                )}

                {/* Pulsing Active Indicator Dot */}
                {isActive && !isCollapsed && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white ml-auto shrink-0 shadow-xs animate-pulse" />
                )}

                {/* Collapsed Tooltip */}
                {isCollapsed && (
                  <span className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-neutral-950 text-white text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl">
                    {link.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="mt-auto pt-4 border-t border-outline-variant/60 space-y-1">
          <Link
            href="/dashboard"
            className={`flex items-center rounded-xl text-xs font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors ${
              isCollapsed ? "justify-center p-3" : "gap-3 px-3 py-2"
            }`}
            title="Back to Client Portal"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Back to Portal</span>}
          </Link>

          <Link
            href="/sign-out"
            className={`flex items-center rounded-xl text-xs font-medium text-on-surface-variant hover:text-red-600 hover:bg-red-500/10 transition-colors ${
              isCollapsed ? "justify-center p-3" : "gap-3 px-3 py-2"
            }`}
            title="Sign Out"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </Link>
        </div>
      </aside>

      {/* =========================================================
          MOBILE SLIDE-OVER DRAWER (Responsive Sheet)
          ========================================================= */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop Blur */}
          <div 
            onClick={() => setMobileDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />

          {/* Drawer Sheet */}
          <div className="relative w-[280px] max-w-[85vw] h-full bg-surface border-r border-outline-variant p-5 shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-250">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 mb-3 border-b border-outline-variant/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-on-surface leading-tight">Admin Central</h2>
                  <p className="text-[10px] text-on-surface-variant">System Navigation</p>
                </div>
              </div>

              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav list */}
            <nav className="flex-1 overflow-y-auto space-y-1 pr-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = link.href === "/admin" 
                  ? pathname === "/admin" 
                  : pathname === link.href || pathname.startsWith(link.href + "/");

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? "bg-primary text-white shadow-md shadow-primary/20"
                        : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{link.label}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white ml-auto shrink-0 shadow-xs animate-pulse" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-outline-variant/60 space-y-2 mt-auto">
              <Link
                href="/dashboard"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Portal</span>
              </Link>
              <Link
                href="/sign-out"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MAIN APPLICATION AREA (Responsive Layout)
          ========================================================= */}
      <div 
        className={`flex-1 flex flex-col min-h-screen min-w-0 ${
          isResizing ? "" : "transition-all duration-200 ease-out"
        } md:ml-[var(--sidebar-width)]`}
      >
        {/* Top Header */}
        <header className="sticky top-0 z-20 h-16 bg-surface/95 backdrop-blur-md border-b border-outline-variant/80 flex items-center justify-between px-4 sm:px-6">
          {/* Mobile: Hamburger Menu + Logo */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="p-2 rounded-xl bg-surface-container border border-outline-variant text-on-surface hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Open Navigation Drawer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-primary tracking-tight">Admin Central</span>
            </div>
          </div>

          {/* Desktop: Quick Search */}
          <div className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-full py-2 pl-10 pr-4 text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Search telemetry, KRA records, logs, users..."
              />
            </div>
          </div>

          {/* Right Header Badges & Actions */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-on-surface-variant bg-surface-container hover:bg-surface-container-high transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Client Portal</span>
            </Link>

            <Link
              href="/admin/system-logs"
              className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-xl transition-colors relative"
              title="System Logs & Telemetry"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full animate-pulse" />
            </Link>

            {user?.imageUrl && (
              <img
                src={user.imageUrl}
                alt="Admin Profile"
                className="w-8 h-8 rounded-full border border-outline-variant object-cover ml-1 shadow-xs"
              />
            )}
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-3 sm:p-6 md:p-8 overflow-y-auto bg-surface-bright min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
