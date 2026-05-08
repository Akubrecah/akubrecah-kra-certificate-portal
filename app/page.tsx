"use client"

import { useState, useEffect } from "react"
import { 
  Show, 
  SignInButton, 
  UserButton 
} from "@clerk/nextjs"
import { 
  ArrowRight, 
  Search, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Download, 
  ShieldCheck, 
  Fingerprint, 
  User, 
  MapPin,
  Shield,
  Zap,
  Lock
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageBackground } from "@/components/ui/page-background"
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

export default function Home() {
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
        setIsVerified(true)
        toast.success("PIN Retrieval Verified")
      } else {
        setIdSearchStatus("error")
        setError(result.error || "Verification failed. Please check your credentials.")
        toast.error("PIN Retrieval Verification Failed")
      }
    } catch (err: any) {
      setIdSearchStatus("error")
      setError("Vault synchronization failed. Please try manual entry.")
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
        // Address fields - all explicitly mapped
        building: formData.building,
        street: formData.street,
        city: formData.town,       // 'town' in state = 'city' in PDF route
        county: formData.county,
        district: formData.district,
        taxArea: formData.taxArea,
        station: formData.station,
        poBox: formData.poBox,
        postalCode: formData.postalCode,
        mobileNumber: formData.phoneNumber,
      };
      console.log('[DOWNLOAD] Sending payload to generate-certificate:', payload);

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
    <PageBackground>
      <div className="container mx-auto px-4 py-12 max-w-4xl relative z-10">
        <Show when="signed-out">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-12"
          >
            <div className="space-y-4">
              <Badge className="bg-[#F2E600] text-black font-black px-4 py-1.5 rounded-full text-[10px] tracking-[0.4em] shadow-2xl border-none">
                RESTRICTED ACCESS
              </Badge>
              <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase leading-[0.9] text-gradient">
                Identity Vault<span className="text-[#F2E600]">.</span>
              </h1>
              <p className="max-w-[500px] mx-auto text-sm text-muted-foreground font-bold uppercase tracking-[0.2em] opacity-50">
                Authorized Compliance Personnel Only
              </p>
            </div>

            <Card className="glass-panel w-full max-w-sm overflow-hidden rounded-[2.5rem] border-white/10 shadow-2xl">
              <CardContent className="p-10 space-y-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#1F6F5B]/10 flex items-center justify-center mx-auto border border-[#1F6F5B]/20">
                  <Lock className="w-8 h-8 text-[#1F6F5B]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black uppercase tracking-tight">Encryption Active</h3>
                  <p className="text-xs font-medium text-muted-foreground opacity-60">Authentication required to initialize retrieval.</p>
                </div>
                <SignInButton mode="modal">
                  <Button className="w-full h-14 bg-gradient-to-br from-[#1F6F5B] to-[#145A47] text-white rounded-full transition-all hover:scale-[1.02] font-black text-base uppercase tracking-widest border border-white/10 group">
                    Initialize Login
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </SignInButton>
              </CardContent>
            </Card>

            <div className="flex items-center gap-10 text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] opacity-20">
              <span className="flex items-center gap-3"><Shield className="w-4 h-4" /> Secure Auth</span>
              <span className="flex items-center gap-3"><Zap className="w-4 h-4" /> KRA Integrated</span>
            </div>
          </motion.div>
        </Show>

        <Show when="signed-in">
          <AnimatePresence mode="wait">
            {isVerified ? (
              <motion.div 
                key="verified"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#061411] p-6"
              >
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#1F6F5B]/20 blur-[120px] rounded-full animate-pulse" />
                  <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#F2E600]/10 blur-[120px] rounded-full animate-pulse delay-700" />
                </div>

                <div className="relative z-10 flex flex-col items-center gap-12 w-full max-w-4xl text-center">
                  <div className="space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#F2E600] flex items-center justify-center mx-auto shadow-2xl border-2 border-black/10">
                      <ShieldCheck className="w-7 h-7 text-black" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white leading-none">Verified Access<span className="text-[#F2E600]">.</span></h2>
                      <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#1F6F5B]">Identity Synchronization Complete</p>
                    </div>
                  </div>

                  <Card className="glass-panel w-full overflow-hidden rounded-[3rem] border-white/10 shadow-2xl bg-gradient-to-br from-card/90 to-transparent">
                    <CardContent className="p-10 space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-black/40 backdrop-blur-3xl p-8 rounded-3xl border border-white/5 space-y-1 text-left group hover:border-[#1F6F5B]/30 transition-all">
                          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] block mb-1">Authenticated Holder</span>
                          <span className="text-xl font-black text-white uppercase tracking-tight leading-tight block truncate">{formData.fullName || 'NOT FOUND'}</span>
                          <span className="text-[9px] font-mono text-[#1F6F5B] uppercase tracking-widest">{formData.email || 'NO EMAIL SYNCED'}</span>
                        </div>
                        <div className="bg-black/40 backdrop-blur-3xl p-8 rounded-3xl border border-white/5 space-y-2 text-left group hover:border-[#F2E600]/30 transition-all">
                          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] block mb-1">Encrypted KRA PIN</span>
                          <span className="text-2xl font-mono font-black text-[#F2E600] tracking-wider">{formData.pin || formData.idNumber}</span>
                        </div>
                        <div className="bg-black/40 backdrop-blur-3xl p-8 rounded-3xl border border-white/5 space-y-1 text-left group hover:border-[#1F6F5B]/30 transition-all md:col-span-2 lg:col-span-1">
                          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] block mb-1">Synchronization Area</span>
                          <div className="space-y-0.5">
                            <span className="text-base font-black text-white uppercase tracking-tight block">{formData.county || 'UNKNOWN COUNTY'}</span>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.1em]">{formData.town || formData.district || 'PENDING LOCATION'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row gap-4">
                        <Button 
                          onClick={handleDownload}
                          className="flex-[3] h-16 bg-gradient-to-br from-[#1F6F5B] to-[#145A47] text-white rounded-2xl shadow-xl transition-all hover:scale-[1.01] font-black text-xl uppercase tracking-widest border border-white/20 group relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                          Download Certificate
                          <Download className="ml-4 w-7 h-7 group-hover:translate-y-1 transition-transform duration-300" />
                        </Button>
                        <Button 
                          variant="ghost"
                          onClick={() => setIsVerified(false)}
                          className="flex-1 h-16 rounded-2xl border border-white/5 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-[#F2E600] hover:bg-white/5 transition-all"
                        >
                          Reset
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-12">
                <div className="flex justify-between items-center mb-12">
                  <div className="flex items-center gap-4">
                    <Badge className="bg-[#1F6F5B] text-white font-black px-4 py-1.5 rounded-full text-[10px] tracking-widest border-none">
                      AUTHENTICATED
                    </Badge>
                  </div>
                  <UserButton appearance={{
                    elements: {
                      avatarBox: "w-12 h-12 rounded-2xl border-2 border-[#1F6F5B]/30"
                    }
                  }} />
                </div>

          <AnimatePresence>
            {idSearchStatus !== "found" && (
              <motion.div 
                initial={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-12 space-y-8"
              >
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                  <div className="space-y-6">
                    <div className="flex flex-col gap-4">
                      <Badge className="bg-[#F2E600] text-black font-black px-4 py-1.5 rounded-full text-[9px] tracking-[0.3em] shadow-xl border-none w-fit">
                        KRA RETRIEVAL
                      </Badge>
                      <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-[0.9] text-gradient">
                        PIN Retrieval<span className="text-[#F2E600]">.</span>
                      </h1>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 p-6 bg-card/20 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 shadow-2xl">
                    <div className="w-12 h-12 rounded-2xl bg-[#1F6F5B]/20 flex items-center justify-center border border-[#1F6F5B]/30">
                      <ShieldCheck className="w-6 h-6 text-[#1F6F5B]" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Cyber-Vault Status</p>
                      <p className="text-sm font-black text-[#1F6F5B] uppercase tracking-tight">Active & Encrypted</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div key="step1" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8">
                <Card className="glass-panel overflow-hidden rounded-[4rem] border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] bg-gradient-to-br from-card/80 to-transparent">
                  <CardHeader className="p-10 pb-6 border-b border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-[#F2E600]/5 blur-3xl rounded-full -mr-24 -mt-24" />
                    <div className="flex items-center gap-4 mb-4 relative z-10">
                      <div className="w-12 h-12 rounded-2xl bg-[#F2E600] flex items-center justify-center shadow-xl">
                        <Fingerprint className="w-6 h-6 text-black" />
                      </div>
                      <div className="space-y-0.5">
                        <CardTitle className="text-2xl font-black uppercase tracking-tight">KRA PIN Retrieval</CardTitle>
                        <CardDescription className="text-base font-medium opacity-60">Securely retrieve your official KRA documentation.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-10 pt-6 space-y-8 relative z-10">
                    <AnimatePresence mode="wait">
                      {idSearchStatus === "found" ? (
                        <motion.div key="verified" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-12 flex flex-col items-center py-12">
                          <div className="w-40 h-40 rounded-full bg-[#F2E600] flex items-center justify-center shadow-[0_0_80px_rgba(242,230,0,0.3)]">
                            <CheckCircle className="w-20 h-20 text-black" strokeWidth={3} />
                          </div>
                          <div className="space-y-4 text-center">
                            <h3 className="text-4xl font-black text-foreground uppercase tracking-tight text-gradient">Record Synchronized</h3>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Encrypted Handshake Complete</p>
                          </div>
                          <Button className="w-full h-28 bg-gradient-to-br from-[#1F6F5B] to-[#145A47] text-white rounded-[2rem] shadow-[0_20px_40px_-10px_rgba(31,111,91,0.5)] transition-all hover:scale-[1.02] font-black text-3xl uppercase tracking-[0.1em] group relative overflow-hidden border border-white/10" onClick={handleDownload}>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            Download Certificate
                            <Download className="ml-6 w-10 h-10 group-hover:translate-y-1 transition-transform duration-300" />
                          </Button>
                        </motion.div>
                      ) : (
                        <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                          <div className="space-y-8">
                            <div className="space-y-3">
                              <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-2">Retrieval Protocol</Label>
                              <div className="grid grid-cols-2 gap-4">
                                <Button variant="outline" className={cn("h-14 rounded-2xl font-black transition-all border-white/5 bg-white/5", formData.idNumber && !formData.pin ? "border-[#F2E600] bg-[#F2E600]/10 text-[#F2E600]" : "hover:bg-white/10")} onClick={() => { handleInputChange('pin', ''); handleInputChange('idNumber', ' '); }}>Identity Token</Button>
                                <Button variant="outline" className={cn("h-14 rounded-2xl font-black transition-all border-white/5 bg-white/5", formData.pin ? "border-[#F2E600] bg-[#F2E600]/10 text-[#F2E600]" : "hover:bg-white/10")} onClick={() => { handleInputChange('idNumber', ''); handleInputChange('pin', ' '); }}>KRA PIN</Button>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-2">{formData.pin ? 'KRA Designation' : 'Registration Number'}</Label>
                              <Input value={formData.pin || formData.idNumber} onChange={(e) => handleInputChange(formData.pin ? 'pin' : 'idNumber', e.target.value.toUpperCase())} placeholder={formData.pin ? 'A00XXXXXXXXB' : '12345678'} className="h-16 rounded-2xl bg-black/40 border-white/10 focus:border-[#F2E600] focus:ring-[#F2E600]/10 px-6 text-xl font-black tracking-widest uppercase transition-all placeholder:opacity-20" />
                            </div>
                          </div>
                          {error && (
                            <Alert variant="destructive" className="bg-red-500/5 border-red-500/20 rounded-[2rem] p-8">
                              <AlertCircle className="h-8 w-8 text-red-500" />
                              <AlertTitle className="text-xs font-black uppercase text-red-500 mb-1">Protocol Failure</AlertTitle>
                              <AlertDescription className="text-sm font-medium opacity-60 leading-relaxed">{error}</AlertDescription>
                            </Alert>
                          )}
                          <div className="flex flex-col gap-6">
                            <Button className="w-full h-24 bg-gradient-to-br from-[#1F6F5B] to-[#145A47] text-white rounded-full shadow-[0_20px_40px_-10px_rgba(31,111,91,0.4)] transition-all font-black text-2xl uppercase tracking-[0.2em] group border border-white/10" onClick={handleIdSearch} disabled={idSearchStatus === "searching"}>
                              {idSearchStatus === "searching" ? (
                                <div className="flex items-center gap-4">
                                  <Loader2 className="w-8 h-8 animate-spin text-[#F2E600]" />
                                  <div className="flex flex-col items-start leading-none">
                                    <span className="text-sm font-black text-white">SYNCHRONIZING...</span>
                                    <span className="text-[8px] font-bold text-[#F2E600]/60 tracking-[0.2em]">DECRYPTING KRA VAULT TOKEN</span>
                                  </div>
                                </div>
                              ) : <>Initialize Verify <Search className="ml-4 w-8 h-8 group-hover:scale-110 transition-transform" /></>}
                            </Button>
                            <Button variant="ghost" className="w-full h-16 rounded-full text-muted-foreground hover:text-[#F2E600] font-black text-[10px] uppercase tracking-[0.3em]" onClick={() => setCurrentStep(2)}>Manual Data Entry Override</Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div key="step2" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8">
                <Card className="glass-panel overflow-hidden rounded-[4rem] border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] bg-gradient-to-br from-card/80 to-transparent">
                  <CardHeader className="p-10 pb-6 border-b border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-[#F2E600]/5 blur-3xl rounded-full -mr-24 -mt-24" />
                    <div className="flex items-center gap-4 mb-4 relative z-10">
                      <div className="w-12 h-12 rounded-2xl bg-[#F2E600] flex items-center justify-center shadow-xl">
                        <User className="w-6 h-6 text-black" />
                      </div>
                      <div className="space-y-0.5">
                        <CardTitle className="text-2xl font-black uppercase tracking-tight">Personal Details</CardTitle>
                        <CardDescription className="text-base font-medium opacity-60">Verify or enter your legal personal information.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-10 pt-6 space-y-8 relative z-10">
                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-3">
                        <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-2">Full Legal Name</Label>
                        <Input value={formData.fullName} onChange={(e) => handleInputChange('fullName', e.target.value.toUpperCase())} placeholder="ENTER YOUR FULL NAME" className="h-14 rounded-2xl bg-black/40 border-white/10 focus:border-[#F2E600] px-6 text-lg font-black tracking-tight transition-all placeholder:opacity-20" />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-2">Email Address</Label>
                        <Input value={formData.email} onChange={(e) => handleInputChange('email', e.target.value.toLowerCase())} placeholder="taxpayer@example.com" className="h-14 rounded-2xl bg-black/40 border-white/10 focus:border-[#F2E600] px-6 text-lg font-black tracking-tight transition-all placeholder:opacity-20" />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <Button variant="ghost" className="h-14 flex-1 rounded-full text-muted-foreground hover:text-[#F2E600] font-black text-[10px] uppercase tracking-[0.3em]" onClick={() => setCurrentStep(1)}>Back</Button>
                      <Button className="h-14 flex-[2] bg-gradient-to-br from-[#1F6F5B] to-[#145A47] text-white rounded-full shadow-xl transition-all font-black text-lg uppercase tracking-widest group border border-white/10" onClick={() => setCurrentStep(3)}>Next Step <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" /></Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div key="step3" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8">
                <Card className="glass-panel overflow-hidden rounded-[4rem] border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] bg-gradient-to-br from-card/80 to-transparent">
                  <CardHeader className="p-10 pb-6 border-b border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-[#F2E600]/5 blur-3xl rounded-full -mr-24 -mt-24" />
                    <div className="flex items-center gap-4 mb-4 relative z-10">
                      <div className="w-12 h-12 rounded-2xl bg-[#F2E600] flex items-center justify-center shadow-xl">
                        <MapPin className="w-6 h-6 text-black" />
                      </div>
                      <div className="space-y-1">
                        <CardTitle className="text-2xl font-black uppercase tracking-tight">Contact Address</CardTitle>
                        <CardDescription className="text-base font-medium opacity-60">Specify your official residency and tax station.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-10 pt-6 space-y-8 relative z-10">

                    {/* Show prompt when KRA did not return address data */}
                    {!formData.county && (
                      <div className="flex items-start gap-4 bg-[#F2E600]/10 border border-[#F2E600]/30 rounded-3xl p-6">
                        <div className="w-8 h-8 rounded-full bg-[#F2E600] flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-black font-black text-sm">!</span>
                        </div>
                        <div>
                          <p className="font-black text-sm uppercase tracking-wider text-[#F2E600]">Manual Entry Required</p>
                          <p className="text-xs font-medium opacity-60 mt-1">KRA did not return address data for this PIN. Please select your county and fill in the address fields below before generating the certificate.</p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-3"><Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] ml-4">County</Label><Select value={formData.county} onValueChange={(v) => { handleInputChange('county', v); handleInputChange('district', '') }}><SelectTrigger className="h-14 rounded-2xl bg-black/40 border-white/10 text-base font-bold px-6 focus:border-[#F2E600]"><SelectValue placeholder="SELECT COUNTY" /></SelectTrigger><SelectContent className="glass-panel border-white/10 rounded-2xl max-h-80">{COUNTIES.map(c => (<SelectItem key={c} value={c} className="font-bold py-3 uppercase hover:bg-[#F2E600]/10 transition-colors">{c}</SelectItem>))}</SelectContent></Select></div>
                      <div className="space-y-3"><Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] ml-4">Sub-County / District</Label><Select value={formData.district || ""} onValueChange={(v) => handleInputChange('district', v)}><SelectTrigger className="h-14 rounded-2xl bg-black/40 border-white/10 text-base font-bold px-6 focus:border-[#F2E600]"><SelectValue placeholder="SELECT DISTRICT" /></SelectTrigger><SelectContent className="glass-panel border-white/10 rounded-2xl max-h-80">{formData.county && GET_SUB_COUNTIES(formData.county).map(sc => (<SelectItem key={sc} value={sc} className="font-bold py-3 uppercase hover:bg-[#F2E600]/10 transition-colors">{sc}</SelectItem>))}</SelectContent></Select></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                      <div className="space-y-3"><Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] ml-4">Tax Area</Label><Select value={formData.taxArea || ""} onValueChange={(v) => handleInputChange('taxArea', v)}><SelectTrigger className="h-14 rounded-2xl bg-black/40 border-white/10 text-base font-bold px-6 focus:border-[#F2E600]"><SelectValue placeholder="AREA" /></SelectTrigger><SelectContent className="glass-panel border-white/10 rounded-2xl max-h-80">{formData.county && GET_LOCALITIES(formData.county, formData.district || "").map(l => (<SelectItem key={l} value={l} className="font-bold py-3 uppercase hover:bg-[#F2E600]/10 transition-colors">{l}</SelectItem>))}</SelectContent></Select></div>
                      <div className="space-y-3"><Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] ml-4">Reporting Station</Label><Select value={formData.station || ""} onValueChange={(v) => handleInputChange('station', v)}><SelectTrigger className="h-14 rounded-2xl bg-black/40 border-white/10 text-base font-bold px-6 focus:border-[#F2E600]"><SelectValue placeholder="STATION" /></SelectTrigger><SelectContent className="glass-panel border-white/10 rounded-2xl max-h-80">{formData.county && GET_STATIONS(formData.county).map(s => (<SelectItem key={s} value={s} className="font-bold py-3 uppercase hover:bg-[#F2E600]/10 transition-colors">{s}</SelectItem>))}</SelectContent></Select></div>
                      <div className="space-y-3"><Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] ml-4">Postal Code</Label><Select value={formData.postalCode} onValueChange={(v) => { const found = GET_POSTAL_CODES(formData.county).find(p => p.code === v); handleInputChange('postalCode', v); if (found) handleInputChange('town', found.town) }}><SelectTrigger className="h-14 rounded-2xl bg-black/40 border-white/10 text-base font-bold px-6 focus:border-[#F2E600]"><SelectValue placeholder="CODE" /></SelectTrigger><SelectContent className="glass-panel border-white/10 rounded-2xl max-h-80">{formData.county && GET_POSTAL_CODES(formData.county).map(p => (<SelectItem key={p.code} value={p.code} className="font-bold py-3">{p.code}</SelectItem>))}</SelectContent></Select></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-3"><Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] ml-4">Town / City</Label><Input value={formData.town} onChange={(e) => handleInputChange('town', e.target.value.toUpperCase())} placeholder="e.g. NAIROBI" className="h-14 rounded-2xl bg-black/40 border-white/10 focus:border-[#F2E600] px-6 font-bold text-base" /></div>
                      <div className="space-y-3"><Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] ml-4">Mobile Number</Label><Input value={formData.phoneNumber} onChange={(e) => handleInputChange('phoneNumber', e.target.value)} placeholder="07XXXXXXXX" className="h-14 rounded-2xl bg-black/40 border-white/10 focus:border-[#F2E600] px-6 font-bold text-base" /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                      <div className="space-y-3"><Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] ml-4">Building</Label><Input value={formData.building} onChange={(e) => handleInputChange('building', e.target.value.toUpperCase())} placeholder="e.g. TIMES TOWER" className="h-14 rounded-2xl bg-black/40 border-white/10 focus:border-[#F2E600] px-6 font-bold text-base" /></div>
                      <div className="space-y-3"><Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] ml-4">Street</Label><Input value={formData.street} onChange={(e) => handleInputChange('street', e.target.value.toUpperCase())} placeholder="e.g. HAILE SELASSIE" className="h-14 rounded-2xl bg-black/40 border-white/10 focus:border-[#F2E600] px-6 font-bold text-base" /></div>
                      <div className="space-y-3"><Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] ml-4">P. O. Box</Label><Input value={formData.poBox} onChange={(e) => handleInputChange('poBox', e.target.value)} placeholder="e.g. 12345" className="h-14 rounded-2xl bg-black/40 border-white/10 focus:border-[#F2E600] px-6 font-bold text-base" /></div>
                    </div>
                    <div className="flex gap-4">
                      <Button variant="ghost" className="h-14 flex-1 rounded-full text-muted-foreground hover:text-[#F2E600] font-black text-[10px] uppercase tracking-[0.3em]" onClick={() => setCurrentStep(2)}>Back</Button>
                      <Button className="h-14 flex-[2] bg-gradient-to-br from-[#1F6F5B] to-[#145A47] text-white rounded-full shadow-xl transition-all font-black text-lg uppercase tracking-widest group border border-white/10" onClick={() => setCurrentStep(4)}>Final Review <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" /></Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div key="step4" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8">
                <Card className="glass-panel overflow-hidden rounded-[4rem] border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] bg-gradient-to-br from-card/80 to-transparent">
                  <CardHeader className="p-10 pb-6 border-b border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-[#F2E600]/5 blur-3xl rounded-full -mr-24 -mt-24" />
                    <div className="flex items-center gap-4 mb-4 relative z-10">
                      <div className="w-12 h-12 rounded-2xl bg-[#F2E600] flex items-center justify-center shadow-xl">
                        <ShieldCheck className="w-6 h-6 text-black" />
                      </div>
                      <div className="space-y-0.5">
                        <CardTitle className="text-2xl font-black uppercase tracking-tight">Vault Summary</CardTitle>
                        <CardDescription className="text-base font-medium opacity-60">Confirm details before generating certificate.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-10 pt-6 space-y-8 relative z-10">
                    <div className="bg-black/40 backdrop-blur-3xl p-6 rounded-3xl border border-white/5 space-y-4 shadow-inner">
                      <div className="flex items-center justify-between border-b border-white/5 pb-4"><span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em]">Official KRA PIN</span><span className="text-lg font-mono font-black text-[#F2E600] tracking-widest">{formData.pin || 'NOT SPECIFIED'}</span></div>
                      <div className="flex items-center justify-between border-b border-white/5 pb-4"><span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em]">Legal Name</span><span className="text-base font-black text-foreground uppercase text-right leading-tight max-w-[60%]">{formData.fullName}</span></div>
                      <div className="flex items-center justify-between"><span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em]">Registered Address</span><span className="text-[10px] font-bold text-muted-foreground text-right uppercase tracking-wider">{formData.town}, {formData.county}</span></div>
                    </div>
                    <div className="flex flex-col gap-4">
                      <Button className="w-full h-14 bg-gradient-to-br from-[#1F6F5B] to-[#145A47] text-white rounded-full shadow-xl transition-all font-black text-lg uppercase tracking-widest group border border-white/10 overflow-hidden relative" onClick={handleDownload}><div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />Finalize Retrieval <Download className="ml-3 w-6 h-6 group-hover:translate-y-1 transition-transform duration-300" /></Button>
                      <Button variant="ghost" className="h-14 rounded-full text-muted-foreground hover:text-[#F2E600] font-black text-[10px] uppercase tracking-[0.3em]" onClick={() => setCurrentStep(1)}>Reset Synchronization</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  </Show>
</div>
    </PageBackground>
  )
}
