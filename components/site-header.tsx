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

const navItems = [
  { name: "HOME", href: "/" },
  { name: "KRA CERTIFICATE", href: "/retrieval-portal" },
  { name: "CHANGE PARTICULARS", href: "/change-particulars" },
]

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { isLoaded, isSignedIn } = useUser()

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border py-4">
      <div className="container mx-auto max-w-7xl px-6 flex flex-col items-center gap-4">
        {/* Row 1: Logo */}
        <Link href="/" className="group flex items-center gap-4">
          <div className="relative">
            <Logo width={360} height={108} className="transition-transform duration-500 group-hover:scale-105" />
            <span className="absolute -top-2 -right-12 bg-primary/20 text-primary text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter border border-primary/30 backdrop-blur-md">BETA</span>
          </div>
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
                    : "text-foreground hover:text-primary hover:bg-primary/5"
                )}
              >
                {item.name}
              </Button>
            </Link>
          ))}

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
  )
}