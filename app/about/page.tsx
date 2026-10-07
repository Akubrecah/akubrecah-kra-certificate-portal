"use client"

import Link from "next/link"
import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { 
  CheckCircle2, ArrowRight, ArrowUpRight, Code2, Target, Zap, Shield, MapPin
} from "lucide-react"
import { Button } from "@/components/ui/button"

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const expertise = [
  "Full-Stack TypeScript / React / Next.js",
  "Native iOS (Swift/SwiftUI)",
  "Native Android (Kotlin/Jetpack)",
  "React Native Cross-Platform",
  "Node.js, Python, Go Microservices",
  "AWS, GCP, Azure Architecture",
  "Docker & Kubernetes DevOps",
  "Terraform Infrastructure as Code",
  "PostgreSQL & Redis Engineering",
  "M-Pesa Daraja Payment Gateways",
  "KRA iTax & eCitizen Gov APIs",
  "GraphQL, REST, gRPC Design",
]

const proof = [
  { value: "50K+", label: "Compliance certificates issued", href: "/retrieval-portal" },
  { value: "10K+", label: "Daily taxpayer validations", href: "/pin-checker" },
  { value: "99.98%", label: "Platform uptime SLA", href: "/products" },
  { value: "80+", label: "Projects delivered", href: "/contact" },
]

