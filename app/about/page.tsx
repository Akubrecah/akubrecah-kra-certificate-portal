import Image from 'next/image'
import { PageBackground } from "@/components/ui/page-background"
import ServiceSidebar from '@/components/service-sidebar'
import { Shield, Zap, Target, Users, TrendingUp, Lightbulb } from 'lucide-react'

export default function AboutPage() {
  return (
    <PageBackground>
      <div className="mx-auto max-w-4xl space-y-12 px-4 py-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-heading tracking-tighter sm:text-5xl text-primary">
            Simplifying Tax Compliance for Kenyan Youth
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Akubrecah Entertainment is committed to removing the barriers that prevent young people in Kenya from meeting their tax obligations.
          </p>
        </div>

        {/* Mission & Vision Section */}
        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          <div className="group relative overflow-hidden rounded-2xl border border-brand-cyan/20 bg-white/50 p-8 transition-all hover:shadow-2xl hover:shadow-brand-red/5">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-red/10 text-brand-red">
              <Target className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-heading text-brand-red mb-3">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              We provide simple, affordable, and accessible tax solutions tailored specifically for students, freelancers, and unemployed youth—empowering them to stay compliant without confusion or stress.
            </p>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-brand-cyan/20 bg-white/50 p-8 transition-all hover:shadow-2xl hover:shadow-brand-cyan/5">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-cyan/10 text-brand-cyan">
              <Lightbulb className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-heading text-brand-cyan mb-3">Our Vision</h2>
            <p className="text-muted-foreground leading-relaxed">
              We envision a Kenya where tax compliance is fully inclusive—where every young person, regardless of income level or employment status, can easily understand and fulfill their tax responsibilities.
            </p>
          </div>
        </div>

        {/* Approach Section */}
        <div className="rounded-2xl border border-brand-green/20 bg-gradient-to-br from-white to-brand-green/5 p-8 md:p-12">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green">
            <Zap className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-heading text-brand-green mb-8">Our Approach</h2>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="font-bold text-primary flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-green" />
                User-Centered Design
              </h3>
              <p className="text-sm text-muted-foreground">A clean, mobile-first platform designed for simplicity, even for first-time taxpayers.</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-primary flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-green" />
                Smart Automation
              </h3>
              <p className="text-sm text-muted-foreground">Guided filing processes that reduce errors and eliminate guesswork.</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-primary flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-green" />
                Blockchain Security
              </h3>
              <p className="text-sm text-muted-foreground">Transparent and tamper-resistant records that enhance trust and data integrity.</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-primary flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-green" />
                Localized Support
              </h3>
              <p className="text-sm text-muted-foreground">Content and guidance tailored to the Kenyan tax environment, including student scenarios.</p>
            </div>
          </div>
        </div>

        {/* Strategic Roadmap Sections */}
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-4 p-6">
            <h3 className="text-xl font-heading flex items-center gap-2 text-primary">
              <Shield className="h-5 w-5 text-brand-red" />
              The Problem
            </h3>
            <p className="text-sm text-muted-foreground italic">
              Many young Kenyans struggle with tax compliance due to lack of awareness, complex systems, and fear of penalties. Existing solutions are often expensive or not tailored to low-income users.
            </p>
          </div>

          <div className="space-y-4 p-6">
            <h3 className="text-xl font-heading flex items-center gap-2 text-primary">
              <TrendingUp className="h-5 w-5 text-brand-cyan" />
              Target Audience
            </h3>
            <ul className="grid grid-cols-1 gap-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">• University and college students</li>
              <li className="flex items-center gap-2">• Recent graduates</li>
              <li className="flex items-center gap-2">• Freelancers and gig workers</li>
              <li className="flex items-center gap-2">• Unemployed youth</li>
            </ul>
          </div>
        </div>

        <div className="border-t pt-12">
          <ServiceSidebar />
        </div>
      </div>
    </PageBackground>
  )
}
