"use client"

import { PageBackground } from "@/components/ui/page-background"
import { Shield, Zap, Target, Lightbulb } from 'lucide-react'
import { motion } from "framer-motion"

export default function AboutPage() {
  const sections = [
    {
      icon: <Target className="w-4 h-4" />,
      title: "OUR MISSION",
      desc: "Simplifying tax compliance for the next generation. We provide accessible solutions for students and freelancers."
    },
    {
      icon: <Lightbulb className="w-4 h-4" />,
      title: "OUR VISION",
      desc: "A Kenya where every individual can easily fulfill their tax responsibilities with confidence and ease."
    }
  ]

  return (
    <PageBackground>
      <div className="w-full flex flex-col space-y-6 py-6 max-w-2xl mx-auto">
        {/* Hero Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-primary">Identity</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tighter uppercase leading-tight">
            Compliance <span className="text-primary">Redefined.</span>
          </h1>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide leading-relaxed opacity-60 max-w-md mx-auto">
            Committed to removing barriers and empowering young people to stay compliant without the friction.
          </p>
        </div>

        {/* Info Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {sections.map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass p-6 rounded-2xl border border-white/5 space-y-4 text-center"
            >
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
                {item.icon}
              </div>
              <div className="space-y-1">
                <h2 className="text-[10px] font-bold tracking-widest uppercase">{item.title}</h2>
                <p className="text-[9px] text-muted-foreground uppercase leading-relaxed font-medium opacity-70">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Digital-First Approach */}
        <section className="glass rounded-2xl border border-white/5 p-6 relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <div className="text-center space-y-1">
              <h2 className="text-sm font-bold uppercase tracking-widest">Digital Precision.</h2>
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest opacity-50">Infrastructure for a compliant generation.</p>
            </div>
            
            <div className="grid gap-3">
              {[
                { title: "User-Centered", desc: "Mobile-first platform designed for absolute simplicity." },
                { title: "Smart Automation", desc: "Guided filing processes that eliminate manual errors." },
                { title: "Localized Support", desc: "Tailored to the unique Kenyan tax landscape." }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Zap size={12} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-widest group-hover:text-primary transition-colors">{item.title}</h3>
                    <p className="text-[9px] text-muted-foreground uppercase font-medium opacity-60">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Security Focus */}
        <div className="text-center py-4 border-t border-white/5 space-y-2">
          <Shield size={24} className="text-primary mx-auto opacity-40" />
          <h3 className="text-[9px] font-bold uppercase tracking-[0.3em]">Vault-Grade Security</h3>
          <p className="text-[8px] text-muted-foreground uppercase tracking-widest opacity-50 max-w-xs mx-auto">
            Every interaction is protected by enterprise-level encryption protocols.
          </p>
        </div>
      </div>
    </PageBackground>
  )
}
