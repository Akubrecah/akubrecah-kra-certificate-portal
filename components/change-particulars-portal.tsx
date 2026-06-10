"use client"

import { useState, useRef, useCallback } from "react"
import {
  Mail,
  Phone,
  User,
  Lock,
  Eye,
  EyeOff,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  FileText,
  X,
  Shield,
  TicketCheck,
  RefreshCw,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { motion, AnimatePresence, type Variants } from "motion/react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "react-hot-toast"

type ChangeType = "email" | "mobile" | null

interface KraAccount {
  firstName: string
  email: string
  username: string
  password: string
  confirmPassword: string
  idNumber: string
  kraPin: string
}

interface FormState {
  changeType: ChangeType
  newValue: string
  kraAccount: KraAccount
  idFile: File | null
  idPreviewUrl: string | null
  idFilePath: string | null
}

const stepVariants: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
  exit: { opacity: 0, x: -30, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } },
}

const PIN_REGEX = /^[AP]\d{9}[A-Z]$/

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          animate={{
            width: i + 1 === current ? 24 : 6,
            backgroundColor: i + 1 <= current ? "hsl(var(--primary))" : "hsl(var(--border))",
          }}
          transition={{ duration: 0.3 }}
          className="h-1.5 rounded-full"
        />
      ))}
    </div>
  )
}

