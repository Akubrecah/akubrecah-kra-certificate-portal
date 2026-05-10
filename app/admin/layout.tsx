"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  BarChart3, 
  Users, 
  FileText, 
  CreditCard, 
  Users2, 
  FileArchive,
  Settings,
  Home,
  Menu,
  Plus,
  X,
  LineChart,
  ActivitySquare
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { AdminNavbar } from "@/components/admin/navbar"
import { useUser } from "@clerk/nextjs"
import { isAdminUser } from "@/lib/admin-config"
import { Logo } from "@/components/logo"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  {
    title: "Overview",
    href: "/admin/dashboard",
    icon: BarChart3,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Returns",
    href: "/admin/returns",
    icon: FileText,
  },
  {
    title: "Transactions",
    href: "/admin/transactions",
    icon: CreditCard,
  },
  {
    title: "Partners",
    href: "/admin/partners",
    icon: Users2,
  },
  {
    title: "Documents",
    href: "/admin/documents",
    icon: FileArchive,
  },
  {
    title: "Reports",
    href: "/admin/reports",
    icon: LineChart,
  },
  {
    title: "Activity Log",
    href: "/admin/activity",
    icon: ActivitySquare,
  },
  {
    title: "Blog",
    href: "/admin/blog",
    icon: FileText,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { user, isLoaded } = useUser()
  const router = useRouter()
  
  useEffect(() => {
    if (isLoaded && !isAdminUser(user)) {
      router.push("/")
    }
  }, [isLoaded, user, router])

  if (!isLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAdminUser(user)) {
    return null
  }
  
  return (
    <div className="flex flex-col w-full">
      {/* Admin Horizontal Nav - Always Visible & Centered */}
      <div className="w-full border-b border-white/5 bg-background/50 backdrop-blur-xl sticky top-[100px] z-40 py-2">
        <div className="container mx-auto max-w-7xl px-4">
          <nav className="flex flex-wrap items-center justify-center gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 h-8 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all shrink-0",
                    isActive 
                      ? "bg-primary text-white shadow-lg shadow-primary/20" 
                      : "text-foreground/60 hover:text-foreground hover:bg-white/5"
                  )}
                >
                  <item.icon className="h-3 w-3" />
                  <span className="whitespace-nowrap">{item.title}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Admin Content Area */}
      <div className="w-full py-8">
        {children}
      </div>
    </div>
  )
}

function MobileNav({ 
  items, 
  pathname,
  onNavClick
}: { 
  items: NavItem[]
  pathname: string | null
  onNavClick: () => void
}) {
  return items.map((item) => (
    <Link
      key={item.href}
      href={item.href}
      onClick={onNavClick}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
        pathname && pathname === item.href
          ? "bg-primary text-primary-foreground"
          : "hover:bg-muted hover:text-foreground"
      )}
    >
      <item.icon className="h-5 w-5" />
      {item.title}
    </Link>
  ))
}

function DesktopNav({ 
  items, 
  pathname 
}: { 
  items: NavItem[]
  pathname: string | null
}) {
  return items.map((item) => (
    <Link
      key={item.href}
      href={item.href}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
        pathname && pathname === item.href
          ? "bg-primary text-primary-foreground"
          : "hover:bg-muted hover:text-foreground"
      )}
    >
      <item.icon className="h-5 w-5" />
      {item.title}
    </Link>
  ))
}
