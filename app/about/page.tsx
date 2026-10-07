"use client"

import Link from "next/link"
import { 
  ShieldCheck, Zap, Lock, Users, Target, ArrowRight, CheckCircle2, 
  MapPin, Code2, Smartphone, Cloud, FileCheck2, ArrowUpRight
} from "lucide-react"
import { Button } from "@/components/ui/button"

const principles = [
  {
    icon: Code2,
    num: "01",
    title: "Engineering Rigor Above All",
    desc: "We treat software engineering as a rigorous discipline. Every module is strictly typed, tested, audited, and documented before deploying to production.",
  },
  {
    icon: Lock,
    num: "02",
    title: "Security by Default",
    desc: "Bank-grade TLS 1.3 encryption, OWASP hardening, and rigorous access control are built into the foundation from day one, never bolted on after.",
  },
  {
    icon: Target,
    num: "03",
    title: "Measurable Business Outcomes",
    desc: "We prioritize real-world velocity, uptime, latency metrics, and user adoption over vanity metrics and superficial deliverable checklists.",
  },
  {
    icon: Zap,
    num: "04",
    title: "Sub-Second Performance",
    desc: "Optimized database query planners, distributed caching, and lean bundle delivery ensure lightning-fast interactions across all devices.",
  },
]

const stackCategories = [
  {
    title: "Web & Enterprise SaaS",
    icon: Code2,
    desc: "Modern reactive web apps built with Next.js 15, React 19, strict TypeScript, and Tailwind CSS for peak Core Web Vitals.",
    technologies: ["Next.js 15", "React 19", "TypeScript", "Tailwind CSS", "Prisma ORM", "PostgreSQL"],
  },
  {
    title: "Mobile App Ecosystems",
    icon: Smartphone,
    desc: "High-performance native iOS (Swift), Android (Kotlin), and universal React Native applications with offline-first synchronization.",
    technologies: ["React Native", "Swift / SwiftUI", "Kotlin / Compose", "SQLite", "Expo", "Firebase"],
  },
  {
    title: "Cloud & DevOps Infrastructure",
    icon: Cloud,
    desc: "Containerized microservices and automated GitOps CI/CD pipelines deployed to AWS, GCP, and modern edge CDN networks.",
    technologies: ["AWS / GCP", "Docker & K8s", "Terraform", "GitHub Actions", "Redis", "Cloudflare"],
  },
]

const inHouseProducts = [
  {
    title: "KRA Certificate Retrieval Portal",
    tag: "Flagship GovTech",
    stat: "50,000+ Certificates Issued",
    speed: "< 30s processing",
    href: "/retrieval-portal",
    desc: "Automated retrieval and cryptographic verification of compliance documents via National ID and PIN.",
  },
  {
    title: "Live PIN & National ID Validator",
    tag: "Registry Engine",
    stat: "10,000+ Validations / Day",
    speed: "< 3s response time",
    href: "/pin-checker",
    desc: "Direct integration with public records for instant verification, fraud detection, and tax station lookup.",
  },
  {
    title: "Automated Tax Returns Filing",
    tag: "Compliance Suite",
    stat: "25,000+ Returns Processed",
    speed: "99.9% success rate",
    href: "/dashboard/filing",
    desc: "Streamlined statutory compliance assistant guiding Kenyan businesses through iTax nil returns in under 5 minutes.",
  },
]