export function ChangeParticularsPortal() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormState>({
    changeType: null,
    newValue: "",
    kraAccount: {
      firstName: "",
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
      idNumber: "",
      kraPin: "",
    },
    idFile: null,
    idPreviewUrl: null,
    idFilePath: null,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [result, setResult] = useState<{ caseNumber: string; message: string } | null>(null)
  const [hasConsented, setHasConsented] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const updateAccount = (field: keyof KraAccount, value: string) => {
    setForm(prev => ({
      ...prev,
      kraAccount: { ...prev.kraAccount, [field]: value },
    }))
    setError(null)
  }

  // ─── Step Validations ────────────────────────────────────────────────────────

  const validateStep1 = () => {
    if (!form.changeType) {
      setError("Please select what you want to change.")
      return false
    }
    return true
  }

  const validateStep2 = () => {
    if (!form.newValue.trim()) {
      setError(form.changeType === "email" ? "Please enter your new email address." : "Please enter your new mobile number.")
      return false
    }
    if (form.changeType === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(form.newValue)) {
        setError("Please enter a valid email address.")
        return false
      }
    }
    if (form.changeType === "mobile") {
      const phoneRegex = /^(?:\+?254|0)[17]\d{8}$/
      if (!phoneRegex.test(form.newValue.replace(/\s/g, ""))) {
        setError("Please enter a valid Kenyan mobile number (e.g. 0712345678 or +254712345678).")
        return false
      }
    }
    return true
  }

  const validateStep3 = () => {
    const { firstName, email, username, password, confirmPassword } = form.kraAccount
    if (!firstName.trim()) { setError("First name is required."); return false }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("A valid email is required."); return false }
    if (!username.trim() || username.length < 4) { setError("Username must be at least 4 characters."); return false }
    if (!password || password.length < 8) { setError("Password must be at least 8 characters."); return false }
    if (password !== confirmPassword) { setError("Passwords do not match."); return false }
    if (form.kraAccount.kraPin && !PIN_REGEX.test(form.kraAccount.kraPin.toUpperCase())) {
      setError("KRA PIN must be in format A000000000X or P000000000X")
      return false
    }
    return true
  }

  const validateStep4 = () => {
    if (!form.idFile) {
      setError("Please upload the front page of your National ID.")
      return false
    }
    return true
  }

  // ─── File Handling ────────────────────────────────────────────────────────────

  const handleFile = useCallback((file: File) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
    if (!allowed.includes(file.type)) {
      setError("Invalid file type. Please upload JPG, PNG, WEBP, or PDF.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File too large. Maximum size is 5 MB.")
      return
    }
    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : null
    setForm(prev => ({ ...prev, idFile: file, idPreviewUrl: previewUrl, idFilePath: null }))
    setError(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const removeFile = () => {
    if (form.idPreviewUrl) URL.revokeObjectURL(form.idPreviewUrl)
    setForm(prev => ({ ...prev, idFile: null, idPreviewUrl: null, idFilePath: null }))
  }

  // ─── Upload ID ───────────────────────────────────────────────────────────────

  const uploadId = async (): Promise<string | null> => {
    if (!form.idFile) return null
    setIsUploading(true)
    try {
      const fd = new FormData()
      fd.append("idImage", form.idFile)
      const res = await fetch("/api/kra/upload-id", { method: "POST", body: fd })
      const data = await res.json()
      if (data.success) {
        setForm(prev => ({ ...prev, idFilePath: data.filePath }))
        return data.filePath
      } else {
        throw new Error(data.error || "Upload failed.")
      }
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setIsUploading(false)
    }
  }

  // ─── Submit ───────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setError(null)
    setIsSubmitting(true)

    const loadingToast = toast.loading("Connecting to KRA Support Portal...", { duration: Infinity })

    try {
      // Upload ID first
      toast.loading("Uploading your ID document...", { id: loadingToast })
      const filePath = await uploadId()
      if (!filePath) {
        toast.error("ID upload failed. Please try again.", { id: loadingToast })
        setIsSubmitting(false)
        return
      }

      toast.loading("Submitting your request to KRA...", { id: loadingToast })
      const response = await fetch("/api/kra/change-particulars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          changeType: form.changeType,
          newValue: form.newValue.trim(),
          idFilePath: filePath,
          kraAccount: {
            firstName: form.kraAccount.firstName.trim(),
            email: form.kraAccount.email.trim().toLowerCase(),
            username: form.kraAccount.username.trim(),
            password: form.kraAccount.password,
            idNumber: form.kraAccount.idNumber.trim(),
            kraPin: form.kraAccount.kraPin.trim().toUpperCase(),
          },
        }),
      })

      const data = await response.json()

      if (data.success) {
        setResult({ caseNumber: data.caseNumber, message: data.message })
        setStep(6)
        toast.success("Request submitted successfully!", { id: loadingToast })
      } else {
        throw new Error(data.error || "Submission failed.")
      }
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message, { id: loadingToast })
    } finally {
      setIsSubmitting(false)
    }
  }

  const goNext = () => {
    setError(null)
    const validators: Record<number, () => boolean> = {
      1: validateStep1,
      2: validateStep2,
      3: validateStep3,
      4: validateStep4,
    }
    if (validators[step] && !validators[step]()) return
    setStep(s => s + 1)
  }

  const goBack = () => {
    setError(null)
    setStep(s => s - 1)
  }

  const resetAll = () => {
    setStep(1)
    setResult(null)
    setError(null)
    setForm({
      changeType: null,
      newValue: "",
      kraAccount: { firstName: "", email: "", username: "", password: "", confirmPassword: "", idNumber: "", kraPin: "" },
      idFile: null,
      idPreviewUrl: null,
      idFilePath: null,
    })
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-lg mx-auto"
    >
      <AnimatePresence mode="wait">

        {/* ─── STEP 1: Select Change Type ─── */}
        {step === 1 && (
          <motion.div key="step1" variants={stepVariants} initial="hidden" animate="visible" exit="exit">
            <Card className="glass-panel rounded-2xl border-white/10 shadow-none bg-gradient-to-br from-card/80 to-transparent overflow-hidden">
              <CardHeader className="p-6 pb-2 border-b border-white/5 text-center">
                <div className="flex justify-center mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                    <RefreshCw className="w-5 h-5 text-white" />
                  </div>
                </div>
                <CardTitle className="text-sm font-bold uppercase tracking-widest">Change Particulars</CardTitle>
                <CardDescription className="text-[10px] uppercase tracking-wider opacity-80">
                  What would you like to update on your KRA profile?
                </CardDescription>
                <StepIndicator current={1} total={5} />
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { type: "email" as ChangeType, icon: <Mail className="w-6 h-6" />, label: "Email Address", desc: "Update your registered email" },
                    { type: "mobile" as ChangeType, icon: <Phone className="w-6 h-6" />, label: "Mobile Number", desc: "Update your phone number" },
                  ].map(({ type, icon, label, desc }) => (
                    <motion.button
                      key={type}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => { setForm(p => ({ ...p, changeType: type })); setError(null) }}
                      className={cn(
                        "w-full flex items-center gap-4 p-5 rounded-2xl border transition-all text-left",
                        form.changeType === type
                          ? "border-primary bg-primary/10 shadow-inner shadow-primary/5"
                          : "border-white/10 hover:border-amber-400/30 hover:bg-amber-400/5"
                      )}
                    >
                      <div className={cn("p-2.5 rounded-xl transition-all", form.changeType === type ? "bg-primary text-white" : "bg-white/5 text-muted-foreground")}>
                        {icon}
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest">{label}</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wide mt-0.5">{desc}</p>
                      </div>
                      {form.changeType === type && (
                        <CheckCircle className="w-4 h-4 text-primary ml-auto flex-shrink-0" />
                      )}
                    </motion.button>
                  ))}
                </div>

                {error && (
                  <Alert variant="destructive" className="bg-red-500/5 border-red-500/10 rounded-xl p-3">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <AlertDescription className="text-[10px] font-medium uppercase ml-2">{error}</AlertDescription>
                  </Alert>
                )}

                {/* Consent checkbox — legally required */}
                <div className="flex items-start gap-2.5 text-left">
                  <input
                    type="checkbox"
                    id="cp-consent"
                    checked={hasConsented}
                    onChange={(e) => setHasConsented(e.target.checked)}
                    className="mt-0.5 w-3.5 h-3.5 accent-amber-400 flex-shrink-0 cursor-pointer"
                  />
                  <label htmlFor="cp-consent" className="text-[9px] text-muted-foreground leading-relaxed cursor-pointer">
                    I confirm these are my own KRA credentials and I consent to Akubrecah acting as my agent to submit this
                    request to KRA on my behalf. I have read and agree to the{" "}
                    <a href="/legal/terms" target="_blank" className="text-amber-400 underline underline-offset-2">Terms of Service</a>,{" "}
                    <a href="/legal/privacy" target="_blank" className="text-amber-400 underline underline-offset-2">Privacy Policy</a>, and{" "}
                    <a href="/legal/disclaimer" target="_blank" className="text-amber-400 underline underline-offset-2">Disclaimer</a>.
                  </label>
                </div>

                <Button
                  className="w-full h-10 bg-amber-400 text-black rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-amber-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={goNext}
                  disabled={!hasConsented}
                >
                  CONTINUE <ArrowRight className="ml-2 w-3.5 h-3.5" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ─── STEP 2: New Value ─── */}
        {step === 2 && (
          <motion.div key="step2" variants={stepVariants} initial="hidden" animate="visible" exit="exit">
            <Card className="glass-panel rounded-2xl border-white/10 shadow-none bg-gradient-to-br from-card/80 to-transparent overflow-hidden">
              <CardHeader className="p-6 pb-2 border-b border-white/5 text-center">
                <div className="flex justify-center mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                    {form.changeType === "email" ? <Mail className="w-5 h-5 text-white" /> : <Phone className="w-5 h-5 text-white" />}
                  </div>
                </div>
                <CardTitle className="text-sm font-bold uppercase tracking-widest">
                  New {form.changeType === "email" ? "Email Address" : "Mobile Number"}
                </CardTitle>
                <CardDescription className="text-[10px] uppercase tracking-wider opacity-80">
                  Enter the new {form.changeType === "email" ? "email" : "phone number"} you want registered with KRA
                </CardDescription>
                <StepIndicator current={2} total={5} />
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    {form.changeType === "email" ? "New Email Address" : "New Mobile Number"}
                  </Label>
                  <Input
                    type={form.changeType === "email" ? "email" : "tel"}
                    value={form.newValue}
                    onChange={(e) => { setForm(p => ({ ...p, newValue: e.target.value })); setError(null) }}
                    placeholder={form.changeType === "email" ? "newemail@example.com" : "0712 345 678"}
                    className="h-11 rounded-full border-white/10 focus:border-primary px-6 text-[12px] font-medium bg-black/5 text-center"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === "Enter") goNext() }}
                  />
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wide text-center opacity-70">
                    {form.changeType === "mobile" && "Accepted formats: 0712345678 or +254712345678"}
                    {form.changeType === "email" && "Must be a valid and accessible email address"}
                  </p>
                </div>

                {error && (
                  <Alert variant="destructive" className="bg-red-500/5 border-red-500/10 rounded-xl p-3">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <AlertDescription className="text-[10px] font-medium uppercase ml-2">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col gap-2">
                  <Button className="w-full h-10 bg-amber-400 text-black rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-amber-300 transition-colors" onClick={goNext}>
                    CONTINUE <ArrowRight className="ml-2 w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" className="w-full h-9 rounded-full text-muted-foreground font-bold text-[9px] uppercase tracking-widest" onClick={goBack}>
                    <ArrowLeft className="mr-2 w-3 h-3" /> BACK
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ─── STEP 3: KRA Portal Account ─── */}
        {step === 3 && (
          <motion.div key="step3" variants={stepVariants} initial="hidden" animate="visible" exit="exit">
            <Card className="glass-panel rounded-2xl border-white/10 shadow-none bg-gradient-to-br from-card/80 to-transparent overflow-hidden">
              <CardHeader className="p-6 pb-2 border-b border-white/5 text-center">
                <div className="flex justify-center mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                    <User className="w-5 h-5 text-white" />
                  </div>
                </div>
                <CardTitle className="text-sm font-bold uppercase tracking-widest">KRA Support Portal Account</CardTitle>
                <CardDescription className="text-[10px] uppercase tracking-wider opacity-80">
                  Create or use your account on the KRA support portal
                </CardDescription>
                <StepIndicator current={3} total={5} />
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-3">
                  <p className="text-[9px] text-primary font-bold uppercase tracking-wide">
                    <Shield className="w-3 h-3 inline mr-1" />
                    These details are used to create your account on kenya-revenue-authority.custhelp.com
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">First Name *</Label>
                    <Input
                      value={form.kraAccount.firstName}
                      onChange={(e) => updateAccount("firstName", e.target.value)}
                      placeholder="John"
                      className="h-9 rounded-full border-white/10 focus:border-primary px-4 text-[11px] bg-black/5"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Username *</Label>
                    <Input
                      value={form.kraAccount.username}
                      onChange={(e) => updateAccount("username", e.target.value.toLowerCase().replace(/\s/g, ""))}
                      placeholder="john_doe"
                      className="h-9 rounded-full border-white/10 focus:border-primary px-4 text-[11px] bg-black/5"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Email Address *</Label>
                  <Input
                    type="email"
                    value={form.kraAccount.email}
                    onChange={(e) => updateAccount("email", e.target.value.toLowerCase())}
                    placeholder="your@email.com"
                    className="h-9 rounded-full border-white/10 focus:border-primary px-4 text-[11px] bg-black/5"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Password *</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={form.kraAccount.password}
                      onChange={(e) => updateAccount("password", e.target.value)}
                      placeholder="Min. 8 characters"
                      className="h-9 rounded-full border-white/10 focus:border-primary px-4 pr-10 text-[11px] bg-black/5"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-amber-400 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Re-enter Password *</Label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      value={form.kraAccount.confirmPassword}
                      onChange={(e) => updateAccount("confirmPassword", e.target.value)}
                      placeholder="Must match password"
                      className={cn(
                        "h-9 rounded-full border-white/10 focus:border-primary px-4 pr-10 text-[11px] bg-black/5",
                        form.kraAccount.confirmPassword && form.kraAccount.password !== form.kraAccount.confirmPassword && "border-red-500/50"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form.kraAccount.confirmPassword && form.kraAccount.password !== form.kraAccount.confirmPassword && (
                    <p className="text-[9px] text-red-400 font-bold uppercase tracking-wide pl-2">Passwords do not match</p>
                  )}
                </div>

                <div className="border-t border-white/5 pt-3 space-y-3">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Optional Verification Fields</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">ID / Reg. Number</Label>
                      <Input
                        value={form.kraAccount.idNumber}
                        onChange={(e) => updateAccount("idNumber", e.target.value)}
                        placeholder="12345678"
                        className="h-9 rounded-full border-white/10 focus:border-primary px-4 text-[11px] bg-black/5"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">KRA PIN</Label>
                      <Input
                        value={form.kraAccount.kraPin}
                        onChange={(e) => updateAccount("kraPin", e.target.value.toUpperCase())}
                        placeholder="A000000000X"
                        className="h-9 rounded-full border-white/10 focus:border-primary px-4 text-[11px] bg-black/5 uppercase"
                        maxLength={11}
                      />
                    </div>
                  </div>
                  <p className="text-[9px] text-muted-foreground opacity-60 uppercase tracking-wide">
                    PIN format: A########A (e.g. A012345678B)
                  </p>
                </div>

                {error && (
                  <Alert variant="destructive" className="bg-red-500/5 border-red-500/10 rounded-xl p-3">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <AlertDescription className="text-[10px] font-medium uppercase ml-2">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col gap-2 pt-1">
                  <Button className="w-full h-10 bg-primary text-white rounded-full font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20" onClick={goNext}>
                    CONTINUE <ArrowRight className="ml-2 w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" className="w-full h-9 rounded-full text-muted-foreground font-bold text-[9px] uppercase tracking-widest" onClick={goBack}>
                    <ArrowLeft className="mr-2 w-3 h-3" /> BACK
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ─── STEP 4: Upload ID ─── */}
        {step === 4 && (
          <motion.div key="step4" variants={stepVariants} initial="hidden" animate="visible" exit="exit">
            <Card className="glass-panel rounded-2xl border-white/10 shadow-none bg-gradient-to-br from-card/80 to-transparent overflow-hidden">
              <CardHeader className="p-6 pb-2 border-b border-white/5 text-center">
                <div className="flex justify-center mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                    <Upload className="w-5 h-5 text-white" />
                  </div>
                </div>
                <CardTitle className="text-sm font-bold uppercase tracking-widest">Upload ID Document</CardTitle>
                <CardDescription className="text-[10px] uppercase tracking-wider opacity-80">
                  Front page of your National ID / Passport
                </CardDescription>
                <StepIndicator current={4} total={5} />
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3">
                  <p className="text-[9px] text-amber-400 font-bold uppercase tracking-wide">
                    ⚠ Required — KRA needs your ID to verify your identity. Your file is securely transmitted and not stored.
                  </p>
                </div>

                {!form.idFile ? (
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all",
                      isDragging ? "border-amber-400 bg-amber-400/10" : "border-white/15 hover:border-amber-400/40 hover:bg-amber-400/5"
                    )}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
                    />
                    <motion.div
                      animate={{ scale: isDragging ? 1.05 : 1 }}
                      className="flex flex-col items-center gap-3"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <Upload className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest">Drop file here or click to browse</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wide mt-1 opacity-70">
                          JPG, PNG, WEBP, or PDF · Max 5 MB
                        </p>
                      </div>
                    </motion.div>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative rounded-2xl border border-white/10 overflow-hidden bg-black/10"
                  >
                    {form.idPreviewUrl ? (
                      <img
                        src={form.idPreviewUrl}
                        alt="ID Preview"
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-32 flex items-center justify-center gap-3">
                        <FileText className="w-8 h-8 text-primary" />
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider">{form.idFile.name}</p>
                          <p className="text-[9px] text-muted-foreground uppercase">{(form.idFile.size / 1024).toFixed(0)} KB</p>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-[9px] font-bold text-white uppercase tracking-wide">ID Ready</span>
                      </div>
                      <button
                        onClick={removeFile}
                        className="w-6 h-6 rounded-full bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center transition-all"
                      >
                        <X className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {error && (
                  <Alert variant="destructive" className="bg-red-500/5 border-red-500/10 rounded-xl p-3">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <AlertDescription className="text-[10px] font-medium uppercase ml-2">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col gap-2">
                  <Button className="w-full h-10 bg-primary text-white rounded-full font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20" onClick={goNext}>
                    CONTINUE <ArrowRight className="ml-2 w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" className="w-full h-9 rounded-full text-muted-foreground font-bold text-[9px] uppercase tracking-widest" onClick={goBack}>
                    <ArrowLeft className="mr-2 w-3 h-3" /> BACK
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ─── STEP 5: Review & Submit ─── */}
        {step === 5 && (
          <motion.div key="step5" variants={stepVariants} initial="hidden" animate="visible" exit="exit">
            <Card className="glass-panel rounded-2xl border-white/10 shadow-none bg-gradient-to-br from-card/80 to-transparent overflow-hidden">
              <CardHeader className="p-6 pb-2 border-b border-white/5 text-center">
                <div className="flex justify-center mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                </div>
                <CardTitle className="text-sm font-bold uppercase tracking-widest">Review & Submit</CardTitle>
                <CardDescription className="text-[10px] uppercase tracking-wider opacity-80">
                  Confirm all details before submitting to KRA
                </CardDescription>
                <StepIndicator current={5} total={5} />
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="bg-black/10 rounded-2xl border border-white/5 overflow-hidden divide-y divide-white/5">
                  <div className="flex items-center justify-between p-3">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Request Type</span>
                    <Badge className="bg-primary/15 text-primary border border-primary/20 font-bold text-[8px] uppercase tracking-widest">
                      {form.changeType === "email" ? "Email Change" : "Mobile Change"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                      New {form.changeType === "email" ? "Email" : "Phone"}
                    </span>
                    <span className="text-[10px] font-bold text-foreground">{form.newValue}</span>
                  </div>
                  <div className="flex items-center justify-between p-3">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Name</span>
                    <span className="text-[10px] font-bold text-foreground uppercase">{form.kraAccount.firstName}</span>
                  </div>
                  <div className="flex items-center justify-between p-3">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Portal Email</span>
                    <span className="text-[10px] font-bold text-foreground">{form.kraAccount.email}</span>
                  </div>
                  <div className="flex items-center justify-between p-3">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Username</span>
                    <span className="text-[10px] font-bold text-foreground">{form.kraAccount.username}</span>
                  </div>
                  {form.kraAccount.kraPin && (
                    <div className="flex items-center justify-between p-3">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">KRA PIN</span>
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest">{form.kraAccount.kraPin}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between p-3">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">ID Document</span>
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-400">
                      <CheckCircle className="w-3 h-3" /> Attached
                    </span>
                  </div>
                </div>

                <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3">
                  <p className="text-[9px] text-amber-400 font-bold uppercase tracking-wide">
                    By submitting, we will automate the KRA support portal on your behalf. The process takes 30–90 seconds.
                  </p>
                </div>

                {error && (
                  <Alert variant="destructive" className="bg-red-500/5 border-red-500/10 rounded-xl p-3">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <AlertDescription className="text-[10px] font-medium uppercase ml-2">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col gap-2">
                  <Button
                    className="w-full h-11 bg-amber-400 text-black rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-amber-300 transition-colors"
                    onClick={handleSubmit}
                    disabled={isSubmitting || isUploading}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        SUBMITTING TO KRA...
                      </span>
                    ) : (
                      <>SUBMIT REQUEST <ArrowRight className="ml-2 w-3.5 h-3.5" /></>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full h-9 rounded-full text-muted-foreground font-bold text-[9px] uppercase tracking-widest"
                    onClick={goBack}
                    disabled={isSubmitting}
                  >
                    <ArrowLeft className="mr-2 w-3 h-3" /> BACK
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ─── STEP 6: Success ─── */}
        {step === 6 && result && (
          <motion.div key="step6" variants={stepVariants} initial="hidden" animate="visible" exit="exit">
            <Card className="glass-panel rounded-2xl border-white/10 shadow-none bg-gradient-to-br from-card/80 to-transparent overflow-hidden">
              <CardContent className="p-8 flex flex-col items-center text-center gap-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/20 flex items-center justify-center"
                >
                  <TicketCheck className="w-8 h-8 text-green-400" />
                </motion.div>

                <div className="space-y-1">
                  <h2 className="text-sm font-bold uppercase tracking-widest">Request Submitted!</h2>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide opacity-80">
                    Your {form.changeType === "email" ? "email address" : "mobile number"} change request has been submitted to KRA.
                  </p>
                </div>

                <div className="w-full bg-black/10 rounded-2xl border border-white/5 p-5 space-y-2">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Case Reference Number</p>
                  <p className="text-xl font-black text-primary tracking-widest uppercase">{result.caseNumber}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wide opacity-70">
                    Save this reference. KRA will process within 2–5 business days.
                  </p>
                </div>

                <div className="w-full bg-blue-500/5 border border-blue-500/10 rounded-xl p-4">
                  <p className="text-[9px] text-blue-400 font-bold uppercase tracking-wide">
                    📩 Check your email for a confirmation from KRA support. You may be asked to provide additional verification.
                  </p>
                </div>

                <Button
                  variant="outline"
                  className="w-full h-9 rounded-full border-amber-400/20 text-amber-400 font-bold text-[9px] uppercase tracking-widest hover:bg-amber-400/10 hover:border-amber-400/40 transition-all"
                  onClick={resetAll}
                >
                  MAKE ANOTHER REQUEST
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  )
}
