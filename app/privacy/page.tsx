"use client"

import { PageBackground } from "@/components/ui/page-background"
import { motion } from "framer-motion"

export default function PrivacyPage() {
  const sections = [
    {
      title: "INFORMATION COLLECTION",
      content: [
        "Personal identification information (name, email address, phone number)",
        "Financial data necessary for tax filing",
        "Employment and income information",
        "KRA PIN and Identification numbers",
        "Documents uploaded to our platform"
      ]
    },
    {
      title: "USAGE PROTOCOL",
      content: [
        "Process and file tax returns",
        "Provide support and respond to inquiries",
        "Improve service infrastructure",
        "Comply with legal and tax regulations",
        "Prevent fraud and enhance security"
      ]
    },
    {
      title: "SECURITY MEASURES",
      content: [
        "End-to-end encryption for all data transmission",
        "Secure, encrypted data storage",
        "Strict access control and authentication",
        "Regular security audits",
        "Zero-retention policy for sensitive session data"
      ]
    }
  ]

  return (
    <PageBackground>
      <div className="w-full flex flex-col space-y-6 py-6 max-w-2xl mx-auto">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tighter uppercase leading-tight">Privacy <span className="text-primary">Policy.</span></h1>
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
              <ul className="space-y-2">
                {section.content.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[9px] text-muted-foreground uppercase font-medium leading-relaxed opacity-80">
                    <span className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.section>
          ))}
        </div>

        <div className="glass p-6 rounded-2xl border border-white/5 text-center space-y-2">
          <h2 className="text-[10px] font-bold uppercase tracking-widest">CONTACT PROTOCOL</h2>
          <p className="text-[9px] text-muted-foreground uppercase font-medium leading-relaxed opacity-60">
            For privacy-related inquiries, contact our security team at privacy@akubrecah.com
          </p>
        </div>
      </div>
    </PageBackground>
  )
}
