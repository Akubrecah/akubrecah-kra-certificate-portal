"use client"

import { 
  useUser,
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
import { motion, useScroll, useTransform, useInView, animate } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { useRef, useState, useEffect } from "react"
import Link from "next/link"

function Counter({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })
  const [displayValue, setDisplayValue] = useState("0")
  
  useEffect(() => {
    if (!isInView) return
    
    const match = value.match(/([0-9.]+)/)
    if (!match) {
      setDisplayValue(value)
      return
    }
    const num = parseFloat(match[1])
    const prefix = value.substring(0, match.index)
    const suffix = value.substring(match.index! + match[1].length)
    
    const isDecimal = match[1].includes(".")
    const decimals = isDecimal ? match[1].split(".")[1].length : 0

    const controls = animate(0, num, {
      duration: 2.0,
      ease: "easeOut",
      onUpdate(val) {
        setDisplayValue(`${prefix}${val.toFixed(decimals)}${suffix}`)
      }
    })
    return () => controls.stop()
  }, [value, isInView])

  return <span ref={ref}>{displayValue}</span>
}

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })
  const { isSignedIn, isLoaded } = useUser()

  return (
    <PageBackground>
      <div ref={containerRef} className="relative z-10 min-h-screen pb-4 w-full">
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full flex flex-col space-y-0 py-0 max-w-7xl mx-auto"
        >
          {/* 01. Hero */}
          <section id="about" className="relative flex flex-col items-center justify-center text-center overflow-visible pt-12 pb-8">
            {/* Ambient Animated Amber Glow Orb */}
            <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none overflow-visible">
              <div className="w-[500px] h-[500px] bg-amber-400/5 blur-[120px] rounded-full animate-float" style={{ animationDelay: '1s' }} />
              <div className="w-[300px] h-[300px] bg-primary/5 blur-[100px] rounded-full animate-float-slow absolute" />
            </div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    staggerChildren: 0.12
                  }
                }
              }}
              className="space-y-4 relative z-10"
            >
              <motion.div
                variants={{
                  hidden: { opacity: 0, scale: 0.8, y: -10 },
                  visible: { 
                    opacity: 1, 
                    scale: 1, 
                    y: 0, 
                    transition: { type: "spring", stiffness: 200, damping: 15 } 
                  }
                }}
                className="flex justify-center"
              >
                <Badge className="bg-primary/5 text-primary border border-primary/10 font-medium px-2.5 py-0.5 rounded-full text-[8px] tracking-wider uppercase">
                  Official KRA Retrieval Service
                </Badge>
              </motion.div>
              
              <motion.h1 
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { 
                    opacity: 1, 
                    y: 0, 
                    transition: { type: "spring", stiffness: 100, damping: 15 } 
                  }
                }}
                className="text-4xl md:text-6xl font-bold text-foreground tracking-tight leading-[1.05] mb-2 uppercase"
              >
                Generate Your <br />
                <span className="text-amber-400 font-bold bg-clip-text">KRA Certificate.</span>
              </motion.h1>
              
              <motion.p 
                variants={{
                  hidden: { opacity: 0, y: 15 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
                }}
                className="max-w-2xl mx-auto text-[10px] md:text-[11px] text-muted-foreground font-normal leading-normal opacity-80 uppercase tracking-widest"
              >
                Simple and secure retrieval of KRA PIN and Compliance Certificates. Fast and reliable.
              </motion.p>

              <motion.div 
                variants={{
                  hidden: { opacity: 0, y: 15 },
                  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
                }}
                className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3"
              >
                {isLoaded && isSignedIn ? (
                  <>
                    <Link href="/retrieval-portal" className="w-full sm:w-auto">
                      <Button className="w-full sm:w-auto h-8 px-6 bg-amber-400 text-black rounded-full transition-all hover:bg-amber-300 font-bold text-[9px] uppercase tracking-widest border border-amber-300/20 shadow-none">
                        Get Your Certificate
                        <ArrowRight className="ml-2 h-3 w-3" />
                      </Button>
                    </Link>
                    <Link href="/change-particulars" className="w-full sm:w-auto">
                      <Button variant="outline" className="w-full sm:w-auto h-8 px-6 glass border-amber-400/20 rounded-full font-bold text-[9px] uppercase tracking-widest hover:bg-amber-400/10 hover:text-amber-400 hover:border-amber-400/45 transition-all">
                        Change Particulars
                      </Button>
                    </Link>
                  </>
                ) : isLoaded && (
                  <>
                    <Link href="/sign-in" className="w-full sm:w-auto">
                      <Button className="w-full sm:w-auto h-8 px-6 bg-primary text-white rounded-full transition-all hover:opacity-90 font-bold text-[9px] uppercase tracking-widest border border-white/5 shadow-none">
                        Get Your Certificate
                        <ArrowRight className="ml-2 h-3 w-3" />
                      </Button>
                    </Link>
                    <Link href="/sign-up" className="w-full sm:w-auto">
                      <Button variant="outline" className="w-full sm:w-auto h-8 px-6 glass border-white/10 rounded-full font-bold text-[9px] uppercase tracking-widest hover:bg-white/5 transition-all">
                        Create Account
                      </Button>
                    </Link>
                    <Link href="/change-particulars" className="w-full sm:w-auto">
                      <Button variant="ghost" className="w-full sm:w-auto h-8 px-4 rounded-full font-bold text-[9px] uppercase tracking-widest text-muted-foreground hover:text-amber-400 hover:bg-amber-400/10 transition-all">
                        Change Particulars
                      </Button>
                    </Link>
                  </>
                )}
              </motion.div>

            </motion.div>

          </section>

          {/* 02. Service Marquee - Seamless Continuous Loop */}
          <section id="blogs" className="py-2.5 border-y border-white/5 overflow-hidden">
            <div className="mask-marquee flex overflow-hidden whitespace-nowrap">
              <motion.div 
                animate={{ x: ["0%", "-50%"] }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="flex items-center gap-12 whitespace-nowrap"
              >
                {[
                  "NIL RETURNS", "PIN RETRIEVAL", "TCC ISSUANCE", "VAT COMPLIANCE",
                  "PAYE FILING", "COMPANY REGISTRATION", "KRA CERTIFICATE"
                ].map((service, i) => (
                  <span key={`1-${i}`} className="text-[12px] font-bold text-foreground/20 uppercase tracking-[0.2em] flex-shrink-0">
                    {service}
                  </span>
                ))}
                {[
                  "NIL RETURNS", "PIN RETRIEVAL", "TCC ISSUANCE", "VAT COMPLIANCE",
                  "PAYE FILING", "COMPANY REGISTRATION", "KRA CERTIFICATE"
                ].map((service, i) => (
                  <span key={`2-${i}`} className="text-[12px] font-bold text-foreground/20 uppercase tracking-[0.2em] flex-shrink-0">
                    {service}
                  </span>
                ))}
              </motion.div>
            </div>
          </section>

          {/* 03. Workflow */}
          <section id="security" className="py-8">
            <div className="text-center mb-6 space-y-1">
              <h2 className="text-base font-bold tracking-tight uppercase">How it works.</h2>
              <p className="text-muted-foreground text-[8px] font-bold uppercase tracking-widest opacity-90">Simple steps to get your certificate.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative max-w-4xl mx-auto px-4">
              {/* Connecting line for desktop */}
              <div className="absolute top-6 left-[15%] right-[15%] h-[1px] border-t border-dashed border-white/10 hidden md:block z-0">
                <div className="h-full bg-gradient-to-r from-transparent via-amber-400/20 to-transparent w-full animate-pulse" />
              </div>

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
                  title: "CERTIFICATE", 
                  desc: "Download official PDF certificate."
                }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: i * 0.15, type: "spring", stiffness: 100 }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  className="group flex flex-col items-center text-center space-y-3 relative z-10 cursor-pointer"
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-background border border-white/10 flex items-center justify-center transition-all duration-300 group-hover:border-amber-400/30 group-hover:bg-amber-400/5 relative z-10">
                      <div className="text-primary group-hover:text-amber-400 transition-colors">
                        {item.icon}
                      </div>
                    </div>
                    <motion.div 
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.15 + 0.3, type: "spring", stiffness: 200, damping: 10 }}
                      className="absolute -top-1 -right-1 w-5 h-5 glass rounded-full flex items-center justify-center text-[7px] font-bold italic border border-white/20 group-hover:border-amber-400/30 transition-colors"
                    >
                      {item.step}
                    </motion.div>
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-[9px] font-bold uppercase tracking-widest group-hover:text-amber-400 transition-colors">{item.title}</h3>
                    <p className="text-muted-foreground font-medium leading-relaxed opacity-90 text-[8px] uppercase px-2">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* 04. Infrastructure */}
          <section id="infrastructure" className="glass border border-white/5 p-8 relative overflow-hidden rounded-2xl">
            {/* Scan line & shimmer overlay effects */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/25 to-transparent animate-scan" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
            </div>

            <div className="max-w-xl mx-auto text-center space-y-4 relative z-10">
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
                    <div className="text-sm font-bold uppercase tracking-tight text-foreground">
                      <Counter value={stat.value} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 05. FAQ - Enhanced Grid & Entrance */}
          <section id="faqs" className="max-w-7xl mx-auto py-8 space-y-4">
            <div className="text-center space-y-1">
              <h2 className="text-base font-bold uppercase tracking-widest">Inquiries.</h2>
              <div className="h-[1px] w-8 bg-primary mx-auto" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-4">
              {[
                { q: "IS THIS OFFICIAL?", a: "This is a reliable independent service for easy KRA portal access." },
                { q: "HOW LONG DOES IT TAKE?", a: "Your certificate will be ready in about 45 seconds." },
                { q: "IS MY DATA SAFE?", a: "Yes. We don't save any of your details. Your session is deleted immediately." },
                { q: "CAN I FILE RETURNS?", a: "Yes, we support Nil returns and other basic filing tasks." }
              ].map((faq, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  whileHover={{ scale: 1.015, y: -2 }}
                  className="glass rounded-2xl p-4 border border-white/5 hover:border-amber-400/30 hover:bg-amber-400/5 transition-all cursor-default"
                >
                  <h4 className="text-[8px] font-bold uppercase tracking-[0.2em] mb-1.5 text-primary">{faq.q}</h4>
                  <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wide opacity-80 leading-relaxed">
                    {faq.a}
                  </p>
                </motion.div>
              ))}
            </div>
          </section>

        </motion.div>

      </div>
    </PageBackground>
  )
}
