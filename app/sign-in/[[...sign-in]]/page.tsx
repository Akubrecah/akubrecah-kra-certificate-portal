"use client"

import { useState, useEffect } from "react";
import { SignIn } from "@clerk/nextjs";
import { PageBackground } from "@/components/ui/page-background";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function SignInPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <PageBackground className="flex items-center justify-center p-4">
      <div className="w-full max-w-md relative">
        {/* Background Glows */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-brand-cyan/10 blur-[100px] rounded-full animate-pulse" />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary/10 blur-[100px] rounded-full animate-pulse" />
        
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col items-center space-y-2 mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-brand-cyan/20 blur-xl rounded-full" />
              <div className="relative w-16 h-16 rounded-2xl bg-black/40 flex items-center justify-center border border-white/10 backdrop-blur-md">
                <ShieldCheck className="w-8 h-8 text-brand-cyan" />
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase mt-4">
              Identity Gateway
            </h1>
            <p className="text-muted-foreground uppercase text-[9px] tracking-[0.2em] font-black opacity-60">
              Authorize your secure session
            </p>
          </div>

          {mounted ? (
            <SignIn
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "bg-card/40 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden",
                  header: "hidden", // Custom header used above
                  formButtonPrimary: "bg-brand-cyan hover:bg-brand-cyan/90 text-black font-black uppercase tracking-[0.2em] text-[10px] h-12 rounded-xl transition-all active:scale-[0.98]",
                  formFieldInput: "bg-white/5 border-white/10 focus:border-brand-cyan/30 focus:ring-brand-cyan/10 h-11 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all",
                  formFieldLabel: "text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 mb-1.5 ml-1",
                  footerActionLink: "text-brand-cyan hover:opacity-80 transition-opacity font-bold uppercase text-[10px] tracking-wider",
                  socialButtonsBlockButton: "bg-white/5 border-white/10 hover:bg-white/10 h-11 rounded-xl transition-all",
                  socialButtonsBlockButtonText: "text-[10px] font-black uppercase tracking-widest text-foreground/70",
                  dividerLine: "bg-white/10",
                  dividerText: "text-[9px] font-black uppercase tracking-widest text-muted-foreground/40",
                  formFieldAction: "text-brand-cyan hover:opacity-80 text-[10px] font-bold uppercase tracking-wider",
                  footer: "bg-transparent border-none",
                  identityPreviewText: "text-[11px] font-bold text-foreground",
                  identityPreviewEditButtonIcon: "text-brand-cyan",
                },
                variables: {
                  colorPrimary: "#1F6F5B",
                  colorBackground: "transparent", // Managed by elements.card
                  colorText: "white",
                  colorTextSecondary: "#a1a1aa",
                  borderRadius: "1rem",
                }
              }}
            />
          ) : (
            <div className="h-64 flex flex-col items-center justify-center gap-3 bg-card/40 backdrop-blur-xl border border-white/10 rounded-2xl">
              <Loader2 className="w-8 h-8 animate-spin text-brand-cyan" />
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Loading Gateway...</span>
            </div>
          )}
          
          <div className="flex justify-center items-center gap-6 opacity-20 pt-4">
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-white" />
            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white">SECURE AUTH</span>
            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-white" />
          </div>
        </div>
      </div>
    </PageBackground>
  );
}
