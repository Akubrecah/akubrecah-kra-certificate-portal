import { PageBackground } from "@/components/ui/page-background"
import { FilePlusIcon, KeyIcon, MailIcon, Shield, ActivityIcon, FileText, ArrowUpRight } from 'lucide-react'
import Link from "next/link"

export default function ServicesPage() {
  const services = [
    {
      title: "Register KRA PIN",
      description: "Get your KRA PIN quickly and easily with our streamlined retrieval protocol.",
      icon: <FilePlusIcon />,
      slug: "register-kra-pin",
      price: "KES 30",
      accent: "text-brand-cyan"
    },
    {
      title: "Renew KRA Password",
      description: "Reset your KRA vault access securely without the usual administrative hassle.",
      icon: <KeyIcon />,
      slug: "renew-kra-password",
      price: "KES 20",
      accent: "text-brand-yellow"
    },
    {
      title: "File Nil Returns",
      description: "High-speed nil returns filing for individuals and corporate entities.",
      icon: <FileText />,
      slug: "file-nil-returns",
      price: "KES 30",
      accent: "text-brand-cyan"
    },
    {
      title: "Change KRA Email",
      description: "Update your primary communication channel with KRA in under 2 minutes.",
      icon: <MailIcon />,
      slug: "change-kra-email",
      price: "KES 30",
      accent: "text-brand-yellow"
    },
    {
      title: "Register NSSF",
      description: "Complete your social security registration with automated compliance checks.",
      icon: <Shield />,
      slug: "register-nssf",
      price: "KES 30",
      accent: "text-brand-cyan"
    },
    {
      title: "Register SHIF",
      description: "Onboard with the Social Health Insurance Fund via our secure portal.",
      icon: <ActivityIcon />,
      slug: "register-shif",
      price: "KES 30",
      accent: "text-brand-yellow"
    }
  ];

  return (
    <PageBackground className="pt-24 pb-20">
      <div className="container mx-auto px-6 max-w-6xl space-y-16">
        {/* Header */}
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 mb-4">
            <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-cyan">Protocol Catalog</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white leading-[1.1]">
            Our <span className="text-brand-cyan">Compliance</span> Services
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Precision-engineered tax solutions designed specifically for the digital-native generation. Secure, fast, and fully compliant.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, i) => (
            <Link href={`/services/${service.slug}`} key={i} className="group">
              <div className="glass-pro p-8 rounded-[2rem] border border-white/5 h-full flex flex-col justify-between transition-all duration-500 hover:border-brand-cyan/30 hover:translate-y-[-4px] relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <div className="scale-[2.5] origin-top-right">
                    {service.icon}
                  </div>
                </div>

                <div className="relative z-10 space-y-6">
                  <div className={`h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-brand-cyan/50 transition-colors ${service.accent}`}>
                    {service.icon}
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-2xl font-black tracking-tight text-white group-hover:text-brand-cyan transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed text-sm">
                      {service.description}
                    </p>
                  </div>
                </div>

                <div className="relative z-10 pt-8 flex items-center justify-between border-t border-white/5 mt-8">
                  <span className="text-xl font-black text-white">{service.price}</span>
                  <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-brand-cyan group-hover:text-black transition-all">
                    <ArrowUpRight size={20} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Custom Service CTA */}
        <div className="glass-pro p-8 md:p-12 rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 mt-12 bg-gradient-to-br from-brand-cyan/5 to-transparent">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-2xl font-black text-white tracking-tight">Need a custom filing solution?</h2>
            <p className="text-muted-foreground">Our compliance experts are available for complex corporate tax structures.</p>
          </div>
          <Link 
            href="/contact" 
            className="px-8 py-4 rounded-full bg-white text-black font-black uppercase tracking-widest hover:bg-brand-cyan transition-colors shrink-0"
          >
            Contact Expert
          </Link>
        </div>
      </div>
    </PageBackground>
  )
}