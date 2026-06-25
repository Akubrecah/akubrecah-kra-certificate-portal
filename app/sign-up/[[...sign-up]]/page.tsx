"use client"

import { useState, useEffect } from "react";
import { SignUp } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/logo";

export default function SignUpPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen font-body-md text-on-surface">
      {/* Left Side: Visual Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-surface-container border-r border-outline-variant flex-col items-center justify-center overflow-hidden p-12">
        {/* Decorative Grid Lines / Modern Backdrop */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-md">
          <Logo width={280} height={90} className="transition-transform hover:scale-105 duration-300" />
          <div className="space-y-2 mt-4">
            <h1 className="font-display-md text-headline-lg text-on-surface tracking-tight">
              KRA Certificate Portal
            </h1>
            <p className="font-body-md text-on-surface-variant max-w-xs mx-auto">
              Secure, instant access to your tax registrations and compliance status.
            </p>
          </div>
        </div>
      </div>
      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-center items-center p-4 sm:p-8 lg:p-12 bg-surface relative">
        <div className="w-full max-w-md bg-surface-container-lowest rounded-xl shadow-soft border border-outline-variant p-6 sm:p-8">
          <div className="mb-6 text-center flex flex-col items-center">
            <Logo width={160} height={48} className="mb-4" />
            <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Create Your Account</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Register to access your certificates and tax services</p>
          </div>
          {mounted ? (
            <SignUp
              appearance={{
                elements: {
                  rootBox: "w-full flex justify-center",
                  card: "shadow-none p-0 bg-transparent border-none w-full",
                  header: "hidden", 
                  main: "w-full",
                  form: "w-full flex flex-col gap-4",
                  formField: "w-full flex flex-col gap-1.5",
                  formFieldLabel: "block font-label-md text-label-md text-on-surface mb-1",
                  formFieldInput: "w-full bg-surface-container-lowest border border-outline-variant rounded text-body-md text-on-surface placeholder-on-surface-variant/50 focus:ring-1 focus:ring-primary focus:border-primary p-3 h-auto",
                  formButtonPrimary: "w-full bg-primary text-on-primary font-label-md text-label-md py-3 px-4 rounded hover:bg-primary/90 transition-colors flex justify-center items-center h-auto mt-2",
                  dividerRow: "w-full flex items-center justify-center my-4",
                  dividerLine: "bg-outline-variant flex-grow h-[1px]",
                  dividerText: "font-label-sm text-label-sm text-on-surface-variant px-3",
                  socialButtonsBlockButton: "w-full bg-surface-container-lowest border border-outline-variant hover:bg-surface-container transition-colors py-2.5 px-4 rounded flex items-center justify-center gap-3 h-auto",
                  socialButtonsBlockButtonText: "font-label-md text-label-md text-on-surface",
                  footer: "bg-transparent border-none p-0 mt-6 flex flex-col items-center justify-center gap-2 text-center w-full",
                  footerAction: "flex items-center justify-center gap-1 text-center w-full",
                  footerActionLink: "font-label-md text-label-md text-primary hover:underline font-semibold text-center mx-auto",
                  footerActionText: "font-label-md text-label-md text-on-surface-variant text-center",
                  formFieldAction: "font-label-sm text-label-sm text-primary hover:text-primary/90 transition-colors",
                },
                variables: {
                  colorPrimary: "var(--primary-container)",
                  colorBackground: "transparent",
                  colorText: "var(--on-surface)",
                  colorTextSecondary: "var(--on-surface-variant)",
                  borderRadius: "0.25rem",
                }
              }}
            />
          ) : (
            <div className="h-64 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-sm font-medium text-on-surface-variant">Loading Gateway...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
