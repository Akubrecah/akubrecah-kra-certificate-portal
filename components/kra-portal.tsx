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
  ArrowRight,
  RefreshCw,
  BadgeIcon,
  MapPinIcon
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { motion, AnimatePresence } from "framer-motion"
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
import { useUser } from "@clerk/nextjs"

export function KRAPortal() {
  const { isLoaded: authLoaded, isSignedIn } = useUser()
  const [currentStep, setCurrentStep] = useState(1)
  const [idSearchStatus, setIdSearchStatus] = useState<"idle" | "searching" | "found" | "error">("idle")
  
  // Tab state for Step 1
  const [activeTab, setActiveTab] = useState<"id" | "pin">("id")
  // Engine selection: Live API vs DWR Web Remoting vs Auto
  const [engineMode, setEngineMode] = useState<"auto" | "api" | "dwr">("auto")

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
  const [hasConsented, setHasConsented] = useState(false)

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
    if (!formData.idNumber && !formData.pin) {
      setError("Please enter your National ID number or KRA PIN.")
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
          engineMode,
        }),
      })

      const result = await response.json()

      // If server specifically requires CAPTCHA answer
      if (result.captchaRequired || result.captchaWrong || response.status === 422) {
        if (result.pin) {
          setFormData(prev => ({ ...prev, pin: result.pin }))
        }
        toast(result.error || "Security verification required. Please solve the arithmetic question.", { icon: "🔒" })
        setError(result.error || "Please enter the verification answer from the image.")
        setIdSearchStatus("idle")
        await loadCaptcha()
        return
      }

      if (result.success && (result.data?.name || result.data?.pin)) {
        setFormData(prev => ({
          ...prev,
          fullName: result.data?.name || prev.fullName || '',
          pin: result.data?.pin || prev.pin,
          email: result.data?.email || prev.email || '',
          building: result.data?.building || prev.building || '',
          street: result.data?.street || prev.street || '',
          town: result.data?.town || prev.town || '',
          county: result.data?.county || prev.county || '',
          district: result.data?.district || prev.district || '',
          taxArea: result.data?.taxArea || prev.taxArea || '',
          station: result.data?.station || prev.station || '',
          poBox: result.data?.poBox || prev.poBox || '',
          postalCode: result.data?.postalCode || prev.postalCode || '',
          phoneNumber: result.data?.phoneNumber || prev.phoneNumber || '',
          registeredDate: result.data?.registeredDate || prev.registeredDate || '',
        }))
        setIdSearchStatus("found")
        setIsVerified(true)
        setCaptchaStatus("idle")
        setCaptchaImage(null)
        setCaptchaAnswer("")
        setCurrentStep(4)
        toast.success("KRA Taxpayer Details Found!")
      } else {
        setIdSearchStatus("idle")
        setError(result.error || "Details not found. Please check your credentials.")
        toast.error(result.error || "Retrieval Failed")
      }
    } catch {
      setIdSearchStatus("idle")
      setError("Connection failed. Please try again.")
    }
  }


  const handleDownload = async () => {
    const loadingToast = toast.loading("Securely generating your certificate...")
    try {
      if (!formData.pin || !formData.fullName) {
        toast.error("Identity details missing. Please verify your ID again.", { id: loadingToast })
        return
      }

      if (authLoaded && !isSignedIn) {
        toast.error("Authentication required. Please sign in to download your certificate.", { id: loadingToast })
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Generation failed")
      }

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
    } catch (err: any) {
      toast.error(err.message || "Download failed. Please check your connection.", { id: loadingToast })
    }
  }

  const stepVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  }

  // Common input classes based on Stitch design
  const inputClass = "w-full bg-surface-container-lowest border border-outline-muted rounded text-body-md text-on-surface placeholder-on-surface-variant/50 focus:ring-1 focus:ring-primary focus:border-primary px-4 py-3 h-auto"
  const labelClass = "block font-label-md text-label-md text-on-surface mb-unit"
  const primaryButtonClass = "w-full md:w-auto bg-primary-container text-on-primary font-label-md text-label-md py-3 px-8 rounded hover:bg-primary transition-colors flex justify-center items-center gap-2"
  const secondaryButtonClass = "w-full md:w-auto bg-surface-container border border-outline-muted text-on-surface font-label-md text-label-md py-3 px-6 rounded hover:bg-surface-variant transition-colors flex justify-center items-center gap-2"

  return (
    <div className="w-full">
      <div className="mb-stack-lg flex flex-col items-center justify-center text-center">
        <h1 className="font-display-lg text-display-lg text-on-surface mb-stack-sm text-center">Retrieve Your KRA Certificate</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg">Enter your details to quickly retrieve and verify your tax compliance certificate.</p>
      </div>

      {isVerified && (
        <div className="w-full max-w-3xl mx-auto mb-8">
          <Alert className="bg-success-bg border-success-green/30 text-success-green rounded-lg flex items-center gap-3 py-3 px-4">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <AlertDescription className="text-sm font-medium">
              Certificate details successfully retrieved. Please review the information before downloading.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Step Progress Bar */}
      <div className="w-full max-w-md mx-auto mb-8 px-4">
        <div className="flex justify-between items-center font-label-sm text-label-sm uppercase mb-2">
          <span className={cn(currentStep >= 1 ? "text-primary" : "text-on-surface-variant")}>01. Identity</span>
          <span className={cn(currentStep >= 2 ? "text-primary" : "text-on-surface-variant")}>02. Personal</span>
          <span className={cn(currentStep >= 3 ? "text-primary" : "text-on-surface-variant")}>03. Address</span>
          <span className={cn(currentStep >= 4 ? "text-primary" : "text-on-surface-variant")}>04. Review</span>
        </div>
        <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden relative">
          <motion.div 
            className="h-full bg-primary rounded-full"
            initial={{ width: "25%" }}
            animate={{ width: `${(currentStep / 4) * 100}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key="portal-content"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <div className="bg-surface-container-lowest rounded-xl shadow-soft border border-outline-muted p-6 md:p-8 relative overflow-hidden z-10">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div key="step1" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4">
                  
                  {idSearchStatus === "searching" ? (
                    <div className="flex flex-col items-center justify-center py-8">
                        <Loader2 className="animate-spin text-primary w-10 h-10 mb-4" />
                        <p className="font-body-md text-body-md text-on-surface-variant">Connecting to KRA Database...</p>
                    </div>
                  ) : (
                    <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                      
                      {/* Query Engine Switcher */}
                      <div className="flex flex-col items-center gap-2 mb-5 max-w-md mx-auto">
                        <div className="flex items-center justify-between w-full px-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            Retrieval Protocol
                          </span>
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                            engineMode === "api" ? "bg-red-500/10 text-red-600 border-red-500/20" :
                            engineMode === "dwr" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                            "bg-blue-500/10 text-blue-600 border-blue-500/20"
                          )}>
                            {engineMode === "api" ? "⚡ GavaConnect Live Gateway" :
                             engineMode === "dwr" ? "🌐 DWR Remoting Pipeline" :
                             "🔄 Dual-Engine (API + DWR)"}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-full border border-outline-variant/60">
                          <button
                            type="button"
                            onClick={() => setEngineMode("auto")}
                            className={cn(
                              "py-2 px-2 text-xs font-semibold rounded transition-all flex items-center justify-center gap-1.5",
                              engineMode === "auto"
                                ? "bg-white dark:bg-zinc-900 text-primary shadow-sm font-bold"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            🔄 Auto
                          </button>
                          <button
                            type="button"
                            onClick={() => setEngineMode("api")}
                            className={cn(
                              "py-2 px-2 text-xs font-semibold rounded transition-all flex items-center justify-center gap-1.5",
                              engineMode === "api"
                                ? "bg-red-600 text-white shadow-sm font-bold"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            ⚡ Live API
                          </button>
                          <button
                            type="button"
                            onClick={() => setEngineMode("dwr")}
                            className={cn(
                              "py-2 px-2 text-xs font-semibold rounded transition-all flex items-center justify-center gap-1.5",
                              engineMode === "dwr"
                                ? "bg-emerald-600 text-white shadow-sm font-bold"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            🌐 DWR
                          </button>
                        </div>

                        {/* Engine Context Card */}
                        <div className={cn(
                          "w-full rounded-lg p-3 text-left text-xs border transition-all",
                          engineMode === "api"
                            ? "bg-red-500/5 border-red-500/20 text-red-900 dark:text-red-300"
                            : engineMode === "dwr"
                            ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-900 dark:text-emerald-300"
                            : "bg-blue-500/5 border-blue-500/20 text-blue-900 dark:text-blue-300"
                        )}>
                          {engineMode === "api" && (
                            <div className="flex flex-col gap-1">
                              <span className="font-bold flex items-center gap-1">⚡ KRA Live API (GavaConnect OAuth 2.0)</span>
                              <span className="text-[11px] opacity-80">Direct verification via official government gateway endpoints (`/checker/v1/pin`, `/checker/v1/pinbypin`).</span>
                            </div>
                          )}
                          {engineMode === "dwr" && (
                            <div className="flex flex-col gap-1">
                              <span className="font-bold flex items-center gap-1">🌐 KRA Direct Web Remoting (DWR)</span>
                              <span className="text-[11px] opacity-80">Real-time session handshake (`findPinByIdno.findPinByIdnumber`) with instant live unmasking.</span>
                            </div>
                          )}
                          {engineMode === "auto" && (
                            <div className="flex flex-col gap-1">
                              <span className="font-bold flex items-center gap-1">🔄 Intelligent Dual-Engine Mode</span>
                              <span className="text-[11px] opacity-80">Coordinates Live API and DWR remoting for fastest response and accuracy.</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Lookup Type Tabs */}
                      <div className="flex p-1 bg-surface-variant rounded-lg mb-stack-lg max-w-sm mx-auto">
                          <button 
                            className={cn("flex-1 py-2 font-label-md text-label-md rounded shadow-sm transition-colors", activeTab === "id" ? "bg-surface-container-lowest text-on-surface font-bold" : "text-on-surface-variant hover:text-on-surface")}
                            onClick={() => { setActiveTab("id"); handleInputChange('pin', ''); }}
                          >
                              ID Number
                          </button>
                          <button 
                            className={cn("flex-1 py-2 font-label-md text-label-md rounded shadow-sm transition-colors", activeTab === "pin" ? "bg-surface-container-lowest text-on-surface font-bold" : "text-on-surface-variant hover:text-on-surface")}
                            onClick={() => { setActiveTab("pin"); handleInputChange('idNumber', ''); }}
                          >
                              KRA PIN
                          </button>
                      </div>

                      <form className="space-y-stack-md max-w-sm mx-auto" onSubmit={(e) => { e.preventDefault(); handleIdSearch(); }}>
                          {activeTab === "id" ? (
                            <div>
                                <label className={labelClass}>National ID Number</label>
                                <div className="relative">
                                    <BadgeIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                                    <input 
                                      className={cn(inputClass, "pl-10")}
                                      placeholder="e.g. 12345678" 
                                      type="text" 
                                      value={formData.idNumber}
                                      onChange={(e) => { handleInputChange('idNumber', e.target.value.toUpperCase()); setCaptchaStatus('idle'); }}
                                    />
                                </div>
                            </div>
                          ) : (
                            <div>
                                <label className={labelClass}>KRA PIN</label>
                                <div className="relative">
                                    <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                                    <input 
                                      className={cn(inputClass, "pl-10 uppercase")}
                                      placeholder="e.g. A123456789Z" 
                                      type="text" 
                                      value={formData.pin}
                                      onChange={(e) => { handleInputChange('pin', e.target.value.toUpperCase()); setCaptchaStatus('idle'); }}
                                    />
                                </div>
                            </div>
                          )}

                          {/* CAPTCHA section — shown after first click */}
                          <AnimatePresence>
                            {captchaStatus === "loading" && (
                              <motion.div key="captcha-loading" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex flex-col items-center gap-2 py-2">
                                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                <span className="font-label-sm text-label-sm text-on-surface-variant">Loading verification...</span>
                              </motion.div>
                            )}
                            {captchaStatus === "ready" && captchaImage && (
                              <motion.div key="captcha-ready" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="flex flex-col items-center gap-3 bg-surface-container rounded-lg p-4">
                                <label className={labelClass}>Solve Verification Code</label>
                                <div className="relative">
                                  <img src={captchaImage} alt="KRA CAPTCHA" className="rounded border border-outline-variant h-14 mx-auto object-contain bg-white" />
                                  <button
                                    type="button"
                                    onClick={loadCaptcha}
                                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-surface-variant hover:bg-surface-container-high flex items-center justify-center transition-all border border-outline-variant"
                                    title="Refresh CAPTCHA"
                                  >
                                    <RefreshCw className="w-3 h-3 text-primary" />
                                  </button>
                                </div>
                                <input 
                                  value={captchaAnswer}
                                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                                  placeholder="Enter the answer"
                                  className={cn(inputClass, "text-center max-w-[160px]")}
                                  autoFocus
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {error && (
                            <Alert variant="destructive" className="bg-error-container border-error text-error rounded-lg">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription className="text-xs font-medium mt-1">{error}</AlertDescription>
                            </Alert>
                          )}
                          
                          {/* Consent checkbox — legally required */}
                          <div className="flex items-start gap-2.5 text-left py-2">
                            <input
                              type="checkbox"
                              id="kra-consent"
                              checked={hasConsented}
                              onChange={(e) => setHasConsented(e.target.checked)}
                              className="mt-1 w-4 h-4 accent-primary rounded border-outline-muted cursor-pointer"
                            />
                            <label htmlFor="kra-consent" className="font-body-sm text-body-sm text-on-surface-variant cursor-pointer">
                              I confirm I am the rightful owner of these credentials and I agree to the{" "}
                              <a href="/legal/terms" target="_blank" className="text-primary hover:underline">Terms of Service</a>.
                            </label>
                          </div>
                          
                          <div className="pt-stack-sm flex flex-col gap-3 justify-center">
                              <button 
                                className={cn(primaryButtonClass, "w-full disabled:opacity-50")}
                                type="button"
                                onClick={handleIdSearch}
                                disabled={!hasConsented || captchaStatus === "loading"}
                              >
                                  <Search className="w-4 h-4" />
                                  {captchaStatus === "ready" ? "Submit" : "Retrieve Certificate"}
                              </button>
                              <button 
                                className="w-full bg-transparent text-primary hover:bg-primary/5 font-label-md text-label-md py-3 px-8 rounded transition-colors flex justify-center items-center gap-2"
                                type="button"
                                onClick={() => setCurrentStep(2)}
                              >
                                I'll Enter Details Manually
                              </button>
                          </div>
                      </form>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div key="step2" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                  <div className="mb-stack-lg flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <User className="text-primary w-6 h-6" />
                    </div>
                    <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Personal Information</h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Please confirm your personal details.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
                    <div>
                      <label className={labelClass}>Full Name</label>
                      <input 
                        value={formData.fullName} 
                        onChange={(e) => handleInputChange('fullName', e.target.value.toUpperCase())} 
                        placeholder="e.g. JOHN DOE" 
                        className={inputClass} 
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Email Address</label>
                      <input 
                        value={formData.email} 
                        onChange={(e) => handleInputChange('email', e.target.value.toLowerCase())} 
                        placeholder="email@example.com" 
                        type="email"
                        className={inputClass} 
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Mobile Phone Number</label>
                      <input 
                        value={formData.phoneNumber} 
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)} 
                        placeholder="e.g. 0712345678" 
                        type="tel"
                        className={inputClass} 
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Exact Registration Date</label>
                      <input 
                        value={formData.registeredDate} 
                        onChange={(e) => handleInputChange('registeredDate', e.target.value)} 
                        placeholder="DD/MM/YYYY" 
                        className={inputClass} 
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4 max-w-md mx-auto pt-4">
                    <button className={secondaryButtonClass} onClick={() => setCurrentStep(1)}>
                      Back
                    </button>
                    <button className={primaryButtonClass} onClick={() => setCurrentStep(3)}>
                      Continue <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div key="step3" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                  <div className="mb-stack-lg flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <MapPin className="text-primary w-6 h-6" />
                    </div>
                    <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Address Details</h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Where are you located?</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                    <div>
                      <label className={labelClass}>County</label>
                      <Select value={formData.county} onValueChange={(v) => { handleInputChange('county', v); handleInputChange('district', '') }}>
                        <SelectTrigger className={cn(inputClass, "h-12")}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="bg-surface-container-lowest border-outline-muted rounded-lg">
                          {COUNTIES.map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className={labelClass}>District</label>
                      <Select value={formData.district || ""} onValueChange={(v) => handleInputChange('district', v)}>
                        <SelectTrigger className={cn(inputClass, "h-12")}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="bg-surface-container-lowest border-outline-muted rounded-lg">
                          {formData.county && GET_SUB_COUNTIES(formData.county).map(sc => (<SelectItem key={sc} value={sc}>{sc}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className={labelClass}>Area</label>
                      <Select value={formData.taxArea || ""} onValueChange={(v) => handleInputChange('taxArea', v)}>
                        <SelectTrigger className={cn(inputClass, "h-12")}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="bg-surface-container-lowest border-outline-muted rounded-lg">
                          {formData.county && GET_LOCALITIES(formData.county, formData.district || "").map(l => (<SelectItem key={l} value={l}>{l}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className={labelClass}>Station</label>
                      <Select value={formData.station || ""} onValueChange={(v) => handleInputChange('station', v)}>
                        <SelectTrigger className={cn(inputClass, "h-12")}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="bg-surface-container-lowest border-outline-muted rounded-lg">
                          {formData.county && GET_STATIONS(formData.county).map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className={labelClass}>Postal Code</label>
                      <Select value={formData.postalCode} onValueChange={(v) => { const found = GET_POSTAL_CODES(formData.county).find(p => p.code === v); handleInputChange('postalCode', v); if (found) handleInputChange('town', found.town) }}>
                        <SelectTrigger className={cn(inputClass, "h-12")}>
                          <SelectValue placeholder="Code" />
                        </SelectTrigger>
                        <SelectContent className="bg-surface-container-lowest border-outline-muted rounded-lg">
                          {formData.county && GET_POSTAL_CODES(formData.county).map(p => (<SelectItem key={p.code} value={p.code}>{p.code}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className={labelClass}>Mobile Number</label>
                      <input 
                        value={formData.phoneNumber} 
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)} 
                        placeholder="07XXXXXXXX" 
                        className={inputClass} 
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-2xl mx-auto pt-4">
                    <button className={secondaryButtonClass} onClick={() => setCurrentStep(2)}>
                      Back
                    </button>
                    <button className={primaryButtonClass} onClick={() => setCurrentStep(4)}>
                      Review <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div key="step4" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                  <div className="mb-stack-lg flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <ShieldCheck className="text-primary w-6 h-6" />
                    </div>
                    <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Review Certificate</h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Please check everything before downloading.</p>
                  </div>

                  <div className="w-full max-w-lg mx-auto bg-surface-variant/30 rounded-lg p-6 border border-outline-variant space-y-4">
                    <div className="flex justify-between border-b border-outline-muted pb-3">
                      <span className="font-label-md text-label-md text-on-surface-variant">KRA PIN</span>
                      <span className="font-label-md text-label-md text-primary font-bold">{formData.pin || 'NOT FOUND'}</span>
                    </div>
                    <div className="flex justify-between border-b border-outline-muted pb-3">
                      <span className="font-label-md text-label-md text-on-surface-variant">Name</span>
                      <span className="font-label-md text-label-md text-on-surface font-bold">{formData.fullName}</span>
                    </div>
                    <div className="flex justify-between border-b border-outline-muted pb-3">
                      <span className="font-label-md text-label-md text-on-surface-variant">Email</span>
                      <span className="font-label-md text-label-md text-on-surface">{formData.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b border-outline-muted pb-3">
                      <span className="font-label-md text-label-md text-on-surface-variant">Exact Reg Date</span>
                      <span className="font-label-md text-label-md text-on-surface">{formData.registeredDate || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b border-outline-muted pb-3">
                      <span className="font-label-md text-label-md text-on-surface-variant">Phone</span>
                      <span className="font-label-md text-label-md text-on-surface">{formData.phoneNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-label-md text-label-md text-on-surface-variant">Location</span>
                      <span className="font-label-md text-label-md text-on-surface">{formData.town || 'N/A'}, {formData.county || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-center gap-3 max-w-lg mx-auto pt-4">
                    <button className={secondaryButtonClass} onClick={() => setCurrentStep(2)}>
                      <User className="w-4 h-4" /> Edit Details
                    </button>
                    <button className={secondaryButtonClass} onClick={() => { setCurrentStep(1); setIdSearchStatus("idle"); setIsVerified(false); setFormData(prev => ({ ...prev, idNumber: "", pin: "" })); }}>
                      <RefreshCw className="w-4 h-4" /> New Search
                    </button>
                    <button className={primaryButtonClass} onClick={handleDownload}>
                      <Download className="w-4 h-4" /> Download PDF
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
