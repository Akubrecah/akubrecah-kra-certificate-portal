"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { ThemeToggle } from "@/components/theme-toggle"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Show, SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs"
import { ScheduleCallButton } from "@/components/schedule-call-button"
import { isAdminUser } from "@/lib/admin-config"

const navItems = [
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Blog", href: "/blog" },
  { label: "Careers", href: "/careers" },
]

export function SiteHeader() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { user } = useUser()
  const isAdmin = isAdminUser(user)

  // Avoid hydration mismatch by waiting for mount
  useEffect(() => {
    setMounted(true)
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const currentTheme = mounted ? resolvedTheme : 'light'
  const logoSrc = currentTheme === 'dark' ? "/akubrecah-logo-dark.png" : "/akubrecah-logo.png"

  return (
    <header className={`fixed top-0 z-50 w-full transition-all duration-300 ${
      scrolled ? "bg-background border-b border-border/50 py-2 shadow-sm" : "bg-background/80 backdrop-blur-md py-4"
    }`} role="banner">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link className="group flex items-center gap-4 text-xl font-bold text-foreground hover:opacity-90 transition-opacity" aria-label="Akubrecah - Home" href="/">
              <div className="relative flex h-12 items-center justify-center transition-transform group-hover:scale-105">
                <Image 
                  alt="Akubrecah Logo" 
                  width={180} 
                  height={48} 
                  decoding="async" 
                  className="object-contain w-auto h-auto" 
                  src={logoSrc} 
                  priority
                />
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Show when="signed-in">
                <div className="flex items-center gap-4">
                  {isAdmin && (
                    <Link href="/admin/dashboard">
                      <Button variant="outline" size="sm" className="rounded-full border-brand-red/30 text-brand-red hover:bg-brand-red/5">
                        Admin
                      </Button>
                    </Link>
                  )}
                  <UserButton appearance={{ elements: { avatarBox: "h-9 w-9 border border-brand-cyan/20" } }} />
                </div>
              </Show>
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <Button variant="ghost" size="sm" className="rounded-full">Sign In</Button>
                </SignInButton>
              </Show>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-background/95 backdrop-blur-xl border-b border-border overflow-hidden"
          >
            <div className="container mx-auto px-4 py-8 flex flex-col space-y-6">
              {navItems.map(({ label, href }) => (
                <button 
                  key={href} 
                  onClick={() => {
                    router.push(href)
                    setMobileMenuOpen(false)
                  }} 
                  className="text-lg font-medium text-left hover:text-brand-cyan transition-colors py-1"
                >
                  {label}
                </button>
              ))}
              {isAdmin && (
                <button 
                  onClick={() => {
                    router.push("/admin/dashboard")
                    setMobileMenuOpen(false)
                  }} 
                  className="text-lg font-bold text-left text-brand-red hover:text-brand-red/80 transition-colors py-1"
                >
                  Admin Dashboard
                </button>
              )}
              <div className="pt-4 flex flex-col space-y-3 border-t border-border">
                <Button className="rounded-full bg-brand-cyan hover:bg-brand-cyan/90 text-black w-full border-none" onClick={() => { router.push("/file"); setMobileMenuOpen(false); }}>File Now</Button>
                <ScheduleCallButton />
                <Show when="signed-out">
                  <SignInButton mode="modal">
                    <Button variant="ghost" className="w-full border border-border rounded-full">Sign In</Button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button variant="outline" className="w-full border border-brand-cyan/20 rounded-full mt-2">Sign Up</Button>
                  </SignUpButton>
                </Show>
                
                <Show when="signed-in">
                  <div className="flex items-center space-x-3 p-2 bg-muted/50 rounded-xl">
                    <UserButton />
                    <span className="text-sm font-medium">My Account</span>
                  </div>
                </Show>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>

  )
}