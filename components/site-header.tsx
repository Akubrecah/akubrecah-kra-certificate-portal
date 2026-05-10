"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { 
  UserButton, 
  useUser,
  useClerk
} from "@clerk/nextjs"
import { cn } from "@/lib/utils"

const navItems = [
  { name: "HOME", href: "/" },
  { name: "RETRIEVAL", href: "/portal" },
  { name: "SECURITY", href: "/security" },
  { name: "BLOGS", href: "/blog" },
  { name: "FAQS", href: "/faq" },
  { name: "ABOUT", href: "/about" },
]

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isLoaded } = useUser()

  // Check if user is admin
  const isAdmin = user?.publicMetadata?.role === 'admin'

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5 py-3">
      <div className="container mx-auto max-w-3xl px-4 flex flex-col items-center gap-3">
        {/* Row 1: Logo */}
        <Link href="/" className="group">
          <Logo width={180} height={54} className="transition-transform group-hover:scale-105" />
        </Link>

        {/* Row 2: Navigation & Actions */}
        <nav className="flex flex-wrap items-center justify-center gap-1.5 w-full">
          {navItems.map((item) => (
            <Link key={item.name} href={item.href}>
              <Button 
                variant="ghost" 
                className={cn(
                  "h-7 px-3 text-[9px] font-bold tracking-[0.15em] uppercase rounded-full transition-all",
                  pathname === item.href 
                    ? "bg-primary/10 text-primary" 
                    : "text-foreground/60 hover:text-foreground hover:bg-white/5"
                )}
              >
                {item.name}
              </Button>
            </Link>
          ))}

          {/* User / Auth Actions */}
          <div className="flex items-center gap-1.5 ml-1 pl-1 border-l border-white/10">
            <ThemeToggle />
            
            {isLoaded && user ? (
              <div className="flex items-center gap-1.5">
                {isAdmin && (
                  <Button 
                    variant="outline"
                    className="h-7 px-3 rounded-full border-primary/20 text-primary font-bold uppercase tracking-widest text-[8px] hover:bg-primary/5"
                    onClick={() => router.push("/admin/dashboard")}
                  >
                    ADMIN
                  </Button>
                )}
                <UserButton afterSignOutUrl="/" />
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Button 
                  variant="ghost"
                  className="h-7 px-3 rounded-full text-foreground/60 font-bold uppercase tracking-widest text-[8px] hover:text-foreground"
                  onClick={() => router.push("/sign-in")}
                >
                  LOGIN
                </Button>
                <Button 
                  className="h-7 px-4 rounded-full bg-primary text-white font-bold uppercase tracking-widest text-[8px] shadow-none hover:opacity-90"
                  onClick={() => router.push("/sign-up")}
                >
                  JOIN
                </Button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}