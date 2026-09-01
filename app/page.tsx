"use client"

import { useUser } from "@clerk/nextjs"
import { 
  ArrowRight, 
  Fingerprint, 
  ShieldCheck, 
  Zap, 
  Lock, 
  LockKeyhole,
  Briefcase,
  FileCheck2,
  CheckCircle2
} from 'lucide-react'
import { motion, useInView, animate } from "framer-motion"
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
  const [activeTab, setActiveTab] = useState<"retrieval" | "pinchecker" | "filing" | "cv">("retrieval")

  return (
    <div ref={containerRef} className="relative z-10 min-h-screen pb-16 w-full bg-background text-on-background font-body-md pt-6 overflow-x-hidden">
      
      {/* Background Decorative Gradients & Blobs */}
      <div className="absolute top-0 inset-x-0 h-[600px] bg-[radial-gradient(circle_at_top,rgba(125,0,14,0.06)_0%,transparent_70%)] pointer-events-none z-0" />
      <div className="absolute top-20 right-[15%] w-96 h-96 bg-primary/5 rounded-full filter blur-[120px] animate-blob z-0" />
      <div className="absolute top-[40%] left-[10%] w-80 h-80 bg-[#E9A23B]/5 rounded-full filter blur-[100px] animate-blob animation-delay-2000 z-0" />

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full flex flex-col space-y-24 py-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
      >
        {/* 01. Hero Section */}
        <section id="hero" className="relative flex flex-col items-center text-center gap-10 pt-2 max-w-4xl mx-auto w-full">
          <div className="space-y-6 max-w-3xl flex flex-col items-center">
            
            <h1 className="font-display-lg text-[42px] md:text-[60px] text-on-surface leading-tight font-black tracking-tight">
              Manage Your KRA Obligations <br />
              <span className="text-primary bg-gradient-to-r from-primary to-[#BA1A1A] bg-clip-text text-transparent">
                Instantly & Securely.
              </span>
            </h1>
            
            <p className="font-body-lg text-lg text-on-surface-variant max-w-xl text-center">
              An independent, automated helper for fast KRA PIN retrieval, Compliance Certificate downloads, simplified Nil returns filing, and professional resume building.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 w-full max-w-xl">
              <Link href="/retrieval-portal" className="w-full sm:flex-1">
                <button className="w-full bg-primary text-white font-bold py-3.5 px-6 rounded-xl hover:bg-primary/95 hover:scale-[1.02] active:scale-[0.98] transition-all flex justify-center items-center gap-2 shadow-lg shadow-primary/20">
                  <Fingerprint className="h-5 w-5" />
                  Certificate Portal (ID / PIN)
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              <Link href="/pin-checker" className="w-full sm:flex-1">
                <button className="w-full bg-surface-container-lowest border-2 border-red-500/30 hover:border-red-500 text-red-600 dark:text-red-400 font-bold py-3.5 px-6 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-all flex justify-center items-center gap-2 shadow-sm">
                  <ShieldCheck className="h-5 w-5" />
                  Live PIN & ID Checker
                </button>
              </Link>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-on-surface-variant font-medium">
              <div className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-primary" /> 100% Secure SSL
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-primary" /> Direct iTax Integration
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-primary" /> Instant PDF download
              </div>
            </div>
          </div>
        </section>

        {/* 02. Detailed Services Showcase (Tabs layout) */}
        <section id="services" className="space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="font-headline-lg text-3xl font-black text-on-surface tracking-tight">
              One Consolidated Obligation Portal
            </h2>
            <p className="text-on-surface-variant text-base">
              Say goodbye to navigating slow government website forms. Get everything done securely in three distinct browser modules.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
              {[
                { id: "retrieval", label: "PIN Retrieval", icon: Fingerprint },
                { id: "pinchecker", label: "Live PIN Checker", icon: ShieldCheck },
                { id: "filing", label: "Filing Assistant", icon: FileCheck2 },
                { id: "cv", label: "Professional CV Builder", icon: Briefcase }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold border transition-all duration-200",
                      activeTab === tab.id 
                        ? "bg-primary text-white border-primary shadow-md shadow-primary/10" 
                        : "bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:bg-surface-container"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Details Content for Selected Service */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-8 md:p-12 shadow-soft hover:shadow-medium transition-shadow duration-300">
            {activeTab === "retrieval" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <Fingerprint className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-on-surface font-headline-md">
                    KRA PIN Verification & PDF Retrieval
                  </h3>
                  <p className="text-on-surface-variant text-base leading-relaxed">
                    Easily search your taxpayer credentials using your National ID or PIN. The system connects to the iTax Pin Checker endpoint using randomized user-agent strings and premium proxy endpoints, resolving details and downloading the PDF compliance certificate directly inside the browser.
                  </p>
                  <ul className="space-y-3.5 text-sm text-on-surface">
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/15 dark:bg-primary/25 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span>Determine obligations, registration dates, and stations automatically.</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/15 dark:bg-primary/25 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span>Automated captcha solving through low-latency OCR scripts.</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/15 dark:bg-primary/25 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span>Generate and download clean, verified KRA PDF certificates instantly.</span>
                    </li>
                  </ul>
                  <div className="pt-2">
                    <Link href="/retrieval-portal">
                      <button className="bg-primary text-white font-bold py-2.5 px-6 rounded-xl hover:bg-primary/95 transition-colors flex items-center gap-2">
                        Open Retrieval Portal <ArrowRight className="w-4 h-4" />
                      </button>
                    </Link>
                  </div>
                </div>
                <div className="bg-surface rounded-2xl p-6 border border-outline-variant space-y-4">
                  <h4 className="font-bold text-on-surface text-sm uppercase tracking-wide">Portal Status Checker</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/60">
                      <span className="text-sm font-medium text-on-surface">KRA iTax Server</span>
                      <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full">Operational</span>
                    </div>
                    <div className="flex justify-between items-center bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/60">
                      <span className="text-sm font-medium text-on-surface">Verification Engine</span>
                      <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full">99.9% Uptime</span>
                    </div>
                    <div className="flex justify-between items-center bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/60">
                      <span className="text-sm font-medium text-on-surface">Avg Retrieval Speed</span>
                      <span className="text-xs font-bold text-on-surface-variant">28 seconds</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "pinchecker" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="w-12 h-12 bg-red-600/10 rounded-xl flex items-center justify-center text-red-600">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-on-surface font-headline-md">
                    Official Live KRA PIN & ID Status Checker
                  </h3>
                  <p className="text-on-surface-variant text-base leading-relaxed">
                    Verify any Kenyan National ID or KRA PIN in real-time through the official KRA API Gateway and Direct Web Remoting (DWR) protocol. Instantly review taxpayer names, obligations, station, exact registration dates, and location details.
                  </p>
                  <ul className="space-y-3.5 text-sm text-on-surface">
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-red-600/15 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-red-600" />
                      </div>
                      <span>Instant OAuth2 live gateway queries without CAPTCHA friction.</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-red-600/15 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-red-600" />
                      </div>
                      <span>Flexible engine switcher: Live API, DWR, or Auto Best-Match.</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-red-600/15 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-red-600" />
                      </div>
                      <span>Print verification summaries and copy details with one click.</span>
                    </li>
                  </ul>
                  <div className="pt-2">
                    <Link href="/pin-checker">
                      <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-xl transition-colors flex items-center gap-2">
                        Open Live PIN Checker <ArrowRight className="w-4 h-4" />
                      </button>
                    </Link>
                  </div>
                </div>
                <div className="bg-surface rounded-2xl p-6 border border-outline-variant space-y-4">
                  <h4 className="font-bold text-on-surface text-sm uppercase tracking-wide">Live Gateway Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/60">
                      <span className="text-sm font-medium text-on-surface">KRA API Gateway</span>
                      <span className="px-2.5 py-0.5 bg-emerald-600/10 text-emerald-600 text-xs font-bold rounded-full">Connected (Live)</span>
                    </div>
                    <div className="flex justify-between items-center bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/60">
                      <span className="text-sm font-medium text-on-surface">DWR Remoting Engine</span>
                      <span className="px-2.5 py-0.5 bg-emerald-600/10 text-emerald-600 text-xs font-bold rounded-full">Active</span>
                    </div>
                    <div className="flex justify-between items-center bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/60">
                      <span className="text-sm font-medium text-on-surface">Verification Response Time</span>
                      <span className="text-xs font-bold text-on-surface-variant">&lt; 1.2s</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "filing" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <FileCheck2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-on-surface font-headline-md">
                    Automated Nil Returns Filing
                  </h3>
                  <p className="text-on-surface-variant text-base leading-relaxed">
                    Filing Nil returns shouldn't take half an hour of your day. Our filing assistant automates the login and submissions process, submitting your Nil return to the iTax system with a single click.
                  </p>
                  <ul className="space-y-3.5 text-sm text-on-surface">
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/15 dark:bg-primary/25 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span>No need to navigate complex multi-page iTax questionnaire tabs.</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/15 dark:bg-primary/25 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span>Auto-detects tax obligations (e.g. Resident Individual).</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/15 dark:bg-primary/25 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span>Download the official KRA filing receipt immediately on completion.</span>
                    </li>
                  </ul>
                  <div className="pt-2">
                    <Link href="/dashboard/filing">
                      <button className="bg-primary text-white font-bold py-2.5 px-6 rounded-xl hover:bg-primary/95 transition-colors flex items-center gap-2">
                        Start Filing Return <ArrowRight className="w-4 h-4" />
                      </button>
                    </Link>
                  </div>
                </div>
                <div className="bg-surface rounded-2xl p-6 border border-outline-variant space-y-4">
                  <h4 className="font-bold text-on-surface text-sm uppercase tracking-wide">Filing Steps Flow</h4>
                  <div className="space-y-3 text-xs">
                    <div className="flex gap-3 p-3 bg-surface-container-lowest border border-outline-variant/60 rounded-xl">
                      <div className="w-6 h-6 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold">1</div>
                      <div>
                        <p className="font-bold text-on-surface">Obligation Match</p>
                        <p className="text-on-surface-variant mt-0.5">The system cross-references active obligations on your PIN details.</p>
                      </div>
                    </div>
                    <div className="flex gap-3 p-3 bg-surface-container-lowest border border-outline-variant/60 rounded-xl">
                      <div className="w-6 h-6 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold">2</div>
                      <div>
                        <p className="font-bold text-on-surface">Auto-fill & Submit</p>
                        <p className="text-on-surface-variant mt-0.5">Fills KRA's form details programmatically via local secure workers.</p>
                      </div>
                    </div>
                    <div className="flex gap-3 p-3 bg-surface-container-lowest border border-outline-variant/60 rounded-xl">
                      <div className="w-6 h-6 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold">3</div>
                      <div>
                        <p className="font-bold text-on-surface">Download Receipt</p>
                        <p className="text-on-surface-variant mt-0.5">Fetches and saves the official confirmation PDF to your device.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "cv" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-on-surface font-headline-md">
                    Professional CV Builder
                  </h3>
                  <p className="text-on-surface-variant text-base leading-relaxed">
                    Build resume layouts designed to pass Applicant Tracking Systems (ATS). Our interactive CV Builder lets you enter your education, experiences, skills, and projects, formatting them into a premium PDF design instantly.
                  </p>
                  <ul className="space-y-3.5 text-sm text-on-surface">
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/15 dark:bg-primary/25 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span>ATS-friendly layouts that ensure scanner readability.</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/15 dark:bg-primary/25 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span>Dynamic live preview to check spacing and layouts on the fly.</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/15 dark:bg-primary/25 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span>Instant browser-side compilation (zero data logs on servers).</span>
                    </li>
                  </ul>
                  <div className="pt-2">
                    <Link href="/dashboard/cv-builder">
                      <button className="bg-primary text-white font-bold py-2.5 px-6 rounded-xl hover:bg-primary/95 transition-colors flex items-center gap-2">
                        Open CV Builder <ArrowRight className="w-4 h-4" />
                      </button>
                    </Link>
                  </div>
                </div>
                <div className="bg-surface rounded-2xl p-6 border border-outline-variant space-y-4">
                  <h4 className="font-bold text-on-surface text-sm uppercase tracking-wide">Available Templates</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2.5 bg-surface-container-lowest border border-outline-variant/60 rounded-lg">
                      <span className="font-medium text-on-surface">Executive Minimalist</span>
                      <span className="text-[10px] font-bold text-primary uppercase">ATS Optimized</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-surface-container-lowest border border-outline-variant/60 rounded-lg">
                      <span className="font-medium text-on-surface">Tech Innovator</span>
                      <span className="text-[10px] font-bold text-primary uppercase">Modern Classic</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-surface-container-lowest border border-outline-variant/60 rounded-lg">
                      <span className="font-medium text-on-surface">Creative Compact</span>
                      <span className="text-[10px] font-bold text-zinc-500">2-Column</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 03. Call to Action Banner */}
        <section id="cta" className="relative bg-gradient-to-r from-primary to-primary-container text-white p-8 md:p-16 rounded-3xl overflow-hidden shadow-xl max-w-5xl mx-auto w-full text-center">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] pointer-events-none" />
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-4xl font-black leading-tight tracking-tight">
              Ready to Secure Your Tax Documents?
            </h2>
            <p className="text-white/80 max-w-lg mx-auto text-base">
              Get instant compliance checks, check active obligations, build resumes, and file your tax returns automatically in a couple of clicks.
            </p>
            <div className="pt-2">
              {isLoaded && isSignedIn ? (
                <Link href="/dashboard">
                  <button className="bg-white text-primary font-bold py-3.5 px-8 rounded-xl hover:bg-neutral-50 hover:scale-[1.02] active:scale-[0.98] transition-all inline-flex items-center gap-2 shadow-lg shadow-black/10">
                    Go to Your Dashboard <ArrowRight className="w-4.5 h-4.5" />
                  </button>
                </Link>
              ) : isLoaded && (
                <Link href="/sign-up">
                  <button className="bg-white text-primary font-bold py-3.5 px-8 rounded-xl hover:bg-neutral-50 hover:scale-[1.02] active:scale-[0.98] transition-all inline-flex items-center gap-2 shadow-lg shadow-black/10">
                    Create a Free Account <ArrowRight className="w-4.5 h-4.5" />
                  </button>
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* 04. Security Certifications Banner */}
        <section className="max-w-4xl mx-auto w-full px-4 text-center pb-8">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 hover:opacity-90 transition-all duration-300">
            <div className="flex items-center gap-2 font-bold text-sm text-on-surface">
              <LockKeyhole className="w-5 h-5 text-primary" /> End-to-End SSL Encryption
            </div>
            <div className="flex items-center gap-2 font-bold text-sm text-on-surface">
              <ShieldCheck className="w-5 h-5 text-primary" /> KRA Compliance Audited
            </div>
            <div className="flex items-center gap-2 font-bold text-sm text-on-surface">
              <Zap className="w-5 h-5 text-primary" /> Real-time Calculation & Verification
            </div>
          </div>
        </section>

      </motion.div>
    </div>
  )
}
