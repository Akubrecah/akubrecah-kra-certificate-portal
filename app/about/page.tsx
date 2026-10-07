"use client"

import Link from "next/link"
import { Code2, Target, Cpu, Shield, Users, MapPin, ArrowRight, CheckCircle2, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

const values = [
  {
    icon: Code2,
    title: "Engineering Rigor Above All",
    desc: "We treat software engineering as a discipline, not a craft. Every component is typed, tested, audited, and documented before it ships to production.",
  },
  {
    icon: Target,
    title: "Outcome-Driven Development",
    desc: "We don't measure success by lines of code or velocity metrics. We measure it by business outcomes — uptime, user adoption, and measurable ROI.",
  },
  {
    icon: Shield,
    title: "Security by Default",
    desc: "Security is not a feature — it is the foundation. OWASP standards, end-to-end encryption, and regular penetration testing are non-negotiable on every project.",
  },
  {
    icon: Zap,
    title: "Performance Without Compromise",
    desc: "We design for sub-second response times, optimize database query plans, and profile every critical path before shipping any production-bound code.",
  },
]

const teamHighlights = [
  { label: "Engineers on Staff", value: "12+" },
  { label: "Years Average Experience", value: "7+" },
  { label: "Projects Delivered", value: "80+" },
  { label: "Client Retention Rate", value: "94%" },
]

const expertise = [
  "Full-Stack TypeScript / React / Next.js",
  "Native iOS (Swift/SwiftUI) & Android (Kotlin)",
  "React Native Cross-Platform Engineering",
  "Node.js, Python, Go Microservices",
  "AWS, GCP, Azure Cloud Architecture",
  "Docker, Kubernetes, Terraform DevOps",
  "PostgreSQL, MongoDB, Redis Data Engineering",
  "M-Pesa, Stripe, Paystack Payment Gateways",
  "KRA iTax, NTSA, eCitizen Government APIs",
  "GraphQL, REST, gRPC API Design",
  "Prisma ORM, Drizzle, TypeORM",
  "Playwright, Vitest, Jest Testing Pipelines",
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-on-background">

      {/* Page Hero */}
      <div className="relative overflow-hidden bg-on-surface dark:bg-surface-container-lowest border-b border-outline-variant">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,rgba(186,26,26,0.15)_0%,transparent_60%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 space-y-6 relative z-10">
          <nav className="flex items-center gap-2 text-xs text-surface/60 dark:text-on-surface-variant">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <span className="text-surface dark:text-on-surface font-semibold">About</span>
          </nav>

          <div className="max-w-3xl space-y-6">
            <span className="text-xs font-black text-primary uppercase tracking-widest">Who We Are</span>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-surface dark:text-on-surface tracking-tight leading-[1.05]">
              Akubrecah<br />
              <span className="text-primary">Technologies.</span>
            </h1>
            <p className="text-base sm:text-xl text-surface/70 dark:text-on-surface-variant max-w-2xl leading-relaxed">
              A premier software engineering and digital innovation company headquartered in Nairobi, Kenya. 
              We build the digital infrastructure that powers ambitious businesses, government services, 
              and innovative startups across East Africa and globally.
            </p>
            <div className="flex items-center gap-3 text-surface/60 dark:text-on-surface-variant text-sm">
              <MapPin className="h-4 w-4 text-primary" />
              <span>Nairobi, Kenya — Engineering for East Africa & Global Markets</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 space-y-20">

        {/* Mission Statement */}
        <section className="max-w-3xl mx-auto text-center space-y-6">
          <span className="text-xs font-black text-primary uppercase tracking-widest">Our Mission</span>
          <blockquote className="text-2xl sm:text-3xl font-black text-on-surface leading-tight">
            &ldquo;To engineer digital systems of exceptional quality — systems that are fast, 
            secure, and built to last — enabling our clients to compete and win on a global scale.&rdquo;
          </blockquote>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Founded in Nairobi, Akubrecah Technologies was born from a conviction that East African businesses 
            deserve world-class engineering — not compromised, offshore-minimum-viable code. We operate with 
            the same engineering standards as leading global software houses, applied to local market realities 
            and domain knowledge.
          </p>
        </section>

        {/* Team Metrics */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {teamHighlights.map((m) => (
            <div key={m.label} className="p-7 rounded-3xl bg-surface-container-lowest border border-outline-variant text-center space-y-2 shadow-soft">
              <span className="text-4xl font-black text-primary">{m.value}</span>
              <p className="text-xs text-on-surface-variant font-semibold">{m.label}</p>
            </div>
          ))}
        </section>

        {/* Core Values */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-black text-primary uppercase tracking-widest">Guiding Principles</span>
            <h2 className="text-3xl sm:text-4xl font-black text-on-surface">What We Stand For</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((value) => {
              const Icon = value.icon
              return (
                <div key={value.title} className="p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-soft space-y-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary w-fit">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-on-surface">{value.title}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{value.desc}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Engineering Expertise */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-black text-primary uppercase tracking-widest">Technical Depth</span>
            <h2 className="text-3xl sm:text-4xl font-black text-on-surface">Deep Expertise Across the Stack</h2>
            <p className="text-sm text-on-surface-variant max-w-xl mx-auto">
              Our engineers hold mastery across the full modern technology spectrum — no knowledge gaps, no subcontracting to generalists.
            </p>
          </div>
          <div className="p-8 sm:p-12 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-soft">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {expertise.map((skill) => (
                <div key={skill} className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-container text-xs font-semibold text-on-surface">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  {skill}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* KRA Products as Proof of Work */}
        <section className="p-10 sm:p-14 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-soft space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="text-xs font-black text-primary uppercase tracking-widest">Proof of Engineering</span>
              <h2 className="text-3xl font-black text-on-surface">
                We Eat Our Own Cooking.
              </h2>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Our in-house KRA Compliance Suite — live, production-grade tools used by thousands of Kenyans daily — 
                is the best demonstration of our engineering standards. These are the same architectural patterns, 
                security models, and deployment pipelines we bring to every client project.
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-on-surface">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>50,000+ compliance certificates generated and delivered</span>
                </div>
                <div className="flex items-center gap-2 text-on-surface">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>99.98% uptime across all production services</span>
                </div>
                <div className="flex items-center gap-2 text-on-surface">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Zero critical security incidents since launch</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <Link href="/products" className="flex items-center justify-between p-5 rounded-2xl bg-surface-container border border-outline-variant hover:border-primary/50 transition-all group">
                <div>
                  <p className="font-bold text-on-surface text-sm group-hover:text-primary transition-colors">KRA Certificate Retrieval Portal</p>
                  <p className="text-xs text-on-surface-variant">50k+ certificates issued</p>
                </div>
                <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/products#pin-checker" className="flex items-center justify-between p-5 rounded-2xl bg-surface-container border border-outline-variant hover:border-primary/50 transition-all group">
                <div>
                  <p className="font-bold text-on-surface text-sm group-hover:text-primary transition-colors">Live PIN & National ID Validator</p>
                  <p className="text-xs text-on-surface-variant">10k+ validations daily</p>
                </div>
                <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/products#tax-filing" className="flex items-center justify-between p-5 rounded-2xl bg-surface-container border border-outline-variant hover:border-primary/50 transition-all group">
                <div>
                  <p className="font-bold text-on-surface text-sm group-hover:text-primary transition-colors">Automated Tax Returns Filing</p>
                  <p className="text-xs text-on-surface-variant">25k+ returns filed</p>
                </div>
                <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="p-10 sm:p-14 rounded-3xl bg-primary text-white text-center space-y-5">
          <h2 className="text-3xl font-black">Partner With Akubrecah Technologies.</h2>
          <p className="text-white/80 text-sm max-w-lg mx-auto">
            Whether you are a startup building your first product, an enterprise modernizing legacy systems, 
            or a government agency digitizing citizen services — we bring the engineering discipline your project deserves.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link href="/contact">
              <Button size="lg" className="h-12 px-8 rounded-xl bg-white text-primary font-bold text-sm flex items-center gap-2 group">
                Start a Conversation <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/services">
              <Button variant="outline" size="lg" className="h-12 px-8 rounded-xl border-white/40 text-white hover:bg-white/10 font-bold text-sm">
                View Our Services
              </Button>
            </Link>
          </div>
        </section>

      </div>
    </div>
  )
}
