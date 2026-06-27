'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { useUser } from '@clerk/nextjs'
import { 
  LayoutDashboard, 
  Send, 
  User,
  Hash,
  Shield,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from "lucide-react";
import Link from 'next/link';

export function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isSignedIn, isLoaded, user } = useUser()
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isResizing, setIsResizing] = useState(false);

  // Load and persist sidebar state (collapsed & width)
  useEffect(() => {
    setIsMounted(true);
    const storedCollapsed = localStorage.getItem("main-sidebar-collapsed");
    if (storedCollapsed) {
      setIsCollapsed(storedCollapsed === "true");
    } else {
      const width = window.innerWidth;
      if (width >= 768 && width < 1024) {
        setIsCollapsed(true); // Slim on tablets by default
      }
    }

    const storedWidth = localStorage.getItem("main-sidebar-width");
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
    localStorage.setItem("main-sidebar-collapsed", String(next));
  };

  const startResizing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const resetWidth = () => {
    const defaultWidth = 256;
    setSidebarWidth(defaultWidth);
    localStorage.setItem("main-sidebar-width", String(defaultWidth));
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const clientX = e.clientX;
      const minW = Math.max(180, window.innerWidth * 0.12);
      const maxW = Math.min(450, window.innerWidth * 0.30);
      if (clientX >= minW && clientX <= maxW) {
        setSidebarWidth(clientX);
        localStorage.setItem("main-sidebar-width", String(clientX));
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const clientX = e.touches[0].clientX;
      const minW = Math.max(180, window.innerWidth * 0.12);
      const maxW = Math.min(450, window.innerWidth * 0.30);
      if (clientX >= minW && clientX <= maxW) {
        setSidebarWidth(clientX);
        localStorage.setItem("main-sidebar-width", String(clientX));
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
  
  const isAuthPage = pathname?.startsWith('/sign-in') || pathname?.startsWith('/sign-up') || pathname?.startsWith('/onboarding') || pathname?.startsWith('/admin')

  useEffect(() => {
    // Check for onboarding completion only on dashboard routes
    if (pathname?.startsWith('/dashboard')) {
      const hasCompleted = localStorage.getItem('hasCompletedOnboarding')
      if (!hasCompleted) {
        router.push('/onboarding')
      }
    }
  }, [pathname, router])

  if (isAuthPage) {
    return <main className="flex-grow flex w-full">{children}</main>
  }

  const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
  const userRole = user?.publicMetadata?.role as string;
  const configPublicAdminEmail = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "poweldayck@gmail.com").toLowerCase();

  const isAdmin = 
    userEmail === "poweldayck@gmail.com" || 
    userEmail === configPublicAdminEmail ||
    userRole === "Super Admin" ||
    userRole === "Admin";

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/filing", label: "File Returns", icon: Send },
    { href: "/retrieval-portal", label: "KRA Certificate", icon: Hash },
    { href: "/dashboard/profile", label: "Profile", icon: User },
    ...(isAdmin ? [{ href: "/admin/system-health", label: "Admin Central", icon: Shield }] : []),
  ];

  const showSidebar = isLoaded && isSignedIn

  return (
    <div 
      className="flex flex-col min-h-screen bg-background text-on-background"
      style={{
        ["--main-sidebar-width" as any]: isCollapsed ? "80px" : `${sidebarWidth}px`
      }}
    >
      <SiteHeader />

      {/* Resizing Guide HUD & Info Pill */}
      {isMounted && isResizing && (
        <>
          {/* Transparent full-screen overlay to lock cursor style during drag */}
          <div className="fixed inset-0 cursor-col-resize z-50 select-none pointer-events-auto" />
          
          {/* Vertical guide line */}
          <div 
            className="fixed top-16 bottom-0 w-[2px] bg-primary/70 z-50 pointer-events-none"
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

      <div className="flex-grow flex pt-16 flex-col">
        {showSidebar && (
          <div className="md:hidden w-full bg-surface-container-low border-b border-outline-variant relative">
            <div className="px-4 py-2.5 flex flex-col">
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="flex items-center justify-between px-4 py-2 bg-surface-container border border-outline-variant rounded-xl text-sm font-bold text-on-surface hover:bg-surface-container-high transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">menu</span>
                  <span>Menu</span>
                </div>
                <span className="material-symbols-outlined text-[18px] transition-transform duration-200" style={{ transform: mobileOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  expand_more
                </span>
              </button>
              
              {/* Collapsible content (links list) */}
              {mobileOpen && (
                <ul className="flex flex-col gap-1 mt-2.5 pb-1 animate-in fade-in duration-200">
                  {navLinks.map((link) => {
                    const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname?.startsWith(link.href));
                    const Icon = link.icon;
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
                          <Icon className="h-5 w-5 shrink-0" />
                          <span>{link.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}

        <div className="flex-grow flex w-full">
        {showSidebar && (
          <aside 
            className={`hidden md:flex flex-col bg-surface-container-lowest border-r border-outline-variant h-[calc(100vh-4rem)] fixed left-0 top-16 overflow-hidden z-40 select-none ${
              isResizing ? "" : "transition-all duration-300 ease-in-out"
            } ${isCollapsed ? "px-3 py-4" : "p-4"}`}
            style={{ width: "var(--main-sidebar-width)" }}
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

            {/* Toggle Expand/Collapse Button */}
            <button
              onClick={toggleSidebar}
              className="absolute top-4 -right-3 w-6 h-6 rounded-full border border-outline-variant bg-background shadow-md flex items-center justify-center cursor-pointer hover:bg-surface-container-high transition-all duration-200 z-30 text-on-surface-variant hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>

            <div className="flex flex-col gap-2 w-full">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname?.startsWith(link.href));
                const Icon = link.icon;
                
                return (
                  <Link 
                    key={link.href}
                    href={link.href}
                    className={`flex items-center rounded-lg transition-colors duration-200 ease-in-out group relative focus:outline-none focus:ring-2 focus:ring-primary ${
                      isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3"
                    } ${
                      isActive 
                        ? 'bg-primary-container text-on-primary-container font-medium' 
                        : 'text-on-surface hover:bg-surface-container hover:text-primary'
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className={`transition-all duration-200 whitespace-nowrap text-sm ${isCollapsed ? "opacity-0 w-0 overflow-hidden pointer-events-none absolute" : "opacity-100"}`}>
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
                );
              })}
            </div>
          </aside>
        )}
        <main 
          className={`flex-grow flex flex-col justify-start px-4 md:px-8 py-8 w-full min-h-[calc(100vh-4rem)] ${
            isResizing ? "" : "transition-all duration-300 ease-in-out"
          } ${showSidebar ? 'md:ml-[var(--main-sidebar-width)]' : ''}`}
        >
          {children}
        </main>
      </div>
      </div>
      <SiteFooter />
    </div>
  )
}
