'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { useUser } from '@clerk/nextjs'
import { 
  LayoutDashboard, 
  FileText, 
  Send, 
  CheckSquare, 
  History, 
  User,
  Hash,
  Shield
} from "lucide-react";
import Link from 'next/link';

export function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isSignedIn, isLoaded, user } = useUser()
  
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
    <div className="flex flex-col min-h-screen bg-background text-on-background">
      <SiteHeader />
      <div className="flex-grow flex pt-16">
        {showSidebar && (
          <aside className="hidden lg:flex flex-col w-64 bg-surface-container-lowest border-r border-outline-variant h-[calc(100vh-4rem)] fixed left-0 overflow-y-auto z-40 mt-16">
            <div className="p-4 flex flex-col gap-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname?.startsWith(link.href));
                const Icon = link.icon;
                
                return (
                  <Link 
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ease-in-out ${
                      isActive 
                        ? 'bg-primary-container text-on-primary-container font-medium' 
                        : 'text-on-surface hover:bg-surface-container hover:text-primary'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium text-sm">{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </aside>
        )}
        <main className={`flex-grow flex flex-col justify-start px-4 md:px-8 py-8 w-full min-h-[calc(100vh-4rem)] ${showSidebar ? 'lg:ml-64' : ''}`}>
          {children}
        </main>
      </div>
      <SiteFooter />
    </div>
  )
}
