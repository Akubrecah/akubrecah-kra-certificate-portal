"use client"

import * as React from 'react'
import { useSignUp } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowRight, ShieldCheck, Mail, Lock, CheckCircle2, Shield } from 'lucide-react'
import { PageBackground } from "@/components/ui/page-background"
import { motion, AnimatePresence } from "framer-motion"

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [pendingVerification, setPendingVerification] = React.useState(false)
  const [code, setCode] = React.useState('')
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const router = useRouter()

  // Start the sign up process
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return

    setLoading(true)
    setError('')

    try {
      await signUp.create({
        emailAddress,
        password,
      })

      // Send the email verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })

      // Set 'pendingVerification' to true to display second form
      setPendingVerification(true)
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage || 'An error occurred during sign up.')
    } finally {
      setLoading(false)
    }
  }

  // Handle the submission of the verification form
  const onPressVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return

    setLoading(true)
    setError('')

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      })

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId })
        router.push('/')
      } else {
        console.log(JSON.stringify(completeSignUp, null, 2))
        setError('Verification incomplete. Please try again.')
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage || 'Invalid verification code.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageBackground>
      <div className="flex min-h-screen items-center justify-center p-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="glass border-white/10 shadow-2xl overflow-hidden relative">
            {/* Top Gradient Bar */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-cyan via-brand-green to-brand-red opacity-70" />
            
            <CardHeader className="space-y-2 pt-10 text-center">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-brand-cyan/20 blur-xl rounded-full" />
                  <div className="relative w-16 h-16 rounded-2xl bg-black/40 flex items-center justify-center border border-white/10 backdrop-blur-md">
                    <ShieldCheck className="w-8 h-8 text-brand-cyan" />
                  </div>
                </div>
              </div>
              
              <CardTitle className="text-3xl font-heading tracking-tight text-foreground uppercase">
                {pendingVerification ? 'Verify' : 'Register'}
              </CardTitle>
              <CardDescription className="text-muted-foreground uppercase text-[9px] tracking-[0.2em] font-black opacity-60">
                {pendingVerification 
                  ? `OTP sent to ${emailAddress}` 
                  : 'KRA Retrieval Portal Access'}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pb-10 px-8">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6"
                  >
                    <Alert variant="destructive" className="bg-red-500/5 border-red-500/20 text-red-400 text-[10px] py-3 rounded-xl uppercase font-bold tracking-wider">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              {!pendingVerification ? (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 ml-1">Email Identity</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-brand-cyan transition-colors" />
                      <Input
                        type="email"
                        placeholder="NAME@DOMAIN.COM"
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                        required
                        className="pl-11 h-12 bg-black/20 border-white/5 focus:border-brand-cyan/30 rounded-2xl text-[11px] font-bold uppercase tracking-wider transition-all placeholder:text-muted-foreground/20"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 ml-1">Access Cipher</Label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-brand-cyan transition-colors" />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pl-11 h-12 bg-black/20 border-white/5 focus:border-brand-cyan/30 rounded-2xl text-[11px] transition-all"
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-12 bg-brand-cyan hover:bg-brand-cyan/90 text-black font-black uppercase tracking-[0.3em] text-[10px] rounded-2xl shadow-2xl shadow-brand-cyan/20 border-none transition-all group overflow-hidden relative"
                  >
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <span className="relative z-10 flex items-center justify-center">
                      {loading ? <Loader2 className="animate-spin h-4 w-4" /> : (
                        <>
                          INITIATE ACCESS
                          <ArrowRight className="ml-3 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </span>
                  </Button>

                  <div className="pt-4 text-center">
                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-40">
                      Already registered?{' '}
                      <Link href="/sign-in" className="text-brand-cyan hover:opacity-100 transition-opacity">
                        SIGN IN
                      </Link>
                    </p>
                  </div>
                </form>
              ) : (
                <form onSubmit={onPressVerify} className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 text-center block w-full">Verification Code</Label>
                    <div className="relative group">
                      <Input
                        placeholder="000000"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        required
                        maxLength={6}
                        className="h-16 text-center text-3xl tracking-[0.4em] font-mono bg-black/20 border-white/5 focus:border-brand-cyan/30 rounded-2xl transition-all"
                      />
                    </div>
                    <p className="text-[8px] text-center text-muted-foreground font-medium uppercase tracking-widest opacity-60">
                      Enter the 6-digit code sent to your inbox
                    </p>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading || code.length < 6}
                    className="w-full h-12 bg-brand-green hover:bg-brand-green/90 text-black font-black uppercase tracking-[0.3em] text-[10px] rounded-2xl shadow-2xl shadow-brand-green/20 border-none transition-all"
                  >
                    <span className="flex items-center justify-center">
                      {loading ? <Loader2 className="animate-spin h-4 w-4" /> : (
                        <>
                          VERIFY IDENTITY
                          <CheckCircle2 className="ml-3 h-4 w-4" />
                        </>
                      )}
                    </span>
                  </Button>

                  <div className="text-center pt-2">
                    <button 
                      type="button"
                      onClick={() => setPendingVerification(false)}
                      className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 hover:text-brand-cyan transition-colors"
                    >
                      EDIT EMAIL ADDRESS
                    </button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          <div className="mt-8 flex justify-center items-center gap-6 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-white/20" />
            <Shield className="w-4 h-4 text-white" />
            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-white/20" />
          </div>
        </motion.div>
      </div>
    </PageBackground>
  )
}
