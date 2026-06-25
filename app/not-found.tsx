"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Home, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background text-on-background pt-16 flex flex-col items-center justify-center">
      <div className="relative z-10 w-full max-w-lg mx-auto px-4 text-center">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Error Code */}
          <div className="relative">
            <h1 className="font-display-lg text-[120px] md:text-[150px] font-bold text-primary/20 leading-none tracking-tighter">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-surface-container-highest border border-outline-muted px-4 py-2 rounded-full shadow-soft">
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary font-bold">
                  Page Not Found
                </span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          <div className="space-y-4">
            <h2 className="font-headline-lg text-headline-lg text-on-surface">
              Lost in the System
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto">
              The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <button
              onClick={() => router.back()}
              className="w-full sm:w-auto bg-surface-container border border-outline-muted text-on-surface font-label-md text-label-md py-3 px-6 rounded hover:bg-surface-variant transition-colors flex justify-center items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
            <Link href="/" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto bg-primary-container text-on-primary font-label-md text-label-md py-3 px-8 rounded hover:bg-primary transition-colors flex justify-center items-center gap-2">
                <Home className="w-4 h-4" />
                Return Home
              </button>
            </Link>
          </div>
        </motion.div>
        
      </div>
    </div>
  )
}
