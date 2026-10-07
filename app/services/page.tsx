"use client"

import Link from "next/link"
import { 
  Laptop, Smartphone, Cloud, Layers, 
  CheckCircle2, ArrowRight, Shield, Zap, Lock, Terminal
} from "lucide-react"
import { Button } from "@/components/ui/button"

const services = [
  {
    id: "web",
    tag: "Full-Stack Web Engineering",
    icon: Laptop,
    title: "Web Applications & Scalable SaaS",
    subtitle: "Production-grade Next.js, React, and strict TypeScript systems",
    description: "We build resilient, server-rendered and statically generated web applications engineered for speed, search discovery, and enterprise security. Designed to handle high concurrent traffic with effortless sub-second latency.",
    href: "/contact?service=web",
    ctaText: "Discuss Web Project",
    color: "text-primary",
    bgColor: "bg-primary/10",
    features: [
      "Server-rendered Next.js 15 & React 19 architecture",
      "Sub-second Core Web Vitals (LCP < 1.2s, INP < 100ms)",
      "Strict end-to-end TypeScript with runtime validation",
      "Multi-tenant SaaS architecture & Stripe/Paystack billing",
      "WCAG 2.1 AA accessibility & semantic HTML standards",
      "Automated CI/CD pipelines & zero-downtime deployment",
    ],
    stack: ["Next.js 15", "React 19", "TypeScript", "Tailwind CSS", "Prisma ORM", "PostgreSQL"],
    stats: [
      { label: "Core Web Vitals Score", value: "99/100" },
      { label: "Avg. Page Load Time", value: "< 0.8s" },
      { label: "Type Safety Coverage", value: "100%" },
    ],
    statusText: "Ready for Q2/Q3 Engagements",
  },
  {
    id: "mobile",
    tag: "Native & Universal Mobile",
    icon: Smartphone,
    title: "Mobile App Ecosystems",
    subtitle: "Fluid 60fps native iOS, Android, and React Native apps",
    description: "From native Swift/SwiftUI and Kotlin/Jetpack to cross-platform React Native with offline-first synchronization, we engineer mobile applications that deliver smooth, reliable experiences in any network condition.",
    href: "/contact?service=mobile",
    ctaText: "Discuss Mobile App",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/40",
    features: [
      "Universal iOS (Swift/SwiftUI) & Android (Kotlin/Compose)",
      "Offline-first local SQLite caching with auto-sync",
      "Biometric security (FaceID/Fingerprint) & hardware APIs",
      "Push notification systems (APNs, FCM) & deep linking",
      "M-Pesa STK Push and mobile money checkout SDKs",
      "App Store & Google Play submission and release management",
    ],
    stack: ["React Native", "Swift / SwiftUI", "Kotlin / Compose", "SQLite", "Expo", "Firebase"],
    stats: [
      { label: "Target Framerate", value: "60 FPS" },
      { label: "Offline Sync Support", value: "Built-in" },
      { label: "Crash-Free Rate", value: "> 99.8%" },
    ],
    statusText: "Production Native Engineering",
  },
  {
    id: "cloud",
    tag: "Cloud Architecture & DevOps",
    icon: Cloud,
    title: "Cloud Infrastructure & GitOps",
    subtitle: "Self-healing Kubernetes, Terraform IaC, and resilient microservices",
    description: "We architect secure, scalable cloud infrastructure across AWS, GCP, and Azure. Automated GitOps CI/CD pipelines, container orchestration, and continuous monitoring eliminate manual operations and deployment risks.",
    href: "/contact?service=cloud",
    ctaText: "Discuss Cloud Architecture",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
    features: [
      "Docker & Kubernetes container orchestration at scale",
      "Infrastructure as Code (IaC) with Terraform & Pulumi",
      "Multi-region failover, blue-green & canary deployments",
      "Automated GitHub Actions CI/CD with security scanning",
      "Edge CDN caching, DDoS mitigation, and WAF setup",
      "High-availability PostgreSQL & Redis clustering with PITR",
    ],
    stack: ["AWS / GCP", "Docker & K8s", "Terraform", "GitHub Actions", "Redis", "Cloudflare"],
    stats: [
      { label: "Infrastructure Uptime SLA", value: "99.99%" },
      { label: "Deploy Frequency", value: "Multiple/Day" },
      { label: "Recovery Time (RTO)", value: "< 15 min" },
    ],
    statusText: "Enterprise Infrastructure Active",
  },
  {
    id: "enterprise",
    tag: "GovTech & Enterprise Systems",
    icon: Layers,
    title: "Enterprise & Statutory Integration",
    subtitle: "High-throughput APIs, ERP connectors, and compliance portals",
    description: "Bespoke digital transformation for enterprises and government agencies. We engineer high-throughput transaction gateways, automated statutory compliance pipelines, and custom back-office operations systems.",
    href: "/contact?service=enterprise",
    ctaText: "Discuss Enterprise Systems",
    color: "text-primary",
    bgColor: "bg-primary/10",
    features: [
      "M-Pesa Daraja API integration (STK Push, C2B, B2C, B2B)",
      "KRA iTax, eCitizen, NTSA, and statutory API connectors",
      "Cryptographic PDF generation and automated digital signing",
      "Granular Role-Based Access Control (RBAC) & audit logging",
      "ERP / HRMS / Accounting integrations (SAP, Sage, custom)",
      "High-throughput event streaming with Kafka or RabbitMQ",
    ],
    stack: ["Node.js", "Python / FastAPI", "PostgreSQL", "M-Pesa Daraja", "Apache Kafka", "Docker"],
    stats: [
      { label: "Throughput Capacity", value: "10,000 req/s" },
      { label: "Statutory Registry Link", value: "Verified" },
      { label: "Security Incident Rate", value: "0" },
    ],
    statusText: "Government-Grade Compliance",
  },
]

