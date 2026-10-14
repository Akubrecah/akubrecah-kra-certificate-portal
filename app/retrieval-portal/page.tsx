"use client"

import Link from "next/link"
import { KRAPortal } from "@/components/kra-portal"
import { CyberSubscriptionCard } from "@/components/cyber-subscription-card"
import { 
  FileCheck2, ShieldCheck, Zap, Lock, ArrowRight, 
  CheckCircle2, Sparkles, RefreshCw, FileText, Building2, HelpCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"

const highlights = [
  {
    icon: Zap,
    title: "Sub-30s Automated Retrieval",
    desc: "Direct statutory verification connects to taxpayer registries and generates an official compliance document in seconds.",
  },
  {
    icon: Lock,
    title: "Bank-Grade Cryptographic Security",
    desc: "TLS 1.3 encryption, Kenya Data Protection Act (KDPA) compliance, and verified digital signatures on every issued certificate.",
  },
  {
    icon: FileText,
    title: "Transparent KES 20 Download Fee",
    desc: "Pay only KES 20 per certificate download via M-Pesa or card. Or subscribe for KES 500/mo for unlimited cyber retrievals.",
  },
]

const steps = [
  {
    num: "01",
    title: "Enter National ID or KRA PIN",
    desc: "Select query type and enter your 8-digit National ID number or 11-character KRA PIN with arithmetic security verification.",
  },
  {
    num: "02",
    title: "Instant Statutory Registry Search",
    desc: "Our automated gateway queries tax compliance records to retrieve your legal name, tax station, county, and registration status.",
  },
  {
    num: "03",
    title: "Instant Official PDF Download",
    desc: "Free for active Cyber Cafe subscribers, or KES 20 one-time via M-Pesa. Your official tamper-proof PDF with QR code downloads immediately.",
  },
]

const faqs = [
  {
    q: "Is this certificate an official Kenya Revenue Authority document?",
    a: "Yes. Certificates retrieved through our gateway reflect the official taxpayer registration and compliance standing with the authentic verification QR code and cryptographic validation.",
  },
  {
    q: "How does the KES 500 Cyber Cafe monthly subscription work?",
    a: "Cyber cafes and tax consultants can subscribe for KES 500/month to get unlimited certificate retrievals with zero per-download fees, WhatsApp bot access, and automated fiscal invoices with full business details.",
  },
  {
    q: "Can I retrieve with only my National ID if I forgot my KRA PIN?",
    a: "Yes. Our automated gateway supports direct reverse lookup using your Kenya National ID number without needing to remember your KRA PIN.",
  },
]

export default function RetrievalPortalPage() {
  return (
    <div className="min-h-screen bg-background text-on-background">

      {/* Above-The-Fold Interactive Workspace */}
      <div className="bg-surface-container-lowest border-b border-outline-variant relative overflow-hidden">
        {/* Subtle ambient red spotlight */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full filter blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 lg:py-8 space-y-5 relative z-10">
          
          {/* Top Bar: Breadcrumb + Live Status */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <nav className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              <span>/</span>
              <Link href="/products" className="hover:text-primary transition-colors">In-House Products</Link>
              <span>/</span>
              <span className="text-on-surface font-bold">KRA Retrieval Portal</span>
            </nav>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-black text-emerald-700 dark:text-emerald-300 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Statutory Gateway Live · 50,000+ Certificates Issued
            </div>
          </div>

          {/* Cyber Subscription Status (Visible only for logged-in users) */}
          <CyberSubscriptionCard compact={true} />

          {/* Main Above-The-Fold Split Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start pt-1">
            
            {/* Left Column: Branding, Title, High-Impact Badges */}
            <div className="lg:col-span-5 space-y-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-[11px] font-bold tracking-wide uppercase">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Official Taxpayer Gateway
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-on-surface tracking-tight leading-tight">
                  Instant Official KRA<br className="hidden sm:inline" />
                  <span className="text-primary"> Certificate Retrieval.</span>
                </h1>
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed font-medium">
                  Retrieve and verify official Kenya Revenue Authority (KRA) Tax Compliance Certificates instantly 
                  using your National ID number or KRA PIN with verified QR codes.
                </p>
              </div>

              {/* Eye-Catching Highlights Grid */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="p-3 rounded-2xl bg-surface-container border border-outline-variant flex items-center gap-2.5">
                  <Zap className="h-4 w-4 text-primary shrink-0" />
                  <div className="text-left">
                    <p className="text-[11px] font-black text-on-surface">&lt; 30s Instant</p>
                    <p className="text-[10px] text-on-surface-variant">Automated generation</p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-surface-container border border-outline-variant flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div className="text-left">
                    <p className="text-[11px] font-black text-on-surface">Verified QR Code</p>
                    <p className="text-[10px] text-on-surface-variant">Statutory authenticity</p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-surface-container border border-outline-variant flex items-center gap-2.5">
                  <Lock className="h-4 w-4 text-on-surface-variant shrink-0" />
                  <div className="text-left">
                    <p className="text-[11px] font-black text-on-surface">TLS 1.3 Encrypted</p>
                    <p className="text-[10px] text-on-surface-variant">KDPA compliant</p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-primary/10 border border-primary/25 flex items-center gap-2.5">
                  <Sparkles className="h-4 w-4 text-primary shrink-0" />
                  <div className="text-left">
                    <p className="text-[11px] font-black text-primary">KES 20 / Cert</p>
                    <p className="text-[10px] text-primary/80">Free with Cyber plan</p>
                  </div>
                </div>
              </div>

              {/* Cyber Cafe Quick Info Callout */}
              <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/80 shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-on-surface">
                  <Building2 className="h-4 w-4 text-primary shrink-0" />
                  <span>Cyber Cafe or Business Agent?</span>
                </div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Get our <span className="font-bold text-primary">Cyber Cafe Monthly Plan at KES 500/mo</span> for unlimited lookups, zero download fees, WhatsApp bot access, and monthly tax invoices.
                </p>
                <div className="pt-1">
                  <Link href="/dashboard" className="text-[11px] font-bold text-primary hover:underline inline-flex items-center gap-1">
                    Manage Cyber Subscription &rarr;
                  </Link>
                </div>
              </div>

            </div>

            {/* Right Column: Interactive Portal - DIRECTLY ABOVE THE FOLD */}
            <div className="lg:col-span-7">
              <div className="relative rounded-3xl bg-surface-container-lowest border-2 border-outline-variant shadow-xl overflow-hidden p-4 sm:p-6 lg:p-7">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary via-red-600 to-primary" />
                <KRAPortal hideHeader={true} />
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Below-The-Fold Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-16">

        {/* 3-Step Simple Process */}
        <section className="space-y-8">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="text-xs font-black text-primary uppercase tracking-widest">How It Works</span>
            <h2 className="text-3xl font-black text-on-surface">Three Steps to Your Official Certificate</h2>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              Fast, automated, and strictly compliant with Kenya Revenue Authority statutory verification guidelines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((st) => (
              <div key={st.num} className="p-7 rounded-3xl bg-surface-container-lowest border border-outline-variant space-y-4 shadow-soft">
                <span className="text-xs font-mono font-black text-primary px-3 py-1 rounded-xl bg-primary/10 border border-primary/20 inline-block">
                  Step {st.num}
                </span>
                <h3 className="text-lg font-bold text-on-surface">{st.title}</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Engineering Highlights */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-black text-primary uppercase tracking-widest">Built Different</span>
            <h2 className="text-3xl font-black text-on-surface">Why Thousands Rely on Our Gateway Daily</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {highlights.map((h) => {
              const Icon = h.icon
              return (
                <div key={h.title} className="p-7 rounded-3xl bg-surface-container-lowest border border-outline-variant space-y-4 shadow-soft">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary w-fit">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-on-surface">{h.title}</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{h.desc}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* FAQs */}
        <section className="space-y-8">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="text-xs font-black text-primary uppercase tracking-widest">Frequently Asked Questions</span>
            <h2 className="text-3xl font-black text-on-surface">Common Questions Answered</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {faqs.map((faq, idx) => (
              <div key={idx} className="p-6 rounded-3xl bg-surface-container-lowest border border-outline-variant space-y-3 shadow-soft">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <HelpCircle className="w-4 h-4 shrink-0" />
                  <span>{faq.q}</span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="p-10 sm:p-14 rounded-3xl bg-primary text-white text-center space-y-5 shadow-xl">
          <h2 className="text-3xl font-black">Need Batch Certificate Verification for Your Business?</h2>
          <p className="text-white/90 text-sm max-w-lg mx-auto">
            We offer enterprise bulk validation and automated employee compliance checking via our secure B2B API gateway.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/contact?service=enterprise">
              <Button size="lg" className="h-12 px-8 rounded-xl bg-white text-primary font-bold text-sm flex items-center gap-2 group shadow-sm hover:bg-white/95">
                Inquire Enterprise API <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/dashboard/filing">
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 rounded-xl border-2 border-white text-white bg-transparent hover:bg-white hover:text-primary font-bold text-sm transition-all shadow-sm"
              >
                Tax Filing Gateway
              </Button>
            </Link>
          </div>
        </section>

      </div>
    </div>
  )
}

