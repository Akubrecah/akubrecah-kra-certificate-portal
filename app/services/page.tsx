"use client"

import Link from "next/link"
import { 
  Laptop, Smartphone, Cloud, Layers, 
  CheckCircle2, ArrowRight, Code2, Database, Server, Zap, Globe, Cpu
} from "lucide-react"
import { Button } from "@/components/ui/button"

const services = [
  {
    id: "web",
    tag: "Web & SaaS",
    icon: Laptop,
    title: "Full-Stack Web Engineering",
    subtitle: "High-concurrency, enterprise-grade web platforms",
    description: "We build production-quality web applications using Next.js 15, React 19, and strict TypeScript. Architected for Core Web Vitals excellence, bulletproof security, and zero-compromise reliability at scale.",
    features: [
      "Server-rendered & statically generated Next.js architectures",
      "Reactive state management with resilient caching strategies",
      "Sub-second Core Web Vitals & full SEO/GEO optimization",
      "WCAG 2.1 AA accessibility compliance across all components",
      "Multi-tenant SaaS & subscription billing integrations",
      "Real-time features via WebSockets & Server-Sent Events",
    ],
    stack: ["Next.js 15", "React 19", "TypeScript", "Tailwind CSS", "Prisma ORM", "PostgreSQL"],
    examples: ["Fintech Dashboards", "SaaS Platforms", "E-commerce Systems", "Government Portals"],
  },
  {
    id: "mobile",
    tag: "iOS / Android",
    icon: Smartphone,
    title: "Mobile Ecosystem Engineering",
    subtitle: "Native and cross-platform mobile excellence",
    description: "From Swift-native iOS apps to Kotlin Android and universal React Native — we build mobile experiences that function offline, sync in real-time, and deliver fluid 60fps interactions.",
    features: [
      "Universal iOS (Swift/SwiftUI) & Android (Kotlin/Jetpack) builds",
      "Offline-first local data persistence with automatic cloud sync",
      "Biometric auth, Apple Pay, and Google Pay native integrations",
      "Background processing, push notifications & deep linking",
      "Hardware sensor & camera integrations (OCR, QR, NFC)",
      "App Store & Play Store submission & review management",
    ],
    stack: ["React Native", "Swift/SwiftUI", "Kotlin/Jetpack Compose", "SQLite/WatermelonDB", "Expo", "Firebase"],
    examples: ["Banking Apps", "Field Operations", "Consumer Marketplaces", "Compliance Tools"],
  },
  {
    id: "cloud",
    tag: "DevOps & Cloud",
    icon: Cloud,
    title: "Cloud Infrastructure & DevOps",
    subtitle: "Scalable, resilient, zero-downtime deployments",
    description: "Modern microservices, container orchestration, and GitOps CI/CD pipelines on AWS, GCP, and modern edge networks. We architect infrastructure that self-heals and scales automatically.",
    features: [
      "Docker & Kubernetes container orchestration at scale",
      "Automated GitHub Actions / GitLab CI CD pipelines",
      "Infrastructure as Code (IaC) with Terraform & Pulumi",
      "Multi-region resilience, blue-green & canary deployments",
      "Edge CDN routing, DDoS mitigation & WAF configuration",
      "Database clustering, automated backups & point-in-time restore",
    ],
    stack: ["AWS / GCP", "Docker & Kubernetes", "Terraform", "GitHub Actions", "PostgreSQL", "Redis"],
    examples: ["Microservice Migrations", "Auto-Scaling APIs", "Database Clusters", "Edge Networks"],
  },
  {
    id: "enterprise",
    tag: "Enterprise & GovTech",
    icon: Layers,
    title: "Custom Enterprise & Government Systems",
    subtitle: "Mission-critical architectures for complex domains",
    description: "Bespoke internal platforms, high-throughput financial gateways, and automated statutory data portals. Our systems process millions of requests reliably with 99.99% uptime guarantees.",
    features: [
      "High-throughput transactional REST and GraphQL microservices",
      "M-Pesa STK Push, card processing & statutory payment gateways",
      "Government registry & public service API integrations",
      "Automated audit logging & granular RBAC access control",
      "ERP & HRMS integrations (SAP, Sage, custom connectors)",
      "Data pipeline automation & custom analytics dashboards",
    ],
    stack: ["Node.js", "Python/FastAPI", "M-Pesa Daraja", "PostgreSQL", "Apache Kafka", "Elasticsearch"],
    examples: ["Tax Automation Portals", "HRMS Systems", "Payment Gateways", "Audit Platforms"],
  },
]

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-background text-on-background">
      
      {/* Page Hero */}
      <div className="bg-surface-container-lowest border-b border-outline-variant">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 space-y-6">
          <nav className="flex items-center gap-2 text-xs text-on-surface-variant">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <span className="text-on-surface font-semibold">Services</span>
          </nav>
          <div className="max-w-3xl space-y-4">
            <span className="text-xs font-black text-primary uppercase tracking-widest">Engineering Capabilities</span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-on-surface tracking-tight leading-tight">
              From Concept to<br />
              <span className="text-primary">Scaled Production.</span>
            </h1>
            <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl leading-relaxed">
              We design, build, and maintain digital products that withstand heavy user loads, 
              stringent security standards, and rapid scaling demands. Every engagement is backed 
              by our 4-phase engineering methodology.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link href="/contact">
              <Button size="lg" className="h-12 px-7 rounded-xl bg-primary text-white font-bold text-sm flex items-center gap-2 group">
                Request a Consultation <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/about">
              <Button variant="outline" size="lg" className="h-12 px-7 rounded-xl font-bold text-sm">
                Our Methodology
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 space-y-16">
        {services.map((service, idx) => {
          const Icon = service.icon
          const isEven = idx % 2 === 0
          return (
            <div
              key={service.id}
              id={service.id}
              className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start"
            >
              {/* Content */}
              <div className={`space-y-6 ${isEven ? "lg:order-1" : "lg:order-2"}`}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-7 w-7" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-primary px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                    {service.tag}
                  </span>
                </div>

                <div>
                  <h2 className="text-3xl sm:text-4xl font-black text-on-surface tracking-tight">{service.title}</h2>
                  <p className="text-sm font-bold text-primary mt-1">{service.subtitle}</p>
                  <p className="text-sm text-on-surface-variant mt-3 leading-relaxed">{service.description}</p>
                </div>

                <div className="space-y-2.5">
                  {service.features.map((feat) => (
                    <div key={feat} className="flex items-start gap-2.5 text-sm text-on-surface">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <Link href="/contact">
                  <Button className="h-11 px-6 rounded-xl bg-primary text-white font-bold text-sm flex items-center gap-2 group w-fit">
                    Discuss {service.title} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>

              {/* Detail Card */}
              <div className={`space-y-4 ${isEven ? "lg:order-2" : "lg:order-1"}`}>
                <div className="p-7 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-soft space-y-6">
                  
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Tech Stack</h4>
                    <div className="flex flex-wrap gap-2">
                      {service.stack.map((tech) => (
                        <span key={tech} className="px-3 py-1.5 rounded-lg bg-surface-container text-xs font-bold text-on-surface border border-outline-variant">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Use Cases</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {service.examples.map((ex) => (
                        <div key={ex} className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-container text-xs font-semibold text-on-surface">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                          {ex}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )
        })}

        {/* Bottom CTA */}
        <div className="p-10 sm:p-14 rounded-3xl bg-primary text-white space-y-5 text-center">
          <h2 className="text-3xl font-black">Not Sure Which Service You Need?</h2>
          <p className="text-white/80 text-sm max-w-lg mx-auto">
            Book a free 30-minute architecture discovery call. Our senior engineers will scope your requirements 
            and recommend the optimal technical approach.
          </p>
          <Link href="/contact">
            <Button size="lg" className="h-12 px-8 rounded-xl bg-white text-primary font-bold text-sm flex items-center gap-2 mx-auto group">
              Book Free Discovery Call <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
