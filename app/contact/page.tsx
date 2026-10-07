"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Send, MapPin, Mail, Clock, MessageSquare, ArrowRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type FormState = "idle" | "submitting" | "success"

const projectTypes = [
  "Web Platform / SaaS", "Mobile App (iOS/Android)",
  "Cloud Infrastructure", "Enterprise System",
  "Government / GovTech Portal", "Fintech / Payment Integration",
  "M-Pesa / KRA API Integration", "Other",
]

const budgetRanges = [
  "Under KES 500K", "KES 500K – 2M", "KES 2M – 5M",
  "KES 5M – 15M", "KES 15M+", "Let's discuss",
]

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "", email: "", company: "", phone: "",
    projectType: "", budget: "", message: "",
  })
  const [formState, setFormState] = useState<FormState>("idle")

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormState("submitting")
    await new Promise(r => setTimeout(r, 1500))
    setFormState("success")
  }

  return (
    <div className="min-h-screen bg-background text-on-background">

      {/* ── HERO: Stark dark editorial ── */}
      <section className="bg-on-surface dark:bg-[#0d0d0d] text-surface dark:text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 space-y-6">
          <nav className="flex items-center gap-2 text-xs text-surface/40 dark:text-white/40">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <span>Contact</span>
          </nav>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-5"
          >
            <p className="text-xs font-black text-primary uppercase tracking-[0.3em]">Start a Project</p>
            <h1 className="text-[clamp(2.5rem,8vw,6rem)] font-black leading-[0.93] tracking-tight">
              Let&apos;s Build<br />
              <span className="text-primary">Something</span><br />
              Great.
            </h1>
            <p className="text-sm text-surface/60 dark:text-white/50 max-w-lg leading-relaxed border-l-2 border-primary pl-4">
              Our senior engineers review every brief and respond within 24 hours with a proposed 
              approach and timeline — no automated replies.
            </p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 inset-x-0 h-px bg-primary/30" />
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">

          {/* Left: Info (2 cols) */}
          <div className="lg:col-span-2 space-y-10">

            <div className="space-y-5">
              {[
                { icon: MapPin, label: "Location", value: "Nairobi, Kenya\nEast Africa Hub" },
                { icon: Mail, label: "Email", value: "engineering@akubrecah.com", isEmail: true },
                { icon: Clock, label: "Response Time", value: "Within 24h on business days.\nPriority for enterprise inquiries." },
                { icon: MessageSquare, label: "Free Discovery Call", value: "30-min architecture scoping call with a senior engineer — no cost." },
              ].map(({ icon: Icon, label, value, isEmail }) => (
                <div key={label} className="flex items-start gap-4 border-b border-outline-variant pb-5">
                  <div className="p-2 border border-outline-variant text-primary shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-on-surface-variant uppercase tracking-widest mb-1">{label}</p>
                    {isEmail ? (
                      <a href={`mailto:${value}`} className="text-sm font-bold text-primary hover:underline">{value}</a>
                    ) : (
                      <p className="text-xs text-on-surface whitespace-pre-line leading-relaxed">{value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* What happens next */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-on-surface uppercase tracking-widest">What Happens Next</h3>
              <div className="space-y-0 border border-outline-variant">
                {[
                  { num: "01", text: "We review your brief within 24h" },
                  { num: "02", text: "Senior engineer contacts you" },
                  { num: "03", text: "We send scope doc & timeline" },
                  { num: "04", text: "Project kickoff on agreement" },
                ].map((step) => (
                  <div key={step.num} className="flex items-center gap-4 px-4 py-3 border-b border-outline-variant last:border-b-0">
                    <span className="font-mono font-black text-primary text-xs w-6 shrink-0">{step.num}</span>
                    <span className="text-xs text-on-surface">{step.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Tools quick-links */}
            <div className="space-y-2">
              <h3 className="text-xs font-black text-on-surface-variant uppercase tracking-widest">Live Tools</h3>
              {[
                { label: "KRA Certificate Portal", href: "/retrieval-portal" },
                { label: "PIN & ID Validator", href: "/pin-checker" },
                { label: "Tax Filing Portal", href: "/dashboard/filing" },
              ].map((tool) => (
                <Link
                  key={tool.label}
                  href={tool.href}
                  className="flex items-center justify-between py-2.5 border-b border-outline-variant text-xs font-bold text-on-surface hover:text-primary transition-colors group"
                >
                  {tool.label}
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              ))}
            </div>
          </div>

          {/* Right: Form (3 cols) */}
          <div className="lg:col-span-3">
            {formState === "success" ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col items-center justify-center text-center py-20 space-y-5 border border-outline-variant"
              >
                <div className="p-4 border-2 border-emerald-500 text-emerald-600">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h2 className="text-3xl font-black text-on-surface">Brief Received.</h2>
                <p className="text-sm text-on-surface-variant max-w-sm leading-relaxed">
                  Our engineering team will review your submission and contact you within 24 business hours.
                </p>
                <Button
                  className="h-11 px-7 rounded-none bg-primary text-white font-black text-sm"
                  onClick={() => { setFormState("idle"); setForm({ name: "", email: "", company: "", phone: "", projectType: "", budget: "", message: "" }) }}
                >
                  Send Another Brief
                </Button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 border border-outline-variant p-8 sm:p-10">
                <h2 className="text-2xl font-black text-on-surface">Project Brief</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {[
                    { id: "name", label: "Full Name *", placeholder: "John Kamau", type: "text", required: true },
                    { id: "email", label: "Email *", placeholder: "john@company.com", type: "email", required: true },
                    { id: "company", label: "Company", placeholder: "Acme Corp Ltd", type: "text", required: false },
                    { id: "phone", label: "Phone", placeholder: "+254 7XX XXX XXX", type: "tel", required: false },
                  ].map((field) => (
                    <div key={field.id} className="space-y-1.5">
                      <label htmlFor={field.id} className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                        {field.label}
                      </label>
                      <Input
                        id={field.id}
                        name={field.id}
                        type={field.type}
                        value={form[field.id as keyof typeof form]}
                        onChange={handleChange}
                        required={field.required}
                        placeholder={field.placeholder}
                        className="h-11 rounded-none border-outline-variant bg-surface-container text-sm focus-visible:ring-primary"
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {[
                    { id: "projectType", label: "Project Type *", options: projectTypes, required: true },
                    { id: "budget", label: "Estimated Budget", options: budgetRanges, required: false },
                  ].map((sel) => (
                    <div key={sel.id} className="space-y-1.5">
                      <label htmlFor={sel.id} className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                        {sel.label}
                      </label>
                      <select
                        id={sel.id}
                        name={sel.id}
                        value={form[sel.id as keyof typeof form]}
                        onChange={handleChange}
                        required={sel.required}
                        className="w-full h-11 px-3 border border-outline-variant bg-surface-container text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary rounded-none"
                      >
                        <option value="" disabled>Select...</option>
                        {sel.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="message" className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                    Project Brief *
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    placeholder="Describe your project: What problem does it solve? Who are the users? What integrations are needed? Target timeline?"
                    className="rounded-none border-outline-variant bg-surface-container text-sm resize-none focus-visible:ring-primary"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={formState === "submitting"}
                  className="w-full h-13 rounded-none bg-primary text-white font-black text-sm flex items-center justify-center gap-2 group disabled:opacity-70"
                >
                  {formState === "submitting" ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Sending Brief...
                    </>
                  ) : (
                    <>Submit Project Brief <Send className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" /></>
                  )}
                </Button>

                <p className="text-[11px] text-on-surface-variant text-center">
                  By submitting, you agree to our{" "}
                  <Link href="/legal/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
                  Your information is never shared.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
