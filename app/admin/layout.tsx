"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

const navLinks = [
  { href: "/admin/system-health", label: "System Health", icon: "monitor_heart" },
  { href: "/admin/user-management", label: "User Management", icon: "group" },
  { href: "/admin/role-access", label: "Role Access", icon: "admin_panel_settings" },
  { href: "/admin/system-logs", label: "System Logs", icon: "terminal" },
  { href: "/admin/global-config", label: "Global Config", icon: "settings_input_component" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isResizing, setIsResizing] = useState(false);

  // Load and persist sidebar state (collapsed & width)
  useEffect(() => {
    setIsMounted(true);
    const storedCollapsed = localStorage.getItem("admin-sidebar-collapsed");
    if (storedCollapsed) {
      setIsCollapsed(storedCollapsed === "true");
    } else {
      const width = window.innerWidth;
      if (width >= 768 && width < 1024) {
        setIsCollapsed(true); // Slim on tablets by default
      }
    }

    const storedWidth = localStorage.getItem("admin-sidebar-width");
    if (storedWidth) {
      setSidebarWidth(parseInt(storedWidth, 10));
    } else {
      const defaultWidth = Math.min(Math.max(window.innerWidth * 0.18, 220), 320);
      setSidebarWidth(defaultWidth);
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

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const clientX = e.clientX;
      const minW = Math.max(180, window.innerWidth * 0.12);
      const maxW = Math.min(450, window.innerWidth * 0.30);
      if (clientX >= minW && clientX <= maxW) {
        setSidebarWidth(clientX);
        localStorage.setItem("admin-sidebar-width", String(clientX));
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const clientX = e.touches[0].clientX;
      const minW = Math.max(180, window.innerWidth * 0.12);
      const maxW = Math.min(450, window.innerWidth * 0.30);
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

  // Show loading while auth details are fetching
  if (!isLoaded) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-container-lowest text-on-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-sm font-medium text-on-surface-variant animate-pulse">Checking authorization...</p>
        </div>
      </div>
    );
  }

  // Enforce Super Admin check (dynamic configuration & Clerk metadata roles)
  const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
  const userRole = user?.publicMetadata?.role as string;
  const configPublicAdminEmail = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "poweldayck@gmail.com").toLowerCase();

  const isSuperAdmin = 
    userEmail === "poweldayck@gmail.com" || 
    userEmail === configPublicAdminEmail ||
    userRole === "Super Admin" ||
    userRole === "Admin";
  
  console.log("[Admin Authorization]", {
    userEmail,
    userRole,
    isSuperAdmin,
    userId: user?.id
  });

  if (!isSuperAdmin) {
    if (typeof window !== "undefined") {
      router.push("/dashboard");
    }
    return null;
  }

  return (
    <div 
      className="min-h-screen flex bg-surface-container-lowest text-on-surface font-sans"
      style={{
        ["--sidebar-width" as any]: isCollapsed ? "80px" : `${sidebarWidth}px`
      }}
    >


      {/* Resizing Guide HUD & Info Pill */}
      {isResizing && (
        <>
          {/* Transparent full-screen overlay to lock cursor style during drag */}
          <div className="fixed inset-0 cursor-col-resize z-50 select-none pointer-events-auto" />
          
          {/* Vertical guide line */}
          <div 
            className="fixed top-0 bottom-0 w-[2px] bg-primary/70 z-50 pointer-events-none"
            style={{ left: `${sidebarWidth}px` }}
          />

          {/* Width info pill */}
          <div 
            className="fixed top-1/3 z-50 bg-neutral-950 text-white font-mono text-xs px-3.5 py-2.5 rounded-xl shadow-2xl flex flex-col gap-0.5 select-none pointer-events-none -translate-x-1/2"
            style={{ left: `${sidebarWidth}px` }}
          >
            <span className="font-bold text-[10px] text-zinc-400 uppercase tracking-wider">Sidebar Width</span>
            <span className="text-white font-black">{sidebarWidth}px</span>
            <span className="text-primary text-[10px] font-bold">
              {typeof window !== 'undefined' ? Math.round((sidebarWidth / window.innerWidth) * 100) : 0}% of screen
            </span>
          </div>
        </>
      )}

      {/* Desktop / Tablet Sidebar */}
      <nav 
        className={`hidden md:flex flex-col fixed left-0 top-0 h-full bg-surface border-r border-outline-variant z-20 py-6 select-none overflow-hidden ${
          isResizing ? "" : "transition-all duration-300 ease-in-out"
        } ${
          isCollapsed ? "px-3" : "px-4"
        }`}
        style={{ width: "var(--sidebar-width)" }}
      >
        {/* Draggable Resize Handle */}
        {!isCollapsed && (
          <div
            onMouseDown={startResizing}
            onTouchStart={startResizing}
            onDoubleClick={resetWidth}
            className={`absolute top-0 right-0 w-1 h-full cursor-col-resize z-30 transition-colors ${
              isResizing ? "bg-primary" : "hover:bg-primary/40 bg-transparent"
            }`}
            title="Drag to resize, double-click to reset"
          />
        )}

        {/* Toggle Expand/Collapse Button (Modern SaaS style border trigger) */}
        <button
          onClick={toggleSidebar}
          className="absolute top-8 -right-3 w-6 h-6 rounded-full border border-outline-variant bg-surface shadow-md flex items-center justify-center cursor-pointer hover:bg-surface-container-high transition-all duration-200 z-30 text-on-surface-variant hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span className="material-symbols-outlined text-[16px] font-bold">
            {isCollapsed ? "chevron_right" : "chevron_left"}
          </span>
        </button>

        {/* Logo block */}
        <div className={`mb-8 px-2 flex items-center gap-3 transition-all duration-300 ${isCollapsed ? "justify-center" : ""}`}>
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-white shadow-sm flex items-center justify-center shrink-0 border border-outline-variant">
            <span className="material-symbols-outlined text-primary text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              admin_panel_settings
            </span>
          </div>
          <div className={`transition-all duration-300 min-w-0 ${isCollapsed ? "opacity-0 w-0 overflow-hidden pointer-events-none absolute" : "opacity-100"}`}>
            <h1 className="text-base font-extrabold text-primary tracking-tight leading-tight whitespace-nowrap">Admin Central</h1>
            <p className="text-[10px] text-on-surface-variant whitespace-nowrap">System Management v2.1</p>
          </div>
        </div>

        {/* New Audit Button */}
        <div className="mb-6 px-1">
          {isCollapsed ? (
            <button
              className="w-12 h-12 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center shadow-soft relative group focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="New System Audit"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              {/* Tooltip for collapsed mode */}
              <span 
                role="tooltip"
                className="absolute left-full ml-3 opacity-0 pointer-events-none group-hover:opacity-100 group-focus:opacity-100 transition-all duration-200 bg-neutral-950 text-white text-[10px] px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap z-50 flex items-center gap-1.5 before:content-[''] before:absolute before:right-full before:top-1/2 before:-translate-y-1/2 before:border-4 before:border-transparent before:border-r-neutral-950"
              >
                New System Audit
              </span>
            </button>
          ) : (
            <button className="w-full bg-primary text-white text-sm font-bold py-2.5 px-4 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-soft whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary">
              <span className="material-symbols-outlined text-[18px]">add</span>
              New System Audit
            </button>
          )}
        </div>

        {/* Nav Links */}
        <ul className="flex flex-col gap-1 flex-grow">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname?.startsWith(link.href + "/");
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`flex items-center rounded-xl transition-all duration-200 text-sm font-medium group relative focus:outline-none focus:ring-2 focus:ring-primary ${
                    isCollapsed ? "justify-center p-3" : "gap-3 px-3 py-2.5"
                  } ${
                    isActive
                      ? "bg-primary text-white font-bold"
                      : "text-on-surface-variant hover:bg-surface-container-highest"
                  }`}
                  aria-label={link.label}
                >
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {link.icon}
                  </span>
                  
                  <span className={`transition-all duration-200 truncate whitespace-nowrap ${isCollapsed ? "opacity-0 w-0 overflow-hidden pointer-events-none absolute" : "opacity-100"}`}>
                    {link.label}
                  </span>
                  
                  {/* Tooltip for collapsed mode */}
                  {isCollapsed && (
                    <span 
                      role="tooltip"
                      className="absolute left-full ml-3 opacity-0 pointer-events-none group-hover:opacity-100 group-focus:opacity-100 transition-all duration-200 bg-neutral-950 text-white text-[10px] px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap z-50 flex items-center gap-1.5 before:content-[''] before:absolute before:right-full before:top-1/2 before:-translate-y-1/2 before:border-4 before:border-transparent before:border-r-neutral-950"
                    >
                      {link.label}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Footer */}
        <div className="mt-auto border-t border-outline-variant pt-4 flex flex-col gap-1">
          <Link
            href="/dashboard"
            className={`flex items-center rounded-xl transition-all duration-200 text-sm group relative focus:outline-none focus:ring-2 focus:ring-primary ${
              isCollapsed ? "justify-center p-3" : "gap-3 px-3 py-2.5"
            } text-on-surface-variant hover:bg-surface-container-highest`}
            aria-label="Back to Portal"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            <span className={`transition-all duration-200 truncate whitespace-nowrap ${isCollapsed ? "opacity-0 w-0 overflow-hidden pointer-events-none absolute" : "opacity-100"}`}>
              Back to Portal
            </span>
            
            {/* Tooltip for collapsed mode */}
            {isCollapsed && (
              <span 
                role="tooltip"
                className="absolute left-full ml-3 opacity-0 pointer-events-none group-hover:opacity-100 group-focus:opacity-100 transition-all duration-200 bg-neutral-950 text-white text-[10px] px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap z-50 flex items-center gap-1.5 before:content-[''] before:absolute before:right-full before:top-1/2 before:-translate-y-1/2 before:border-4 before:border-transparent before:border-r-neutral-950"
              >
                Back to Portal
              </span>
            )}
          </Link>
          <Link
            href="/sign-out"
            className={`flex items-center rounded-xl transition-all duration-200 text-sm mt-1 group relative focus:outline-none focus:ring-2 focus:ring-primary ${
              isCollapsed ? "justify-center p-3" : "gap-3 px-3 py-2.5"
            } text-on-surface-variant hover:bg-surface-container-highest`}
            aria-label="Sign Out"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className={`transition-all duration-200 truncate whitespace-nowrap ${isCollapsed ? "opacity-0 w-0 overflow-hidden pointer-events-none absolute" : "opacity-100"}`}>
              Sign Out
            </span>
            
            {/* Tooltip for collapsed mode */}
            {isCollapsed && (
              <span 
                role="tooltip"
                className="absolute left-full ml-3 opacity-0 pointer-events-none group-hover:opacity-100 group-focus:opacity-100 transition-all duration-200 bg-neutral-950 text-white text-[10px] px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap z-50 flex items-center gap-1.5 before:content-[''] before:absolute before:right-full before:top-1/2 before:-translate-y-1/2 before:border-4 before:border-transparent before:border-r-neutral-950"
              >
                Sign Out
              </span>
            )}
          </Link>
        </div>
      </nav>

      {/* Main content */}
      <div 
        className={`flex-1 flex flex-col min-h-screen ml-0 ${
          isResizing ? "" : "transition-all duration-300 ease-in-out"
        } md:ml-[var(--sidebar-width)]`}
      >
        {/* Top Header */}
        <header className="sticky top-0 z-10 h-16 bg-surface border-b border-outline-variant flex items-center justify-between px-4 md:px-6">
          {/* Mobile Logo on left */}
          <div className="flex items-center gap-2.5 md:hidden">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-white shadow-sm flex items-center justify-center border border-outline-variant shrink-0">
              <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                admin_panel_settings
              </span>
            </div>
            <span className="text-xs font-black text-primary uppercase tracking-wider">Admin Central</span>
          </div>

          <div className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
              <input
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-full py-2 pl-10 pr-4 text-sm text-on-surface placeholder-on-surface-variant/60 focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Search logs, users, IDs..."
              />
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto animate-fade-in">
            <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-primary">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full" />
            </button>
            <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors hidden sm:block focus:outline-none focus:ring-2 focus:ring-primary">
              <span className="material-symbols-outlined">help</span>
            </button>
            <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors hidden sm:block focus:outline-none focus:ring-2 focus:ring-primary">
              <span className="material-symbols-outlined">settings</span>
            </button>
            {user?.imageUrl && (
              <img
                src={user.imageUrl}
                alt="Admin"
                className="w-9 h-9 rounded-full border border-outline-variant ml-2 object-cover cursor-pointer"
              />
            )}
          </div>
        </header>

        <div className="md:hidden w-full bg-surface border-b border-outline-variant relative">
          <div className="px-4 py-2.5 flex flex-col">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex items-center gap-2 text-sm font-bold text-on-surface hover:text-primary transition-colors py-1 focus:outline-none w-max"
            >
              <span className="material-symbols-outlined text-[20px]">menu</span>
              <span>Menu</span>
            </button>
            
            {/* Collapsible content (links list) */}
            {mobileOpen && (
              <ul className="flex flex-col gap-1 mt-2.5 pb-1 animate-in fade-in duration-200">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href || pathname?.startsWith(link.href + "/");
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium ${
                          isActive
                            ? "bg-primary text-white font-bold"
                            : "text-on-surface hover:bg-surface-container-high"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                        <span>{link.label}</span>
                      </Link>
                    </li>
                  );
                })}
                {/* Back to Portal */}
                <li className="border-t border-outline-variant/60 mt-1 pt-1.5">
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium text-on-surface-variant hover:bg-surface-container-high"
                  >
                    <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                    <span>Back to Portal</span>
                  </Link>
                </li>
                {/* Sign Out */}
                <li>
                  <Link
                    href="/sign-out"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium text-on-surface-variant hover:bg-surface-container-high"
                  >
                    <span className="material-symbols-outlined text-[20px]">logout</span>
                    <span>Sign Out</span>
                  </Link>
                </li>
              </ul>
            )}
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-surface-bright">
          {children}
        </main>
      </div>
    </div>
  );
}
