"use client";

import { useState } from "react";
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

  // Show loading while auth details are fetching
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest text-on-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-sm font-medium text-on-surface-variant animate-pulse">Checking authorization...</p>
        </div>
      </div>
    );
  }

  // Enforce Super Admin email check (case-insensitive)
  const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
  const isSuperAdmin = userEmail === "poweldayck@gmail.com";
  
  console.log("[Admin Authorization]", {
    userEmail,
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
    <div className="min-h-screen flex bg-surface-container-lowest text-on-surface font-sans">
      {/* Mobile Drawer Navigation */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer Body */}
          <nav className="relative flex flex-col w-64 max-w-xs bg-surface-container h-full py-6 px-4 z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Header / Logo */}
            <div className="mb-6 px-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl overflow-hidden bg-white shadow-sm flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    admin_panel_settings
                  </span>
                </div>
                <div>
                  <h1 className="text-sm font-extrabold text-primary tracking-tight leading-tight">Admin Central</h1>
                  <p className="text-[10px] text-on-surface-variant">v2.1</p>
                </div>
              </div>
              <button 
                onClick={() => setMobileOpen(false)}
                className="p-1 rounded-lg hover:bg-surface-container-highest transition-colors text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Nav Links */}
            <ul className="flex flex-col gap-1 flex-grow">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || pathname?.startsWith(link.href + "/");
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${
                        isActive
                          ? "bg-primary text-white font-bold"
                          : "text-on-surface-variant hover:bg-surface-container-highest"
                      }`}
                    >
                      <span
                        className="material-symbols-outlined text-[20px]"
                        style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                      >
                        {link.icon}
                      </span>
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Footer */}
            <div className="mt-auto border-t border-outline-variant pt-4">
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-on-surface-variant hover:bg-surface-container-highest rounded-xl transition-all text-sm"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                Back to Portal
              </Link>
              <Link
                href="/sign-out"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-on-surface-variant hover:bg-surface-container-highest rounded-xl transition-all text-sm mt-1"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
                Sign Out
              </Link>
            </div>
          </nav>
        </div>
      )}

      {/* Desktop Sidebar */}
      <nav className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 bg-surface-container border-r border-outline-variant z-20 py-6 px-4">
        {/* Logo */}
        <div className="mb-8 px-2 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-white shadow-sm flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              admin_panel_settings
            </span>
          </div>
          <div>
            <h1 className="text-base font-extrabold text-primary tracking-tight leading-tight">Admin Central</h1>
            <p className="text-xs text-on-surface-variant">System Management v2.1</p>
          </div>
        </div>

        {/* New Audit Button */}
        <button className="mb-6 w-full bg-primary text-white text-sm font-bold py-2.5 px-4 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[18px]">add</span>
          New System Audit
        </button>

        {/* Nav Links */}
        <ul className="flex flex-col gap-1 flex-grow">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname?.startsWith(link.href + "/");
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${
                    isActive
                      ? "bg-primary text-white font-bold"
                      : "text-on-surface-variant hover:bg-surface-container-highest"
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {link.icon}
                  </span>
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Footer */}
        <div className="mt-auto border-t border-outline-variant pt-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 text-on-surface-variant hover:bg-surface-container-highest rounded-xl transition-all text-sm"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            Back to Portal
          </Link>
          <Link
            href="/sign-out"
            className="flex items-center gap-3 px-3 py-2.5 text-on-surface-variant hover:bg-surface-container-highest rounded-xl transition-all text-sm mt-1"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Sign Out
          </Link>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-10 h-16 bg-surface border-b border-outline-variant flex items-center justify-between px-4 md:px-6">
          {/* Hamburger Menu Button */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 -ml-1 mr-2 text-on-surface-variant hover:bg-surface-container-low rounded-xl transition-colors shrink-0"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>

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
            <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full" />
            </button>
            <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors hidden sm:block">
              <span className="material-symbols-outlined">help</span>
            </button>
            <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors hidden sm:block">
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

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-surface-bright">
          {children}
        </main>
      </div>
    </div>
  );
}
