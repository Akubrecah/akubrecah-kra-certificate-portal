"use client"

import { useUser } from "@clerk/nextjs"
import { 
  ArrowRight, 
  Fingerprint, 
  Cpu,
  Layers,
} from 'lucide-react'
import { motion, useScroll, useInView, animate } from "framer-motion"
import { useRef, useState, useEffect } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

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
  const { isSignedIn, isLoaded } = useUser()

  return (
    <div ref={containerRef} className="relative z-10 min-h-screen pb-4 w-full bg-background text-on-background font-body-md pt-16">
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full flex flex-col space-y-16 py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        {/* 01. Hero */}
        <section id="about" className="relative flex flex-col items-center justify-center text-center overflow-visible">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.12 } }
            }}
            className="space-y-6 relative z-10 max-w-3xl mx-auto"
          >
            <motion.div
              variants={{
                hidden: { opacity: 0, scale: 0.8, y: -10 },
                visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 15 } }
              }}
              className="flex justify-center"
            >
              <div className="bg-surface-container-high text-primary font-label-sm text-label-sm px-4 py-1.5 rounded-full uppercase tracking-widest border border-outline-variant">
                Official KRA Retrieval Service
              </div>
            </motion.div>
            
            <motion.h1 
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
              }}
              className="font-display-lg text-[40px] md:text-[56px] text-on-surface leading-tight"
            >
              Generate Your <br />
              <span className="text-primary">KRA Certificate.</span>
            </motion.h1>
            
            <motion.p 
              variants={{
                hidden: { opacity: 0, y: 15 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
              }}
              className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto"
            >
              Simple and secure retrieval of KRA PIN and Compliance Certificates. Fast and reliable.
            </motion.p>

            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 15 },
                visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
              }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              {isLoaded && isSignedIn ? (
                <Link href="/retrieval-portal" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto bg-primary-container text-on-primary font-label-md text-label-md py-3 px-8 rounded hover:bg-primary transition-colors flex justify-center items-center gap-2">
                    Get Your Certificate
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              ) : isLoaded && (
                <>
                  <Link href="/sign-in" className="w-full sm:w-auto">
                    <button className="w-full sm:w-auto bg-primary-container text-on-primary font-label-md text-label-md py-3 px-8 rounded hover:bg-primary transition-colors flex justify-center items-center gap-2">
                      Get Your Certificate
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </Link>
                  <Link href="/sign-up" className="w-full sm:w-auto">
                    <button className="w-full sm:w-auto bg-surface-container-lowest border border-outline-muted text-on-surface font-label-md text-label-md py-3 px-8 rounded hover:bg-surface-variant transition-colors flex justify-center items-center gap-2">
                      Create Account
                    </button>
                  </Link>
                </>
              )}
            </motion.div>
          </motion.div>
        </section>

        {/* 03. Workflow */}
        <section id="workflow" className="py-8 border-t border-outline-variant">
          <div className="text-center mb-10 space-y-2">
            <h2 className="font-headline-lg text-headline-lg text-on-surface">How it works</h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto">Simple steps to get your certificate securely and instantly.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative max-w-4xl mx-auto px-4">
            {/* Connecting line for desktop */}
            <div className="absolute top-8 left-[15%] right-[15%] h-[2px] bg-surface-variant hidden md:block z-0" />

            {[
              { 
                step: "01", 
                icon: <Fingerprint className="w-6 h-6" />, 
                title: "IDENTITY", 
                desc: "Provide your identification details."
              },
              { 
                step: "02", 
                icon: <Cpu className="w-6 h-6" />, 
                title: "PROCESSING", 
                desc: "System synchronizes with KRA records."
              },
              { 
                step: "03", 
                icon: <Layers className="w-6 h-6" />, 
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
                className="group flex flex-col items-center text-center space-y-4 relative z-10 cursor-pointer bg-surface-container-lowest p-6 rounded-xl border border-outline-muted shadow-sm hover:shadow-soft transition-all"
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-surface-variant flex items-center justify-center transition-all duration-300 group-hover:bg-primary-container group-hover:text-on-primary text-primary relative z-10">
                    {item.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-primary text-on-primary rounded-full flex items-center justify-center font-label-sm text-label-sm shadow-sm">
                    {item.step}
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="font-title-lg text-title-lg text-on-surface">{item.title}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 04. Infrastructure */}
        <section id="infrastructure" className="bg-surface-variant/30 border border-outline-variant p-8 relative overflow-hidden rounded-2xl max-w-5xl mx-auto w-full">
          <div className="max-w-xl mx-auto text-center space-y-6 relative z-10">
            <div className="bg-primary/10 text-primary font-label-sm text-label-sm px-3 py-1 rounded-full uppercase tracking-widest inline-block border border-primary/20">
              SYSTEM STATUS
            </div>
            <h2 className="font-display-lg text-[32px] md:text-[40px] text-on-surface leading-tight">
              PRECISION <span className="text-primary">ENGINE</span>
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mx-auto">
              Fast processing with enterprise security. Your personal data is never stored on our servers.
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6">
              {[
                { label: "UPTIME", value: "99.9%" },
                { label: "SPEED", value: "< 35S" },
                { label: "ENCRYPT", value: "AES-256" },
                { label: "VOLUME", value: "128K+" }
              ].map((stat, i) => (
                <div key={i} className="space-y-2 bg-surface-container-lowest p-4 rounded-lg border border-outline-muted">
                  <div className="font-label-sm text-label-sm uppercase text-on-surface-variant">{stat.label}</div>
                  <div className="font-headline-lg text-headline-lg text-primary">
                    <Counter value={stat.value} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 05. FAQ */}
        <section id="faqs" className="max-w-4xl mx-auto w-full py-8 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Frequently Asked Questions</h2>
            <div className="h-1 w-12 bg-primary mx-auto rounded" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
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
                whileHover={{ scale: 1.02 }}
                className="bg-surface-container-lowest border border-outline-muted rounded-xl p-6 transition-all hover:border-primary/30 hover:shadow-soft"
              >
                <h4 className="font-title-lg text-[18px] mb-2 text-primary">{faq.q}</h4>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  {faq.a}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

      </motion.div>
    </div>
  )
}
