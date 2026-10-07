"use client"

import Link from "next/link"
import { CheckCircle2, ArrowRight, Globe, Zap, Shield, Users, Laptop, Smartphone, Cloud, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const solutions = [
  {
    id: "fintech",
    title: "Financial Technology & Payments",
    subtitle: "Automated payment flows, multi-currency ledgers & instant reconciliation",
    description: "From M-Pesa Daraja STK Push integrations to multi-currency balance ledgers and automated reconciliation systems — we build the financial infrastructure that powers modern business in East Africa.",
    icon: Zap,
    tag: "Fintech & Payments",
    color: "text-primary",
    bgColor: "bg-primary/10",
    deliverables: [
      "M-Pesa Daraja API (STK Push, C2B, B2C, B2B) architecture",
      "Card payment gateways (Stripe, Paystack, DPO, Pesapal)",
      "Multi-currency transaction ledger engines",
      "Automated bank statement reconciliation pipelines",
      "Real-time financial dashboards & cashflow telemetry",
      "Fraud detection signals & risk scoring algorithms",
    ],
    stats: [
      { label: "M-Pesa Uptime", value: "99.9%" },
      { label: "Settlement Speed", value: "Real-time" },
      { label: "Compliance", value: "PCI-DSS" },
    ],
  },
  {
    id: "govtech",
    title: "Government & Public Sector",
    subtitle: "Statutory compliance portals & secure citizen-facing services",
    description: "We specialize in digitizing public sector workflows — from citizen identity verification gateways to automated statutory compliance portals and inter-agency data exchange APIs.",
    icon: Shield,
    tag: "GovTech Systems",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/40",
    deliverables: [
      "National ID & KRA PIN verification gateways",
      "Automated compliance certificate generation engines",
      "Statutory returns filing automation workflows",
      "Role-based citizen portal access control & audit trails",
      "Government API integrations (KRA, NTSA, eCitizen)",
      "PDPA & data protection compliance architecture",
    ],
    stats: [
      { label: "Validations Daily", value: "10,000+" },
      { label: "Certificate Time", value: "< 30s" },
      { label: "PDPA Compliance", value: "100%" },
    ],
  },
  {
    id: "enterprise",
    title: "Enterprise Operations & ERP",
    subtitle: "Replacing manual paperwork with intelligent, auditable digital portals",
    description: "Digitize sprawling operational workflows with real-time web and mobile portals, automated document generation pipelines, custom ERP modules, and analytics telemetry.",
    icon: Users,
    tag: "Enterprise Systems",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
    deliverables: [
      "Custom ERP modules & operational management tools",
      "High-volume cryptographic PDF document generation",
      "Granular approval hierarchies & Role-Based Access Control",
      "CRM & third-party enterprise integrations",
      "Real-time business intelligence telemetry dashboards",
      "Automated multi-channel notification pipelines (SMS/Email)",
    ],
    stats: [
      { label: "Paperwork Reduced", value: "85%" },
      { label: "Process Velocity", value: "4x Faster" },
      { label: "Audit Accuracy", value: "99.9%" },
    ],
  },
  {
    id: "saas",
    title: "SaaS Product Engineering",
    subtitle: "Full-cycle product architecture and development for tech startups",
    description: "From initial MVP to Series A scale, we act as the senior technical partner for software ventures. We architect, build, and deploy multi-tenant SaaS products designed for rapid iteration and rock-solid stability.",
    icon: Globe,
    tag: "SaaS & Ventures",
    color: "text-primary",
    bgColor: "bg-primary/10",
    deliverables: [
      "Rapid MVP delivery built on production-quality foundations",
      "Multi-tenant subscription billing (Stripe, Paystack, M-Pesa)",
      "Authentication, SSO & team permission management",
      "Usage metering and real-time product analytics",
      "Public API design, rate-limiting & developer documentation",
      "Cloud-native auto-scaling architecture from Day 1",
    ],
    stats: [
      { label: "Time-to-Market", value: "6-8 Weeks" },
      { label: "Architecture", value: "Multi-tenant" },
      { label: "Scalability", value: "100K+ Users" },
    ],
  },
]

const processSteps = [
  {
    num: "01",
    title: "Discovery & System Architecture",
    desc: "We define system boundaries, data models, API contracts, and security policies before touching a single line of production code.",
  },
  {
    num: "02",
    title: "Vertical Slice Iterations",
    desc: "We build thin, complete slices — UI, business logic, persistence, and automated verification — providing testable software every sprint.",
  },
  {
    num: "03",
    title: "Security & QA Hardening",
    desc: "Automated type checking, security static analysis, integration testing, and performance profiling are run prior to every release.",
  },
  {
    num: "04",
    title: "Zero-Downtime Deployment",
    desc: "Automated GitOps deployments with blue-green failover and live telemetry monitoring ensure continuous service availability.",
  },
]

export default function SolutionsPage() {
  return (
    <div className="min-h-screen bg-background text-on-background">

      {/* Page Hero - Matching Products Design */}
      <div className="bg-surface-container-lowest border-b border-outline-variant">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 space-y-6">
          <nav className="flex items-center gap-2 text-xs text-on-surface-variant">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <span className="text-on-surface font-semibold">Industry Solutions</span>
          </nav>
          <div className="max-w-3xl space-y-4">
            <span className="text-xs font-black text-primary uppercase tracking-widest">Industry Specializations</span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-on-surface tracking-tight leading-tight">
              Software Solutions<br />
              <span className="text-primary">for Complex Domains.</span>
            </h1>
            <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl leading-relaxed">
              We combine deep sector knowledge with engineering rigor to deliver software that solves mission-critical business challenges — from fintech payment rails to government automation portals.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/contact">
              <Button size="lg" className="h-12 px-7 rounded-xl bg-primary text-white font-bold text-sm flex items-center gap-2 group">
                Discuss Your Requirements <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 space-y-20">

        {/* Solutions Grid - Matching Products Card Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {solutions.map((sol) => {
            const Icon = sol.icon
            return (
              <div 
                key={sol.id} 
                id={sol.id} 
                className="p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-soft hover:border-primary/40 transition-all duration-300 space-y-6 flex flex-col justify-between"
              >
                <div className="space-y-6">
                  {/* Icon & Tag */}
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl ${sol.bgColor} ${sol.color}`}>
                      <Icon className="h-7 w-7" />
                    </div>
                    <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full ${sol.bgColor} ${sol.color} border border-current/20`}>
                      {sol.tag}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-on-surface">{sol.title}</h2>
                    <p className={`text-xs font-bold mt-1 ${sol.color}`}>{sol.subtitle}</p>
                    <p className="text-xs sm:text-sm text-on-surface-variant mt-3 leading-relaxed">{sol.description}</p>
                  </div>

                  {/* Deliverables checklist */}
                  <div className="space-y-2.5">
                    {sol.deliverables.map((item) => (
                      <div key={item} className="flex items-start gap-2.5 text-xs sm:text-sm text-on-surface">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-outline-variant space-y-4">
                  {/* Stats Mini Row */}
                  <div className="grid grid-cols-3 gap-2">
                    {sol.stats.map((stat) => (
                      <div key={stat.label} className="p-2.5 rounded-xl bg-surface-container text-center">
                        <span className="block text-[10px] text-on-surface-variant font-medium">{stat.label}</span>
                        <span className="block text-xs font-black text-on-surface mt-0.5">{stat.value}</span>
                      </div>
                    ))}
                  </div>

                  <Link href={`/contact?solution=${sol.id}`} className="block">
                    <Button className="w-full h-11 rounded-xl bg-primary text-white font-bold text-xs flex items-center justify-center gap-2 group">
                      Consult on {sol.title} <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        {/* Execution Framework / 4 Steps */}
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-black text-primary uppercase tracking-widest">Delivery Framework</span>
            <h2 className="text-3xl font-black text-on-surface">How We Deliver Every Project</h2>
            <p className="text-sm text-on-surface-variant max-w-xl mx-auto">
              Regardless of domain or technical complexity, our work follows a structured 4-phase methodology.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {processSteps.map((step) => (
              <div key={step.num} className="p-7 rounded-3xl bg-surface-container-lowest border border-outline-variant space-y-4 shadow-soft">
                <span className="text-xs font-mono font-black text-primary px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 w-fit inline-block">
                  Phase {step.num}
                </span>
                <h3 className="text-base font-bold text-on-surface">{step.title}</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Cross-Platform Ecosystem Banner */}
        <div className="p-8 sm:p-12 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-soft space-y-8">
          <div className="text-center space-y-3">
            <span className="text-xs font-black text-primary uppercase tracking-widest">Unified Ecosystems</span>
            <h2 className="text-3xl font-black text-on-surface">Cross-Platform. End-to-End.</h2>
            <p className="text-sm text-on-surface-variant max-w-xl mx-auto">
              We deliver cohesive product ecosystems — responsive web apps, native mobile apps, and scalable cloud APIs — all under one unified engineering team.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { icon: Laptop, label: "Web Applications", sub: "Next.js 15 · React 19 · TypeScript" },
              { icon: Smartphone, label: "Mobile Apps", sub: "iOS Swift · Android Kotlin · React Native" },
              { icon: Cloud, label: "Cloud & DevOps", sub: "AWS · GCP · Docker · K8s · CI/CD" },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="p-6 rounded-2xl bg-surface-container text-center space-y-2">
                  <Icon className="h-7 w-7 text-primary mx-auto" />
                  <p className="font-bold text-sm text-on-surface">{item.label}</p>
                  <p className="text-xs text-on-surface-variant">{item.sub}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottom CTA Banner - Matching Products Style */}
        <div className="p-10 sm:p-14 rounded-3xl bg-primary text-white text-center space-y-5">
          <h2 className="text-3xl font-black">Ready to Build a Tailored Solution?</h2>
          <p className="text-white/80 text-sm max-w-lg mx-auto">
            Share your system requirements with our senior team. We will review your architecture and provide an actionable proposal within 24 hours.
          </p>
          <Link href="/contact">
            <Button size="lg" className="h-12 px-8 rounded-xl bg-white text-primary font-bold text-sm flex items-center gap-2 mx-auto group">
              Start Project Brief <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

      </div>
    </div>
  )
}
