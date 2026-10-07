"use client"

import Link from "next/link"
import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { 
  Laptop, Smartphone, Cloud, Layers, 
  CheckCircle2, ArrowRight, ArrowUpRight
} from "lucide-react"
import { Button } from "@/components/ui/button"

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const services = [
  {
    id: "web",
    tag: "01 — Web & SaaS",
    icon: Laptop,
    title: "Full-Stack Web Engineering",
    description: "Production-quality web applications built with Next.js 15, React 19, and strict TypeScript. Architected for Core Web Vitals excellence, bulletproof security, and zero-compromise reliability at scale.",
    features: [
      "Server-rendered & statically generated Next.js architectures",
      "Reactive state management with resilient caching strategies",
      "Sub-second Core Web Vitals & full SEO/GEO optimization",
      "WCAG 2.1 AA accessibility compliance",
      "Multi-tenant SaaS & subscription billing",
      "Real-time features via WebSockets & SSE",
    ],
    stack: ["Next.js 15", "React 19", "TypeScript", "Tailwind CSS", "Prisma ORM", "PostgreSQL"],
  },
  {
    id: "mobile",
    tag: "02 — iOS / Android",
    icon: Smartphone,
    title: "Mobile Ecosystem Engineering",
    description: "From Swift-native iOS apps to Kotlin Android and universal React Native — we build mobile experiences that function offline, sync in real-time, and deliver fluid 60fps interactions.",
    features: [
      "Universal iOS (Swift/SwiftUI) & Android (Kotlin/Jetpack)",
      "Offline-first local data with automatic cloud sync",
      "Biometric auth, Apple Pay, Google Pay integrations",
      "Background processing, push notifications & deep linking",
      "Hardware sensor & camera integrations (OCR, QR, NFC)",
      "App Store & Play Store submission management",
    ],
    stack: ["React Native", "Swift/SwiftUI", "Kotlin/Jetpack Compose", "SQLite", "Expo", "Firebase"],
  },
  {
    id: "cloud",
    tag: "03 — DevOps & Cloud",
    icon: Cloud,
    title: "Cloud Infrastructure & DevOps",
    description: "Modern microservices, container orchestration, and GitOps CI/CD pipelines on AWS, GCP, and modern edge networks. Infrastructure that self-heals and scales automatically.",
    features: [
      "Docker & Kubernetes container orchestration",
      "Automated GitHub Actions / GitLab CI/CD pipelines",
      "Infrastructure as Code with Terraform & Pulumi",
      "Multi-region resilience, blue-green & canary deployments",
      "Edge CDN routing, DDoS mitigation & WAF configuration",
      "Database clustering, automated backups & PITR",
    ],
    stack: ["AWS / GCP", "Docker & Kubernetes", "Terraform", "GitHub Actions", "PostgreSQL", "Redis"],
  },
  {
    id: "enterprise",
    tag: "04 — Enterprise & GovTech",
    icon: Layers,
    title: "Enterprise & Government Systems",
    description: "Bespoke internal platforms, high-throughput financial gateways, and automated statutory data portals. Our systems process millions of requests reliably with 99.99% uptime guarantees.",
    features: [
      "High-throughput REST and GraphQL microservices",
      "M-Pesa STK Push, card processing & statutory gateways",
      "Government registry & public service API integrations",
      "Automated audit logging & granular RBAC control",
      "ERP & HRMS integrations (SAP, Sage, custom)",
      "Data pipeline automation & analytics dashboards",
    ],
    stack: ["Node.js", "Python/FastAPI", "M-Pesa Daraja", "PostgreSQL", "Apache Kafka", "Elasticsearch"],
  },
]

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-background text-on-background">

      {/* ── HERO ── */}
      <section className="bg-on-surface dark:bg-[#0d0d0d] text-surface dark:text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 space-y-6">
          <nav className="flex items-center gap-2 text-xs text-surface/40 dark:text-white/40">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <span>Services</span>
          </nav>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-5"
          >
            <p className="text-xs font-black text-primary uppercase tracking-[0.3em]">Engineering Capabilities</p>
            <h1 className="text-[clamp(2.5rem,8vw,6rem)] font-black leading-[0.93] tracking-tight">
              From Concept<br />
              <span className="text-primary">to Scaled</span><br />
              Production.
            </h1>
            <div className="max-w-2xl border-l-2 border-primary pl-6">
              <p className="text-sm text-surface/60 dark:text-white/50 leading-relaxed">
                Every engagement is backed by our 4-phase engineering methodology — no shortcuts, no surprises, 
                no technical debt by design.
              </p>
            </div>
          </motion.div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link href="/contact">
              <Button size="lg" className="h-12 px-7 rounded-none bg-primary text-white font-black text-sm flex items-center gap-2 group">
                Request Consultation <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/about">
              <Button variant="outline" size="lg" className="h-12 px-7 rounded-none border-2 border-surface/30 dark:border-white/20 text-surface dark:text-white font-black text-sm hover:bg-surface/10">
                Our Methodology
              </Button>
            </Link>
          </div>
        </div>
        <div className="absolute bottom-0 inset-x-0 h-px bg-primary/30" />
      </section>

      {/* ── SERVICE SECTIONS: Full-bleed alternating ── */}
      <div className="divide-y divide-outline-variant">
        {services.map((service, idx) => {
          const Icon = service.icon
          const isEven = idx % 2 === 0
          return (
            <section key={service.id} id={service.id}>
              <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 ${!isEven ? "bg-surface-container-lowest" : ""}`}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">

                  {/* Left: Tag + Title + Description */}
                  <Reveal className={`lg:col-span-5 space-y-5 ${!isEven ? "lg:order-2" : ""}`}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 border border-outline-variant text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-black text-primary uppercase tracking-[0.2em]">{service.tag}</span>
                    </div>

                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-on-surface leading-tight tracking-tight">
                      {service.title}
                    </h2>

                    <p className="text-sm text-on-surface-variant leading-relaxed">{service.description}</p>

                    {/* Stack pills */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {service.stack.map((tech) => (
                        <span key={tech} className="px-2.5 py-1 border border-outline-variant text-[11px] font-bold text-on-surface-variant">
                          {tech}
                        </span>
                      ))}
                    </div>

                    <Link href="/contact">
                      <Button className="h-11 px-6 rounded-none bg-primary text-white font-black text-xs flex items-center gap-2 group w-fit mt-2">
                        Discuss This Service <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </Button>
                    </Link>
                  </Reveal>

                  {/* Right: Feature checklist */}
                  <Reveal delay={0.1} className={`lg:col-span-7 ${!isEven ? "lg:order-1" : ""}`}>
                    <div className="border border-outline-variant divide-y divide-outline-variant">
                      {service.features.map((feat, i) => (
                        <div key={feat} className="flex items-start gap-4 px-5 py-4 hover:bg-surface-container transition-colors group">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                          <span className="text-sm text-on-surface">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </Reveal>

                </div>
              </div>
            </section>
          )
        })}
      </div>

      {/* ── CTA ── */}
      <section className="bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-2">
              <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                Not Sure Which Service You Need?
              </h2>
              <p className="text-white/70 text-sm max-w-lg">
                Book a free 30-minute architecture discovery call. Our senior engineers will scope 
                your requirements and recommend the optimal approach — no commitment required.
              </p>
            </div>
            <Link href="/contact" className="shrink-0">
              <Button size="lg" className="h-13 px-8 rounded-none bg-white text-primary font-black text-sm flex items-center gap-2 group hover:bg-white/92">
                Book Free Discovery Call <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
