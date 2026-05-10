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
    poBox: ""
  })
  const [isVerified, setIsVerified] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleIdSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!formData.idNumber && !formData.pin) return

    setIdSearchStatus("searching")
    setError(null)

    try {
      const response = await fetch('/api/kra/retrieve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idNumber: formData.idNumber,
          pin: formData.pin
        }),
      })

      const result = await response.json()

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
        }))
        setIdSearchStatus("found")
        setIsVerified(true)
        toast.success("PIN Retrieval Verified")
      } else {
        setIdSearchStatus("error")
        setError(result.error || "Verification failed. Please check your credentials.")
        toast.error("PIN Retrieval Verification Failed")
      }
    } catch (err: any) {
      setIdSearchStatus("error")
      setError("Connection failed. Please try manual entry.")
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
                        <CardTitle className="text-sm font-bold uppercase tracking-widest">CHECK YOUR PIN</CardTitle>
                        <CardDescription className="text-[10px] uppercase tracking-wider opacity-90 font-medium">Enter your ID or KRA PIN to start.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 pt-4 space-y-6 relative z-10 text-center">
                    <AnimatePresence mode="wait">
                      {idSearchStatus === "found" ? (
                        <motion.div key="verified" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 flex flex-col items-center py-6">
                          <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
                            <CheckCircle className="w-10 h-10 text-white" />
                          </div>
                          <h3 className="text-xs font-bold uppercase tracking-widest">IDENTITY FOUND</h3>
                          <div className="flex flex-col gap-2 w-full max-w-[240px]">
                            <Button className="w-full h-9 bg-primary text-white rounded-full font-bold text-[10px] uppercase tracking-widest transition-all shadow-none" onClick={handleDownload}>
                              DOWNLOAD
                              <Download className="ml-2 w-3 h-3" />
                            </Button>
                            <Button variant="ghost" className="w-full h-8 text-muted-foreground hover:text-primary font-bold text-[9px] uppercase tracking-widest" onClick={() => { setIdSearchStatus("idle"); setIsVerified(false); setFormData(prev => ({ ...prev, idNumber: "", pin: "" })); }}>
                              VERIFY ANOTHER
                            </Button>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                          <div className="space-y-6">
                            <div className="space-y-3">
                              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Search Mode</Label>
                              <div className="flex items-center justify-center gap-2">
                                <Button 
                                  variant="outline" 
                                  className={cn(
                                    "h-8 px-5 rounded-full font-bold text-[9px] uppercase tracking-widest transition-all precision-outline", 
                                    formData.idNumber && !formData.pin ? "border-primary bg-primary/10 text-primary" : "opacity-100"
                                  )} 
                                  onClick={() => { handleInputChange('pin', ''); handleInputChange('idNumber', ' '); }}
                                >
                                  ID NUMBER
                                </Button>
                                <Button 
                                  variant="outline" 
                                  className={cn(
                                    "h-8 px-5 rounded-full font-bold text-[9px] uppercase tracking-widest transition-all precision-outline", 
                                    formData.pin ? "border-primary bg-primary/10 text-primary" : "opacity-100"
                                  )} 
                                  onClick={() => { handleInputChange('idNumber', ''); handleInputChange('pin', ' '); }}
                                >
                                  KRA PIN
                                </Button>
                              </div>
                            </div>
                            <div className="space-y-2 max-w-xs mx-auto">
                              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{formData.pin ? 'KRA PIN NUMBER' : 'ID NUMBER'}</Label>
                              <Input 
                                value={formData.pin || formData.idNumber} 
                                onChange={(e) => handleInputChange(formData.pin ? 'pin' : 'idNumber', e.target.value.toUpperCase())} 
                                placeholder={formData.pin ? 'A00XXXXXXXXB' : '12345678'} 
                                className="h-10 rounded-full border-white/10 precision-outline focus:border-primary px-8 text-[11px] text-center font-medium transition-all uppercase bg-black/5" 
                              />
                            </div>
                          </div>
                          {error && (
                            <Alert variant="destructive" className="bg-red-500/5 border-red-500/10 rounded-full p-3">
                              <AlertCircle className="h-4 w-4 text-red-500 mx-auto" />
                              <AlertDescription className="text-[10px] font-medium opacity-80 leading-normal uppercase text-center mt-1">{error}</AlertDescription>
                            </Alert>
                          )}
                          <div className="flex flex-col items-center gap-3">
                            <Button 
                              className="h-9 px-8 bg-primary text-white rounded-full transition-all font-bold text-[10px] uppercase tracking-widest shadow-none hover:opacity-90 w-auto min-w-[140px]" 
                              onClick={handleIdSearch} 
                              disabled={idSearchStatus === "searching"}
                            >
                              {idSearchStatus === "searching" ? (
                                <div className="flex items-center gap-2">
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  <span>SEARCHING...</span>
                                </div>
                              ) : <>CHECK ID <Search className="ml-2 w-3 h-3" /></>}
                            </Button>
                            <Button 
                              variant="ghost" 
                              className="h-8 px-6 rounded-full text-muted-foreground hover:text-primary font-bold text-[9px] uppercase tracking-widest" 
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
                    </div>
                    <div className="flex flex-col items-center gap-4">
                      <Button className="h-9 px-8 bg-primary text-white rounded-full transition-all font-bold text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20" onClick={() => setCurrentStep(3)}>CONTINUE <ArrowRight className="ml-2 w-3 h-3" /></Button>
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
                      <Button className="h-9 px-8 bg-primary text-white rounded-full transition-all font-bold text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20" onClick={() => setCurrentStep(4)}>REVIEW <ArrowRight className="ml-2 w-3 h-3" /></Button>
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
                        <CardTitle className="text-sm font-bold uppercase tracking-widest">CHECK YOUR DETAILS</CardTitle>
                        <CardDescription className="text-xs uppercase tracking-wide opacity-90">Please check everything before downloading.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 pt-6 space-y-8 relative z-10">
                    <div className="bg-black/10 p-6 rounded-2xl border border-white/5 space-y-4 max-w-2xl mx-auto">
                      <div className="flex items-center justify-between border-b border-white/5 pb-3"><span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">PIN</span><span className="text-xs font-bold text-primary">{formData.pin || 'NOT FOUND'}</span></div>
                      <div className="flex items-center justify-between border-b border-white/5 pb-3"><span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">NAME</span><span className="text-xs font-bold text-foreground text-right uppercase">{formData.fullName}</span></div>
                      <div className="flex items-center justify-between"><span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">AREA</span><span className="text-xs font-bold text-muted-foreground text-right uppercase tracking-wide">{formData.town}, {formData.county}</span></div>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                      <Button className="h-10 px-8 bg-primary text-white rounded-full transition-all font-bold text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20 w-auto min-w-[160px]" onClick={handleDownload}>DOWNLOAD <Download className="ml-2 w-3 h-3" /></Button>
                      <Button variant="ghost" className="h-9 px-6 rounded-full text-muted-foreground hover:text-primary font-bold text-[9px] uppercase tracking-widest" onClick={() => { setCurrentStep(1); setIdSearchStatus("idle"); setIsVerified(false); setFormData(prev => ({ ...prev, idNumber: "", pin: "" })); }}>VERIFY ANOTHER</Button>
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
