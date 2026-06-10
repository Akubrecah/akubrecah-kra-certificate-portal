import type { Metadata } from "next"
import Link from "next/link"
import { Shield, FileText, AlertTriangle, Cookie, RotateCcw, Ban } from "lucide-react"

export const metadata: Metadata = {
  title: "Legal | Akubrecah KRA Services",
  description: "Legal documents governing the use of Akubrecah's KRA certificate retrieval services.",
}

const legalDocs = [
  {
    icon: Shield,
    title: "Privacy Policy",
    description:
      "How we collect, process, and protect your personal data under Kenya's Data Protection Act 2019. Covers ID data, retention periods, your rights, and our security measures.",
    href: "/legal/privacy",
    tag: "Data Protection Act 2019",
    tagColor: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  },
  {
    icon: FileText,
    title: "Terms of Service",
    description:
      "The binding agreement between you and Akubrecah. Covers acceptable use, liability limits, indemnification, eligibility, and Kenyan governing law.",
    href: "/legal/terms",
    tag: "Binding Agreement",
    tagColor: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  },
  {
    icon: AlertTriangle,
    title: "Disclaimer",
    description:
      "Akubrecah is NOT the Kenya Revenue Authority. This document clarifies our independence, limits our liability for KRA system errors, and confirms we provide no legal or tax advice.",
    href: "/legal/disclaimer",
    tag: "Not Affiliated with KRA",
    tagColor: "text-red-400 bg-red-400/10 border-red-400/20",
  },
  {
    icon: Cookie,
    title: "Cookie Policy",
    description:
      "A detailed breakdown of the minimal cookies we use — only Clerk authentication cookies. We use no advertising, tracking, or third-party analytics cookies.",
    href: "/legal/cookies",
    tag: "No Ad Cookies",
    tagColor: "text-green-400 bg-green-400/10 border-green-400/20",
  },
  {
    icon: RotateCcw,
    title: "Refund Policy",
    description:
      "Our policy on service fees, refund eligibility, and the process for requesting a refund if our service fails to deliver your certificate.",
    href: "/legal/refund",
    tag: "Payments & Refunds",
    tagColor: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  },
  {
    icon: Ban,
    title: "Acceptable Use Policy",
    description:
      "What you may and may not do with this service. Prohibits accessing others' KRA data without consent, scraping, fraud, and other misuse.",
    href: "/legal/aup",
    tag: "User Conduct",
    tagColor: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  },
]

export default function LegalIndexPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-3 border-b border-white/10 pb-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-400">Akubrecah</p>
        <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">Legal Center</h1>
        <p className="text-[12px] text-muted-foreground leading-relaxed max-w-lg">
          All legal documents governing your use of Akubrecah KRA Services. Please read these carefully before using
          the Service.
        </p>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mt-2">
          <p className="text-[11px] text-red-400 font-bold uppercase tracking-wide">
            ⚠ Akubrecah is an independent third-party service and is NOT the Kenya Revenue Authority (KRA) or any
            government entity.
          </p>
        </div>
      </div>

      {/* Documents grid */}
      <div className="grid grid-cols-1 gap-4">
        {legalDocs.map((doc) => {
          const Icon = doc.icon
          return (
            <Link
              key={doc.href}
              href={doc.href}
              className="group flex items-start gap-5 p-5 rounded-2xl border border-white/10 hover:border-amber-400/30 hover:bg-amber-400/5 transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:border-amber-400/30 transition-colors">
                <Icon className="w-4 h-4 text-muted-foreground group-hover:text-amber-400 transition-colors" />
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-[12px] font-black uppercase tracking-widest text-foreground group-hover:text-amber-400 transition-colors">
                    {doc.title}
                  </h2>
                  <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${doc.tagColor}`}>
                    {doc.tag}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{doc.description}</p>
              </div>
              <span className="text-amber-400/40 group-hover:text-amber-400 transition-colors text-lg flex-shrink-0 mt-1">
                →
              </span>
            </Link>
          )
        })}
      </div>

      {/* Bottom notice */}
      <div className="border-t border-white/10 pt-6 space-y-2">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
          These documents were last reviewed on <strong className="text-foreground">10 June 2026</strong>.
        </p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
          Questions? Contact us at{" "}
          <a href="mailto:legal@akubrecah.com" className="text-amber-400 underline underline-offset-4">
            legal@akubrecah.com
          </a>
        </p>
      </div>
    </div>
  )
}
