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
                    <span className="px-2.5 py-0.5 text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 rounded hover:bg-primary hover:text-white transition-colors cursor-pointer mr-1.5">
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
              <Button variant="ghost" className="font-label-md text-label-md text-primary">Log in</Button>
            </Link>
            <Link href="/sign-up">
              <Button className="bg-primary-container text-on-primary font-label-md text-label-md hover:bg-primary">Join Now</Button>
            </Link>
          </div>
        ) : null}
      </div>
    </header>
  )
}