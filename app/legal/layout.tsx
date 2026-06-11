"use client"

import { PageBackground } from "@/components/ui/page-background"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { motion } from "framer-motion"

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageBackground>
      <div className="max-w-3xl mx-auto w-full px-6 py-12 pb-24">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 150, damping: 20 }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-amber-400 transition-colors mb-10"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to Home
          </Link>
        </motion.div>

        <motion.article 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="prose-legal space-y-8"
        >
          {children}
        </motion.article>
      </div>
    </PageBackground>
  )
}
