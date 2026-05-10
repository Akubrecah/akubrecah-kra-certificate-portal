"use client"

import { PageBackground } from "@/components/ui/page-background"
import { motion } from "framer-motion"

export default function TermsPage() {
  const sections = [
    {
      title: "1. ACCEPTANCE",
      content: "By accessing Akubrecah services, you agree to be bound by these Terms. If you disagree, you may not access the service."
    },
    {
      title: "2. SERVICE SCOPE",
      content: "We provide online tax preparation and retrieval services. We assist in preparing and filing returns electronically."
    },
    {
      title: "3. ACCOUNT SECURITY",
      content: "Users must provide accurate information. You are responsible for maintaining the security of your credentials."
    },
    {
      title: "4. PRIVACY PROTOCOL",
      content: "Your privacy is paramount. Our protocol describes how we handle and protect your personal information."
    },
    {
      title: "5. COMPLIANCE",
      content: "Users must comply with all local tax laws. Our system facilitates compliance but does not replace legal advice."
    }
  ]

  return (
    <PageBackground>
      <div className="w-full flex flex-col space-y-6 py-6 max-w-2xl mx-auto">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tighter uppercase leading-tight">Terms of <span className="text-primary">Service.</span></h1>
          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-[0.3em] opacity-40">Last updated: December 2024</p>
        </div>

        <div className="space-y-4">
          {sections.map((section, index) => (
            <motion.section 
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass p-6 rounded-2xl border border-white/5 space-y-3"
            >
              <h2 className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">{section.title}</h2>
              <p className="text-[9px] text-muted-foreground uppercase font-medium leading-relaxed opacity-80">
                {section.content}
              </p>
            </motion.section>
          ))}
        </div>

        <div className="glass p-6 rounded-2xl border border-white/5 text-center space-y-2">
          <p className="text-[8px] text-muted-foreground uppercase font-medium leading-relaxed opacity-40">
            By using this service, you acknowledge you have read and understood these terms.
          </p>
        </div>
      </div>
    </PageBackground>
  )
}
