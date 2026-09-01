"use client"

import { useState, useEffect } from "react";
import { SignIn } from "@clerk/nextjs";
import { Loader2, ShieldCheck, Zap, Lock, CheckCircle2, ArrowRight } from "lucide-react";
import { Logo } from "@/components/logo";
import Link from "next/link";
import { motion } from "framer-motion";

export default function SignInPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen font-body-md text-on-surface bg-background overflow-hidden">
      {/* Left Side: Premium Visual & Feature Showcase (Hidden on small mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white flex-col justify-between p-12 lg:p-16 overflow-hidden border-r border-border/30">
        {/* Ambient Glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-red-600/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10">
          <Link href="/" className="inline-block transition-transform hover:scale-105">
            <Logo width={180} height={54} className="h-10 w-auto brightness-200" />
          </Link>
        </div>

        {/* Center Content */}
        <div className="relative z-10 space-y-8 max-w-lg my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-red-400" />
            <span>Secure Government Gateway Integration</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Instant KRA Portal & Tax Operations.
            </h1>
            <p className="text-zinc-400 text-base leading-relaxed">
              Retrieve compliance certificates, unmask citizen PINs, file Nil returns, and build ATS resumes with enterprise-grade automation.
            </p>
          </div>

          {/* Feature List */}
          <div className="space-y-3.5 pt-2">
            {[
              { text: "Live KRA Production Gateway & Direct Remoting", icon: Zap },
              { text: "Official Certificate PDF Stamping & Download", icon: CheckCircle2 },
              { text: "256-Bit Encrypted Data Protection", icon: Lock },
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm text-zinc-300">
                <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                  <feature.icon className="w-3.5 h-3.5" />
                </div>
                <span>{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Trust Footer */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
          <span>© {new Date().getFullYear()} KRA Certificate Portal</span>
          <div className="flex items-center gap-4">
            <Link href="/legal/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/legal/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </div>

      {/* Right Side: Custom Authentication Form */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-center items-center p-4 sm:p-8 lg:p-12 relative bg-surface-container-lowest">
        {/* Mobile Header Logo */}
        <div className="lg:hidden mb-8 text-center flex flex-col items-center">
          <Link href="/">
            <Logo width={160} height={48} className="mb-2" />
          </Link>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md bg-card border border-border/80 rounded-2xl shadow-xl p-6 sm:p-8 backdrop-blur-xl"
        >
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-on-surface tracking-tight">Welcome Back</h2>
            <p className="text-sm text-on-surface-variant mt-1">Sign in to your account to manage your certificates</p>
          </div>

          {mounted ? (
            <SignIn
              appearance={{
                elements: {
                  rootBox: "w-full flex justify-center",
                  card: "shadow-none p-0 bg-transparent border-none w-full",
                  header: "hidden", 
                  main: "w-full",
                  form: "w-full flex flex-col gap-4",
                  formField: "w-full flex flex-col gap-1.5",
                  formFieldLabel: "block text-xs font-semibold text-on-surface mb-0.5",
                  formFieldInput: "w-full bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/40 focus:border-primary p-3 h-11 transition-all",
                  formButtonPrimary: "w-full bg-primary text-white font-bold text-sm py-3 px-4 rounded-lg hover:bg-primary/90 transition-all flex justify-center items-center h-11 mt-2 shadow-md shadow-primary/20 cursor-pointer",
                  dividerRow: "w-full flex items-center justify-center my-4",
                  dividerLine: "bg-border flex-grow h-[1px]",
                  dividerText: "text-xs text-muted-foreground px-3 font-medium",
                  socialButtonsBlockButton: "w-full bg-surface-container-low hover:bg-surface-container-high border border-outline-variant hover:border-outline transition-all py-2.5 px-4 rounded-lg flex items-center justify-center gap-3 h-11 text-sm font-semibold text-on-surface shadow-sm cursor-pointer",
                  socialButtonsBlockButtonText: "text-sm font-semibold text-on-surface",
                  footer: "bg-transparent border-none p-0 mt-6 flex flex-col items-center justify-center gap-2 text-center w-full",
                  footerAction: "flex items-center justify-center gap-1.5 text-center w-full text-xs",
                  footerActionLink: "text-primary hover:underline font-bold transition-colors ml-1",
                  footerActionText: "text-muted-foreground text-xs",
                  formFieldAction: "text-xs text-primary hover:underline font-medium transition-colors",
                  identityPreview: "bg-surface-container-low border border-outline-variant rounded-lg p-3 text-sm",
                },
                variables: {
                  colorPrimary: "var(--primary)",
                  colorBackground: "transparent",
                  colorText: "var(--on-surface)",
                  colorTextSecondary: "var(--on-surface-variant)",
                  borderRadius: "0.5rem",
                }
              }}
            />
          ) : (
            <div className="h-64 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Loading Secure Gateway...</span>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-border/50 text-center flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
            <Lock className="w-3.5 h-3.5 text-primary" />
            <span>End-to-End 256-Bit Encrypted Authentication</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