const companyStats = [
  { label: "Compliance Certificates Issued", value: "50,000+" },
  { label: "Daily Taxpayer Validations", value: "10,000+" },
  { label: "Platform Uptime SLA", value: "99.98%" },
  { label: "Production Deployments", value: "80+" },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-on-background">

      {/* Page Hero - Matching Products Design */}
      <div className="bg-surface-container-lowest border-b border-outline-variant">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 space-y-6">
          <nav className="flex items-center gap-2 text-xs text-on-surface-variant">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <span className="text-on-surface font-semibold">About Akubrecah</span>
          </nav>
          <div className="max-w-3xl space-y-4">
            <span className="text-xs font-black text-primary uppercase tracking-widest">Engineering Excellence · Nairobi, Kenya</span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-on-surface tracking-tight leading-tight">
              We Build Software<br />
              <span className="text-primary">That Lasts & Scales.</span>
            </h1>
            <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl leading-relaxed">
              Akubrecah Technologies is a premier software engineering firm headquartered in Nairobi. 
              We architect high-impact web platforms, native mobile applications, cloud infrastructure, 
              and mission-critical statutory automation systems that withstand real production load.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant pt-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span>Nairobi, Kenya — Engineering for East Africa and Global Enterprises</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 space-y-20">

        {/* Core Philosophy Section - Matching Products 5-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">
          
          {/* Main Content (3 cols) */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                Engineering Conviction
              </span>
            </div>

            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-on-surface tracking-tight">
                World-Class Standards. Local Market Depth.
              </h2>
              <p className="text-sm font-bold mt-1 text-primary">
                Zero shortcuts, zero compromises, and no technical debt by design.
              </p>
              <p className="text-sm text-on-surface-variant mt-3 leading-relaxed">
                Founded on the conviction that East African businesses and institutions deserve engineering 
                built to global top-tier benchmarks. From high-throughput M-Pesa payment gateways to resilient 
                statutory compliance portals, our software is engineered for mission-critical reliability.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                "Strict TypeScript & comprehensive type safety",
                "Automated CI/CD pipelines & zero-downtime releases",
                "Bank-grade TLS 1.3 encryption & OWASP hardening",
                "Sub-second Core Web Vitals across all screens",
                "Resilient offline-first mobile sync capabilities",
                "Clear documentation & enterprise code ownership",
              ].map((feat) => (
                <div key={feat} className="flex items-start gap-2.5 text-sm text-on-surface">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Link href="/contact">
                <Button className="h-12 px-7 rounded-xl bg-primary text-white font-bold text-sm flex items-center gap-2 group w-fit">
                  Work With Our Engineers <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Card (2 cols) - Matching Products Live Card */}
          <div className="lg:col-span-2">
            <div className="p-7 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-soft space-y-5 sticky top-24">
              <h4 className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Engineering Track Record</h4>
              <div className="space-y-4">
                {companyStats.map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between p-4 rounded-2xl bg-surface-container">
                    <span className="text-xs text-on-surface-variant font-semibold">{stat.label}</span>
                    <span className="text-lg font-black text-on-surface">{stat.value}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold pt-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Active Engineering Operations
              </div>
            </div>
          </div>

        </div>

        {/* Guiding Principles - 4 Column / 2x2 Grid */}
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-black text-primary uppercase tracking-widest">Our Foundation</span>
            <h2 className="text-3xl font-black text-on-surface">Guiding Principles That Drive Every Line of Code</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {principles.map((p) => {
              const Icon = p.icon
              return (
                <div key={p.num} className="p-7 rounded-3xl bg-surface-container-lowest border border-outline-variant space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-xl bg-primary/10 text-primary w-fit">
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-xs font-mono font-black text-primary">{p.num}</span>
                    </div>
                    <h3 className="text-lg font-bold text-on-surface">{p.title}</h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Technical Depth - 3 Cards Highlight */}
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-black text-primary uppercase tracking-widest">Technical Capabilities</span>
            <h2 className="text-3xl font-black text-on-surface">Full-Stack Depth Across Every Layer</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stackCategories.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="p-7 rounded-3xl bg-surface-container-lowest border border-outline-variant space-y-5 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary w-fit">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-on-surface">{item.title}</h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed">{item.desc}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {item.technologies.map((tech) => (
                      <span key={tech} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-surface-container text-on-surface-variant">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Proof of Work - In-House Products Highlights */}
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="text-xs font-black text-primary uppercase tracking-widest">Demonstrated Precision</span>
              <h2 className="text-3xl font-black text-on-surface">Our In-House GovTech Suite</h2>
              <p className="text-sm text-on-surface-variant max-w-xl">
                The best testament to our capabilities: high-concurrency compliance tools built and run completely in-house.
              </p>
            </div>
            <Link href="/products">
              <Button variant="outline" className="rounded-xl border-outline-variant text-on-surface font-bold text-xs flex items-center gap-2">
                Explore All Products <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {inHouseProducts.map((prod) => (
              <Link key={prod.title} href={prod.href} className="group block">
                <div className="p-7 rounded-3xl bg-surface-container-lowest border border-outline-variant hover:border-primary/40 transition-all duration-300 space-y-4 h-full flex flex-col justify-between shadow-soft">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-wider text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                        {prod.tag}
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-on-surface-variant group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    </div>
                    <h3 className="text-lg font-bold text-on-surface group-hover:text-primary transition-colors">{prod.title}</h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed">{prod.desc}</p>
                  </div>
                  <div className="pt-3 border-t border-outline-variant flex items-center justify-between text-xs">
                    <span className="font-bold text-on-surface">{prod.stat}</span>
                    <span className="text-emerald-600 font-semibold">{prod.speed}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA - Matching Products Style */}
        <div className="p-10 sm:p-14 rounded-3xl bg-primary text-white text-center space-y-5">
          <h2 className="text-3xl font-black">Ready to Build With Our Engineering Team?</h2>
          <p className="text-white/80 text-sm max-w-lg mx-auto">
            Whether launching a new venture, modernizing legacy enterprise systems, or automating statutory workflows — let&apos;s engineer something extraordinary together.
          </p>
          <Link href="/contact">
            <Button size="lg" className="h-12 px-8 rounded-xl bg-white text-primary font-bold text-sm flex items-center gap-2 mx-auto group">
              Start a Conversation <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

      </div>
    </div>
  )
}
