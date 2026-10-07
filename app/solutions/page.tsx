"use client"

import Link from "next/link"
import { CheckCircle2, ArrowRight, Globe, Zap, Shield, Users, Code2, Laptop, Smartphone, Cloud } from "lucide-react"
import { Button } from "@/components/ui/button"

const solutions = [
  {
    id: "fintech",
    title: "Financial Technology",
    subtitle: "Automated payment flows & fintech infrastructure",
    description: "From M-Pesa STK Push integrations to multi-currency ledger engines and automated reconciliation systems — we build the financial plumbing that powers modern businesses in East Africa.",
    icon: Zap,
    tag: "Fintech & Payments",
    deliverables: [
      "M-Pesa Daraja API (STK Push, C2B, B2C) integration",
      "Card payment gateways (Stripe, Paystack, DPO, Pesapal)",
      "Multi-currency transaction ledger systems",
      "Automated bank statement reconciliation",
      "Financial reporting & real-time cashflow dashboards",
      "Fraud detection and anomaly flagging pipelines",
    ],
  },
  {
    id: "govtech",
    title: "Government & Public Sector",
    subtitle: "Statutory portals & citizen-facing digital services",
    description: "We specialize in digitizing government workflows — from identity verification gateways to automated statutory compliance portals and inter-agency data exchange APIs.",
    icon: Shield,
    tag: "GovTech",
    deliverables: [
      "National ID & KRA PIN verification gateways",
      "Automated compliance certificate generation systems",
      "Statutory returns filing automation engines",
      "Role-based citizen portal access control",
      "Government API integrations (KRA, NTSA, eCitizen, NHIF, NSSF)",
      "PDPA & data privacy compliance architectures",
    ],
  },
  {
    id: "enterprise",
    title: "Enterprise Operations",
    subtitle: "Replacing paper workflows with intelligent digital systems",
    description: "Digitize sprawling manual operations with real-time web and mobile portals, automated document workflows, custom ERP modules, and data-driven analytics dashboards.",
    icon: Users,
    tag: "Enterprise",
    deliverables: [
      "Custom ERP modules and HR management systems",
      "Automated PDF document generation at scale",
      "Role-based access control and approval workflows",
      "CRM integrations (Salesforce, HubSpot, custom)",
      "Business intelligence dashboards & data visualization",
      "Automated email/SMS notification pipelines",
    ],
  },
  {
    id: "saas",
    title: "SaaS Product Engineering",
    subtitle: "Full-cycle product engineering for software startups",
    description: "From founding MVP to Series A scale, we are the technical co-founder your startup needs. We architect, build, and iterate on SaaS products with deep product thinking.",
    icon: Globe,
    tag: "SaaS & Startups",
    deliverables: [
      "Rapid MVP delivery with production-quality code",
      "Multi-tenant subscription billing (Stripe, Paystack)",
      "Authentication, SSO & team permission management",
      "Usage analytics and product telemetry pipelines",
      "API monetization & developer portal engineering",
      "Scale-ready architecture from Day 1",
    ],
  },
]

const processSteps = [
  {
    num: "01",
    title: "Discovery & Architecture",
    desc: "Deep dive into your requirements. We scope the system boundaries, define API contracts, design the database schema, and document the security model before touching any code.",
  },
  {
    num: "02",
    title: "Vertical Slice Development",
    desc: "We build in thin end-to-end slices — UI, business logic, persistence, and verification for each feature — delivering testable increments every sprint.",
  },
  {
    num: "03",
    title: "Security & QA Audit",
    desc: "TypeScript type-checks, automated linting, integration tests, OWASP security reviews, and Lighthouse performance audits run on every deployment.",
  },
  {
    num: "04",
    title: "Zero-Downtime Deployment",
    desc: "Blue-green or canary deployments to staging, then production. Automated rollback triggers. Post-deploy health monitoring confirms all systems are green.",
  },
]

