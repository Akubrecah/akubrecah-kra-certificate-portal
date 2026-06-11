"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { motion } from "framer-motion"
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
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header className={cn(
      "sticky top-0 left-0 right-0 z-50 transition-all duration-300",
      scrolled 
        ? "bg-background/90 backdrop-blur-xl border-b border-border/80 py-2.5 shadow-lg shadow-black/5" 
        : "bg-background/95 backdrop-blur-xl border-b border-border py-4"
    )}>
      <div className="container mx-auto max-w-7xl px-6 flex flex-col items-center gap-3">
        {/* Row 1: Logo with entrance spring */}
        <motion.div
          initial={{ opacity: 0, y: -5, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 120, damping: 14 }}
        >
          <Link href="/" className="group flex items-center gap-4">
            <div className="relative">
              <Logo width={360} height={108} className="transition-transform duration-500 group-hover:scale-[1.02]" />
              <span className="absolute -top-2 -right-12 bg-primary/20 text-primary text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter border border-primary/30 backdrop-blur-md">BETA</span>
            </div>
          </Link>
        </motion.div>

        {/* Row 2: Navigation & Actions */}
        <nav className="flex flex-wrap items-center justify-center gap-2 w-full">
          {navItems.map((item) => (
            <Link key={item.name} href={item.href} className="relative">
              <Button 
                variant="ghost" 
                className={cn(
                  "h-8 px-4 text-[10px] font-extrabold tracking-[0.2em] uppercase rounded-full transition-all relative z-10",
                  pathname === item.href 
                    ? "text-amber-400" 
                    : "text-foreground hover:text-amber-400 hover:bg-amber-400/10"
                )}
              >
                {item.name}
              </Button>
              {pathname === item.href && (
                <motion.div
                  layoutId="activeNavIndicator"
                  className="absolute inset-0 bg-amber-400/15 rounded-full z-0"
                  transition={{ type: "spring", stiffness: 350, damping: 26 }}
                />
              )}
            </Link>
          ))}

          {/* User / Auth Actions */}
          <div className="flex items-center gap-1.5 ml-1 pl-1 border-l border-border relative z-10">
            <ThemeToggle />
            
            {isLoaded && isSignedIn ? (
              <div className="flex items-center gap-1.5">
                <UserButton />
              </div>
            ) : isLoaded ? (
              <div className="flex items-center gap-1.5">
                <Button 
                  variant="ghost"
                  className="h-7 px-3 rounded-full text-foreground/80 font-bold uppercase tracking-widest text-[8px] hover:text-amber-400 hover:bg-amber-400/10"
                  onClick={() => router.push("/sign-in")}
                >
                  LOGIN
                </Button>
                <Button 
                  className="h-7 px-4 rounded-full bg-amber-400 text-black font-bold uppercase tracking-widest text-[8px] shadow-none hover:bg-amber-300 transition-colors"
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