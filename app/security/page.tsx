"use client"

import { PageBackground } from "@/components/ui/page-background"
import { Shield, Lock, Server, UserCheck, ShieldCheck, FileKey } from "lucide-react"
import { motion } from "framer-motion"

export default function SecurityPage() {
  const securityFeatures = [
    {
      icon: Shield,
      title: "END-TO-END ENCRYPT",
      description: "Data transmitted via TLS 1.3 protocols."
    },
    {
      icon: Lock,
      title: "SECURE STORAGE",
      description: "AES-256 encryption at rest."
    },
    {
      icon: Server,
      title: "REGULAR AUDITS",
      description: "Constant penetration testing."
    },
    {
      icon: UserCheck,
      title: "MFA AUTH",
      description: "Multi-factor authentication layers."
    },
    {
      icon: ShieldCheck,
      title: "COMPLIANCE",
      description: "International security standards."
    },
    {
      icon: FileKey,
      title: "FILE HANDLING",
      description: "Highest measures for document safety."
    }
  ]

  return (
    <PageBackground>
      <div className="w-full flex flex-col space-y-6 py-6 max-w-2xl mx-auto">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tighter uppercase leading-tight">Security <span className="text-primary">First.</span></h1>
          <p className="text-[9px] text-muted-foreground uppercase tracking-widest opacity-60 max-w-md mx-auto">
            Industry-leading measures to protect your information.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {securityFeatures.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass p-4 rounded-2xl border border-white/5 hover:border-primary/20 transition-all group flex flex-col items-center text-center space-y-3"
              >
                <div className="p-2 rounded-full bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-[9px] font-bold uppercase tracking-[0.2em]">{feature.title}</h3>
                  <p className="text-[8px] text-muted-foreground uppercase font-medium leading-relaxed opacity-60">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>

        <div className="glass p-6 rounded-2xl border border-white/5 text-center space-y-2">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-primary">COMMITMENT</h2>
          <p className="text-[9px] text-muted-foreground uppercase font-medium leading-relaxed opacity-60">
            We understand the sensitive nature of tax information. Our team continuously monitors and updates our systems to maintain the highest level of protection.
          </p>
        </div>
      </div>
    </PageBackground>
  )
}