const engineeringHighlights = [
  {
    icon: Lock,
    title: "OWASP-Hardened Standards",
    desc: "Rigorous vulnerability assessments, zero-trust network policies, rate-limiting, and automated SAST/DAST scans on every pull request.",
  },
  {
    icon: Terminal,
    title: "Clean Code & Architecture",
    desc: "Strict domain-driven design, single-responsibility modules, strict typing, and comprehensive test coverage across every vertical slice.",
  },
  {
    icon: Zap,
    title: "Telemetry & Observability",
    desc: "Integrated real-time error tracking, distributed tracing, and automated health checks ensure immediate visibility into system vitals.",
  },
]

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-background text-on-background">

      {/* Page Hero - Matching Products Design */}
      <div className="bg-surface-container-lowest border-b border-outline-variant">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 space-y-6">
          <nav className="flex items-center gap-2 text-xs text-on-surface-variant">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <span className="text-on-surface font-semibold">Engineering Services</span>
          </nav>
          <div className="max-w-3xl space-y-4">
            <span className="text-xs font-black text-primary uppercase tracking-widest">Full-Lifecycle Engineering</span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-on-surface tracking-tight leading-tight">
              From Concept<br />
              <span className="text-primary">to Scaled Production.</span>
            </h1>
            <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl leading-relaxed">
              We architect, develop, and maintain high-impact digital systems. From scalable SaaS platforms 
              and fluid mobile ecosystems to mission-critical statutory portals and resilient cloud infrastructure.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/contact">
              <Button size="lg" className="h-12 px-7 rounded-xl bg-primary text-white font-bold text-sm flex items-center gap-2 group">
                Schedule Architecture Discovery <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 space-y-20">

        {/* Services - Matching Products 5-Column Grid */}
        {services.map((service, idx) => {
          const Icon = service.icon
          const isEven = idx % 2 === 0
          return (
            <div key={service.id} id={service.id} className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">
              
              {/* Main Content */}
              <div className={`lg:col-span-3 space-y-6 ${isEven ? "lg:order-1" : "lg:order-2"}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${service.bgColor} ${service.color}`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full ${service.bgColor} ${service.color} border border-current/20`}>
                    {service.tag}
                  </span>
                </div>

                <div>
                  <h2 className="text-3xl sm:text-4xl font-black text-on-surface tracking-tight">{service.title}</h2>
                  <p className={`text-sm font-bold mt-1 ${service.color}`}>{service.subtitle}</p>
                  <p className="text-sm text-on-surface-variant mt-3 leading-relaxed">{service.description}</p>
                </div>

                {/* Stack Pills */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Technology Stack</span>
                  <div className="flex flex-wrap gap-2">
                    {service.stack.map((tech) => (
                      <span key={tech} className="text-xs font-semibold px-3 py-1 rounded-xl bg-surface-container text-on-surface border border-outline-variant">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Features List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {service.features.map((feat) => (
                    <div key={feat} className="flex items-start gap-2.5 text-sm text-on-surface">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <Link href={service.href}>
                  <Button className="h-12 px-7 rounded-xl bg-primary text-white font-bold text-sm flex items-center gap-2 group w-fit">
                    {service.ctaText} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>

              {/* Stats & SLA Card */}
              <div className={`lg:col-span-2 ${isEven ? "lg:order-2" : "lg:order-1"}`}>
                <div className="p-7 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-soft space-y-5 sticky top-24">
                  <h4 className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Engineering Benchmarks</h4>
                  <div className="space-y-4">
                    {service.stats.map((stat) => (
                      <div key={stat.label} className="flex items-center justify-between p-4 rounded-2xl bg-surface-container">
                        <span className="text-xs text-on-surface-variant font-semibold">{stat.label}</span>
                        <span className="text-lg font-black text-on-surface">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold pt-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    {service.statusText}
                  </div>
                </div>
              </div>

            </div>
          )
        })}

        {/* Highlights Section */}
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-black text-primary uppercase tracking-widest">Quality Assurance</span>
            <h2 className="text-3xl font-black text-on-surface">Engineering Standards Built Into Every Sprint</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {engineeringHighlights.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="p-7 rounded-3xl bg-surface-container-lowest border border-outline-variant space-y-4 shadow-soft">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary w-fit">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-on-surface">{item.title}</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottom CTA Banner */}
        <div className="p-10 sm:p-14 rounded-3xl bg-primary text-white text-center space-y-5">
          <h2 className="text-3xl font-black">Not Sure Which Capability Fits Your Needs?</h2>
          <p className="text-white/80 text-sm max-w-lg mx-auto">
            Book a complimentary 30-minute architecture discovery session. Our principal engineers will review your objectives and outline a concrete technical roadmap.
          </p>
          <Link href="/contact">
            <Button size="lg" className="h-12 px-8 rounded-xl bg-white text-primary font-bold text-sm flex items-center gap-2 mx-auto group">
              Book Discovery Session <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

      </div>
    </div>
  )
}
