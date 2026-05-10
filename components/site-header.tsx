"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { 
  UserButton, 
  useUser
} from "@clerk/nextjs"
import { cn } from "@/lib/utils"
import { isAdminUser } from "@/lib/admin-config"
import { ArrowLeft } from "lucide-react"

const navItems = [
  { name: "HOME", href: "/" },
  { name: "KRA CERTIFICATE", href: "/retrieval-portal" },
  { name: "SECURITY", href: "/security" },
  { name: "BLOGS", href: "/blog" },
  { name: "FAQS", href: "/faq" },
  { name: "CAREERS", href: "/careers", highlight: true },
  { name: "ABOUT", href: "/about" },
]

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isLoaded, isSignedIn } = useUser()

  // Check if user is admin using the central utility
  const isAdmin = isAdminUser(user)

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border py-4">
      <div className="container mx-auto max-w-7xl px-6 flex flex-col items-center gap-4">
        {/* Row 1: Logo */}
        <Link href="/" className="group">
          <Logo width={360} height={108} className="transition-transform duration-500 group-hover:scale-105" />
        </Link>

        {/* Row 2: Navigation & Actions */}
        <nav className="flex flex-wrap items-center justify-center gap-1.5 w-full">
          {navItems.map((item) => (
            <Link key={item.name} href={item.href}>
              <Button 
                variant="ghost" 
                className={cn(
                  "h-8 px-4 text-[10px] font-extrabold tracking-[0.2em] uppercase rounded-full transition-all",
                  pathname === item.href 
                    ? "bg-primary/15 text-primary shadow-sm" 
                    : item.name === "CAREERS"
                    ? "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20"
                    : "text-foreground hover:text-primary hover:bg-primary/5"
                )}
              >
                {item.name}
              </Button>
            </Link>
          ))}

          {/* Special Disabled Return Button */}
          <Button 
            disabled 
            variant="outline"
            className="h-8 px-4 text-[10px] font-extrabold tracking-[0.2em] uppercase rounded-full opacity-40 grayscale cursor-not-allowed border-white/10"
          >
            FILE RETURN
          </Button>

          {/* Conditional Dashboard Access */}
          {isLoaded && isSignedIn && (
            <Link href="/dashboard">
              <Button 
                variant="outline"
                className={cn(
                  "h-8 px-5 rounded-full font-black uppercase tracking-[0.2em] text-[9px] hover:bg-primary/10 hover:text-primary transition-all",
                  pathname === "/dashboard" ? "bg-primary/15 text-primary border-primary/20" : "border-border"
                )}
              >
                DASHBOARD
              </Button>
            </Link>
          )}

          {/* Conditional Admin Access */}
          {isLoaded && isSignedIn && isAdmin && (
            <Link href="/admin/dashboard">
              <Button 
                variant="default"
                className="h-8 px-5 rounded-full bg-accent text-accent-foreground font-black uppercase tracking-[0.2em] text-[9px] hover:opacity-90 shadow-lg shadow-accent/20"
              >
                ADMIN PANEL
              </Button>
            </Link>
          )}

          {/* User / Auth Actions */}
          <div className="flex items-center gap-1.5 ml-1 pl-1 border-l border-border">
            <ThemeToggle />
            
            {isLoaded && isSignedIn ? (
              <div className="flex items-center gap-1.5">
                <UserButton />
              </div>
            ) : isLoaded ? (
              <div className="flex items-center gap-1.5">
                <Button 
                  variant="ghost"
                  className="h-7 px-3 rounded-full text-foreground/80 font-bold uppercase tracking-widest text-[8px] hover:text-foreground"
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
            ) : null}
          </div>
        </nav>
      </div>
    </header>
  );
}