"use client"

import React, { useState } from "react"
import { useSignIn } from "@clerk/nextjs/legacy"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  ShieldCheck, 
  FileCheck2,
  ExternalLink
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function KRASignIn() {
  const { isLoaded, signIn, setActive } = useSignIn()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get("redirect_url") || "/"

  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 2FA state
  const [requiresSecondFactor, setRequiresSecondFactor] = useState(false)
  const [secondFactorCode, setSecondFactorCode] = useState("")
  const [secondFactorLoading, setSecondFactorLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded || !signIn) return

    setLoading(true)
    setError(null)

    try {
      const result = await signIn.create({
        identifier: identifier.trim(),
        password: password,
      })

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId })
        router.push(redirectUrl)
      } else if (result.status === "needs_second_factor") {
        setRequiresSecondFactor(true)
      } else {
        setError("Additional verification required. Please check your account.")
      }
    } catch (err: any) {
      const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || "Invalid email or password. Please try again."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleSecondFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded || !signIn) return

    setSecondFactorLoading(true)
    setError(null)

    try {
      const result = await signIn.attemptSecondFactor({
        strategy: "totp",
        code: secondFactorCode.trim(),
      })

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId })
        router.push(redirectUrl)
      } else {
        setError("Invalid verification code. Please check and try again.")
      }
    } catch (err: any) {
      const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || "Verification code failed."
      setError(msg)
    } finally {
      setSecondFactorLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    if (!isLoaded || !signIn) return
    setGoogleLoading(true)
    setError(null)

    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: redirectUrl,
      })
    } catch (err: any) {
      setGoogleLoading(false)
      const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || "Google sign in failed. Please try again."
      setError(msg)
    }
  }

  return (
    <div className="relative min-h-[92vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-background overflow-hidden">
      {/* Background ambient lighting — KRA Crimson Red */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] pointer-events-none rounded-full blur-[140px] opacity-20"
        style={{ background: "radial-gradient(circle, #BA1A1A 0%, transparent 70%)" }}
      />

      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative w-full max-w-[430px] z-10"
      >
        {/* Minimal GovTech Card */}
        <div className="bg-card text-card-foreground border border-border shadow-2xl rounded-2xl p-6 sm:p-8 backdrop-blur-xl">
          
          {/* Header Badge & Title */}
          <div className="text-center space-y-3 mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-wide uppercase">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>KRA Statutory Gateway</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-sans">
              Taxpayer Portal
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Sign in to retrieve official compliance certificates, monitor filings, and manage subscriptions.
            </p>
          </div>

          {/* Error Message */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 overflow-hidden"
              >
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs leading-snug">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!requiresSecondFactor ? (
            <div className="space-y-4">
              {/* Google 1-Click Login */}
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading}
                className="w-full h-11 border-border hover:bg-muted/60 text-foreground text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-3 transition-all"
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                <span>Continue with Google</span>
              </Button>

              {/* Minimal Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase">
                  <span className="bg-card px-3 text-muted-foreground font-medium tracking-wider">
                    or continue with email
                  </span>
                </div>
              </div>

              {/* Standard Email & Password Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Email or Taxpayer ID
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="name@company.com or Taxpayer ID"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                      autoComplete="username"
                      disabled={loading || googleLoading}
                      className="pl-10 h-11 text-xs sm:text-sm bg-background border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-[11px] font-medium text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      disabled={loading || googleLoading}
                      className="pl-10 pr-10 h-11 text-xs sm:text-sm bg-background border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="w-full h-11 mt-2 bg-primary hover:bg-primary-hover text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            </div>
          ) : (
            /* 2FA Form */
            <form onSubmit={handleSecondFactorSubmit} className="space-y-4">
              <div className="space-y-1.5 text-center">
                <p className="text-xs text-muted-foreground">
                  Enter the 6-digit verification code from your authenticator application.
                </p>
                <Input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={secondFactorCode}
                  onChange={(e) => setSecondFactorCode(e.target.value)}
                  required
                  autoFocus
                  className="text-center text-lg tracking-widest font-mono h-12 bg-background border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <Button
                type="submit"
                disabled={secondFactorLoading}
                className="w-full h-11 bg-primary hover:bg-primary-hover text-white font-bold text-xs sm:text-sm rounded-xl"
              >
                {secondFactorLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <span>Verify Code</span>
                )}
              </Button>
            </form>
          )}

          {/* Footer Navigation within Card */}
          <div className="mt-6 pt-5 border-t border-border flex flex-col items-center gap-3 text-center">
            <p className="text-xs text-muted-foreground">
              New cyber cafe or taxpayer?{" "}
              <Link href="/sign-up" className="font-bold text-primary hover:underline">
                Register account
              </Link>
            </p>

            <div className="flex items-center gap-3 text-[11px] text-muted-foreground/80">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>KDPA Compliant</span>
              </span>
              <span>•</span>
              <span>256-Bit SSL Encrypted</span>
            </div>

            <a
              href="https://akubrecah.com"
              className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors mt-1"
            >
              <span>Akubrecah Technologies Agency</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

        </div>
      </motion.div>
    </div>
  )
}
