"use client"

import Link from "next/link"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserButton, useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"

export function SiteHeader() {
  const { isLoaded, isSignedIn, user } = useUser()

  return (
    <header className="fixed top-0 w-full bg-surface-container-lowest border-b border-outline-variant dark:border-outline z-50 h-16 flex items-center px-4 md:px-8 justify-between">
      <div className="flex items-center gap-6">
        <Link href="/">
          <Logo width={160} height={48} className="h-8 md:h-10 w-auto" />
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        {isLoaded && isSignedIn ? (
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="flex items-center justify-end gap-2">
                {(user?.primaryEmailAddress?.emailAddress?.toLowerCase() === "poweldayck@gmail.com" ||
                  user?.primaryEmailAddress?.emailAddress?.toLowerCase() === (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "poweldayck@gmail.com").toLowerCase() ||
                  user?.publicMetadata?.role === "Super Admin" ||
                  user?.publicMetadata?.role === "Admin") && (
                  <Link href="/admin/system-health">
                    <span className="px-2.5 py-1 text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary hover:text-white transition-all cursor-pointer mr-1.5 inline-flex items-center">
                      Admin Central
                    </span>
                  </Link>
                )}
                <p className="font-label-md text-label-md text-on-surface">{user?.fullName || "User"}</p>
              </div>
              <p className="font-label-sm text-label-sm text-on-surface-variant">{user?.primaryEmailAddress?.emailAddress || "user@example.com"}</p>
            </div>
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10 rounded-full"
                }
              }}
            />
          </div>
        ) : isLoaded && !isSignedIn ? (
          <div className="flex items-center gap-2">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm" className="h-9 px-4 rounded-xl text-xs font-semibold text-primary hover:bg-primary/10">Log in</Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="h-9 px-4 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 shadow-sm">Join Now</Button>
            </Link>
          </div>
        ) : null}
      </div>
    </header>
  )
}