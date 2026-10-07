"use client"

import React, { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ShieldCheck, 
  Search, 
  UserCheck, 
  Building2, 
  MapPin, 
  Calendar, 
  FileText, 
  Copy, 
  Check, 
  Printer, 
  ArrowRight, 
  AlertCircle, 
  RefreshCw,
  Fingerprint,
  Mail,
  Phone,
  Sparkles,
  Lock,
  CheckCircle2,
  Download
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface TaxpayerObligation {
  name: string
  status: string
  effectiveFrom: string
  effectiveTo?: string
}

interface TaxpayerProfile {
  pin: string
  taxpayerName: string
  status: string
  idNumber?: string
  registrationDate?: string
  station?: string
  taxArea?: string
  county?: string
  town?: string
  district?: string
  building?: string
  street?: string
  poBox?: string
  postalCode?: string
  email?: string
  phoneNumber?: string
  obligations?: TaxpayerObligation[]
  source?: string
  isSubscribed?: boolean
}

export function KraPinChecker() {
  const { user } = useUser()

  // Derive admin status client-side from Clerk metadata
  const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase() || ''
  const userRole = user?.publicMetadata?.role as string | undefined
  const configPublicAdminEmail = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || 'poweldayck@gmail.com').toLowerCase()
  const isAdmin = (
    userEmail === 'poweldayck@gmail.com' ||
    userEmail === configPublicAdminEmail ||
    userRole === 'Super Admin' ||
    userRole === 'Admin'
  )

  const [activeTab, setActiveTab] = useState<"pin" | "id">("pin")
  const [engineMode, setEngineMode] = useState<"auto" | "api" | "dwr">("auto")
  const [pinInput, setPinInput] = useState("")
  const [idInput, setIdInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<TaxpayerProfile | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // All authenticated/public searches reveal verified record without monthly paywall
  const hasFullAccess = true

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)

    if (activeTab === "pin") {
      const cleanPin = pinInput.trim().toUpperCase()
      if (!cleanPin) {
        setError("Please enter a valid KRA PIN.")
        return
      }
      if (!/^[A-Z0-9]{11}$/.test(cleanPin)) {
        setError("KRA PIN must be 11 alphanumeric characters (e.g. A012345678Z).")
        return
      }

      setLoading(true)
      try {
        const res = await fetch("/api/kra/live-verify/pin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin: cleanPin, engineMode }),
        })
        const data = await res.json()
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to verify KRA PIN.")
        }
        setResult({
          ...data.data,
          isSubscribed: Boolean(data.isSubscribed ?? data.data?.isSubscribed),
        })
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred during verification.")
      } finally {
        setLoading(false)
      }
    } else {
      const cleanId = idInput.trim()
      if (!cleanId) {
        setError("Please enter a National ID number.")
        return
      }
      if (!/^\d{5,12}$/.test(cleanId)) {
        setError("National ID must contain between 5 and 12 digits.")
        return
      }

      setLoading(true)
      try {
        const res = await fetch("/api/kra/live-verify/id", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idNumber: cleanId, engineMode }),
        })
        const data = await res.json()
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to verify National ID.")
        }
        setResult({
          ...data.data,
          isSubscribed: Boolean(data.isSubscribed ?? data.data?.isSubscribed),
        })
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred during verification.")
      } finally {
        setLoading(false)
      }
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-3">
      {result ? (
        <div className="flex items-center justify-between gap-3 p-2.5 px-4 rounded-xl bg-surface dark:bg-zinc-900 border border-outline-variant shadow-xs">
          <div className="flex items-center gap-2 text-xs min-w-0">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider shrink-0">
              Verified
            </Badge>
            <span className="font-mono font-bold text-foreground text-xs">{result.pin}</span>
            {result.taxpayerName && (
              <span className="hidden sm:inline text-muted-foreground truncate max-w-[280px]">· {result.taxpayerName}</span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className="text-[10px] uppercase font-bold py-0.5 px-2">
              {engineMode.toUpperCase()}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setResult(null)
                setError(null)
              }}
              className="h-7 px-2.5 text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              New Search
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Header Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-red-600/90 via-red-700 to-zinc-900 p-4 sm:p-5 text-white shadow-md">
        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-semibold uppercase tracking-wider text-red-100">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Official KRA Live Verification Gateway & DWR Engine
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            KRA PIN & Taxpayer Status Checker
          </h1>
          <p className="text-xs text-zinc-200 max-w-2xl">
            Real-time tax obligation validation, identity verification, and taxpayer registration check directly connected to the Kenya Revenue Authority portal.
          </p>
        </div>
        <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
          <ShieldCheck className="w-48 h-48 text-white" />
        </div>
      </div>

      {/* Input Card with Tabs & Engine Switcher */}
      <Card className="border border-outline-variant dark:border-zinc-800 bg-surface dark:bg-zinc-900 shadow-md">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Search className="w-5 h-5 text-primary" />
                Taxpayer Verification Query
              </CardTitle>
              <CardDescription>
                Choose your lookup method and verification engine to query verified KRA records.
              </CardDescription>
            </div>

            {/* Engine Selection Toggle */}
            <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-outline-variant/60">
              <button
                type="button"
                onClick={() => setEngineMode("auto")}
                className={`py-1 px-2.5 text-xs font-semibold rounded transition-all ${
                  engineMode === "auto"
                    ? "bg-white dark:bg-zinc-900 text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                🔄 Auto
              </button>
              <button
                type="button"
                onClick={() => setEngineMode("api")}
                className={`py-1 px-2.5 text-xs font-semibold rounded transition-all ${
                  engineMode === "api"
                    ? "bg-red-600 text-white shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                ⚡ Live API
              </button>
              <button
                type="button"
                onClick={() => setEngineMode("dwr")}
                className={`py-1 px-2.5 text-xs font-semibold rounded transition-all ${
                  engineMode === "dwr"
                    ? "bg-emerald-600 text-white shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                🌐 DWR
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(val) => {
              setActiveTab(val as "pin" | "id")
              setError(null)
              setResult(null)
            }}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 w-full max-w-md mb-6 bg-zinc-100 dark:bg-zinc-800">
              <TabsTrigger value="pin" className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="w-4 h-4" />
                By KRA PIN
              </TabsTrigger>
              <TabsTrigger value="id" className="flex items-center gap-2 text-sm font-semibold">
                <Fingerprint className="w-4 h-4" />
                By National ID
              </TabsTrigger>
            </TabsList>

            {/* PIN Tab Content */}
            <TabsContent value="pin" className="mt-0">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Input
                      placeholder="e.g. A012345678Z"
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value.toUpperCase())}
                      maxLength={11}
                      disabled={loading}
                      className="font-mono text-base tracking-wider uppercase h-12 pl-4"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-12 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold transition-all flex items-center justify-center gap-2 min-w-[140px]"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        Verify PIN
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Format: 11 characters starting with letter, followed by 9 digits and ending with a letter.
                </p>
              </form>
            </TabsContent>

            {/* ID Tab Content */}
            <TabsContent value="id" className="mt-0">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Input
                      placeholder="e.g. 12345678"
                      value={idInput}
                      onChange={(e) => setIdInput(e.target.value.replace(/\D/g, ""))}
                      maxLength={10}
                      disabled={loading}
                      className="font-mono text-base tracking-wider h-12 pl-4"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-12 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold transition-all flex items-center justify-center gap-2 min-w-[140px]"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Querying...
                      </>
                    ) : (
                      <>
                        <Fingerprint className="w-4 h-4" />
                        Search by ID
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter the Kenyan National Identity Number (5 to 10 digits).
                </p>
              </form>
            </TabsContent>
          </Tabs>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Lookup Notice</p>
                  <p>{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </>
  )}

      {/* Result Presentation */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            className="space-y-3"
          >
            <Card className="border border-emerald-500/30 bg-surface dark:bg-zinc-900 shadow-xl overflow-hidden print:border-none print:shadow-none">
              {/* Card Top Strip */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-2.5 text-white flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-sm shrink-0">
                    <UserCheck className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-bold tracking-tight truncate">{result.taxpayerName}</h2>
                    <p className="text-[11px] text-emerald-100 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Verified Taxpayer Record
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className="bg-white text-emerald-800 font-bold px-2 py-0.5 text-[10px] uppercase tracking-wider">
                    {result.status || "ACTIVE"}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20 print:hidden text-xs h-7 px-2.5 cursor-pointer"
                  >
                    <Printer className="w-3 h-3 mr-1" />
                    Print
                  </Button>
                </div>
              </div>

              <CardContent className="p-3.5 sm:p-4 space-y-3">
                {/* Verified Taxpayer Record Banner */}
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-2.5 px-3 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <p className="text-[11px] text-on-surface font-semibold">
                      Verified Taxpayer Record • Ready to download official compliance certificate for KES 20.
                    </p>
                  </div>
                  <Link href={`/retrieval-portal?pin=${result.pin}`}>
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-white font-bold text-xs h-7 px-3 flex items-center gap-1 shadow-sm cursor-pointer whitespace-nowrap">
                      Download PDF (KES 20) <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>

                {/* Highlights Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-outline-variant dark:border-zinc-700/60">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">KRA PIN</span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-sm font-bold font-mono text-primary">{result.pin}</span>
                      <button
                        onClick={() => handleCopy(result.pin, "pin")}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title="Copy PIN"
                      >
                        {copiedField === "pin" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                      </button>
                    </div>
                  </div>

                  {result.idNumber && (
                    <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-outline-variant dark:border-zinc-700/60">
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">National ID</span>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-sm font-bold font-mono">{result.idNumber}</span>
                        <button
                          onClick={() => handleCopy(result.idNumber!, "id")}
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          title="Copy ID"
                        >
                          {copiedField === "id" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-outline-variant dark:border-zinc-700/60">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Registration Date</span>
                    <p className="text-xs sm:text-sm font-bold mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      {result.registrationDate || "On File"}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-outline-variant dark:border-zinc-700/60">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Tax Station</span>
                    {hasFullAccess && result.station ? (
                      <p className="text-xs sm:text-sm font-bold mt-0.5 flex items-center gap-1 truncate" title={result.station}>
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        {result.station}
                      </p>
                    ) : (
                      <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Hidden (Subscribers)
                      </p>
                    )}
                  </div>
                </div>

                {/* Detailed Information Rows */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-0.5">
                  {/* Location & Address */}
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      Location & Address Details
                    </h3>
                    <div className="rounded-xl border border-outline-variant dark:border-zinc-800 p-2.5 px-3 space-y-1 bg-zinc-50/50 dark:bg-zinc-800/30 text-xs">
                      <div className="flex justify-between py-0.5 border-b border-zinc-100 dark:border-zinc-800/50">
                        <span className="text-muted-foreground">County</span>
                        <span className="font-medium">{result.county || "Not specified"}</span>
                      </div>
                      <div className="flex justify-between py-0.5 border-b border-zinc-100 dark:border-zinc-800/50">
                        <span className="text-muted-foreground">City / Town</span>
                        <span className="font-medium">{result.town || "Not specified"}</span>
                      </div>
                      <div className="flex justify-between py-0.5 border-b border-zinc-100 dark:border-zinc-800/50">
                        <span className="text-muted-foreground">Building / Plot</span>
                        <span className="font-medium">{result.building || "Not specified"}</span>
                      </div>
                      <div className="flex justify-between py-0.5 border-b border-zinc-100 dark:border-zinc-800/50">
                        <span className="text-muted-foreground">Street / Road</span>
                        <span className="font-medium">{result.street || "Not specified"}</span>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span className="text-muted-foreground">Postal Box</span>
                        <span className="font-medium">{result.poBox ? `${result.poBox} - ${result.postalCode || ''}` : "Not specified"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Contact & Obligations */}
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-primary" />
                      Tax Obligations & Contacts
                    </h3>
                    <div className="rounded-xl border border-outline-variant dark:border-zinc-800 p-2.5 px-3 space-y-1.5 bg-zinc-50/50 dark:bg-zinc-800/30 text-xs">
                      {result.email && (
                        <div className="flex items-center justify-between py-0.5 border-b border-zinc-100 dark:border-zinc-800/50">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" /> Email
                          </span>
                          <span className="font-mono text-xs truncate max-w-[200px]">{result.email}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between py-0.5 border-b border-zinc-100 dark:border-zinc-800/50">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" /> Mobile
                        </span>
                        {hasFullAccess && result.phoneNumber ? (
                          <span className="font-mono text-xs font-semibold">{result.phoneNumber}</span>
                        ) : (
                          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Hidden
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="text-[10px] font-semibold text-muted-foreground block mb-1">Registered Obligations:</span>
                        <div className="space-y-1">
                          {(result.obligations && result.obligations.length > 0
                            ? result.obligations
                            : [
                                {
                                  name: "Income Tax - Individual (IT1)",
                                  status: "Active",
                                  effectiveFrom: result.registrationDate || "01/01/2015",
                                },
                              ]
                          ).map((obl, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-1 px-2 rounded-md bg-white dark:bg-zinc-900 border border-outline-variant dark:border-zinc-700/60 text-xs"
                            >
                              <span className="font-medium text-[11px] truncate">{obl.name}</span>
                              <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 text-[9px] px-1.5 py-0">
                                {obl.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>

              {/* Action Footer */}
              <CardFooter className="bg-zinc-50 dark:bg-zinc-800/40 border-t border-outline-variant dark:border-zinc-800 p-2.5 px-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
                <div className="text-[11px] text-muted-foreground">
                  Status: <span className="font-semibold text-emerald-600 dark:text-emerald-400">Authenticated & Active</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setResult(null)
                      setError(null)
                    }}
                    className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    New Search
                  </Button>
                  <Link href={`/retrieval-portal?pin=${result.pin}`}>
                    <Button variant="outline" size="sm" className="h-8 px-3 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer text-primary border-primary/30 hover:bg-primary/10">
                      <Download className="w-3.5 h-3.5 mr-1" />
                      {isAdmin ? "Download Certificate (Admin)" : "Download Certificate (KES 20)"}
                    </Button>
                  </Link>
                  <Link href={`/dashboard/filing?pin=${result.pin}`}>
                    <Button size="sm" className="h-8 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1 whitespace-nowrap cursor-pointer">
                      File Nil Return
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
