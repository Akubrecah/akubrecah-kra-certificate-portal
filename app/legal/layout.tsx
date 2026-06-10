import { PageBackground } from "@/components/ui/page-background"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageBackground>
      <div className="max-w-3xl mx-auto w-full px-6 py-12 pb-24">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-amber-400 transition-colors mb-10"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to Home
        </Link>
        <article className="prose-legal space-y-8">
          {children}
        </article>
      </div>
    </PageBackground>
  )
}
