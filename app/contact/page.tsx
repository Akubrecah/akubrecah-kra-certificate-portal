"use client"

import { useState } from "react"
import Link from "next/link"
import { Send, MapPin, Mail, Clock, MessageSquare, ArrowRight, CheckCircle2, Shield, Lock, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type FormState = "idle" | "submitting" | "success"

const projectTypes = [
  "Web Application / Scalable SaaS",
  "Mobile App (iOS / Android / React Native)",
  "Cloud Infrastructure & DevOps",
  "Enterprise & Internal System",
  "Government / GovTech Compliance Portal",
  "Fintech & M-Pesa / Card Gateway Integration",
  "Custom In-House Product Licensing",
  "Other Engineering Consultation",
]

const budgetRanges = [
  "Under KES 500,000",
  "KES 500,000 – KES 2,000,000",
  "KES 2,000,000 – KES 5,000,000",
  "KES 5,000,000 – KES 15,000,000",
  "KES 15,000,000+",
  "Flexible / Not Yet Determined",
]

const engagementHighlights = [
  {
    icon: Shield,
    title: "Non-Disclosure by Default",
    desc: "Every discussion is protected under our standard enterprise NDA. Your proprietary requirements and data remain strictly confidential.",
  },
  {
    icon: MessageSquare,
    title: "Direct Engineer Access",
    desc: "No sales commission runarounds. You converse directly with senior architects who will be designing and building your product.",
  },
  {
    icon: Zap,
    title: "Transparent Scoping",
    desc: "We provide itemized deliverables, defined milestones, fixed timelines, and measurable success criteria upfront.",
  },
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
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormState("submitting")
    await new Promise((r) => setTimeout(r, 1200))
    setFormState("success")
  }

  return (
    <div className="min-h-screen bg-background text-on-background">

      {/* Page Hero - Matching Products Design */}
      <div className="bg-surface-container-lowest border-b border-outline-variant">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 space-y-6">
          <nav className="flex items-center gap-2 text-xs text-on-surface-variant">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <span className="text-on-surface font-semibold">Contact & Engagement</span>
          </nav>
          <div className="max-w-3xl space-y-4">
            <span className="text-xs font-black text-primary uppercase tracking-widest">Start a Project</span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-on-surface tracking-tight leading-tight">
              Let&apos;s Build<br />
              <span className="text-primary">Something Exceptional.</span>
            </h1>
            <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl leading-relaxed">
              Have an upcoming product launch, enterprise modernization need, or statutory integration? 
              Our principal engineers review every brief and reply within 24 hours with actionable technical guidance.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 space-y-20">

        {/* Main Contact Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">

          {/* Left Column: Contact Info & Value Prop (2 cols) */}
          <div className="lg:col-span-2 space-y-8">

            {/* Office & Direct Info Card */}
            <div className="p-7 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-soft space-y-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Engineering Headquarters</h4>
              
              <div className="space-y-4">
                {[
                  { icon: MapPin, label: "Location", value: "Nairobi, Kenya\nEast Africa Tech Hub" },
                  { icon: Mail, label: "Email", value: "engineering@akubrecah.com", isLink: true, href: "mailto:engineering@akubrecah.com" },
                  { icon: Clock, label: "Office Hours", value: "Monday – Friday: 08:00 – 18:00 EAT\n24/7 Monitoring for Enterprise SLAs" },
                  { icon: MessageSquare, label: "Discovery Consultation", value: "Free 30-min architecture scoping call with our lead engineers" },
                ].map(({ icon: Icon, label, value, isLink, href }) => (
                  <div key={label} className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-surface-container">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant block">{label}</span>
                      {isLink && href ? (
                        <a href={href} className="text-xs sm:text-sm font-bold text-primary hover:underline mt-0.5 block">
                          {value}
                        </a>
                      ) : (
                        <p className="text-xs font-bold text-on-surface whitespace-pre-line mt-0.5">{value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold pt-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Engineering Availability: Open for New Projects
              </div>
            </div>

            {/* What Happens Next Card */}
            <div className="p-7 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-soft space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-on-surface-variant">What to Expect</h4>
              <div className="space-y-3">
                {[
                  { num: "01", text: "We review your brief within 24 hours" },
                  { num: "02", text: "Senior engineer coordinates a technical discovery call" },
                  { num: "03", text: "We deliver an architecture plan, timeline & cost estimate" },
                  { num: "04", text: "Sprint kickoff with clear milestones and access credentials" },
                ].map((step) => (
                  <div key={step.num} className="flex items-center gap-3 text-xs text-on-surface">
                    <span className="font-mono font-bold text-primary px-2 py-0.5 rounded-md bg-primary/10 text-[11px] shrink-0">
                      {step.num}
                    </span>
                    <span>{step.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Link to In-House Tools */}
            <div className="p-7 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-soft space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Looking For Our Live Tools?</h4>
              <div className="space-y-2">
                {[
                  { name: "KRA Certificate Retrieval Portal", href: "/retrieval-portal" },
                  { name: "Live PIN & National ID Validator", href: "/pin-checker" },
                  { name: "Automated Tax Returns Filing", href: "/dashboard/filing" },
                ].map((tool) => (
                  <Link
                    key={tool.name}
                    href={tool.href}
                    className="flex items-center justify-between p-3 rounded-xl bg-surface-container hover:bg-primary/10 hover:text-primary transition-colors text-xs font-bold text-on-surface group"
                  >
                    <span>{tool.name}</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Brief Form (3 cols) */}
          <div className="lg:col-span-3">
            {formState === "success" ? (
              <div className="p-10 sm:p-14 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-soft text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-on-surface">Brief Received Successfully!</h3>
                  <p className="text-sm text-on-surface-variant max-w-md mx-auto leading-relaxed">
                    Thank you for reaching out. Our engineering team is currently reviewing your project details and will be in touch within 24 business hours.
                  </p>
                </div>
                <Button
                  className="h-11 px-7 rounded-xl bg-primary text-white font-bold text-xs"
                  onClick={() => {
                    setFormState("idle")
                    setForm({ name: "", email: "", company: "", phone: "", projectType: "", budget: "", message: "" })
                  }}
                >
                  Submit Another Inquiry
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-8 sm:p-10 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-soft space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-on-surface">Submit Project Brief</h2>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Provide as much context as possible to help us prepare a relevant architectural proposal.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: "name", label: "Full Name *", placeholder: "e.g. Brian Ochieng", type: "text", required: true },
                    { id: "email", label: "Work Email *", placeholder: "brian@company.com", type: "email", required: true },
                    { id: "company", label: "Organization / Company", placeholder: "Acme Enterprises Ltd", type: "text", required: false },
                    { id: "phone", label: "Phone Number", placeholder: "+254 7XX XXX XXX", type: "tel", required: false },
                  ].map((field) => (
                    <div key={field.id} className="space-y-1.5">
                      <label htmlFor={field.id} className="text-xs font-bold text-on-surface">
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
                        className="h-11 rounded-xl border border-outline-variant bg-surface-container text-xs text-on-surface focus-visible:ring-primary"
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="projectType" className="text-xs font-bold text-on-surface">
                      Project Category *
                    </label>
                    <select
                      id="projectType"
                      name="projectType"
                      value={form.projectType}
                      onChange={handleChange}
                      required
                      className="w-full h-11 px-3 border border-outline-variant bg-surface-container rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="" disabled>Select category...</option>
                      {projectTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="budget" className="text-xs font-bold text-on-surface">
                      Estimated Budget
                    </label>
                    <select
                      id="budget"
                      name="budget"
                      value={form.budget}
                      onChange={handleChange}
                      className="w-full h-11 px-3 border border-outline-variant bg-surface-container rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="" disabled>Select budget bracket...</option>
                      {budgetRanges.map((range) => (
                        <option key={range} value={range}>{range}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="message" className="text-xs font-bold text-on-surface">
                    Project Brief & Objective *
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    placeholder="Tell us about your project: What are the core goals? Who are the target users? Any required integrations (M-Pesa, KRA, AWS, CRM)? What is your preferred launch timeline?"
                    className="rounded-xl border border-outline-variant bg-surface-container text-xs text-on-surface resize-none focus-visible:ring-primary leading-relaxed"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={formState === "submitting"}
                  className="w-full h-12 rounded-xl bg-primary text-white font-bold text-sm flex items-center justify-center gap-2 group disabled:opacity-70"
                >
                  {formState === "submitting" ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Submitting Brief...
                    </>
                  ) : (
                    <>
                      Submit Project Brief <Send className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>

                <p className="text-[11px] text-on-surface-variant text-center">
                  Protected by mutual non-disclosure. We respect your confidentiality and never share client data.
                </p>
              </form>
            )}
          </div>

        </div>

        {/* Highlights Section - Matching Products Highlights */}
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-black text-primary uppercase tracking-widest">Our Commitment</span>
            <h2 className="text-3xl font-black text-on-surface">Why Forward-Thinking Teams Partner With Us</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {engagementHighlights.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="p-7 rounded-3xl bg-surface-container-lowest border border-outline-variant space-y-4 shadow-soft">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary w-fit">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-on-surface">{item.title}</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