const principles = [
  {
    num: "01",
    title: "Engineering Rigor Above All",
    body: "We treat software engineering as a discipline, not a craft. Every component is typed, tested, audited, and documented before it ships to production. No shortcuts. No technical debt by design.",
  },
  {
    num: "02",
    title: "Outcome-Driven Development",
    body: "We don't measure success by lines of code or velocity metrics. We measure it by business outcomes — uptime, user adoption, and measurable ROI delivered to clients.",
  },
  {
    num: "03",
    title: "Security by Default",
    body: "Security is not a feature — it is the foundation. OWASP standards, end-to-end encryption, and regular penetration testing are non-negotiable on every project we touch.",
  },
  {
    num: "04",
    title: "Performance Without Compromise",
    body: "We design for sub-second response times, optimize database query plans, and profile every critical path before shipping any production-bound code.",
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-on-background overflow-x-hidden">

      {/* ── HERO: Full-bleed dark editorial ── */}
      <section className="relative bg-on-surface dark:bg-[#0d0d0d] text-surface dark:text-white overflow-hidden">
        {/* Grain texture overlay */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjY1IiBudW1PY3RhdmVzPSIzIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWx0ZXI9InVybCgjYSkiLz48L3N2Zz4=')] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <nav className="flex items-center gap-2 text-xs text-surface/40 dark:text-white/40 mb-14">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <span>About</span>
          </nav>

          {/* Massive editorial headline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-6"
          >
            <p className="text-xs font-black text-primary uppercase tracking-[0.3em]">
              Akubrecah Technologies · Est. Nairobi
            </p>

            <h1 className="text-[clamp(3rem,10vw,8rem)] font-black leading-[0.92] tracking-tight text-surface dark:text-white">
              We Build<br />
              <span className="text-primary">Software</span><br />
              That Lasts.
            </h1>

            <div className="max-w-2xl border-l-2 border-primary pl-6 py-2 mt-8">
              <p className="text-base sm:text-lg text-surface/70 dark:text-white/60 leading-relaxed">
                A premier software engineering company headquartered in Nairobi, Kenya. 
                We architect high-impact web platforms, native mobile apps, cloud infrastructure, 
                and mission-critical statutory automation systems — built to outlast trends and 
                withstand real production load.
              </p>
            </div>

            <div className="flex items-center gap-2 text-surface/50 dark:text-white/40 text-xs font-semibold mt-6">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              Nairobi, Kenya — Engineering for East Africa & Global Markets
            </div>
          </motion.div>
        </div>

        {/* Bottom cut border */}
        <div className="absolute bottom-0 inset-x-0 h-px bg-primary/30" />
      </section>

      {/* ── PROOF NUMBERS: Full-width stark band ── */}
      <section className="border-b border-outline-variant bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {proof.map((p, i) => (
              <Reveal key={p.label} delay={i * 0.08}>
                <Link
                  href={p.href}
                  className="group block border-r border-outline-variant last:border-r-0 px-8 py-10 hover:bg-surface-container transition-colors"
                >
                  <span className="block text-4xl sm:text-5xl font-black text-primary mb-1 group-hover:scale-105 transition-transform origin-left">
                    {p.value}
                  </span>
                  <span className="block text-xs text-on-surface-variant leading-snug">{p.label}</span>
                  <ArrowUpRight className="h-4 w-4 text-primary mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── MISSION: Bold editorial statement ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <Reveal>
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 items-start">
            <div className="lg:w-1/3 shrink-0">
              <p className="text-xs font-black text-primary uppercase tracking-[0.25em] mb-4">Mission</p>
              <h2 className="text-3xl sm:text-4xl font-black text-on-surface leading-tight">
                Our<br />North Star.
              </h2>
            </div>
            <div className="lg:flex-1 space-y-4">
              <blockquote className="text-xl sm:text-2xl font-black text-on-surface leading-snug border-l-4 border-primary pl-6">
                "To engineer digital systems of exceptional quality — fast, secure, and built to last — enabling 
                our clients to compete and win on a global scale."
              </blockquote>
              <p className="text-sm text-on-surface-variant leading-relaxed pl-6">
                Founded in Nairobi, Akubrecah Technologies was built on a conviction that East African businesses 
                deserve world-class engineering — not compromised, offshore-minimum-viable code. We apply the same 
                standards as leading global software houses to local market realities and domain expertise.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── PRINCIPLES: Numbered vertical stack ── */}
      <section className="border-t border-outline-variant">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <Reveal className="mb-12">
            <p className="text-xs font-black text-primary uppercase tracking-[0.25em] mb-3">Guiding Principles</p>
            <h2 className="text-4xl sm:text-5xl font-black text-on-surface">What We Stand For.</h2>
          </Reveal>

          <div className="space-y-0">
            {principles.map((p, i) => (
              <Reveal key={p.num} delay={i * 0.08}>
                <div className="group flex flex-col sm:flex-row gap-6 sm:gap-12 py-8 border-b border-outline-variant hover:bg-surface-container transition-colors -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 cursor-default">
                  <div className="shrink-0 w-12">
                    <span className="text-xs font-mono font-black text-primary">{p.num}</span>
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="text-xl sm:text-2xl font-black text-on-surface group-hover:text-primary transition-colors">
                      {p.title}
                    </h3>
                    <p className="text-sm text-on-surface-variant leading-relaxed max-w-2xl">{p.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── EXPERTISE: Two-col tag cloud with hard borders ── */}
      <section className="border-t border-outline-variant bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 items-start">
            <Reveal className="lg:w-1/3 shrink-0 space-y-3">
              <p className="text-xs font-black text-primary uppercase tracking-[0.25em]">Technical Depth</p>
              <h2 className="text-3xl sm:text-4xl font-black text-on-surface leading-tight">
                Full-Stack<br />Mastery.
              </h2>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                No knowledge gaps. No subcontracting to generalists. Our engineers own every layer of the stack.
              </p>
            </Reveal>

            <Reveal delay={0.12} className="lg:flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 border border-outline-variant">
                {expertise.map((skill, i) => (
                  <div
                    key={skill}
                    className="flex items-center gap-3 px-5 py-4 border-b border-r border-outline-variant last:border-b-0 hover:bg-surface-container hover:text-primary transition-colors text-xs font-semibold text-on-surface group"
                    style={{ borderRight: i % 2 !== 0 ? "none" : undefined }}
                  >
                    <div className="w-1 h-1 rounded-full bg-primary shrink-0 group-hover:scale-150 transition-transform" />
                    {skill}
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── IN-HOUSE PROOF: Horizontal list ── */}
      <section className="border-t border-outline-variant">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <Reveal className="mb-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-black text-primary uppercase tracking-[0.25em]">Proof of Engineering</p>
                <h2 className="text-3xl sm:text-4xl font-black text-on-surface">We Eat Our Own Cooking.</h2>
              </div>
              <Link href="/products">
                <Button variant="outline" size="sm" className="h-10 px-5 rounded-none border-2 border-on-surface text-on-surface font-black text-xs gap-2 hover:bg-on-surface hover:text-background transition-colors">
                  View All Products <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
            <p className="text-sm text-on-surface-variant mt-4 max-w-2xl leading-relaxed">
              Our in-house KRA Compliance Suite is the best demonstration of our engineering standards — 
              the same architecture, security models, and deployment pipelines we deliver to every client.
            </p>
          </Reveal>

          <div className="space-y-0 border border-outline-variant">
            {[
              { 
                title: "KRA Certificate Retrieval Portal", 
                stat: "50,000+ certificates issued", 
                uptime: "99.2% success rate", 
                href: "/retrieval-portal",
                tag: "Flagship"
              },
              { 
                title: "Live PIN & National ID Validator", 
                stat: "10,000+ validations/day", 
                uptime: "< 3s response time", 
                href: "/pin-checker",
                tag: "GovTech"
              },
              { 
                title: "Automated Tax Returns Filing", 
                stat: "25,000+ returns filed", 
                uptime: "< 0.1% error rate", 
                href: "/dashboard/filing",
                tag: "Compliance"
              },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 0.07}>
                <Link
                  href={item.href}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-6 border-b border-outline-variant last:border-b-0 hover:bg-surface-container transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black px-2 py-1 border border-outline-variant text-on-surface-variant">
                      {item.tag}
                    </span>
                    <h3 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-6 shrink-0">
                    <span className="text-xs text-on-surface-variant">{item.stat}</span>
                    <span className="hidden sm:block text-xs font-bold text-emerald-600">{item.uptime}</span>
                    <ArrowUpRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>

          {/* Zero-incident badge */}
          <Reveal delay={0.2} className="mt-6 flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              All systems operational
            </div>
            <span className="text-xs text-on-surface-variant">·</span>
            <span className="text-xs text-on-surface-variant">Zero critical security incidents since launch</span>
          </Reveal>
        </div>
      </section>

      {/* ── CTA: Hard-edge full-bleed red ── */}
      <section className="bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-3">
              <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
                Ready to Build<br />Something Real?
              </h2>
              <p className="text-white/70 text-sm max-w-lg leading-relaxed">
                Startup, enterprise, or government agency — if you need software built with discipline, 
                precision, and long-term thinking, this is where that conversation starts.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Link href="/contact">
                <Button size="lg" className="h-13 px-8 rounded-none bg-white text-primary font-black text-sm flex items-center gap-2 group hover:bg-white/92">
                  Start a Conversation <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/services">
                <Button variant="outline" size="lg" className="h-13 px-8 rounded-none border-2 border-white text-white hover:bg-white/10 font-black text-sm">
                  View Services
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
