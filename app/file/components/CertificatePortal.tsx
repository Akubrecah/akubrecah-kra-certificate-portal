"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, FileText, CheckCircle, Shield, ArrowRight, ShieldCheck, Receipt, Loader2, Sparkles, User, Fingerprint } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "react-hot-toast"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"

interface CertificatePortalProps {
  pin: string
  name: string
  receiptNumber?: string
  onDownload: (type: string) => void
  onEndSession: () => void
}

export function CertificatePortal({
  pin,
  name,
  receiptNumber,
  onDownload,
  onEndSession
}: CertificatePortalProps) {
  const [downloading, setDownloading] = useState<string | null>(null)

  const handleDownload = (type: string) => {
    setDownloading(type)
    onDownload(type)
    setTimeout(() => setDownloading(null), 2000)
  }

  return (
    <div className="space-y-12 animate-fadeIn pb-16">
      {/* Success Hero - Pro Terminal Style */}
      <div className="text-center space-y-6">
        <motion.div 
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", damping: 20 }}
            className="relative inline-block"
        >
            <div className="inline-flex items-center justify-center w-28 h-28 rounded-[2.5rem] bg-gradient-to-br from-[#2E8B75] to-[#1a4d41] shadow-3xl shadow-[#2E8B75]/20 mb-4 relative z-10 border border-[#2E8B75]/30">
                <CheckCircle className="w-14 h-14 text-white" />
            </div>
            <div className="absolute inset-0 bg-[#2E8B75]/30 blur-3xl rounded-full animate-pulse" />
            
            {/* Floating particles for premium feel */}
            <motion.div 
              animate={{ y: [0, -10, 0], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -top-4 -right-4"
            >
              <Sparkles className="w-8 h-8 text-[#2E8B75]/40" />
            </motion.div>
        </motion.div>
        
        <div className="space-y-3">
            <h2 className="text-5xl font-black tracking-tight text-foreground uppercase">Return Secured</h2>
            <div className="flex items-center justify-center gap-3">
              <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#2E8B75]" />
              <p className="text-[10px] font-black text-[#2E8B75] uppercase tracking-[0.4em]">Audit Vault Verification Complete</p>
              <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#2E8B75]" />
            </div>
        </div>
      </div>

      <div className="grid gap-8 max-w-7xl mx-auto">
        {/* Certificate Card - Premium Pro Layout */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="glass group relative overflow-hidden p-12 rounded-[3.5rem] border-[#2E8B75]/20 shadow-4xl bg-gradient-to-br from-card via-card to-[#2E8B75]/[0.02]"
        >
          {/* Subtle background grid/pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#2E8B75_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.03] pointer-events-none" />
          
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-1000 rotate-12">
            <FileText className="w-64 h-64 text-[#2E8B75]" />
          </div>
          
          <div className="relative space-y-12">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-[#2E8B75]/10 flex items-center justify-center border border-[#2E8B75]/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
                      <ShieldCheck className="w-8 h-8 text-[#2E8B75]" />
                  </div>
                  <div>
                      <h3 className="text-3xl font-black text-foreground tracking-tight uppercase">PIN Certificate</h3>
                      <p className="text-[10px] font-black text-[#2E8B75] uppercase tracking-[0.2em]">Official KRA Document • 2024 Cycle</p>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <Badge variant="outline" className="px-4 py-2 border-[#2E8B75]/20 text-[#2E8B75] text-[10px] font-black tracking-widest uppercase rounded-xl">
                    Verified Ledger
                  </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-8 rounded-[2rem] bg-background/40 backdrop-blur-md border border-border/50 space-y-4 group/item hover:border-[#2E8B75]/30 transition-all duration-500 shadow-lg">
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-2 rounded-lg bg-secondary text-muted-foreground group-hover/item:text-[#2E8B75] transition-colors">
                    <Fingerprint className="w-5 h-5" />
                  </div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Taxpayer Identifier</p>
                </div>
                <p className="text-3xl font-mono font-black text-foreground tracking-widest">{pin}</p>
              </div>

              <div className="p-8 rounded-[2rem] bg-background/40 backdrop-blur-md border border-border/50 space-y-4 group/item hover:border-[#2E8B75]/30 transition-all duration-500 shadow-lg">
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-2 rounded-lg bg-secondary text-muted-foreground group-hover/item:text-[#2E8B75] transition-colors">
                    <User className="w-5 h-5" />
                  </div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Legal Entity Name</p>
                </div>
                <p className="text-2xl font-black text-foreground truncate uppercase">{name}</p>
              </div>
            </div>

            <div className="space-y-6">
              <Button 
                className="w-full h-24 bg-[#B91C1C] hover:bg-[#B91C1C]/90 text-white font-black text-2xl rounded-3xl shadow-3xl shadow-[#B91C1C]/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-4 border-0 group relative overflow-hidden"
                onClick={() => onDownload('pin-certificate')}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <Download className="w-8 h-8 group-hover:translate-y-1 transition-transform duration-300" />
                <span className="tracking-tight">Download PIN Certificate</span>
              </Button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button 
                  variant="outline"
                  className="h-20 rounded-[1.5rem] border-border bg-card/50 text-muted-foreground font-black text-sm uppercase tracking-widest hover:bg-[#2E8B75]/10 hover:text-[#2E8B75] hover:border-[#2E8B75]/20 transition-all flex items-center justify-center gap-3"
                  onClick={() => handleDownload('acknowledgement')}
                  disabled={!!downloading || !receiptNumber}
                >
                  {downloading === 'acknowledgement' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Receipt className="w-5 h-5" />}
                  Download Receipt
                </Button>
                <Button 
                  variant="outline"
                  className="h-20 rounded-[1.5rem] border-border bg-card/50 text-muted-foreground font-black text-sm uppercase tracking-widest hover:bg-[#2E8B75]/10 hover:text-[#2E8B75] hover:border-[#2E8B75]/20 transition-all flex items-center justify-center gap-3"
                  onClick={() => handleDownload('payment')}
                  disabled={!!downloading || !receiptNumber}
                >
                  {downloading === 'payment' ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                  Compliance Check
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="flex flex-col items-center gap-8 pt-8">
        <Button 
          variant="ghost" 
          className="h-16 px-10 rounded-2xl text-muted-foreground font-black uppercase tracking-[0.3em] hover:text-[#2E8B75] hover:bg-[#2E8B75]/5 transition-all group border border-transparent hover:border-[#2E8B75]/20"
          onClick={onEndSession}
        >
          Finalize & Exit Session
          <ArrowRight className="ml-4 w-5 h-5 group-hover:translate-x-2 transition-transform" />
        </Button>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex items-center gap-6 p-6 px-10 bg-card/40 backdrop-blur-xl rounded-[2rem] border border-border shadow-2xl"
        >
            <Shield className="w-5 h-5 text-[#2E8B75]" />
            <div className="flex flex-col gap-1">
              <p className="text-[9px] text-[#2E8B75] font-black uppercase tracking-[0.3em] leading-none">
                  Secure Cryptographic Signature
              </p>
              <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-70">
                  Official KRA iTax Synchronization Active
              </p>
            </div>
        </motion.div>
      </div>
    </div>
  )
}
