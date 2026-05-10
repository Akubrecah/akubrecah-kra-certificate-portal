"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Home, FileText, ShieldAlert, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageBackground } from "@/components/ui/page-background"

export default function NotFound() {
  return (
    <PageBackground>
      <div className="min-h-screen flex items-center justify-center p-6 relative z-10">
        <div className="absolute top-8 left-8">
          <Link href="/" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-primary transition-colors group">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            BACK TO SAFETY
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg text-center space-y-8"
        >
          {/* Error Visual */}
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-red-500/20 blur-[60px] rounded-full animate-pulse" />
            <div className="relative w-32 h-32 rounded-3xl bg-black/40 border border-white/10 backdrop-blur-xl flex items-center justify-center mx-auto">
              <ShieldAlert className="w-16 h-16 text-red-500" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500">Error 404: Path Obstructed</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground uppercase leading-none">
              Lost in the <br />
              <span className="text-primary">Labyrinth.</span>
            </h1>
            
            <p className="max-w-md mx-auto text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-relaxed opacity-70">
              The requested protocol has been terminated or relocated. Access to this sector is restricted.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto h-12 px-8 bg-primary text-white rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all">
                <Home className="mr-3 h-4 w-4" />
                HOME TERMINAL
              </Button>
            </Link>
            
            <Link href="/retrieval-portal" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto h-12 px-8 glass border-white/10 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] hover:bg-white/5 transition-all">
                <FileText className="mr-3 h-4 w-4" />
                RETRIEVAL GATE
              </Button>
            </Link>
          </div>

          {/* Security Footer */}
          <div className="pt-12 flex justify-center items-center gap-6 opacity-20">
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-white" />
            <span className="text-[8px] font-black uppercase tracking-[0.4em]">Secure Session Monitoring Active</span>
            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-white" />
          </div>
        </motion.div>
      </div>
    </PageBackground>
  )
}
