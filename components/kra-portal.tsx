"use client"

import { useState } from "react"
import { 
  Search, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Download, 
  ShieldCheck, 
  Fingerprint, 
  User, 
  MapPin,
  ArrowRight
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  COUNTIES, 
  GET_POSTAL_CODES, 
  GET_SUB_COUNTIES, 
  GET_STATIONS, 
  GET_LOCALITIES 
} from "@/lib/kenya-data"
import { cn } from "@/lib/utils"
import { toast } from "react-hot-toast"
import { UserButton } from "@clerk/nextjs"

export function KRAPortal() {
  const [currentStep, setCurrentStep] = useState(1)
  const [idSearchStatus, setIdSearchStatus] = useState<"idle" | "searching" | "found" | "error">("idle")
  const [formData, setFormData] = useState({
    idNumber: "",
    pin: "",
    fullName: "",
    email: "",
    phoneNumber: "",
    county: "",
    district: "",
    town: "",
    taxArea: "",
    station: "",
    postalCode: "",
    building: "",
    street: "",
    poBox: "",
    registeredDate: ""
  })
  const [isVerified, setIsVerified] = useState(false)
  const [isVerifyingDate, setIsVerifyingDate] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // CAPTCHA state
  const [captchaImage, setCaptchaImage] = useState<string | null>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [captchaAnswer, setCaptchaAnswer] = useState("")
  const [captchaStatus, setCaptchaStatus] = useState<"idle" | "loading" | "ready" | "error">("idle")

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const loadCaptcha = async () => {
    setCaptchaStatus("loading")
    setCaptchaAnswer("")
    setCaptchaImage(null)
    try {
      const res = await fetch('/api/kra/captcha')
      const data = await res.json()
      if (data.success) {
        setCaptchaImage(data.captchaImage)
        setSessionToken(data.sessionToken)
        setCaptchaStatus("ready")
      } else {
        setCaptchaStatus("error")
        setError("Failed to load verification image. Please try again.")
      }
    } catch {
      setCaptchaStatus("error")
      setError("Cannot connect to KRA server. Please try again.")
    }
  }

  const handleIdSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!formData.idNumber && !formData.pin) return

    // Step 1: If no CAPTCHA loaded yet, load it first
    if (captchaStatus !== "ready") {
      setError(null)
      await loadCaptcha()
      return
    }

    // Step 2: Require CAPTCHA answer before submitting
    if (!captchaAnswer.trim()) {
      setError("Please enter the verification code shown in the image.")
      return
    }

    setIdSearchStatus("searching")
    setError(null)

    try {
      const response = await fetch('/api/kra/retrieve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idNumber: formData.idNumber,
          pin: formData.pin,
          captchaAnswer: captchaAnswer.trim(),
          sessionToken,
        }),
      })

      const result = await response.json()

      // CAPTCHA wrong answer
      if (result.captchaWrong || response.status === 422) {
        toast.error("Wrong verification answer. Please try again.")
        setError("Wrong answer. A new verification image has been loaded.")
        setIdSearchStatus("idle")
        await loadCaptcha()
        return
      }

      if (result.success) {
        setFormData(prev => ({
          ...prev,
          fullName: result.data?.name || prev.fullName,
          pin: result.data?.pin || prev.pin,
          email: result.data?.email || prev.email,
          building: result.data?.building || prev.building,
          street: result.data?.street || prev.street,
          town: result.data?.town || prev.town,
          county: result.data?.county || prev.county,
          district: result.data?.district || prev.district,
          taxArea: result.data?.taxArea || prev.taxArea,
          station: result.data?.station || prev.station,
          poBox: result.data?.poBox || prev.poBox,
          postalCode: result.data?.postalCode || prev.postalCode,
          phoneNumber: result.data?.phoneNumber || prev.phoneNumber,
          registeredDate: result.data?.registeredDate || prev.registeredDate,
        }))
        setIdSearchStatus("found")
        setIsVerified(true)
        setCaptchaStatus("idle")
        setCaptchaImage(null)
        setCaptchaAnswer("")
        toast.success("KRA Certificate Identity Found!")
      } else {
        setIdSearchStatus("error")
        setError(result.error || "Details not found. Please check your credentials.")
        toast.error("Certificate Retrieval Failed")
        await loadCaptcha()
        setIdSearchStatus("idle")
      }
    } catch {
      setIdSearchStatus("error")
      setError("Connection failed. Please try again.")
      setCaptchaStatus("idle")
    }
  }


  const handleDownload = async () => {
    const loadingToast = toast.loading("Securely generating your certificate...")
    try {
      if (!formData.pin || !formData.fullName) {
        toast.error("Identity details missing. Please verify your ID again.", { id: loadingToast })
        return
      }

      const payload = {
        pin: formData.pin,
        name: formData.fullName,
        idNumber: formData.idNumber,
        email: formData.email,
        building: formData.building,
        street: formData.street,
        city: formData.town,
        county: formData.county,
        district: formData.district,
        taxArea: formData.taxArea,
        station: formData.station,
        poBox: formData.poBox,
        postalCode: formData.postalCode,
        mobileNumber: formData.phoneNumber,
        registeredDate: formData.registeredDate,
      };

      const response = await fetch('/api/generate-certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error("Generation failed")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `KRA_Certificate_${formData.pin || 'RETRIEVED'}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      
      toast.success("Certificate downloaded successfully", { id: loadingToast })
    } catch (err) {
      toast.error("Download failed. Please check your connection.", { id: loadingToast })
    }
  }

  const stepVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full flex flex-col space-y-0 py-0 max-w-7xl mx-auto"
    >
      <AnimatePresence mode="wait">
        <motion.div 
          key="portal-content"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-4"
        >
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div key="step1" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4">
                <Card className="glass-panel overflow-hidden rounded-2xl border-white/10 shadow-none bg-gradient-to-br from-card/80 to-transparent">
                  <CardHeader className="p-6 pb-2 border-b border-white/5 relative">
                    <div className="flex flex-col items-center gap-2 relative z-10">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                        <Fingerprint className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-center space-y-1">
                        <CardTitle className="text-sm font-bold uppercase tracking-widest">KRA CERTIFICATE</CardTitle>
                        <CardDescription className="text-[10px] uppercase tracking-wider opacity-90 font-medium">Enter your ID or PIN to generate your certificate.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 pt-4 space-y-6 relative z-10 text-center">
                    <AnimatePresence mode="wait">
                      {idSearchStatus === "found" ? (
                        <motion.div key="verified" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 flex flex-col items-center py-4 w-full max-w-sm mx-auto">
                          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                            <CheckCircle className="w-7 h-7 text-primary" />
                          </div>
                          
                          <div className="w-full space-y-4 bg-black/10 p-6 rounded-2xl border border-white/5 shadow-inner">
                            <div className="flex justify-between items-center gap-4 border-b border-white/5 pb-2">
                              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Full Name</span>
                              <span className="text-[10px] font-bold text-foreground text-right uppercase tracking-tight">{formData.fullName}</span>
                            </div>
                            <div className="flex justify-between items-center gap-4 border-b border-white/5 pb-2">
                              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Email</span>
                              <span className="text-[10px] font-bold text-foreground text-right lowercase tracking-tight">{formData.email || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center gap-4 border-b border-white/5 pb-2">
                              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">KRA PIN</span>
                              <span className="text-[11px] font-black text-primary text-right uppercase tracking-widest">{formData.pin}</span>
                            </div>
                            <div className="flex justify-between items-center gap-4 border-b border-white/5 pb-2">
                              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Exact Reg Date</span>
                              {isVerifyingDate ? (
                                <span className="text-[10px] font-semibold text-primary animate-pulse tracking-wide uppercase">VERIFYING...</span>
                              ) : (
                                <span className="text-[10px] font-bold text-foreground text-right tracking-tight">{formData.registeredDate || 'N/A'}</span>
                              )}
                            </div>
                            <div className="flex justify-between items-center gap-4">
                              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Phone</span>
                              <span className="text-[10px] font-bold text-foreground text-right tracking-tight">{formData.phoneNumber || 'N/A'}</span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-3 w-full max-w-[240px] pt-2">
                            <Button className="w-full h-10 bg-primary text-white rounded-full font-bold text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-primary/20" onClick={handleDownload}>
                              DOWNLOAD
                              <Download className="ml-2 w-4 h-4" />
                            </Button>
                            <Button variant="ghost" className="w-full h-8 text-muted-foreground hover:text-amber-400 hover:bg-amber-400/10 font-bold text-[9px] uppercase tracking-widest" onClick={() => { setIdSearchStatus("idle"); setIsVerified(false); setFormData(prev => ({ ...prev, idNumber: "", pin: "" })); }}>
                              SEARCH ANOTHER
                            </Button>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                          <div className="space-y-4">
                            <div className="space-y-3">
                              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Search Mode</Label>
                              <div className="flex items-center justify-center gap-2">
                                <Button 
                                  variant="outline" 
                                  className={cn(
                                    "h-8 px-5 rounded-full font-bold text-[9px] uppercase tracking-widest transition-all precision-outline", 
                                    formData.idNumber && !formData.pin ? "border-primary bg-primary/10 text-primary" : "opacity-100"
                                  )} 
                                  onClick={() => { handleInputChange('pin', ''); handleInputChange('idNumber', ' '); setCaptchaStatus('idle'); setCaptchaImage(null); setCaptchaAnswer(''); }}
                                >
                                  ID NUMBER
                                </Button>
                                <Button 
                                  variant="outline" 
                                  className={cn(
                                    "h-8 px-5 rounded-full font-bold text-[9px] uppercase tracking-widest transition-all precision-outline", 
                                    formData.pin ? "border-primary bg-primary/10 text-primary" : "opacity-100"
                                  )} 
                                  onClick={() => { handleInputChange('idNumber', ''); handleInputChange('pin', ' '); setCaptchaStatus('idle'); setCaptchaImage(null); setCaptchaAnswer(''); }}
                                >
                                  KRA PIN
                                </Button>
                              </div>
                            </div>
                            <div className="space-y-2 max-w-xs mx-auto">
                              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{formData.pin ? 'KRA PIN NUMBER' : 'ID NUMBER'}</Label>
                              <Input 
                                value={formData.pin || formData.idNumber} 
                                onChange={(e) => { handleInputChange(formData.pin ? 'pin' : 'idNumber', e.target.value.toUpperCase()); setCaptchaStatus('idle'); setCaptchaImage(null); setCaptchaAnswer(''); }} 
                                placeholder={formData.pin ? 'A00XXXXXXXXB' : '12345678'} 
                                className="h-10 rounded-full border-white/10 precision-outline focus:border-primary px-8 text-[11px] text-center font-medium transition-all uppercase bg-black/5" 
                              />
                            </div>
                          </div>

                          {/* CAPTCHA section — shown after first click */}
                          <AnimatePresence>
                            {captchaStatus === "loading" && (
                              <motion.div key="captcha-loading" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex flex-col items-center gap-2 py-2">
                                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Loading verification...</span>
                              </motion.div>
                            )}
                            {captchaStatus === "ready" && captchaImage && (
                              <motion.div key="captcha-ready" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="flex flex-col items-center gap-3">
                                <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Solve Verification Code</Label>
                                <div className="relative">
                                  <img src={captchaImage} alt="KRA CAPTCHA" className="rounded-xl border border-white/10 shadow-inner h-14 mx-auto object-contain bg-white/5" />
                                  <button
                                    type="button"
                                    onClick={loadCaptcha}
                                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-400/20 hover:bg-amber-400/40 flex items-center justify-center transition-all"
                                    title="Refresh CAPTCHA"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
                                  </button>
                                </div>
                                <Input 
                                  value={captchaAnswer}
                                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                                  placeholder="Enter the answer"
                                  className="h-9 rounded-full border-white/10 precision-outline focus:border-primary px-6 text-[12px] text-center font-bold tracking-widest bg-black/5 max-w-[160px] mx-auto"
                                  onKeyDown={(e) => { if (e.key === 'Enter') handleIdSearch(); }}
                                  autoFocus
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {error && (
                            <Alert variant="destructive" className="bg-red-500/5 border-red-500/10 rounded-full p-3">
                              <AlertCircle className="h-4 w-4 text-red-500 mx-auto" />
                              <AlertDescription className="text-[10px] font-medium opacity-80 leading-normal uppercase text-center mt-1">{error}</AlertDescription>
                            </Alert>
                          )}
                          <div className="flex flex-col items-center gap-3">
                            <Button 
                              className="h-9 px-8 bg-amber-400 text-black rounded-full transition-all font-bold text-[10px] uppercase tracking-widest shadow-none hover:bg-amber-300 w-auto min-w-[140px]" 
                              onClick={handleIdSearch} 
                              disabled={idSearchStatus === "searching" || captchaStatus === "loading"}
                            >
                              {idSearchStatus === "searching" ? (
                                <div className="flex items-center gap-2">
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  <span>RETRIEVING...</span>
                                </div>
                              ) : captchaStatus === "ready" ? (
                                <>SUBMIT <ArrowRight className="ml-2 w-3 h-3" /></>
                              ) : captchaStatus === "loading" ? (
                                <div className="flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /><span>LOADING...</span></div>
                              ) : (
                                <>GENERATE <ArrowRight className="ml-2 w-3 h-3" /></>
                              )}
                            </Button>
                            <Button 
                              variant="ghost" 
                              className="h-8 px-6 rounded-full text-muted-foreground hover:text-amber-400 hover:bg-amber-400/10 font-bold text-[9px] uppercase tracking-widest" 
                              onClick={() => setCurrentStep(2)}
                            >
                              I'LL ENTER DETAILS MYSELF
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div key="step2" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                <Card className="glass-panel overflow-hidden rounded-2xl border-white/10 shadow-none bg-gradient-to-br from-card/80 to-transparent">
                  <CardHeader className="p-6 pb-4 border-b border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-3xl rounded-full -mr-12 -mt-12" />
                    <div className="flex flex-col items-center gap-3 relative z-10">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-center space-y-0.5">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em]">PERSONAL INFO</CardTitle>
                        <CardDescription className="text-[9px] uppercase tracking-widest opacity-80">Enter your name and email.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 pt-6 space-y-8 relative z-10">
                    <div className="grid grid-cols-1 gap-4 max-w-2xl mx-auto">
                      <div className="space-y-1.5 text-center">
                        <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Full Name</Label>
                        <Input value={formData.fullName} onChange={(e) => handleInputChange('fullName', e.target.value.toUpperCase())} placeholder="AS SHOWN ON ID" className="h-9 rounded-full bg-black/5 border-white/10 precision-outline focus:border-primary px-6 text-[10px] text-center font-medium transition-all" />
                      </div>
                      <div className="space-y-1.5 text-center">
                        <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Email Address</Label>
                        <Input value={formData.email} onChange={(e) => handleInputChange('email', e.target.value.toLowerCase())} placeholder="EMAIL@EXAMPLE.COM" className="h-9 rounded-full bg-black/5 border-white/10 precision-outline focus:border-primary px-6 text-[10px] text-center font-medium transition-all" />
                      </div>
                      <div className="space-y-1.5 text-center">
                        <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Exact Registration Date</Label>
                        <Input value={formData.registeredDate} onChange={(e) => handleInputChange('registeredDate', e.target.value)} placeholder="DD/MM/YYYY" className="h-9 rounded-full bg-black/5 border-white/10 precision-outline focus:border-primary px-6 text-[10px] text-center font-medium transition-all" />
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                      <Button className="h-9 px-8 bg-amber-400 text-black rounded-full transition-all font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-amber-300" onClick={() => setCurrentStep(3)}>CONTINUE <ArrowRight className="ml-2 w-3 h-3" /></Button>
                      <Button variant="ghost" className="h-8 px-6 rounded-full text-muted-foreground font-bold text-[9px] uppercase tracking-widest" onClick={() => setCurrentStep(1)}>BACK</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div key="step3" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                <Card className="glass-panel overflow-hidden rounded-2xl border-white/10 shadow-none bg-gradient-to-br from-card/80 to-transparent">
                  <CardHeader className="p-6 pb-4 border-b border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-3xl rounded-full -mr-12 -mt-12" />
                    <div className="flex flex-col items-center gap-3 relative z-10">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-center space-y-0.5">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em]">ADDRESS</CardTitle>
                        <CardDescription className="text-[9px] uppercase tracking-widest opacity-80">Where do you live?</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 pt-6 space-y-8 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                      <div className="space-y-2 text-center">
                        <Label className="text-xs font-bold uppercase tracking-widest">County</Label>
                        <Select value={formData.county} onValueChange={(v) => { handleInputChange('county', v); handleInputChange('district', '') }}>
                          <SelectTrigger className="h-11 rounded-full bg-black/5 border-white/10 precision-outline text-xs font-medium px-6 focus:border-primary justify-center text-center">
                            <SelectValue placeholder="SELECT" />
                          </SelectTrigger>
                          <SelectContent className="rounded-full">
                            {COUNTIES.map(c => (<SelectItem key={c} value={c} className="py-2 text-xs">{c}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 text-center">
                        <Label className="text-xs font-bold uppercase tracking-widest">District</Label>
                        <Select value={formData.district || ""} onValueChange={(v) => handleInputChange('district', v)}>
                          <SelectTrigger className="h-11 rounded-full bg-black/5 border-white/10 precision-outline text-xs font-medium px-6 focus:border-primary justify-center text-center">
                            <SelectValue placeholder="SELECT" />
                          </SelectTrigger>
                          <SelectContent className="rounded-full">
                            {formData.county && GET_SUB_COUNTIES(formData.county).map(sc => (<SelectItem key={sc} value={sc} className="py-2 text-xs">{sc}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 text-center">
                        <Label className="text-xs font-bold uppercase tracking-widest">Area</Label>
                        <Select value={formData.taxArea || ""} onValueChange={(v) => handleInputChange('taxArea', v)}>
                          <SelectTrigger className="h-11 rounded-full bg-black/5 border-white/10 precision-outline text-xs font-medium px-6 focus:border-primary justify-center text-center">
                            <SelectValue placeholder="SELECT" />
                          </SelectTrigger>
                          <SelectContent className="rounded-full">
                            {formData.county && GET_LOCALITIES(formData.county, formData.district || "").map(l => (<SelectItem key={l} value={l} className="py-2 text-xs">{l}</SelectItem>))}</SelectContent></Select></div>
                      <div className="space-y-2 text-center">
                        <Label className="text-xs font-bold uppercase tracking-widest">Station</Label>
                        <Select value={formData.station || ""} onValueChange={(v) => handleInputChange('station', v)}>
                          <SelectTrigger className="h-11 rounded-full bg-black/10 border-white/10 text-xs font-medium px-6 focus:border-primary justify-center text-center">
                            <SelectValue placeholder="SELECT" />
                          </SelectTrigger>
                          <SelectContent className="rounded-full">
                            {formData.county && GET_STATIONS(formData.county).map(s => (<SelectItem key={s} value={s} className="py-2 text-xs">{s}</SelectItem>))}</SelectContent></Select></div>
                      <div className="space-y-2 text-center">
                        <Label className="text-xs font-bold uppercase tracking-widest">Postal Code</Label>
                        <Select value={formData.postalCode} onValueChange={(v) => { const found = GET_POSTAL_CODES(formData.county).find(p => p.code === v); handleInputChange('postalCode', v); if (found) handleInputChange('town', found.town) }}>
                          <SelectTrigger className="h-11 rounded-full bg-black/5 border-white/10 precision-outline text-xs font-medium px-6 focus:border-primary justify-center text-center">
                            <SelectValue placeholder="CODE" />
                          </SelectTrigger>
                          <SelectContent className="rounded-full">
                            {formData.county && GET_POSTAL_CODES(formData.county).map(p => (<SelectItem key={p.code} value={p.code} className="py-2 text-xs">{p.code}</SelectItem>))}</SelectContent></Select></div>
                      <div className="space-y-2 text-center">
                        <Label className="text-xs font-bold uppercase tracking-widest">Mobile Number</Label>
                        <Input value={formData.phoneNumber} onChange={(e) => handleInputChange('phoneNumber', e.target.value)} placeholder="07XXXXXXXX" className="h-11 rounded-full bg-black/5 border-white/10 precision-outline focus:border-primary px-6 font-medium text-xs text-center" />
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                      <Button className="h-9 px-8 bg-amber-400 text-black rounded-full transition-all font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-amber-300" onClick={() => setCurrentStep(4)}>REVIEW <ArrowRight className="ml-2 w-3 h-3" /></Button>
                      <Button variant="ghost" className="h-8 px-6 rounded-full text-muted-foreground font-bold text-[9px] uppercase tracking-widest" onClick={() => setCurrentStep(2)}>BACK</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div key="step4" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                <Card className="glass-panel overflow-hidden rounded-2xl border-white/10 shadow-none bg-gradient-to-br from-card/80 to-transparent">
                  <CardHeader className="p-6 pb-4 border-b border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-3xl rounded-full -mr-12 -mt-12" />
                    <div className="flex flex-col items-center gap-3 relative z-10">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                        <ShieldCheck className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-center space-y-1">
                        <CardTitle className="text-sm font-bold uppercase tracking-widest">REVIEW CERTIFICATE</CardTitle>
                        <CardDescription className="text-xs uppercase tracking-wide opacity-90">Please check everything before downloading.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 pt-6 space-y-8 relative z-10">
                    <div className="bg-black/10 p-6 rounded-2xl border border-white/5 space-y-4 max-w-2xl mx-auto shadow-inner">
                      <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">KRA PIN</span>
                        <span className="text-[11px] font-black text-primary uppercase tracking-widest">{formData.pin || 'NOT FOUND'}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Name</span>
                        <span className="text-[10px] font-bold text-foreground text-right uppercase tracking-tight">{formData.fullName}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Email</span>
                        <span className="text-[10px] font-bold text-foreground text-right lowercase tracking-tight">{formData.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Exact Reg Date</span>
                        {isVerifyingDate ? (
                          <span className="text-[10px] font-semibold text-primary animate-pulse tracking-wide uppercase">VERIFYING...</span>
                        ) : (
                          <span className="text-[10px] font-bold text-foreground text-right tracking-tight">{formData.registeredDate || 'N/A'}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Phone</span>
                        <span className="text-[10px] font-bold text-foreground text-right tracking-tight">{formData.phoneNumber || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Location</span>
                        <span className="text-[10px] font-bold text-muted-foreground text-right uppercase tracking-wide">{formData.town || 'N/A'}, {formData.county || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                      <Button className="h-10 px-8 bg-amber-400 text-black rounded-full transition-all font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-amber-300 w-auto min-w-[160px]" onClick={handleDownload}>DOWNLOAD <Download className="ml-2 w-3 h-3" /></Button>
                      <Button variant="ghost" className="h-9 px-6 rounded-full text-muted-foreground hover:text-amber-400 hover:bg-amber-400/10 font-bold text-[9px] uppercase tracking-widest" onClick={() => { setCurrentStep(1); setIdSearchStatus("idle"); setIsVerified(false); setFormData(prev => ({ ...prev, idNumber: "", pin: "" })); }}>GENERATE ANOTHER</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
