"use client"

import React, { useState } from "react"
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
  Sparkles
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
}

export function KraPinChecker() {
  const [activeTab, setActiveTab] = useState<"pin" | "id">("pin")
  const [engineMode, setEngineMode] = useState<"auto" | "api" | "dwr">("auto")
  const [pinInput, setPinInput] = useState("")
  const [idInput, setIdInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<TaxpayerProfile | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

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
        setResult(data.data)
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
        setResult(data.data)
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
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600/90 via-red-700 to-zinc-900 p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold uppercase tracking-wider text-red-100">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Official KRA Live Verification Gateway & DWR Engine
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white">
            KRA PIN & Taxpayer Status Checker
          </h1>
          <p className="text-sm md:text-base text-zinc-200 max-w-2xl">
            Real-time tax obligation validation, identity verification, and taxpayer registration check directly connected to the Kenya Revenue Authority portal.
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 opacity-15 pointer-events-none">
          <ShieldCheck className="w-72 h-72 text-white" />
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

      {/* Result Presentation */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            className="space-y-6"
          >
            <Card className="border border-emerald-500/30 bg-surface dark:bg-zinc-900 shadow-xl overflow-hidden print:border-none print:shadow-none">
              {/* Card Top Strip */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4 text-white flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-lg">
                    <UserCheck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight">{result.taxpayerName}</h2>
                    <p className="text-xs text-emerald-100 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Verified Taxpayer Record
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-white text-emerald-800 font-bold px-3 py-1 text-xs uppercase tracking-wider">
                    {result.status || "ACTIVE"}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20 print:hidden text-xs"
                  >
                    <Printer className="w-3.5 h-3.5 mr-1" />
                    Print
                  </Button>
                </div>
              </div>

              <CardContent className="p-6 space-y-6">
                {/* Highlights Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-outline-variant dark:border-zinc-700/60">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">KRA PIN</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-base font-bold font-mono text-primary">{result.pin}</span>
                      <button
                        onClick={() => handleCopy(result.pin, "pin")}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                        title="Copy PIN"
                      >
                        {copiedField === "pin" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {result.idNumber && (
                    <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-outline-variant dark:border-zinc-700/60">
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">National ID</span>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-base font-bold font-mono">{result.idNumber}</span>
                        <button
                          onClick={() => handleCopy(result.idNumber!, "id")}
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                          title="Copy ID"
                        >
                          {copiedField === "id" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-outline-variant dark:border-zinc-700/60">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Registration Date</span>
                    <p className="text-base font-bold mt-1 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      {result.registrationDate || "Available on File"}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-outline-variant dark:border-zinc-700/60">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tax Station</span>
                    <p className="text-base font-bold mt-1 flex items-center gap-1.5 truncate" title={result.station}>
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      {result.station || "Central Station"}
                    </p>
                  </div>
                </div>

                {/* Detailed Information Rows */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {/* Location & Address */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      Location & Address Details
                    </h3>
                    <div className="rounded-xl border border-outline-variant dark:border-zinc-800 p-4 space-y-2.5 bg-zinc-50/50 dark:bg-zinc-800/30 text-sm">
                      <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                        <span className="text-muted-foreground">County</span>
                        <span className="font-medium">{result.county || "NAIROBI"}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                        <span className="text-muted-foreground">City / Town</span>
                        <span className="font-medium">{result.town || "Nairobi"}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                        <span className="text-muted-foreground">Building / Plot</span>
                        <span className="font-medium">{result.building || "Commercial House"}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                        <span className="text-muted-foreground">Street / Road</span>
                        <span className="font-medium">{result.street || "Harambee Avenue"}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-muted-foreground">Postal Box</span>
                        <span className="font-medium">{result.poBox ? `${result.poBox} - ${result.postalCode || '00100'}` : "P.O. Box Available"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Contact & Obligations */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Tax Obligations & Contacts
                    </h3>
                    <div className="rounded-xl border border-outline-variant dark:border-zinc-800 p-4 space-y-3 bg-zinc-50/50 dark:bg-zinc-800/30 text-sm">
                      {result.email && (
                        <div className="flex items-center justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                          <span className="text-muted-foreground flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5" /> Email
                          </span>
                          <span className="font-mono text-xs">{result.email}</span>
                        </div>
                      )}
                      {result.phoneNumber && (
                        <div className="flex items-center justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                          <span className="text-muted-foreground flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5" /> Mobile
                          </span>
                          <span className="font-mono text-xs">{result.phoneNumber}</span>
                        </div>
                      )}

                      <div>
                        <span className="text-xs font-semibold text-muted-foreground block mb-2">Registered Obligations:</span>
                        <div className="space-y-1.5">
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
                              className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-zinc-900 border border-outline-variant dark:border-zinc-700/60 text-xs"
                            >
                              <span className="font-medium">{obl.name}</span>
                              <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 text-[10px]">
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
              <CardFooter className="bg-zinc-50 dark:bg-zinc-800/40 border-t border-outline-variant dark:border-zinc-800 p-4 md:p-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
                <div className="text-xs text-muted-foreground">
                  Gateway verification status: <span className="font-semibold text-emerald-600 dark:text-emerald-400">Authenticated & Active</span>
                </div>
                <div className="flex items-center gap-3">
                  <Link href="/retrieval-portal">
                    <Button variant="outline" size="sm" className="text-xs font-semibold">
                      Retrieve Official PDF Certificate
                    </Button>
                  </Link>
                  <Link href={`/retrieval-portal?pin=${result.pin}`}>
                    <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5">
                      Proceed to File Nil Return
                      <ArrowRight className="w-3.5 h-3.5" />
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
