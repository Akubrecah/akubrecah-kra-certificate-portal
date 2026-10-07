"use client"

import { useUser } from "@clerk/nextjs"
import { 
  ArrowRight, 
  Laptop, 
  Smartphone, 
  Cloud, 
  Layers, 
  FileCheck2, 
  ShieldCheck, 
  Send, 
  CheckCircle2, 
  Sparkles,
  Code2,
  Zap,
  Globe
} from 'lucide-react'
import { motion, useInView, animate } from "framer-motion"
import { useRef, useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

function Counter({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })
  const [displayValue, setDisplayValue] = useState("0")
  
  useEffect(() => {
    if (!isInView) return
    const match = value.match(/([0-9.]+)/)
    if (!match) { setDisplayValue(value); return }
    const num = parseFloat(match[1])
    const prefix = value.substring(0, match.index)
    const suffix = value.substring(match.index! + match[1].length)
    const isDecimal = match[1].includes(".")
    const decimals = isDecimal ? match[1].split(".")[1].length : 0
    const controls = animate(0, num, {
      duration: 2.0,
      ease: "easeOut",
      onUpdate(val) { setDisplayValue(`${prefix}${val.toFixed(decimals)}${suffix}`) }
    })
    return () => controls.stop()
  }, [value, isInView])

  return <span ref={ref}>{displayValue}</span>
}

