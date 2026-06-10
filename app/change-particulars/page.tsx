// @ts-nocheck
"use client"

import { ChangeParticularsPortal } from "@/components/change-particulars-portal"
import { PageBackground } from "@/components/ui/page-background"
import { useUser, RedirectToSignIn } from "@clerk/nextjs"
import { motion } from "framer-motion"
import { RefreshCw } from "lucide-react"

export default function ChangeParticularsPage() {
  const { isLoaded, isSignedIn } = useUser()

  return (
    <PageBackground>
      {isSignedIn ? (
        <div className="max-w-7xl mx-auto w-full px-4 pt-8 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8 space-y-2"
          >
            <div className="flex justify-center">
              <span className="inline-flex items-center gap-1.5 bg-primary/5 text-primary border border-primary/10 font-bold px-3 py-1 rounded-full text-[8px] tracking-wider uppercase">
                <RefreshCw className="w-3 h-3" />
                KRA Portal Update Service
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight">
              Change Your<br />
              <span className="text-primary">KRA Particulars.</span>
            </h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium opacity-80">
              Update your registered email or mobile number on KRA iTax through the official support portal.
            </p>
          </motion.div>
          <ChangeParticularsPortal />
        </div>
      ) : (
        <RedirectToSignIn />
      )}
    </PageBackground>
  )
}
