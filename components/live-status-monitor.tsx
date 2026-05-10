"use client"

import { motion } from "framer-motion"
import { Activity, Shield, Server, Cpu } from "lucide-react"

export function LiveStatusMonitor() {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/5 bg-black/40 backdrop-blur-xl">
      {/* "Video" Background Effect */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent animate-pulse" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
        <motion.div 
          animate={{ 
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{ 
            duration: 10,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-primary/10 blur-[100px] rounded-full"
        />
      </div>

      <div className="relative z-10 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            <div className="relative p-3 rounded-full bg-primary/10 border border-primary/20">
              <Activity className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2 mb-1">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-red-500/80">LIVE FEED</span>
            </div>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/90">System Monitor</h3>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-500">Operational</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1.5">
              <Server className="w-3 h-3 text-primary/60" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Latency</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-primary">24MS</span>
          </div>
          
          <div className="h-8 w-px bg-white/5" />
          
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-primary/60" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Load</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-primary">1.2%</span>
          </div>

          <div className="h-8 w-px bg-white/5" />

          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-primary/60" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Security</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-emerald-500">ACTIVE</span>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
          <div className="w-1 h-1 rounded-full bg-primary animate-bounce" />
          <span className="text-[8px] font-bold uppercase tracking-widest text-white/30">Syncing Data...</span>
        </div>
      </div>

      {/* Scanning Line Effect */}
      <motion.div 
        animate={{ top: ["0%", "100%", "0%"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent z-20 pointer-events-none opacity-40"
      />
    </div>
  )
}
