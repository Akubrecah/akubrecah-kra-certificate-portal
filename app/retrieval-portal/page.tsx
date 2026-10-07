"use client"

import Link from "next/link"
import { useUser, SignInButton } from "@clerk/nextjs"
import { KRAPortal } from "@/components/kra-portal"
import { 
  FileCheck2, ShieldCheck, Zap, Lock, ArrowRight, 
  CheckCircle2, Sparkles, RefreshCw, FileText
} from "lucide-react"
import { Button } from "@/components/ui/button"

const highlights = [
  {
    icon: Zap,
    title: "Sub-30s Automated Retrieval",
    desc: "Direct integration with public records verifies your taxpayer standing and generates an official compliance document in seconds.",
  },
  {
    icon: Lock,
    title: "Bank-Grade Cryptographic Security",
    desc: "TLS 1.3 encryption, Kenya Data Protection Act (KDPA) compliance, and verified digital signatures on every issued certificate.",
  },
  {
    icon: FileText,
    title: "Transparent KES 20 Download Fee",
    desc: "Pay only KES 20 per certificate download via M-Pesa or card. Zero monthly subscription traps or recurring commitments.",
  },
]

const steps = [
  {
    num: "01",
    title: "Enter National ID or KRA PIN",
    desc: "Our automated query engine instantly connects to statutory registries to retrieve your taxpayer profile.",
  },
  {
    num: "02",
    title: "Review Tax Compliance Record",
    desc: "Verify your legal name, tax station, county, registration date, and active compliance obligations.",
  },
  {
    num: "03",
    title: "Pay KES 20 & Instant Download",
    desc: "Pay the official one-time KES 20 fee via M-Pesa STK or card. Your tamper-proof PDF certificate downloads instantly.",
  },
]

export default function RetrievalPortalPage() {
  const { isLoaded, isSignedIn } = useUser()

  return (
    <div className="min-h-screen bg-background text-on-background">

      {/* Page Hero - Matching Products Page Design System */}
      <div className="bg-surface-container-lowest border-b border-outline-variant relative overflow-hidden">
        {/* Subtle ambient red spotlight */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full filter blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20 space-y-6 relative z-10">
          <nav className="flex items-center gap-2 text-xs text-on-surface-variant">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-primary transition-colors">In-House Products</Link>
            <span>/</span>
            <span className="text-on-surface font-semibold">KRA Retrieval Portal</span>
          </nav>

          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-xs font-black text-primary uppercase tracking-widest shadow-xs">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              Flagship GovTech Product · 50,000+ Certificates Issued
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-on-surface tracking-tight leading-tight">
              Instant Official KRA<br />
              <span className="text-primary">Certificate Retrieval Portal.</span>
            </h1>

            <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl leading-relaxed">
              Retrieve and verify official Kenya Revenue Authority (KRA) Tax Compliance Certificates instantly 
              using your National ID number or KRA PIN. Automated verification, instant cryptographic PDF 
              generation, and official verification QR code.
            </p>
          </div>

          {/* Eye-Catching Highlights Strip */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 text-xs">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container border border-outline-variant text-on-surface font-bold">
              <Zap className="h-4 w-4 text-primary" />
              <span>&lt; 30s Instant Retrieval</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container border border-outline-variant text-on-surface font-bold">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Official KRA Registry Link</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary/15 border border-primary/30 text-primary font-black shadow-xs">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Download Fee: KES 20 Only</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container border border-outline-variant text-on-surface font-bold">
              <Lock className="h-4 w-4 text-on-surface-variant" />
              <span>256-Bit SSL Encrypted</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 space-y-20">

        {/* The Interactive Retrieval Engine Container */}
        <section className="relative">
          {/* Eye-catching glowing accent frame */}
          <div className="relative rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-xl overflow-hidden p-4 sm:p-8 md:p-10">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary via-red-600 to-primary" />

            {isLoaded && !isSignedIn ? (
              <div className="max-w-lg mx-auto py-12 text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto shadow-sm">
                  <FileCheck2 className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight">
                    Sign In to Retrieve Certificate
                  </h2>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    Sign in with your account to access the official KRA automated retrieval gateway, 
                    view your verified tax records, and download your certificate for just <strong>KES 20</strong>.
                  </p>
                </div>
                <div className="pt-2">
                  <SignInButton mode="modal">
                    <Button size="lg" className="h-12 px-8 rounded-xl bg-primary text-white font-bold text-sm shadow-md shadow-primary/25 hover:bg-primary/90 flex items-center gap-2 mx-auto cursor-pointer">
                      <span>Sign In to Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </SignInButton>
                </div>
                <div className="pt-4 flex items-center justify-center gap-6 text-xs text-on-surface-variant font-medium">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Free Taxpayer Search
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> KES 20 per PDF
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> No Subscription Trap
                  </span>
                </div>
              </div>
            ) : (
              <KRAPortal />
            )}
          </div>
        </section>

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

        {/* Bottom CTA Banner */}
        <section className="p-10 sm:p-14 rounded-3xl bg-primary text-white text-center space-y-5 shadow-xl">
          <h2 className="text-3xl font-black">Need Batch Certificate Verification for Your Business?</h2>
          <p className="text-white/80 text-sm max-w-lg mx-auto">
            We offer enterprise bulk validation and automated employee compliance checking via our secure B2B API gateway.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/contact?service=enterprise">
              <Button size="lg" className="h-12 px-8 rounded-xl bg-white text-primary font-bold text-sm flex items-center gap-2 group shadow-sm hover:bg-white/95">
                Inquire Enterprise API <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/pin-checker">
              <Button variant="outline" size="lg" className="h-12 px-8 rounded-xl border-2 border-white text-white hover:bg-white/10 font-bold text-sm">
                Validate KRA PINs
              </Button>
            </Link>
          </div>
        </section>

      </div>
    </div>
  )
}
