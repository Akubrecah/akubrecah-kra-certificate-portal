"use client"

import { 
  Show,
  SignInButton, 
  SignUpButton
} from "@clerk/nextjs"
import { 
  ArrowRight, 
  ShieldCheck, 
  Fingerprint, 
  Shield,
  Zap,
  Lock,
  Globe,
  Database,
  MousePointer2,
  Activity,
  Cpu,
  Layers,
  ChevronRight,
  Plus
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { PageBackground } from "@/components/ui/page-background"
import { motion, useScroll, useTransform } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { useRef } from "react"
import Link from "next/link"

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  return (
    <PageBackground>
      <div ref={containerRef} className="relative z-10 min-h-screen pb-4 w-full">
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full flex flex-col space-y-0 py-0 max-w-3xl mx-auto"
        >
          {/* 01. Hero */}
          <section id="about" className="relative flex flex-col items-center justify-center text-center overflow-visible pt-0">
            {/* Animated Background Elements - Simplified */}
            <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none">
              <div className="w-[400px] h-[400px] bg-primary/5 blur-[100px] rounded-full" />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-2 relative z-10"
            >
              <div className="flex justify-center">
                <Badge className="bg-primary/5 text-primary border border-primary/10 font-medium px-2 py-0.5 rounded-full text-[8px] tracking-wider uppercase">
                  Official KRA Retrieval Service
                </Badge>
              </div>
              
              <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight leading-tight mb-1 uppercase">
                KRA Retrieval <br />
                <span className="text-primary font-bold">Portal.</span>
              </h1>
              
              <p className="max-w-[380px] mx-auto text-[10px] text-muted-foreground font-normal leading-normal opacity-80 uppercase tracking-wide">
                Simple and secure retrieval of KRA PIN and Compliance Certificates. Fast and reliable.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                <Show when="signed-in">
                  <Link href="/portal" className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto h-8 px-6 bg-primary text-white rounded-full transition-all hover:opacity-90 font-bold text-[9px] uppercase tracking-widest border border-white/5 shadow-none">
                      Proceed to Retrieval
                      <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  </Link>
                </Show>
                
                <Show when="signed-out">
                  <SignInButton mode="modal">
                    <Button className="w-full sm:w-auto h-8 px-6 bg-primary text-white rounded-full transition-all hover:opacity-90 font-bold text-[9px] uppercase tracking-widest border border-white/5 shadow-none">
                      Get Started
                      <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button variant="outline" className="w-full sm:w-auto h-8 px-6 glass border-white/10 rounded-full font-bold text-[9px] uppercase tracking-widest hover:bg-white/5 transition-all">
                      Create Account
                    </Button>
                  </SignUpButton>
                </Show>
              </div>
            </motion.div>
          </section>

          {/* 02. Service Marquee - Minimal */}
          <section id="blogs" className="py-2 border-y border-white/5 overflow-hidden">
            <div className="mask-marquee">
              <motion.div 
                animate={{ x: [0, -1000] }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                className="flex items-center gap-12 whitespace-nowrap"
              >
                {[
                  "NIL RETURNS", "PIN RETRIEVAL", "TCC ISSUANCE", "VAT COMPLIANCE",
                  "PAYE FILING", "COMPANY REGISTRATION", "KRA CERTIFICATE"
                ].map((service, i) => (
                  <span key={i} className="text-[12px] font-bold text-foreground/20 uppercase tracking-[0.2em]">
                    {service}
                  </span>
                ))}
              </motion.div>
            </div>
          </section>

          {/* 03. Workflow */}
          <section id="security" className="py-4">
            <div className="text-center mb-4 space-y-1">
              <h2 className="text-base font-bold tracking-tight uppercase">How it works.</h2>
              <p className="text-muted-foreground text-[8px] font-bold uppercase tracking-widest opacity-60">Simple steps to get your certificate.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
              {[
                { 
                  step: "01", 
                  icon: <Fingerprint className="w-5 h-5" />, 
                  title: "IDENTITY", 
                  desc: "Provide your identification details."
                },
                { 
                  step: "02", 
                  icon: <Cpu className="w-5 h-5" />, 
                  title: "PROCESSING", 
                  desc: "System synchronizes with KRA records."
                },
                { 
                  step: "03", 
                  icon: <Layers className="w-5 h-5" />, 
                  title: "RETRIEVAL", 
                  desc: "Download official PDF certificate."
                }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group flex flex-col items-center text-center space-y-3"
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-background border border-white/10 flex items-center justify-center transition-all duration-300 relative z-10">
                      <div className="text-primary">
                        {item.icon}
                      </div>
                    </div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 glass rounded-full flex items-center justify-center text-[7px] font-bold italic border border-white/20">
                      {item.step}
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-[9px] font-bold uppercase tracking-widest">{item.title}</h3>
                    <p className="text-muted-foreground font-medium leading-relaxed opacity-60 text-[8px] uppercase px-2">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* 04. Infrastructure */}
          <section id="infrastructure" className="glass border border-white/5 p-8 relative overflow-hidden rounded-2xl">
            <div className="max-w-xl mx-auto text-center space-y-4">
              <Badge className="bg-primary/10 text-primary border border-primary/20 font-bold px-2 py-0.5 rounded-full text-[7px] tracking-[0.2em] uppercase mx-auto">
                SYSTEM STATUS
              </Badge>
              <h2 className="text-xl font-bold text-foreground tracking-tight uppercase leading-tight">
                PRECISION<br />
                <span className="text-primary">ENGINE.</span>
              </h2>
              <p className="text-[10px] text-muted-foreground leading-relaxed font-normal opacity-80 uppercase tracking-wide max-w-sm mx-auto">
                Fast processing with enterprise security. Your personal data is never stored on our servers.
              </p>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-4">
                {[
                  { label: "UPTIME", value: "99.9%" },
                  { label: "SPEED", value: "< 35S" },
                  { label: "ENCRYPT", value: "AES-256" },
                  { label: "VOLUME", value: "128K+" }
                ].map((stat, i) => (
                  <div key={i} className="space-y-1">
                    <div className="text-[7px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</div>
                    <div className="text-sm font-bold uppercase tracking-tight text-foreground">{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 05. FAQ - Simplified */}
          <section id="faqs" className="max-w-2xl mx-auto py-2 space-y-3">
            <div className="text-center space-y-1">
              <h2 className="text-base font-bold uppercase tracking-widest">Inquiries.</h2>
              <div className="h-[1px] w-8 bg-primary mx-auto" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                { q: "IS THIS OFFICIAL?", a: "This is a reliable independent service for easy KRA portal access." },
                { q: "HOW LONG DOES IT TAKE?", a: "Your certificate will be ready in about 45 seconds." },
                { q: "IS MY DATA SAFE?", a: "Yes. We don't save any of your details. Your session is deleted immediately." },
                { q: "CAN I FILE RETURNS?", a: "Yes, we support Nil returns and other basic filing tasks." }
              ].map((faq, i) => (
                <div 
                  key={i}
                  className="glass rounded-2xl p-3 border border-white/5 transition-all"
                >
                  <h4 className="text-[8px] font-bold uppercase tracking-[0.2em] mb-0.5 text-primary">{faq.q}</h4>
                  <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wide opacity-80">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </section>


        </motion.div>

      </div>
    </PageBackground>
  )
}