export default function SolutionsPage() {
  return (
    <div className="min-h-screen bg-background text-on-background">

      {/* Page Hero */}
      <div className="bg-surface-container-lowest border-b border-outline-variant">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 space-y-6">
          <nav className="flex items-center gap-2 text-xs text-on-surface-variant">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <span className="text-on-surface font-semibold">Solutions</span>
          </nav>
          <div className="max-w-3xl space-y-4">
            <span className="text-xs font-black text-primary uppercase tracking-widest">Industry Specializations</span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-on-surface tracking-tight leading-tight">
              Software Solutions<br />
              <span className="text-primary">for Complex Domains.</span>
            </h1>
            <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl leading-relaxed">
              We combine deep sector expertise with rigorous software engineering to build solutions 
              that solve real business problems — from fintech payment infrastructure to government 
              automation portals.
            </p>
          </div>
          <Link href="/contact">
            <Button size="lg" className="h-12 px-7 rounded-xl bg-primary text-white font-bold text-sm flex items-center gap-2 group">
              Discuss Your Project <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 space-y-20">

        {/* Solutions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {solutions.map((sol) => {
            const Icon = sol.icon
            return (
              <div key={sol.id} id={sol.id} className="p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-soft hover:border-primary/40 transition-all duration-300 space-y-6 flex flex-col">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-primary px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
                    {sol.tag}
                  </span>
                </div>

                <div>
                  <h2 className="text-2xl font-black text-on-surface">{sol.title}</h2>
                  <p className="text-xs font-bold text-primary mt-0.5">{sol.subtitle}</p>
                  <p className="text-xs text-on-surface-variant mt-3 leading-relaxed">{sol.description}</p>
                </div>

                <div className="space-y-2 flex-1">
                  {sol.deliverables.map((item) => (
                    <div key={item} className="flex items-start gap-2 text-xs text-on-surface">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <Link href="/contact">
                  <Button className="w-full h-10 rounded-xl bg-surface-container hover:bg-primary text-on-surface hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-2 group">
                    Build a {sol.title} System <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </Link>
              </div>
            )
          })}
        </div>

        {/* Engineering Methodology */}
        <div className="space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-black text-primary uppercase tracking-widest">Execution Framework</span>
            <h2 className="text-3xl sm:text-4xl font-black text-on-surface">How We Deliver Every Project</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Regardless of domain or complexity, all engagements follow our proven 4-phase engineering lifecycle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {processSteps.map((step, idx) => (
              <div key={step.num} className="relative p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant space-y-3">
                {idx < processSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-outline-variant z-10 translate-x-0" style={{ width: "calc(100% - 3rem)", left: "calc(100% + 0rem)" }} />
                )}
                <span className="text-xs font-mono font-black text-primary">{step.num}</span>
                <h3 className="text-base font-bold text-on-surface">{step.title}</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Cross-platform highlight */}
        <div className="p-10 sm:p-14 rounded-3xl bg-on-surface text-surface dark:bg-surface-container-lowest dark:text-on-surface space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-black">Cross-Platform. End-to-End.</h2>
            <p className="text-sm opacity-70 max-w-xl mx-auto">
              We deliver complete digital product ecosystems — web dashboard, mobile companion app, 
              backend API, and cloud infrastructure — all from a single, unified engineering team.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
            {[
              { icon: Laptop, label: "Web Application", sub: "Next.js · React" },
              { icon: Smartphone, label: "Mobile Apps", sub: "iOS · Android · RN" },
              { icon: Cloud, label: "Backend & Cloud", sub: "APIs · DevOps · K8s" },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="p-5 rounded-2xl bg-white/5 dark:bg-surface-container border border-white/10 dark:border-outline-variant text-center space-y-2">
                  <Icon className="h-7 w-7 text-primary mx-auto" />
                  <p className="font-bold text-sm">{item.label}</p>
                  <p className="text-xs opacity-60">{item.sub}</p>
                </div>
              )
            })}
          </div>
          <div className="text-center">
            <Link href="/contact">
              <Button size="lg" className="h-12 px-8 rounded-xl bg-primary text-white font-bold text-sm flex items-center gap-2 mx-auto group">
                Start Your Full-Stack Project <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
