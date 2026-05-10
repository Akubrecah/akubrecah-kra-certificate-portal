"use client"

import { PageBackground } from "@/components/ui/page-background"
import { motion } from "framer-motion"

export default function FAQPage() {
  const faqs = [
    {
      question: "IS THIS OFFICIAL?",
      answer: "This is a reliable independent service for easy KRA portal access and certificate retrieval."
    },
    {
      question: "DATA SECURITY?",
      answer: "We employ bank-level encryption. All information is encrypted and we do not store your personal details permanently."
    },
    {
      question: "PROCESSING TIME?",
      answer: "Most retrievals are completed within 45 seconds depending on system synchronization."
    },
    {
      question: "SUPPORT OPTIONS?",
      answer: "We offer priority support for all users. Reach out via our official channels for any assistance."
    },
    {
      question: "PREVIOUS YEARS?",
      answer: "Yes, you can retrieve certificates and file returns for previous tax years through our portal."
    },
    {
      question: "MOBILE READY?",
      answer: "Our platform is fully optimized for all devices, ensuring a seamless experience on mobile and desktop."
    }
  ]

  return (
    <PageBackground>
      <div className="w-full flex flex-col space-y-4 py-4 max-w-2xl mx-auto">
        <div className="text-center space-y-1 mb-4">
          <h1 className="text-xl font-bold uppercase tracking-widest">Inquiries.</h1>
          <div className="h-[1px] w-8 bg-primary mx-auto" />
          <p className="text-muted-foreground text-[8px] font-bold uppercase tracking-widest opacity-60 mt-2">
            Common questions about our service.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass rounded-2xl p-4 border border-white/5 hover:border-primary/20 transition-all group"
            >
              <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] mb-2 text-primary group-hover:text-primary/80 transition-colors">
                {faq.question}
              </h3>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide leading-relaxed opacity-80">
                {faq.answer}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </PageBackground>
  )
}
