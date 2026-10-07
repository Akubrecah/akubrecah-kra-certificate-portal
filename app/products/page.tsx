"use client"

import Link from "next/link"
import { FileCheck2, ShieldCheck, Send, ArrowRight, CheckCircle2, Lock, Zap, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"

const products = [
  {
    id: "certificate-portal",
    tag: "Flagship Product",
    icon: FileCheck2,
    title: "KRA Certificate Retrieval Portal",
    subtitle: "Instant official compliance document generation",
    description: "Our flagship government automation product. Retrieve official KRA PIN Compliance Certificates instantly using your National ID number or KRA PIN. Powered by our proprietary automated retrieval engine with built-in PDF generation and cryptographic verification.",
    href: "/retrieval-portal",
    ctaText: "Launch Certificate Portal (KES 20)",
    color: "text-primary",
    bgColor: "bg-primary/10",
    features: [
      "Instant retrieval using National ID or KRA PIN",
      "Official PDF certificate generation in under 30s",
      "Automated compliance status verification",
      "Secure end-to-end encrypted document delivery",
      "Transparent KES 20 download fee (no subscriptions)",
      "Built-in iTax status cross-validation",
    ],
    stats: [
      { label: "Certificates Issued", value: "50,000+" },
      { label: "Download Fee", value: "KES 20" },
      { label: "Success Rate", value: "99.2%" },
    ],
  },
  {
    id: "pin-checker",
    tag: "GovTech Utility",
    icon: ShieldCheck,
    title: "Live PIN & National ID Validator",
    subtitle: "Real-time taxpayer registry verification",
    description: "An enterprise-grade taxpayer validation engine connecting directly to official government registries. Verify KRA PINs, validate National IDs, check tax station assignments, and detect fraudulent credentials — all in real time.",
    href: "/pin-checker",
    ctaText: "Run Live Validation",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/40",
    features: [
      "Real-time PIN status and validity check",
      "National ID ↔ PIN cross-reference verification",
      "Tax station and region assignment lookup",
      "Taxpayer registration date and type display",
      "Batch validation via CSV upload for enterprises",
      "Fraud detection signals and risk scoring",
    ],
    stats: [
      { label: "Validations/Day", value: "10,000+" },
      { label: "Response Time", value: "< 3s" },
      { label: "Registry Coverage", value: "100%" },
    ],
  },
  {
    id: "tax-filing",
    tag: "Compliance Engine",
    icon: Send,
    title: "Automated Tax Returns Filing",
    subtitle: "Streamlined statutory submission pipeline",
    description: "An AI-guided statutory compliance assistant that walks users through the entire nil returns filing process. Automated iTax form preparation, validation checks, and official submission receipt generation — all in under 5 minutes.",
    href: "/dashboard/filing",
    ctaText: "File Returns Now",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
    features: [
      "Step-by-step guided filing wizard for all return types",
      "Automated form prefill from KRA registry data",
      "Real-time validation before submission",
      "Official e-slip and acknowledgement generation",
      "Filing history tracking and record keeping",
      "Support for all standard nil return categories",
    ],
    stats: [
      { label: "Returns Filed", value: "25,000+" },
      { label: "Filing Time", value: "< 5 min" },
      { label: "Error Rate", value: "< 0.1%" },
    ],
  },
]

const techHighlights = [
  {
    icon: Lock,
    title: "Bank-Grade Security",
    desc: "TLS 1.3 encryption, OWASP-hardened APIs, rate limiting, and automated scanner blocking on all product endpoints.",
  },
  {
    icon: Zap,
    title: "Sub-Second Performance",
    desc: "Edge-deployed infrastructure with aggressive caching, CDN routing, and optimized database queries for minimal latency.",
  },
  {
    icon: Shield,
    title: "Zero-Downtime Architecture",
    desc: "Blue-green deployments, automated health checks, and multi-region failover ensure continuous service availability.",
  },
]

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-background text-on-background">

      {/* Page Hero */}
      <div className="bg-surface-container-lowest border-b border-outline-variant">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 space-y-6">
          <nav className="flex items-center gap-2 text-xs text-on-surface-variant">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <span className="text-on-surface font-semibold">In-House Products</span>
          </nav>
          <div className="max-w-3xl space-y-4">
            <span className="text-xs font-black text-primary uppercase tracking-widest">Government & Tax Technology</span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-on-surface tracking-tight leading-tight">
              Battle-Tested<br />
              <span className="text-primary">Statutory Tools.</span>
            </h1>
            <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl leading-relaxed">
              Built and operated in-house, these products demonstrate the precision of our engineering. 
              Used daily by thousands of Kenyan taxpayers and businesses for instant, verified tax compliance.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 space-y-20">

        {/* Products */}
        {products.map((product, idx) => {
          const Icon = product.icon
          const isEven = idx % 2 === 0
          return (
            <div key={product.id} id={product.id} className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">
              
              {/* Main Content */}
              <div className={`lg:col-span-3 space-y-6 ${isEven ? "lg:order-1" : "lg:order-2"}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${product.bgColor} ${product.color}`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full ${product.bgColor} ${product.color} border border-current/20`}>
                    {product.tag}
                  </span>
                </div>

                <div>
                  <h2 className="text-3xl sm:text-4xl font-black text-on-surface tracking-tight">{product.title}</h2>
                  <p className={`text-sm font-bold mt-1 ${product.color}`}>{product.subtitle}</p>
                  <p className="text-sm text-on-surface-variant mt-3 leading-relaxed">{product.description}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {product.features.map((feat) => (
                    <div key={feat} className="flex items-start gap-2.5 text-sm text-on-surface">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <Link href={product.href}>
                  <Button className="h-12 px-7 rounded-xl bg-primary text-white font-bold text-sm flex items-center gap-2 group w-fit">
                    {product.ctaText} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>

              {/* Stats Card */}
              <div className={`lg:col-span-2 ${isEven ? "lg:order-2" : "lg:order-1"}`}>
                <div className="p-7 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-soft space-y-5 sticky top-24">
                  <h4 className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Live Performance</h4>
                  <div className="space-y-4">
                    {product.stats.map((stat) => (
                      <div key={stat.label} className="flex items-center justify-between p-4 rounded-2xl bg-surface-container">
                        <span className="text-xs text-on-surface-variant font-semibold">{stat.label}</span>
                        <span className="text-lg font-black text-on-surface">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold pt-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    System Operational
                  </div>
                </div>
              </div>

            </div>
          )
        })}

        {/* Tech Highlights */}
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-black text-primary uppercase tracking-widest">Built Different</span>
            <h2 className="text-3xl font-black text-on-surface">Engineering Standards Behind Every Product</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {techHighlights.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="p-7 rounded-3xl bg-surface-container-lowest border border-outline-variant space-y-4">
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

        {/* CTA */}
        <div className="p-10 sm:p-14 rounded-3xl bg-primary text-white text-center space-y-5">
          <h2 className="text-3xl font-black">Need a Custom Version for Your Organization?</h2>
          <p className="text-white/80 text-sm max-w-lg mx-auto">
            We white-label and customize all of our in-house products for enterprise and government deployments. 
            Full SLA, dedicated support, and on-premise options available.
          </p>
          <Link href="/contact">
            <Button size="lg" className="h-12 px-8 rounded-xl bg-white text-primary font-bold text-sm flex items-center gap-2 mx-auto group">
              Inquire About Licensing <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

      </div>
    </div>
  )
}