export default function Home() {
  const { isSignedIn, isLoaded } = useUser()

  const inHouseTools = [
    {
      title: "KRA Certificate Retrieval Portal",
      badge: "KES 20 · Instant Download",
      description: "Instant official KRA compliance document retrieval by National ID or PIN. Automated PDF generation, verified in seconds for only KES 20.",
      href: "/retrieval-portal",
      icon: FileCheck2,
      ctaText: "Retrieve Certificate (KES 20)",
      color: "text-primary"
    },
    {
      title: "Live PIN & ID Validator",
      badge: "GovTech",
      description: "Real-time taxpayer status validation, station verification, and fraud prevention connecting to official tax registries.",
      href: "/pin-checker",
      icon: ShieldCheck,
      ctaText: "Run PIN Check",
      color: "text-red-600 dark:text-red-400"
    },
    {
      title: "Automated Tax Filing",
      badge: "Compliance",
      description: "Streamlined nil returns and statutory submission pipeline with automated validation and receipt generation.",
      href: "/dashboard/filing",
      icon: Send,
      ctaText: "File Returns",
      color: "text-emerald-600"
    }
  ]

  const capabilities = [
    { icon: Laptop, label: "Web Engineering", desc: "Next.js, React, TypeScript", href: "/services" },
    { icon: Smartphone, label: "Mobile Apps", desc: "iOS, Android, React Native", href: "/services" },
    { icon: Cloud, label: "Cloud & DevOps", desc: "AWS, GCP, Kubernetes", href: "/services" },
    { icon: Layers, label: "Enterprise Systems", desc: "APIs, ERPs, Automation", href: "/services" },
  ]

  return (
    <div className="relative w-full bg-background text-on-background font-sans overflow-x-hidden">
      
      {/* Background glow — deep red, no purple */}
      <div className="absolute top-0 inset-x-0 h-[700px] bg-[radial-gradient(ellipse_at_20%_0%,rgba(186,26,26,0.10)_0%,transparent_70%)] pointer-events-none z-0" />
      <div className="absolute top-20 right-[8%] w-96 h-96 bg-primary/4 rounded-full filter blur-[130px] pointer-events-none z-0" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col space-y-24 pb-24 pt-8 md:pt-14">

        {/* ============================= HERO ============================= */}
        <section id="hero" className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          
          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
            className="flex-1 space-y-7"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-high border border-outline-variant text-xs font-semibold shadow-xs">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-ping" />
              <span className="font-black text-primary">Akubrecah Technologies</span>
              <span className="text-outline-muted">·</span>
              <span className="text-on-surface-variant">Nairobi, Kenya</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-on-surface tracking-tight leading-[1.06]">
              Engineering<br />
              <span className="text-primary bg-gradient-to-br from-primary to-red-800 bg-clip-text text-transparent">
                Digital Products
              </span><br />
              That Scale.
            </h1>

            <p className="text-base sm:text-lg text-on-surface-variant max-w-lg leading-relaxed">
              Full-cycle software engineering — from concept to production. Web platforms, 
              native mobile apps, cloud infrastructure, and mission-critical automated systems 
              engineered for East Africa and beyond.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link href="/contact">
                <Button size="lg" className="h-13 px-7 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/92 shadow-lg shadow-primary/20 flex items-center gap-2 group">
                  <span>Start a Project</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/services">
                <Button variant="outline" size="lg" className="h-13 px-7 rounded-xl border-outline-variant font-bold text-sm hover:bg-surface-container flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-primary" />
                  <span>View Services</span>
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Right: Animated Capability Grid */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, delay: 0.15, ease: "easeOut" }}
            className="flex-1 grid grid-cols-2 gap-4 w-full max-w-md"
          >
            {capabilities.map((cap, i) => {
              const Icon = cap.icon
              return (
                <Link
                  key={cap.label}
                  href={cap.href}
                  className="group p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant hover:border-primary/50 hover:shadow-md transition-all duration-300 space-y-3"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary w-fit group-hover:bg-primary group-hover:text-white transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">{cap.label}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{cap.desc}</p>
                  </div>
                </Link>
              )
            })}
          </motion.div>
        </section>

        {/* ============================= METRICS ============================= */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 border-y border-outline-variant py-10">
          {[
            { value: "99.98%", label: "Platform Uptime" },
            { value: "120k+", label: "Automated Requests" },
            { value: "50k+", label: "Certificates Issued" },
            { value: "24/7", label: "System Monitoring" },
          ].map((m) => (
            <div key={m.label} className="flex flex-col items-center gap-1 p-4">
              <span className="text-3xl sm:text-4xl font-black text-on-surface">
                <Counter value={m.value} />
              </span>
              <span className="text-xs text-on-surface-variant text-center">{m.label}</span>
            </div>
          ))}
        </section>

        {/* ============================= IN-HOUSE TOOLS ============================= */}
        <section id="products" className="space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-black text-primary uppercase tracking-widest">
                <Sparkles className="h-3.5 w-3.5" />
                In-House Products
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-on-surface tracking-tight">
                Live Statutory Automation Suite
              </h2>
              <p className="text-sm text-on-surface-variant max-w-xl">
                Our flagship in-house systems power thousands of daily verified tax compliance 
                operations across Kenya — built on the same engineering standards we deliver to clients.
              </p>
            </div>
            <Link href="/products">
              <Button variant="outline" size="sm" className="h-10 px-5 rounded-xl font-bold text-xs gap-2 shrink-0">
                All Products <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {inHouseTools.map((tool) => {
              const Icon = tool.icon
              const isFlagship = tool.href === "/retrieval-portal"
              return (
                <div 
                  key={tool.title} 
                  className={`group p-7 rounded-3xl bg-surface-container-lowest border transition-all duration-300 flex flex-col ${
                    isFlagship 
                      ? 'border-primary/40 ring-1 ring-primary/25 shadow-lg shadow-primary/5 hover:border-primary hover:shadow-2xl hover:shadow-primary/10' 
                      : 'border-outline-variant hover:border-primary/40 shadow-soft hover:shadow-xl'
                  }`}
                >
                  <div className="flex items-center justify-between mb-5">
                    <div className={`p-3 rounded-xl transition-colors ${
                      isFlagship 
                        ? 'bg-primary text-white shadow-md shadow-primary/20' 
                        : `bg-surface-container ${tool.color} group-hover:bg-primary group-hover:text-white`
                    }`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
                      isFlagship 
                        ? 'bg-primary/10 text-primary border-primary/30 font-black' 
                        : 'bg-surface-container text-on-surface-variant border-outline-variant'
                    }`}>
                      {tool.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-on-surface mb-2 group-hover:text-primary transition-colors">{tool.title}</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed flex-1">{tool.description}</p>
                  <div className="pt-5 mt-4 border-t border-outline-variant/60">
                    <Link href={tool.href}>
                      <Button className={`w-full h-11 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                        isFlagship 
                          ? 'bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20' 
                          : 'bg-surface-container group-hover:bg-primary text-on-surface group-hover:text-white'
                      }`}>
                        {tool.ctaText} <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ============================= SERVICES TEASER ============================= */}
        <section className="p-10 sm:p-14 rounded-3xl bg-on-surface text-background dark:bg-surface-container-lowest dark:text-on-surface space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-primary">Engineering Capabilities</span>
              <h2 className="text-3xl sm:text-4xl font-black leading-tight">
                Built for Complexity.<br />Delivered with Precision.
              </h2>
              <p className="text-sm opacity-70 max-w-md leading-relaxed">
                From fintech payment gateways to government portals, from consumer mobile apps to enterprise ERPs — 
                we architect systems that handle real-world scale.
              </p>
            </div>
            <Link href="/services">
              <Button size="lg" className="h-13 px-7 rounded-xl bg-primary text-white font-bold text-sm flex items-center gap-2 group shrink-0">
                <span>Explore All Services</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Globe, title: "Web Platforms", sub: "Next.js · React · TypeScript" },
              { icon: Smartphone, title: "Mobile Apps", sub: "iOS · Android · RN" },
              { icon: Cloud, title: "Cloud & DevOps", sub: "AWS · K8s · CI/CD" },
              { icon: Zap, title: "GovTech APIs", sub: "M-Pesa · KRA · Custom" },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="p-4 rounded-2xl bg-white/5 dark:bg-surface-container border border-white/10 dark:border-outline-variant space-y-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <p className="font-bold text-sm">{item.title}</p>
                  <p className="text-xs opacity-60">{item.sub}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* ============================= PROCESS TEASER ============================= */}
        <section className="space-y-8 text-center max-w-3xl mx-auto">
          <div className="space-y-3">
            <span className="text-xs font-black text-primary uppercase tracking-widest">How We Work</span>
            <h2 className="text-3xl sm:text-4xl font-black text-on-surface">
              Disciplined Engineering Methodology
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Every project runs through our proven 4-phase lifecycle — no shortcuts, no surprises.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-0 items-center justify-center">
            {[
              { step: "01", label: "Architect" },
              { step: "02", label: "Build" },
              { step: "03", label: "Audit" },
              { step: "04", label: "Deploy" },
            ].map((phase, i) => (
              <div key={phase.step} className="flex items-center">
                <div className="px-5 py-3 rounded-2xl bg-surface-container-lowest border border-outline-variant text-center min-w-[110px]">
                  <span className="text-xs font-mono font-black text-primary">{phase.step}</span>
                  <p className="font-bold text-sm text-on-surface">{phase.label}</p>
                </div>
                {i < 3 && <div className="hidden sm:block w-8 h-0.5 bg-outline-variant" />}
              </div>
            ))}
          </div>
          <Link href="/about">
            <Button variant="outline" size="sm" className="h-10 px-6 rounded-xl font-bold text-xs gap-2">
              Learn Our Methodology <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </section>

        {/* ============================= CTA BAND ============================= */}
        <section className="relative overflow-hidden p-10 sm:p-14 rounded-3xl bg-primary text-white space-y-6 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.08)_0%,transparent_60%)] pointer-events-none" />
          <div className="relative z-10 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-black leading-tight">
              Ready to Build Your Next<br />Digital System?
            </h2>
            <p className="text-white/80 text-sm max-w-lg mx-auto">
              Our engineering team is ready to scope, architect, and deliver your product — 
              from MVP to enterprise scale.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link href="/contact">
                <Button size="lg" className="h-13 px-7 rounded-xl bg-white text-primary font-bold text-sm hover:bg-white/92 flex items-center gap-2 group">
                  Start a Project <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/products">
                <Button variant="outline" size="lg" className="h-13 px-7 rounded-xl border-white/40 text-white font-bold text-sm hover:bg-white/10 flex items-center gap-2">
                  View In-House Products
                </Button>
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
