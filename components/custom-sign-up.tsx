"use client"

import React, { useState } from "react"
import { useSignUp } from "@clerk/nextjs/legacy"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  ShieldCheck, 
  CheckCircle2, 
  Zap, 
  KeyRound,
  UserPlus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Logo } from "@/components/logo"

export function CustomSignUp() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get("redirect_url") || "/dashboard"

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [emailAddress, setEmailAddress] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Verification step state
  const [verifying, setVerifying] = useState(false)
  const [code, setCode] = useState("")
  const [verifyLoading, setVerifyLoading] = useState(false)

  // Handle Sign Up initiation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded || !signUp) return

    setLoading(true)
    setError(null)

    try {
      await signUp.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        emailAddress: emailAddress.trim(),
        password: password,
      })

      // Send the email verification code
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
      setVerifying(true)
    } catch (err: any) {
      console.error("[CustomSignUp] Error:", err)
      const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || "Sign up failed. Please check your details."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  // Handle Email OTP verification
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded || !signUp) return

    setVerifyLoading(true)
    setError(null)

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: code.trim(),
      })

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId })
        router.push("/onboarding")
      } else {
        setError("Verification was not completed. Please try again.")
      }
    } catch (err: any) {
      console.error("[CustomSignUp] Verification error:", err)
      const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || "Invalid verification code."
      setError(msg)
    } finally {
      setVerifyLoading(false)
    }
  }

  // Handle Google OAuth
  const handleGoogleSignUp = async () => {
    if (!isLoaded || !signUp) return
    setGoogleLoading(true)
    setError(null)

    try {
      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: redirectUrl,
      })
    } catch (err: any) {
      setGoogleLoading(false)
      const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || "Google sign up failed. Please try again."
      setError(msg)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen font-body-md text-on-surface bg-background overflow-hidden">
      {/* Left Hero Panel (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white flex-col justify-between p-12 lg:p-16 overflow-hidden border-r border-border/30">
        {/* Glow Spheres */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-red-600/25 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

        {/* Brand Logo */}
        <div className="relative z-10">
          <Link href="/" className="inline-block transition-transform hover:scale-105">
            <Logo width={180} height={54} className="h-10 w-auto brightness-200" />
          </Link>
        </div>

        {/* Feature List & Headline */}
        <div className="relative z-10 space-y-8 max-w-lg my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
            <UserPlus className="w-4 h-4 text-red-400" />
            <span>Fast & Secure Citizen Registration</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Create Your KRA Portal Account.
            </h1>
            <p className="text-zinc-400 text-base leading-relaxed">
              Join thousands of Kenyan citizens automating their compliance certificates, filing Nil returns, and verifying taxpayer records.
            </p>
          </div>

          <div className="space-y-3.5 pt-2">
            {[
              { text: "Instant PIN & Compliance Certificate Downloads", icon: Zap },
              { text: "Compliant with Kenya Data Protection Act 2019", icon: ShieldCheck },
              { text: "Free ATS Professional CV Builder Suite", icon: CheckCircle2 },
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

        {/* Footer info */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
          <span>© {new Date().getFullYear()} KRA Certificate Portal</span>
          <div className="flex items-center gap-4">
            <Link href="/legal/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/legal/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </div>

      {/* Right Form Container */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-center items-center p-4 sm:p-8 lg:p-12 relative bg-surface-container-lowest">
        {/* Mobile Logo */}
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
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-3">
              <UserPlus className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-on-surface tracking-tight">
              {verifying ? "Verify Your Email" : "Create an Account"}
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">
              {verifying 
                ? `We sent a 6-digit code to ${emailAddress}` 
                : "Get started with your automated tax portal"}
            </p>
          </div>

          {/* Error Banner */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-start gap-2.5 font-medium"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {!verifying ? (
            <div className="space-y-4">
              {/* Google Social Button */}
              <button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={googleLoading || loading}
                className="w-full py-2.5 px-4 bg-surface-container-low hover:bg-surface-container-high border border-outline-variant hover:border-outline rounded-lg flex items-center justify-center gap-3 text-sm font-semibold text-on-surface transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Sign up with Google</span>
              </button>

              {/* Divider */}
              <div className="flex items-center justify-center my-4">
                <div className="flex-grow h-[1px] bg-border" />
                <span className="px-3 text-xs text-muted-foreground font-medium">Or register with email</span>
                <div className="flex-grow h-[1px] bg-border" />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* First & Last Name */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-on-surface">First Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                        className="pl-9 h-10 bg-surface-container-low border-outline-variant rounded-lg text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-on-surface">Last Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        className="pl-9 h-10 bg-surface-container-low border-outline-variant rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-on-surface">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="email"
                      required
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      placeholder="name@example.com"
                      className="pl-10 h-10 bg-surface-container-low border-outline-variant rounded-lg text-sm"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-on-surface">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a strong password"
                      className="pl-10 pr-10 h-10 bg-surface-container-low border-outline-variant rounded-lg text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Terms agreement note */}
                <p className="text-[11px] text-muted-foreground pt-1">
                  By registering, you agree to our{" "}
                  <Link href="/legal/terms" className="text-primary hover:underline">Terms of Service</Link> and{" "}
                  <Link href="/legal/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
                </p>

                {/* Submit CTA */}
                <Button
                  type="submit"
                  disabled={loading || !emailAddress || !password || !firstName || !lastName}
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-bold text-sm rounded-lg shadow-md shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            </div>
          ) : (
            /* OTP Verification Form */
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="p-3.5 bg-primary/10 rounded-lg text-xs text-primary font-medium flex items-center gap-2.5">
                <KeyRound className="w-4 h-4 shrink-0" />
                <span>Check your inbox for your 6-digit confirmation code.</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-on-surface">6-Digit Code</label>
                <Input
                  type="text"
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  className="h-12 text-center font-mono tracking-widest text-xl bg-surface-container-low border-outline-variant rounded-lg"
                />
              </div>

              <Button
                type="submit"
                disabled={verifyLoading || code.length < 6}
                className="w-full h-11 bg-primary text-white font-bold text-sm rounded-lg shadow-md flex items-center justify-center gap-2"
              >
                {verifyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Complete Registration"}
              </Button>

              <button
                type="button"
                onClick={() => setVerifying(false)}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground pt-2"
              >
                ← Back to edit email
              </button>
            </form>
          )}

          {/* Toggle to Sign In */}
          <div className="mt-6 text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-primary hover:underline font-bold ml-1">
              Sign In
            </Link>
          </div>

          {/* Encryption Footer */}
          <div className="mt-6 pt-4 border-t border-border/50 text-center flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
            <Lock className="w-3.5 h-3.5 text-primary" />
            <span>End-to-End 256-Bit Encrypted Authentication</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
