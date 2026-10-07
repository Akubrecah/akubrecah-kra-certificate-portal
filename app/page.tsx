"use client"

import { useUser } from "@clerk/nextjs"
import { 
  ArrowRight, 
  Fingerprint, 
  ShieldCheck, 
  Zap, 
  Laptop, 
  Smartphone, 
  Cloud, 
  Layers, 
  Code2, 
  CheckCircle2, 
  FileCheck2, 
  Send, 
  Lock, 
  Cpu, 
  Terminal, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  Database,
  Server,
  Workflow
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
  const { isSignedIn, isLoaded } = useUser()
  const [activeStackTab, setActiveStackTab] = useState<"web" | "mobile" | "cloud" | "backend">("web")
  const [inquiryType, setInquiryType] = useState<string>("Web Engineering")
  const [inquirySent, setInquirySent] = useState(false)

  const services = [
    {
      id: "web",
      title: "Full-Stack Web Engineering",
      subtitle: "High-concurrency, ultra-fast web platforms",
      description: "We build enterprise-grade web applications utilizing Next.js, React, Node.js, and strict TypeScript. Engineered for Core Web Vitals, bulletproof reliability, and zero-compromise security.",
      icon: Laptop,
      features: [
        "Server-rendered & static modern Next.js architectures",
        "Reactive state synchronization & resilient caching",
        "Sub-second page loads & SEO/GEO optimization",
        "Comprehensive accessibility (WCAG 2.1 AA compliant)"
      ],
      tag: "Web & SaaS"
    },
    {
      id: "mobile",
      title: "Mobile Ecosystems (iOS & Android)",
      subtitle: "Fluid native & cross-platform applications",
      description: "From custom iOS applications in Swift to native Android and cross-platform React Native solutions. We craft mobile experiences that function offline, sync instantaneously, and delight users.",
      icon: Smartphone,
      features: [
        "Universal iOS & Android release pipelines",
        "Offline-first local persistence & automatic sync",
        "Biometric security, Apple Pay & Google Pay hooks",
        "Hardware sensor & background execution integration"
      ],
      tag: "iOS / Android"
    },
    {
      id: "cloud",
      title: "Cloud Infrastructure & DevOps",
      subtitle: "Autonomous scalability and zero-downtime",
      description: "Modern microservices, containerization with Docker and Kubernetes, automated CI/CD deployment pipelines, and high-availability cloud setups on AWS, GCP, and modern edge networks.",
      icon: Cloud,
      features: [
        "Kubernetes & Docker container orchestration",
        "Automated GitHub Actions / GitOps CI/CD pipelines",
        "Infrastructure as Code (IaC) & multi-region resilience",
        "Edge caching, CDN routing & DDoS mitigation"
      ],
      tag: "DevOps & Cloud"
    },
    {
      id: "enterprise",
      title: "Custom Enterprise & GovTech Systems",
      subtitle: "Mission-critical architectures for scale",
      description: "Purpose-built internal platforms, high-throughput financial gateways, and automated statutory data portals. Our systems process millions of automated requests with 99.99% uptime.",
      icon: Layers,
      features: [
        "High-throughput transactional APIs & microservices",
        "M-Pesa STK Push, Card & statutory payment gateways",
        "Government registry & public service integrations",
        "Automated audit logging & role-based access control"
      ],
      tag: "Enterprise"
    }
  ]

  const inHouseTools = [
    {
      title: "KRA Certificate Retrieval Portal",
      badge: "Flagship Product",
      description: "Our in-house automated statutory retrieval engine. Retrieve official KRA PIN certificates and Compliance Certificates instantly with National ID or PIN. Instant PDF generation & automated verification.",
      href: "/retrieval-portal",
      icon: FileCheck2,
      ctaText: "Launch Retrieval Portal",
      stats: "50,000+ Certificates Issued"
    },
    {
      title: "Live PIN & ID Validator",
      badge: "GovTech Utility",
      description: "Real-time automated taxpayer status validation, station verification, and fraud prevention gateway connecting directly with official tax registries.",
      href: "/pin-checker",
      icon: ShieldCheck,
      ctaText: "Run Live PIN Check",
      stats: "Instant Real-Time Verification"
    },
    {
      title: "Automated Tax Returns Filing",
      badge: "Compliance Engine",
      description: "A streamlined, guided tax compliance assistant that prepares and files nil returns with automated validation checks and receipt generation.",
      href: "/dashboard/filing",
      icon: Send,
      ctaText: "File Returns Online",
      stats: "Zero-Error Compliance"
    }
  ]

  const stackItems = {
    web: [
      { name: "Next.js 15 / React 19", role: "SSR, ISR & Modern Frontend Architecture" },
      { name: "TypeScript", role: "Strict End-to-End Type Safety" },
      { name: "Tailwind CSS & Tokens", role: "Modern Design Systems & Micro-motion" },
      { name: "Framer Motion", role: "Hardware-Accelerated UI Interactions" }
    ],
    mobile: [
      { name: "React Native", role: "Cross-Platform High-Performance Mobile" },
      { name: "Swift / SwiftUI", role: "Native iOS Systems & Widget Extensions" },
      { name: "Kotlin / Jetpack", role: "Native Android Engineering" },
      { name: "SQLite / WatermelonDB", role: "Offline-First Reactive Local Stores" }
    ],
    cloud: [
      { name: "Docker & Kubernetes", role: "Scalable Container Architecture" },
      { name: "AWS & GCP Cloud", role: "High-Availability Infrastructure" },
      { name: "GitHub Actions", role: "Continuous Integration & Automated Delivery" },
      { name: "PostgreSQL & Redis", role: "Relational Persistence & High-Speed Cache" }
    ],
    backend: [
      { name: "Node.js & Express", role: "High-Throughput Microservice APIs" },
      { name: "Python / FastAPI", role: "Data Processing & Algorithmic Workflows" },
      { name: "Prisma ORM", role: "Declarative & Type-Safe Database Access" },
      { name: "M-Pesa Daraja API", role: "Seamless Mobile Payment Gateways" }
    ]
  }

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setInquirySent(true)
  }

  return (
    <div className="relative z-10 w-full bg-background text-on-background font-sans overflow-x-hidden">
      
      {/* Dynamic Background Mesh (Strictly No Purple - Red/Neutral/Warm Glow) */}
      <div className="absolute top-0 inset-x-0 h-[650px] bg-[radial-gradient(ellipse_at_top,rgba(186,26,26,0.08)_0%,transparent_70%)] pointer-events-none z-0" />
      <div className="absolute top-24 right-[10%] w-80 h-80 bg-primary/5 rounded-full filter blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-[40%] left-[5%] w-72 h-72 bg-neutral-900/5 dark:bg-zinc-800/20 rounded-full filter blur-[100px] pointer-events-none z-0" />

      {/* Main Content Wrapper */}
      <div className="w-full flex flex-col space-y-20 md:space-y-28 py-6 md:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* ========================================================= */}
        {/* 01. HERO SECTION                                          */}
        {/* ========================================================= */}
        <section id="hero" className="pt-6 md:pt-12 text-center max-w-4xl mx-auto space-y-6">
          
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-high border border-outline-variant text-xs font-semibold text-on-surface shadow-xs animate-in fade-in duration-500">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-ping" />
            <span className="text-primary font-bold">Akubrecah Technologies</span>
            <span className="text-outline-muted">|</span>
            <span className="text-on-surface-variant">Full-Cycle Software Engineering Firm</span>
          </div>

          {/* Master Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-on-surface tracking-tight leading-[1.12]">
            Architecting Resilient <br className="hidden sm:inline" />
            <span className="text-primary bg-gradient-to-r from-primary via-red-600 to-[#900010] bg-clip-text text-transparent">
              Web, Mobile & Cloud Systems.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            We build high-performance web applications, native iOS & Android platforms, scalable cloud infrastructure, 
            and mission-critical automated tools. Home of East Africa&apos;s leading KRA compliance automation suite.
          </p>

          {/* Primary Action Group */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4 max-w-md mx-auto w-full">
            <Link href="#contact" className="w-full sm:w-auto flex-1">
              <Button size="lg" className="w-full h-12 px-6 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/95 shadow-md shadow-primary/20 flex items-center justify-center gap-2 group">
                <span>Start a Project</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>

            <Link href="#in-house-products" className="w-full sm:w-auto flex-1">
              <Button variant="outline" size="lg" className="w-full h-12 px-6 rounded-xl border-outline-variant font-bold text-sm hover:bg-surface-container flex items-center justify-center gap-2">
                <FileCheck2 className="h-4 w-4 text-primary" />
                <span>In-House Products</span>
              </Button>
            </Link>
          </div>

          {/* Live Trust Metrics Strip */}
          <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto border-t border-outline-variant/60">
            <div className="flex flex-col items-center p-3">
              <span className="text-2xl sm:text-3xl font-black text-on-surface">
                <Counter value="99.98%" />
              </span>
              <span className="text-xs text-on-surface-variant mt-0.5">Uptime SLA</span>
            </div>
            <div className="flex flex-col items-center p-3">
              <span className="text-2xl sm:text-3xl font-black text-on-surface">
                <Counter value="120k+" />
              </span>
              <span className="text-xs text-on-surface-variant mt-0.5">Automated Queries</span>
            </div>
            <div className="flex flex-col items-center p-3">
              <span className="text-2xl sm:text-3xl font-black text-on-surface">
                <Counter value="100%" />
              </span>
              <span className="text-xs text-on-surface-variant mt-0.5">Type-Safe Stack</span>
            </div>
            <div className="flex flex-col items-center p-3">
              <span className="text-2xl sm:text-3xl font-black text-on-surface">
                <Counter value="24/7" />
              </span>
              <span className="text-xs text-on-surface-variant mt-0.5">Monitoring & Guard</span>
            </div>
          </div>
        </section>


        {/* ========================================================= */}
        {/* 02. IN-HOUSE PRODUCTS: KRA SUITE HIGHLIGHT                */}
        {/* ========================================================= */}
        <section id="in-house-products" className="space-y-8 scroll-mt-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant pb-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider mb-1">
                <Sparkles className="h-4 w-4" />
                <span>Featured In-House Systems</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-on-surface">
                Battle-Tested Statutory Automation Suite
              </h2>
              <p className="text-sm text-on-surface-variant max-w-xl mt-1">
                Our in-house products demonstrate the precision of our engineering. Used daily by thousands for instant, verified tax compliance.
              </p>
            </div>
            {isLoaded && isSignedIn ? (
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="h-10 px-4 rounded-xl text-xs font-bold gap-2">
                  <span>Launch Client Console</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            ) : (
              <Link href="/sign-up">
                <Button size="sm" className="h-10 px-4 rounded-xl bg-primary text-white text-xs font-bold gap-2">
                  <span>Create Account</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {inHouseTools.map((tool) => {
              const Icon = tool.icon
              return (
                <div
                  key={tool.title}
                  className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant hover:border-primary/50 transition-all duration-300 shadow-soft hover:shadow-xl flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant border border-outline-variant">
                        {tool.badge}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-on-surface group-hover:text-primary transition-colors">
                        {tool.title}
                      </h3>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        {tool.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 mt-4 border-t border-outline-variant/60 space-y-3">
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block">
                      ✓ {tool.stats}
                    </span>
                    <Link href={tool.href} className="block">
                      <Button className="w-full h-10 rounded-xl bg-surface-container-high hover:bg-primary text-on-surface hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 group-hover:bg-primary group-hover:text-white">
                        <span>{tool.ctaText}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </section>


        {/* ========================================================= */}
        {/* 03. FULL-CYCLE SOFTWARE ENGINEERING SERVICES              */}
        {/* ========================================================= */}
        <section id="services" className="space-y-10 scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-primary uppercase tracking-widest">
              Capabilities & Offerings
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-on-surface tracking-tight">
              From Concept to Scaled Production
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              We design, build, and maintain digital products that withstand heavy user loads, stringent security standards, and rapid scaling.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service) => {
              const Icon = service.icon
              return (
                <div
                  key={service.id}
                  className="p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant hover:border-primary/40 transition-all duration-300 shadow-soft flex flex-col justify-between"
                >
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="p-3.5 rounded-2xl bg-surface-container text-primary">
                        <Icon className="h-7 w-7" />
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-wider text-primary px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                        {service.tag}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-xl font-bold text-on-surface">
                        {service.title}
                      </h3>
                      <p className="text-xs font-semibold text-primary">
                        {service.subtitle}
                      </p>
                      <p className="text-xs text-on-surface-variant leading-relaxed pt-1">
                        {service.description}
                      </p>
                    </div>

                    <div className="space-y-2 pt-2">
                      {service.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-on-surface">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-outline-variant/60">
                    <Link href="#contact" className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline">
                      <span>Request consultation on {service.title}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </section>


        {/* ========================================================= */}
        {/* 04. ENGINEERING METHODOLOGY / PROCESS                     */}
        {/* ========================================================= */}
        <section id="process" className="p-8 sm:p-12 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-soft space-y-8 scroll-mt-24">
          <div className="max-w-xl space-y-2">
            <span className="text-xs font-bold text-primary uppercase tracking-widest">
              Execution Discipline
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-on-surface">
              How We Deliver Software
            </h2>
            <p className="text-xs text-on-surface-variant">
              Every project follows our 5-phase engineering methodology to eliminate bottlenecks and guarantee reliability.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-surface-container border border-outline-variant space-y-2.5">
              <span className="text-xs font-mono font-black text-primary">01 / ARCHITECT</span>
              <h4 className="text-sm font-bold text-on-surface">System Architecture</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Requirements scoping, API contracts, schema models, and security boundary definition before touching code.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-surface-container border border-outline-variant space-y-2.5">
              <span className="text-xs font-mono font-black text-primary">02 / BUILD</span>
              <h4 className="text-sm font-bold text-on-surface">Vertical Slice Sprints</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Clean, end-to-end features delivered incrementally — UI, business logic, persistence, and verification.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-surface-container border border-outline-variant space-y-2.5">
              <span className="text-xs font-mono font-black text-primary">03 / AUDIT</span>
              <h4 className="text-sm font-bold text-on-surface">Rigorous Testing & QA</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Automated type-checking, linter validation, integration tests, and OWASP security vulnerability reviews.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-surface-container border border-outline-variant space-y-2.5">
              <span className="text-xs font-mono font-black text-primary">04 / DEPLOY</span>
              <h4 className="text-sm font-bold text-on-surface">Zero-Downtime Rollout</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Edge deployment, blue-green releases, health telemetry, and ongoing performance profiling.
              </p>
            </div>
          </div>
        </section>


        {/* ========================================================= */}
        {/* 05. TECHNOLOGY STACK MATRIX                               */}
        {/* ========================================================= */}
        <section id="stack" className="space-y-6 scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-primary uppercase tracking-widest">
                Our Toolchain
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-on-surface">
                Production-Grade Technologies
              </h2>
            </div>

            {/* Tab switchers */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-container border border-outline-variant text-xs font-bold">
              {(["web", "mobile", "cloud", "backend"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveStackTab(tab)}
                  className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
                    activeStackTab === tab
                      ? "bg-surface-container-lowest text-primary shadow-xs"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stackItems[activeStackTab].map((tech) => (
              <div
                key={tech.name}
                className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant shadow-soft space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm font-bold text-on-surface">{tech.name}</span>
                </div>
                <p className="text-xs text-on-surface-variant">{tech.role}</p>
              </div>
            ))}
          </div>
        </section>


        {/* ========================================================= */}
        {/* 06. SOLUTIONS & INDUSTRIES                                */}
        {/* ========================================================= */}
        <section id="solutions" className="space-y-8 scroll-mt-24">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-bold text-primary uppercase tracking-widest">
              Specialized Domains
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-on-surface">
              Tailored for Complex Business Environments
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant space-y-3">
              <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-primary/10 text-primary">Fintech & Payments</span>
              <h3 className="text-lg font-bold text-on-surface">Automated Financial Workflows</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                M-Pesa STK Push integrations, multi-currency ledger engines, automated payment callbacks, and automated reconciliations with bank statements.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant space-y-3">
              <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-primary/10 text-primary">GovTech & Public Portals</span>
              <h3 className="text-lg font-bold text-on-surface">Statutory & Identity Platforms</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Government registry gateways, National ID verification, automated certificate generation, and secure document storage adhering to Kenyan data privacy standards.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant space-y-3">
              <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-primary/10 text-primary">Enterprise Workflows</span>
              <h3 className="text-lg font-bold text-on-surface">Digitized Business Operations</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Replacing sluggish manual paperwork with real-time web & mobile portals, automated PDF document generation, and custom role-based dashboards.
              </p>
            </div>
          </div>
        </section>


        {/* ========================================================= */}
        {/* 07. INTERACTIVE PROJECT INQUIRY / CONTACT                */}
        {/* ========================================================= */}
        <section id="contact" className="p-8 sm:p-12 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-soft scroll-mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            
            <div className="space-y-4">
              <span className="text-xs font-bold text-primary uppercase tracking-widest">
                Get in Touch
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-on-surface tracking-tight">
                Let&apos;s Build Your Next Engineering Breakthrough.
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Whether you need a dedicated development team for a full-scale web/mobile platform, a custom GovTech integration, or enterprise cloud migration — Akubrecah Technologies brings unmatched engineering rigor.
              </p>

              <div className="pt-2 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="text-on-surface">Direct access to senior software architects</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="text-on-surface">Detailed technical architecture proposals within 48 hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="text-on-surface">Proven production track record in East Africa</span>
                </div>
              </div>
            </div>

            {/* Interactive Form Card */}
            <div className="p-6 sm:p-8 rounded-2xl bg-surface-container border border-outline-variant">
              {inquirySent ? (
                <div className="text-center py-10 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-on-surface">Consultation Request Received</h3>
                  <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                    Thank you! Our engineering lead will review your project requirements and contact you within 24 business hours.
                  </p>
                  <Button
                    onClick={() => setInquirySent(false)}
                    variant="outline"
                    size="sm"
                    className="text-xs rounded-xl"
                  >
                    Submit Another Inquiry
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleInquirySubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface">Project Domain</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        "Web Engineering", 
                        "Mobile App (iOS/Android)", 
                        "Cloud & DevOps", 
                        "GovTech / Statutory"
                      ].map((type) => (
                        <button
                          type="button"
                          key={type}
                          onClick={() => setInquiryType(type)}
                          className={`p-2 rounded-xl text-left text-xs font-semibold border transition-all ${
                            inquiryType === type
                              ? "bg-primary text-white border-primary shadow-xs"
                              : "bg-surface-container-lowest text-on-surface border-outline-variant hover:border-primary/50"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface">Your Name & Organization</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Kelvin Mutua — Tech Lead at Alpha Corp"
                      className="w-full h-10 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface">Work Email or Phone</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. kelvin@company.com or +254 7..."
                      className="w-full h-10 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface">Brief Project Requirements</label>
                    <textarea
                      rows={3}
                      placeholder="Tell us what you want to build, key objectives, or timeline..."
                      className="w-full p-3 rounded-xl bg-surface-container-lowest border border-outline-variant text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/95 shadow-md shadow-primary/20"
                  >
                    Send Engineering Inquiry &rarr;
                  </Button>
                </form>
              )}
            </div>

          </div>
        </section>

      </div>
    </div>
  )
}
