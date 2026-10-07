"use client"

import { useState } from "react"
import Link from "next/link"
import { Send, MapPin, Mail, Phone, ArrowRight, CheckCircle2, Clock, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type FormState = "idle" | "submitting" | "success" | "error"

const projectTypes = [
  "Web Platform / SaaS",
  "Mobile App (iOS/Android)",
  "Cloud Infrastructure",
  "Enterprise System",
  "Government / GovTech Portal",
  "Fintech / Payment Integration",
  "M-Pesa / KRA API Integration",
  "Other",
]

const budgetRanges = [
  "Under KES 500K",
  "KES 500K – 2M",
  "KES 2M – 5M",
  "KES 5M – 15M",
  "KES 15M+",
  "Let's discuss",
]

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    projectType: "",
    budget: "",
    message: "",
  })
  const [formState, setFormState] = useState<FormState>("idle")

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormState("submitting")
    // Simulate API call — wire up your backend / Resend / Formspree here
    await new Promise(r => setTimeout(r, 1500))
    setFormState("success")
  }

  return (
    <div className="min-h-screen bg-background text-on-background">

      {/* Page Hero */}
      <div className="bg-surface-container-lowest border-b border-outline-variant">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 space-y-5">
          <nav className="flex items-center gap-2 text-xs text-on-surface-variant">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <span className="text-on-surface font-semibold">Contact</span>
          </nav>
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-black text-primary uppercase tracking-widest">Start a Project</span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-on-surface tracking-tight leading-tight">
              Let&apos;s Build<br />
              <span className="text-primary">Something Great.</span>
            </h1>
            <p className="text-base text-on-surface-variant max-w-xl leading-relaxed">
              Tell us about your project. Our senior engineers will review your requirements 
              and respond within 24 hours with a proposed approach and timeline.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">

          {/* Left: Contact Info */}
          <div className="space-y-8">
            <div className="space-y-5">
              <h2 className="text-xl font-black text-on-surface">Get in Touch</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-on-surface">Office Location</p>
                    <p className="text-xs text-on-surface-variant">Nairobi, Kenya<br />East Africa Hub</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-on-surface">Email</p>
                    <a href="mailto:engineering@akubrecah.com" className="text-xs text-primary hover:underline">
                      engineering@akubrecah.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-on-surface">Response Time</p>
                    <p className="text-xs text-on-surface-variant">Within 24 hours on business days.<br />Priority response for enterprise inquiries.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-on-surface">Free Discovery Call</p>
                    <p className="text-xs text-on-surface-variant">30-minute architecture scoping call with a senior engineer at no cost.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* What happens next */}
            <div className="p-6 rounded-3xl bg-surface-container-lowest border border-outline-variant space-y-4">
              <h3 className="font-black text-sm text-on-surface">What Happens Next</h3>
              <div className="space-y-3">
                {[
                  { num: "01", text: "We review your brief within 24h" },
                  { num: "02", text: "Senior engineer contacts you for clarity" },
                  { num: "03", text: "We send a scope document and timeline" },
                  { num: "04", text: "Project kickoff upon agreement" },
                ].map((step) => (
                  <div key={step.num} className="flex items-center gap-3 text-xs">
                    <span className="font-mono font-black text-primary">{step.num}</span>
                    <span className="text-on-surface">{step.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick links for existing tools */}
            <div className="p-6 rounded-3xl bg-surface-container space-y-3">
              <h3 className="font-black text-xs text-on-surface-variant uppercase tracking-widest">Try Our Live Tools</h3>
              {[
                { label: "KRA Certificate Portal", href: "/retrieval-portal" },
                { label: "PIN & ID Validator", href: "/pin-checker" },
                { label: "Tax Filing Portal", href: "/dashboard/filing" },
              ].map((tool) => (
                <Link key={tool.label} href={tool.href} className="flex items-center justify-between text-xs font-bold text-on-surface hover:text-primary transition-colors py-1">
                  {tool.label}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ))}
            </div>
          </div>

          {/* Right: Form */}
          <div className="lg:col-span-2">
            {formState === "success" ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 rounded-3xl bg-surface-container-lowest border border-outline-variant space-y-5">
                <div className="p-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h2 className="text-2xl font-black text-on-surface">Message Received!</h2>
                <p className="text-sm text-on-surface-variant max-w-md leading-relaxed">
                  Thank you for reaching out to Akubrecah Technologies. Our engineering team will 
                  review your brief and contact you within 24 business hours.
                </p>
                <Button
                  className="h-11 px-7 rounded-xl bg-primary text-white font-bold text-sm"
                  onClick={() => { setFormState("idle"); setForm({ name: "", email: "", company: "", phone: "", projectType: "", budget: "", message: "" }) }}
                >
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-8 sm:p-10 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-soft space-y-6">
                <h2 className="text-xl font-black text-on-surface">Project Brief</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label htmlFor="name" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Full Name *</label>
                    <Input
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      placeholder="John Kamau"
                      className="h-11 rounded-xl border-outline-variant bg-surface-container text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Email Address *</label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="john@company.com"
                      className="h-11 rounded-xl border-outline-variant bg-surface-container text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="company" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Company / Organization</label>
                    <Input
                      id="company"
                      name="company"
                      value={form.company}
                      onChange={handleChange}
                      placeholder="Acme Corp Ltd"
                      className="h-11 rounded-xl border-outline-variant bg-surface-container text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="phone" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Phone Number</label>
                    <Input
                      id="phone"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+254 7XX XXX XXX"
                      className="h-11 rounded-xl border-outline-variant bg-surface-container text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label htmlFor="projectType" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Project Type *</label>
                    <select
                      id="projectType"
                      name="projectType"
                      value={form.projectType}
                      onChange={handleChange}
                      required
                      className="w-full h-11 px-3 rounded-xl border border-outline-variant bg-surface-container text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="" disabled>Select type...</option>
                      {projectTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="budget" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Estimated Budget</label>
                    <select
                      id="budget"
                      name="budget"
                      value={form.budget}
                      onChange={handleChange}
                      className="w-full h-11 px-3 rounded-xl border border-outline-variant bg-surface-container text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="" disabled>Select range...</option>
                      {budgetRanges.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="message" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Project Brief *</label>
                  <Textarea
                    id="message"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    placeholder="Describe your project: What problem does it solve? Who are the users? What existing systems does it need to integrate with? What is your target timeline?"
                    className="rounded-xl border-outline-variant bg-surface-container text-sm resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={formState === "submitting"}
                  className="w-full h-13 rounded-xl bg-primary text-white font-bold text-sm flex items-center justify-center gap-2 group disabled:opacity-70"
                >
                  {formState === "submitting" ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Sending Brief...
                    </>
                  ) : (
                    <>
                      Submit Project Brief <Send className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-on-surface-variant text-center">
                  By submitting, you agree to our{" "}
                  <Link href="/legal/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
                  Your information is never shared with third parties.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
