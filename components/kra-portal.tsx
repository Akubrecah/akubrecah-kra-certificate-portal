"use client"

import { useState, useEffect } from "react"
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
  MapPinIcon,
  CreditCard,
  Smartphone,
  Lock,
  Sparkles,
  Check,
  CheckCircle2,
  X,
  FileText,
  ExternalLink
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
  const { isLoaded: authLoaded, isSignedIn, user } = useUser()

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

  // Payment gate state
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [accessInfo, setAccessInfo] = useState<{ access: string; feeKes: number; subscription: any } | null>(null)
  const [paymentPhone, setPaymentPhone] = useState("")
  const [paymentStep, setPaymentStep] = useState<"confirm" | "waiting" | "done" | "error">("confirm")
  const [paymentCheckoutId, setPaymentCheckoutId] = useState<string | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [verifiedDownloadId, setVerifiedDownloadId] = useState<string | null>(null)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [verifiedReceipt, setVerifiedReceipt] = useState<string | null>(null)

  // Subscription & Paystack state
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"paystack" | "mpesa">("paystack")
  const [selectedTier, setSelectedTier] = useState<"download" | "subscription">("download")
  const [paystackAuthUrl, setPaystackAuthUrl] = useState<string | null>(null)
  const [isInitializingPaystack, setIsInitializingPaystack] = useState(false)

  useEffect(() => {
    loadCaptcha()

    // Restore formData and active state from sessionStorage if returning from Paystack or refresh
    if (typeof window !== "undefined") {
      try {
        const savedForm = sessionStorage.getItem("kra_active_form_data")
        if (savedForm) {
          const parsed = JSON.parse(savedForm)
          if (parsed && (parsed.pin || parsed.fullName || parsed.idNumber)) {
            setFormData(prev => ({ ...prev, ...parsed }))
            setIsVerified(true)
            setIdSearchStatus("found")
            setCurrentStep(4)
          }
        }
      } catch (e) {
        console.warn("Failed to restore saved form state:", e)
      }

      const urlParams = new URLSearchParams(window.location.search)
      const paystackRef = urlParams.get("paystack_ref") || urlParams.get("reference")
      const payType = urlParams.get("type")

      if (paystackRef) {
        handleVerifyPaystackReference(paystackRef, payType)
      }
    }
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("kra_active_form_data", JSON.stringify(updated))
        } catch {}
      }
      return updated
    })
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

    if (captchaStatus === "ready" && !captchaAnswer.trim()) {
      setError("Please enter the answer to the security verification question.")
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
        setIsSubscribed(Boolean(result.isSubscribed))
        setFormData(prev => {
          const updatedData = {
          ...prev,
          fullName: result.data?.name || prev.fullName || '',
          pin: result.data?.pin || prev.pin,
          email: result.data?.email || prev.email || '',
          building: result.data?.building || '',
          street: result.data?.street || '',
          town: result.data?.town || '',
          county: result.data?.county || '',
          district: result.data?.district || '',
          taxArea: result.data?.taxArea || '',
          station: result.data?.station || '',
          poBox: result.data?.poBox || '',
          postalCode: result.data?.postalCode || '',
          phoneNumber: result.data?.phoneNumber || '',
          registeredDate: result.data?.registeredDate || prev.registeredDate || '',
        }
        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem("kra_active_form_data", JSON.stringify(updatedData))
          } catch {}
        }
        return updatedData
      })
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

  // Verifies a Paystack transaction upon redirect or completion
  const handleVerifyPaystackReference = async (reference: string, type?: string | null) => {
    const loadingToast = toast.loading("Verifying your payment with Paystack...")
    try {
      const res = await fetch('/api/paystack/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference }),
      })
      const data = await res.json()
      if (data.success && data.verified) {
        toast.dismiss(loadingToast)
        setVerifiedReceipt(reference)
        window.history.replaceState({}, document.title, window.location.pathname)

        if (data.type === 'subscription') {
          setIsSubscribed(true)
          toast.success("🎉 Monthly Subscription Activated! Full taxpayer details unlocked.", { duration: 6000 })
          // Re-retrieve to reveal full unmasked profile
          if (formData.idNumber || formData.pin) {
            handleIdSearch()
          }
          setShowPaymentModal(false)
        } else {
          toast.success("Payment verified! Certificate ready for download.", { duration: 4000 })
          if (data.downloadId) {
            setVerifiedDownloadId(data.downloadId)
            setPaymentStep("done")
            setShowPaymentModal(true)
            await executeDownload(data.downloadId)
          }
        }
      } else {
        toast.error(data.error || "Payment verification incomplete. Please contact support if debited.", { id: loadingToast })
      }
    } catch (err: any) {
      toast.error(err.message || "Error verifying Paystack payment", { id: loadingToast })
    }
  }

  // Initiates Paystack checkout for either monthly subscription or single download
  const handlePaystackPayment = async (type: 'subscription' | 'pay_per_download') => {
    if (type === 'subscription' && authLoaded && !isSignedIn) {
      toast.error("Please sign in to start a monthly subscription.", { icon: "🔒" })
      return
    }

    // Persist current active form data to survive redirects
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("kra_active_form_data", JSON.stringify(formData))
      } catch {}
    }

    setIsInitializingPaystack(true)
    setPaymentError(null)
    setPaymentStep("waiting")

    try {
      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          pin: formData.pin,
          callbackUrl: window.location.origin + window.location.pathname,
        }),
      })

      const data = await res.json()
      if (!data.success || !data.authorizationUrl) {
        throw new Error(data.error || "Failed to initialize Paystack checkout")
      }

      setPaystackAuthUrl(data.authorizationUrl)

      // Poll verification in background while user interacts with checkout
      const pollRef = data.reference
      let pollAttempts = 0
      const pollInterval = setInterval(async () => {
        pollAttempts++
        try {
          const vRes = await fetch('/api/paystack/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reference: pollRef }),
          })
          const vData = await vRes.json()
          if (vData.success && vData.verified) {
            clearInterval(pollInterval)
            setIsInitializingPaystack(false)
            setVerifiedReceipt(pollRef)
            if (vData.type === 'subscription') {
              setIsSubscribed(true)
              toast.success("Monthly Subscription Activated! Full details unlocked.", { duration: 6000 })
              setShowPaymentModal(false)
              if (formData.idNumber || formData.pin) {
                handleIdSearch()
              }
            } else if (vData.downloadId) {
              setVerifiedDownloadId(vData.downloadId)
              setPaymentStep("done")
              await executeDownload(vData.downloadId)
            }
          } else if (pollAttempts >= 40) {
            clearInterval(pollInterval)
          }
        } catch {
          // keep polling
        }
      }, 3000)

      // Set auth URL for modal display - no window redirect by default, modal handles the flow
      // But users can optionally open Paystack in a new tab
      setPaystackAuthUrl(data.authorizationUrl)
    } catch (err: any) {
      setIsInitializingPaystack(false)
      setPaymentError(err.message || "Failed to launch Paystack payment.")
      setPaymentStep("error")
    }
  }

  // Opens Paystack checkout in a new window/tab
  const openPaystackCheckout = () => {
    if (!paystackAuthUrl) return
    const popup = window.open(paystackAuthUrl, '_blank', 'width=520,height=720')
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      window.location.href = paystackAuthUrl
    }
  }

  // Fetches server-determined access: subscription or pay_per_download (KES 20)
  const checkAccess = async () => {
    if (!formData.pin || !formData.fullName) {
      toast.error("Identity details missing. Please verify your ID again.")
      return
    }
    if (authLoaded && !isSignedIn) {
      toast.error("Authentication required. Please sign in to download your certificate.")
      return
    }

    try {
      const res = await fetch('/api/certificate/check-access')
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Access check failed')
      setAccessInfo(data)
      setIsSubscribed(data.access === 'subscription')
      setPaymentPhone(formData.phoneNumber || "")
      setPaymentStep("confirm")
      setPaymentError(null)
      setPaymentCheckoutId(null)
      setShowPaymentModal(true)
    } catch (err: any) {
      toast.error(err.message || 'Could not check access. Please try again.')
    }
  }

  // Called when user proceeds through the modal (active subscription OR after payment confirmed)
  const executeDownload = async (downloadId?: string) => {
    const targetDownloadId = downloadId || verifiedDownloadId
    if (!targetDownloadId) {
      toast.error("Download token missing. Please complete the payment flow.")
      return
    }

    setIsDownloadingPdf(true)
    const loadingToast = toast.loading("Securely generating your official certificate...")
    try {
      let activeForm = { ...formData }
      if ((!activeForm.pin || !activeForm.fullName) && typeof window !== "undefined") {
        try {
          const saved = sessionStorage.getItem("kra_active_form_data")
          if (saved) activeForm = { ...activeForm, ...JSON.parse(saved) }
        } catch {}
      }

      const payload = {
        pin: activeForm.pin,
        name: activeForm.fullName,
        idNumber: activeForm.idNumber,
        email: activeForm.email,
        building: activeForm.building,
        street: activeForm.street,
        city: activeForm.town,
        county: activeForm.county,
        district: activeForm.district,
        taxArea: activeForm.taxArea,
        station: activeForm.station,
        poBox: activeForm.poBox,
        postalCode: activeForm.postalCode,
        mobileNumber: activeForm.phoneNumber,
        registeredDate: activeForm.registeredDate,
        downloadId: targetDownloadId,
      }

      const response = await fetch('/api/generate-certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Certificate generation failed")
      }

      const blob = await response.blob()
      if (blob.size < 100) {
        throw new Error("Received an invalid or empty certificate file.")
      }

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `KRA_Certificate_${activeForm.pin || 'RETRIEVED'}.pdf`
      document.body.appendChild(a)
      a.click()
      setTimeout(() => {
        a.remove()
        window.URL.revokeObjectURL(url)
      }, 1500)

      toast.success("Certificate downloaded successfully!", { id: loadingToast })
      setPaymentStep("done")
    } catch (err: any) {
      toast.error(err.message || "Download failed. Please check your connection.", { id: loadingToast })
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  // Initiates M-Pesa STK push and polls for result
  const handleMpesaPayment = async () => {
    if (!paymentPhone.trim()) {
      setPaymentError("Please enter your M-Pesa phone number.")
      return
    }
    setPaymentStep("waiting")
    setPaymentError(null)

    try {
      // Initiate STK Push
      const stkRes = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: paymentPhone,
          amount: accessInfo?.feeKes || 30,
          reference: `CERT-${formData.pin}`,
          description: `KRA Certificate - ${formData.pin}`,
        }),
      })
      const stkData = await stkRes.json()
      if (!stkData.success) throw new Error(stkData.error || 'M-Pesa request failed')

      const checkoutId = stkData.CheckoutRequestID
      setPaymentCheckoutId(checkoutId)

      // Poll for payment status (max 60s)
      let attempts = 0
      const maxAttempts = 30
      const pollInterval = setInterval(async () => {
        attempts++
        try {
          // For mock/simulated flow, auto-confirm after a short delay
          const simulate = stkData.isSimulated ? 'success' : undefined
          const statusUrl = `/api/mpesa/status/${encodeURIComponent(checkoutId)}${simulate ? '?simulate=' + simulate : ''}`
          const statusRes = await fetch(statusUrl)
          const statusData = await statusRes.json()

          if (statusData.status === 'success') {
            clearInterval(pollInterval)
            // Record download server-side
            const recordRes = await fetch('/api/certificate/record-download', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                pin: formData.pin,
                downloadType: 'pay_per_download',
                checkoutId,
              }),
            })
            const recordData = await recordRes.json()
            if (!recordData.success) throw new Error(recordData.error || 'Failed to record download')
            setVerifiedDownloadId(recordData.downloadId)
            setVerifiedReceipt(checkoutId)
            setPaymentStep("done")
            await executeDownload(recordData.downloadId)
          } else if (statusData.status === 'failed') {
            clearInterval(pollInterval)
            setPaymentError(`Payment failed: ${statusData.resultDesc || 'Transaction declined'}`)
            setPaymentStep("error")
          } else if (attempts >= maxAttempts) {
            clearInterval(pollInterval)
            setPaymentError("Payment timed out. Please try again.")
            setPaymentStep("error")
          }
        } catch (pollErr: any) {
          clearInterval(pollInterval)
          setPaymentError(pollErr.message || 'Error checking payment status')
          setPaymentStep("error")
        }
      }, 2000)
    } catch (err: any) {
      setPaymentError(err.message || 'Failed to initiate payment')
      setPaymentStep("error")
    }
  }

  // Retries recording download if payment checkoutId already exists
  const retryConfirmDownload = async () => {
    if (paymentCheckoutId) {
      setPaymentStep("waiting")
      setPaymentError(null)
      try {
        const recordRes = await fetch('/api/certificate/record-download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pin: formData.pin,
            downloadType: 'pay_per_download',
            checkoutId: paymentCheckoutId,
          }),
        })
        const recordData = await recordRes.json()
        if (recordData.success && recordData.downloadId) {
          setVerifiedDownloadId(recordData.downloadId)
          setVerifiedReceipt(paymentCheckoutId)
          setPaymentStep("done")
          await executeDownload(recordData.downloadId)
          return
        } else {
          setPaymentError(recordData.error || 'Failed to confirm download')
          setPaymentStep("error")
          return
        }
      } catch (e: any) {
        setPaymentError(e.message || 'Error confirming download')
        setPaymentStep("error")
        return
      }
    }
    setPaymentStep('confirm')
  }

  // Subscription download — no payment, just record and download
  const handleSubscriptionDownload = async () => {
    try {
      const recordRes = await fetch('/api/certificate/record-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: formData.pin,
          downloadType: 'subscription',
          subscriptionId: accessInfo?.subscription?.id,
        }),
      })
      const recordData = await recordRes.json()
      if (!recordData.success) throw new Error(recordData.error || 'Failed to authorize download')
      setVerifiedDownloadId(recordData.downloadId)
      setPaymentStep("done")
      await executeDownload(recordData.downloadId)
    } catch (err: any) {
      toast.error(err.message || 'Download failed. Please try again.')
    }
  }

  // Admin: bypass payment modal entirely — record download directly as subscription-type
  const handleAdminDownload = async () => {
    if (!formData.pin || !formData.fullName) {
      toast.error('Identity details missing. Please verify your ID again.')
      return
    }
    setIsDownloadingPdf(true)
    const loadingToast = toast.loading('Generating certificate...')
    try {
      const recordRes = await fetch('/api/certificate/record-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: formData.pin, downloadType: 'subscription', subscriptionId: 'admin' }),
      })
      const recordData = await recordRes.json()
      if (!recordData.success) throw new Error(recordData.error || 'Failed to authorize download')
      toast.dismiss(loadingToast)
      await executeDownload(recordData.downloadId)
    } catch (err: any) {
      toast.error(err.message || 'Download failed.', { id: loadingToast })
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  // Effective full-access flag: admins always have full access
  const hasFullAccess = isAdmin || isSubscribed

  const handleDownload = isAdmin ? handleAdminDownload : checkAccess

  const stepVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  }

  // Ergonomic, auto-fitting input & button classes
  const inputClass = "w-full bg-surface-container-lowest border border-outline-variant/80 rounded-xl text-sm text-on-surface placeholder-on-surface-variant/50 focus:ring-2 focus:ring-primary/20 focus:border-primary px-4 py-2.5 h-11 transition-all"
  const labelClass = "block text-xs font-semibold text-on-surface mb-1.5"
  const primaryButtonClass = "inline-flex items-center justify-center gap-2 px-5 py-2.5 h-11 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all shadow-sm cursor-pointer whitespace-nowrap"
  const secondaryButtonClass = "inline-flex items-center justify-center gap-2 px-5 py-2.5 h-11 rounded-xl bg-surface-container border border-outline-variant text-on-surface font-semibold text-sm hover:bg-surface-variant/70 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"

  return (
    <div className="w-full">
      <div className="mb-2.5 flex flex-col items-center justify-center text-center">
        <h1 className="text-xl md:text-2xl font-bold text-on-surface tracking-tight text-center">Retrieve Your KRA Certificate</h1>
        <p className="text-xs text-on-surface-variant max-w-md">Verify your identity to retrieve and download your official tax compliance certificate.</p>
      </div>

      {isVerified && (
        <div className="w-full max-w-2xl mx-auto mb-3">
          <Alert className="bg-success-bg border-success-green/30 text-success-green rounded-xl flex items-center gap-2.5 py-2 px-3.5">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            <AlertDescription className="text-xs font-medium">
              Certificate details retrieved. Review before downloading.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Step Progress Bar */}
      <div className="w-full max-w-md mx-auto mb-4 px-2">
        <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider mb-1.5">
          <span className={cn(currentStep >= 1 ? "text-primary" : "text-on-surface-variant/70")}>01. Identity</span>
          <span className={cn(currentStep >= 2 ? "text-primary" : "text-on-surface-variant/70")}>02. Personal</span>
          <span className={cn(currentStep >= 3 ? "text-primary" : "text-on-surface-variant/70")}>03. Address</span>
          <span className={cn(currentStep >= 4 ? "text-primary" : "text-on-surface-variant/70")}>04. Review</span>
        </div>
        <div className="h-1.5 w-full bg-surface-variant rounded-full overflow-hidden relative">
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
          <div className="bg-surface-container-lowest rounded-2xl shadow-soft border border-outline-variant/60 p-4 sm:p-6 relative overflow-hidden z-10 max-w-3xl mx-auto">
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
                                      onChange={(e) => handleInputChange('idNumber', e.target.value.toUpperCase())}
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
                                      onChange={(e) => handleInputChange('pin', e.target.value.toUpperCase())}
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
                          
                          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                              <button 
                                className={cn(primaryButtonClass, "w-full sm:w-auto min-w-[170px] disabled:opacity-50")}
                                type="button"
                                onClick={handleIdSearch}
                                disabled={!hasConsented || captchaStatus === "loading"}
                              >
                                  <Search className="w-4 h-4" />
                                  {captchaStatus === "ready" ? "Submit" : "Retrieve Certificate"}
                              </button>
                              <button 
                                className="w-full sm:w-auto h-11 px-4 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/40 font-medium text-xs rounded-xl transition-all inline-flex justify-center items-center gap-1.5 cursor-pointer"
                                type="button"
                                onClick={() => setCurrentStep(2)}
                              >
                                Enter Details Manually
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
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Review and edit your certificate identity details.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                    <div>
                      <label className={labelClass}>KRA PIN</label>
                      <input 
                        value={formData.pin} 
                        onChange={(e) => handleInputChange('pin', e.target.value.toUpperCase())} 
                        placeholder="e.g. A012345678Z" 
                        className={inputClass} 
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Full Legal Name</label>
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
                    <div className="md:col-span-2">
                      <label className={labelClass}>Exact Registration Date</label>
                      <input 
                        value={formData.registeredDate} 
                        onChange={(e) => handleInputChange('registeredDate', e.target.value)} 
                        placeholder="DD/MM/YYYY" 
                        className={inputClass} 
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-6">
                    <button className={cn(secondaryButtonClass, "min-w-[100px]")} onClick={() => setCurrentStep(1)}>
                      Back
                    </button>
                    <button className={cn(primaryButtonClass, "min-w-[140px]")} onClick={() => setCurrentStep(3)}>
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
                    <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Address & Location Details</h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Review and edit your certificate address information.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                    <div>
                      <label className={labelClass}>County</label>
                      <Select value={formData.county} onValueChange={(v) => { handleInputChange('county', v); handleInputChange('district', '') }}>
                        <SelectTrigger className={cn(inputClass, "h-12")}>
                          <SelectValue placeholder="Select County" />
                        </SelectTrigger>
                        <SelectContent className="bg-surface-container-lowest border-outline-muted rounded-lg">
                          {COUNTIES.map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className={labelClass}>City / Town</label>
                      <input 
                        value={formData.town} 
                        onChange={(e) => handleInputChange('town', e.target.value)} 
                        placeholder="e.g. Nairobi" 
                        className={inputClass} 
                      />
                    </div>
                    <div>
                      <label className={labelClass}>District / Sub County</label>
                      <Select value={formData.district || ""} onValueChange={(v) => handleInputChange('district', v)}>
                        <SelectTrigger className={cn(inputClass, "h-12")}>
                          <SelectValue placeholder="Select District" />
                        </SelectTrigger>
                        <SelectContent className="bg-surface-container-lowest border-outline-muted rounded-lg">
                          {formData.county && GET_SUB_COUNTIES(formData.county).map(sc => (<SelectItem key={sc} value={sc}>{sc}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className={labelClass}>Tax Area Locality</label>
                      <Select value={formData.taxArea || ""} onValueChange={(v) => handleInputChange('taxArea', v)}>
                        <SelectTrigger className={cn(inputClass, "h-12")}>
                          <SelectValue placeholder="Select Locality" />
                        </SelectTrigger>
                        <SelectContent className="bg-surface-container-lowest border-outline-muted rounded-lg">
                          {formData.county && GET_LOCALITIES(formData.county, formData.district || "").map(l => (<SelectItem key={l} value={l}>{l}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className={labelClass}>Tax Station</label>
                      <Select value={formData.station || ""} onValueChange={(v) => handleInputChange('station', v)}>
                        <SelectTrigger className={cn(inputClass, "h-12")}>
                          <SelectValue placeholder="Select Station" />
                        </SelectTrigger>
                        <SelectContent className="bg-surface-container-lowest border-outline-muted rounded-lg">
                          {formData.county && GET_STATIONS(formData.county).map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className={labelClass}>Building Name</label>
                      <input 
                        value={formData.building} 
                        onChange={(e) => handleInputChange('building', e.target.value)} 
                        placeholder="e.g. Commercial Plaza" 
                        className={inputClass} 
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Street / Road</label>
                      <input 
                        value={formData.street} 
                        onChange={(e) => handleInputChange('street', e.target.value)} 
                        placeholder="e.g. Harambee Avenue" 
                        className={inputClass} 
                      />
                    </div>
                    <div>
                      <label className={labelClass}>P.O. Box</label>
                      <input 
                        value={formData.poBox} 
                        onChange={(e) => handleInputChange('poBox', e.target.value)} 
                        placeholder="e.g. P.O. Box 40001" 
                        className={inputClass} 
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>Postal Code</label>
                      <Select value={formData.postalCode} onValueChange={(v) => { const found = GET_POSTAL_CODES(formData.county).find(p => p.code === v); handleInputChange('postalCode', v); if (found) handleInputChange('town', found.town) }}>
                        <SelectTrigger className={cn(inputClass, "h-12")}>
                          <SelectValue placeholder="Select Postal Code" />
                        </SelectTrigger>
                        <SelectContent className="bg-surface-container-lowest border-outline-muted rounded-lg">
                          {formData.county && GET_POSTAL_CODES(formData.county).map(p => (<SelectItem key={p.code} value={p.code}>{p.code}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-6">
                    <button className={cn(secondaryButtonClass, "min-w-[100px]")} onClick={() => setCurrentStep(2)}>
                      Back
                    </button>
                    <button className={cn(primaryButtonClass, "min-w-[170px]")} onClick={() => setCurrentStep(4)}>
                      Review Certificate <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div key="step4" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-3">
                  <div className="flex flex-col items-center justify-center text-center mb-1">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="text-primary w-5 h-5" />
                      <h2 className="text-base font-bold text-on-surface">Review & Download Certificate</h2>
                    </div>
                    <p className="text-[11px] text-on-surface-variant">Confirm details that will appear on your official KRA PDF certificate.</p>
                  </div>

                  {/* Unsubscribed Preview Warning Banner */}
                  {!hasFullAccess && (
                    <div className="w-full max-w-2xl mx-auto bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 px-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-left">
                      <div className="flex items-center gap-2.5">
                        <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                            Protected Preview Mode
                            <span className="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 rounded font-semibold">Unsubscribed</span>
                          </p>
                          <p className="text-[11px] text-on-surface-variant">
                            Phone number & location hidden. PIN & email partially masked. Legal name is verified.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod("paystack")
                          setSelectedTier("subscription")
                          checkAccess()
                        }}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-on-primary whitespace-nowrap transition-all shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Unlock All (KES 499)
                      </button>
                    </div>
                  )}

                  {/* Summary / Direct Edit Grid */}
                  <div className="w-full max-w-2xl mx-auto bg-surface-variant/30 rounded-xl p-3.5 sm:p-4 border border-outline-variant space-y-2.5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="block text-[11px] font-semibold text-on-surface">KRA PIN</label>
                          {!hasFullAccess && (
                            <span className="text-[9px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                              <Lock className="w-2.5 h-2.5" /> Masked
                            </span>
                          )}
                        </div>
                        <input 
                          value={formData.pin} 
                          onChange={(e) => handleInputChange('pin', e.target.value.toUpperCase())} 
                          readOnly={!hasFullAccess}
                          placeholder="A012345678Z" 
                          className={cn(inputClass, "h-9 text-xs font-bold text-primary px-3", !hasFullAccess && "bg-muted/30 cursor-not-allowed")} 
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="block text-[11px] font-semibold text-on-surface">Taxpayer Full Name</label>
                          <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" /> Full Name
                          </span>
                        </div>
                        <input 
                          value={formData.fullName} 
                          onChange={(e) => handleInputChange('fullName', e.target.value.toUpperCase())} 
                          readOnly={!hasFullAccess}
                          placeholder="JOHN DOE" 
                          className={cn(inputClass, "h-9 text-xs font-semibold px-3")} 
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="block text-[11px] font-semibold text-on-surface">Email Address</label>
                          {!hasFullAccess && (
                            <span className="text-[9px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                              <Lock className="w-2.5 h-2.5" /> Partial
                            </span>
                          )}
                        </div>
                        <input 
                          value={formData.email} 
                          onChange={(e) => handleInputChange('email', e.target.value.toLowerCase())} 
                          readOnly={!isSubscribed}
                          placeholder="email@example.com" 
                          type="email"
                          className={cn(inputClass, "h-9 text-xs px-3", !isSubscribed && "bg-muted/30 cursor-not-allowed")} 
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="block text-[11px] font-semibold text-on-surface">Mobile Phone Number</label>
                          {!hasFullAccess && (
                            <span className="text-[9px] font-semibold text-rose-500 bg-rose-500/10 px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                              <Lock className="w-2.5 h-2.5" /> Hidden
                            </span>
                          )}
                        </div>
                        {hasFullAccess ? (
                          <input 
                            value={formData.phoneNumber} 
                            onChange={(e) => handleInputChange('phoneNumber', e.target.value)} 
                            placeholder="07XXXXXXXX" 
                            className={cn(inputClass, "h-9 text-xs px-3")} 
                          />
                        ) : (
                          <div className="relative">
                            <input 
                              disabled 
                              value="•••••••••• (Hidden — Subscribers Only)" 
                              className={cn(inputClass, "h-9 opacity-75 cursor-not-allowed bg-muted/40 font-mono text-[11px] px-3 pr-16")} 
                            />
                            <button 
                              type="button"
                              onClick={() => {
                                setPaymentMethod("paystack")
                                setSelectedTier("subscription")
                                checkAccess()
                              }} 
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              Unlock
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="block text-[11px] font-semibold text-on-surface">Exact Registration Date</label>
                          {!hasFullAccess && (
                            <span className="text-[9px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                              <Lock className="w-2.5 h-2.5" /> Partial
                            </span>
                          )}
                        </div>
                        <input 
                          value={formData.registeredDate} 
                          onChange={(e) => handleInputChange('registeredDate', e.target.value)} 
                          readOnly={!hasFullAccess}
                          placeholder="DD/MM/YYYY" 
                          className={cn(inputClass, "h-9 text-xs px-3", !hasFullAccess && "bg-muted/30 cursor-not-allowed")} 
                        />
                      </div>

                      {/* Location Details: Visible only when subscribed */}
                      {hasFullAccess ? (
                        <>
                          <div>
                            <label className="block text-[11px] font-semibold text-on-surface mb-0.5">County</label>
                            <Select value={formData.county} onValueChange={(v) => { handleInputChange('county', v); handleInputChange('district', '') }}>
                              <SelectTrigger className={cn(inputClass, "h-9 text-xs px-3")}>
                                <SelectValue placeholder="Select County" />
                              </SelectTrigger>
                              <SelectContent className="bg-surface-container-lowest border-outline-muted rounded-lg">
                                {COUNTIES.map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-on-surface mb-0.5">City / Town</label>
                            <input 
                              value={formData.town} 
                              onChange={(e) => handleInputChange('town', e.target.value)} 
                              placeholder="e.g. Nairobi" 
                              className={cn(inputClass, "h-9 text-xs px-3")} 
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-on-surface mb-0.5">District / Sub County</label>
                            <input 
                              value={formData.district} 
                              onChange={(e) => handleInputChange('district', e.target.value)} 
                              placeholder="e.g. Central District" 
                              className={cn(inputClass, "h-9 text-xs px-3")} 
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-on-surface mb-0.5">Tax Station</label>
                            <input 
                              value={formData.station} 
                              onChange={(e) => handleInputChange('station', e.target.value)} 
                              placeholder="e.g. North of Nairobi" 
                              className={cn(inputClass, "h-9 text-xs px-3")} 
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-on-surface mb-0.5">Building Name</label>
                            <input 
                              value={formData.building} 
                              onChange={(e) => handleInputChange('building', e.target.value)} 
                              placeholder="e.g. Commercial Plaza" 
                              className={cn(inputClass, "h-9 text-xs px-3")} 
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-on-surface mb-0.5">Street / Road</label>
                            <input 
                              value={formData.street} 
                              onChange={(e) => handleInputChange('street', e.target.value)} 
                              placeholder="e.g. Harambee Avenue" 
                              className={cn(inputClass, "h-9 text-xs px-3")} 
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-on-surface mb-0.5">P.O. Box</label>
                            <input 
                              value={formData.poBox} 
                              onChange={(e) => handleInputChange('poBox', e.target.value)} 
                              placeholder="e.g. P.O. Box 40001" 
                              className={cn(inputClass, "h-9 text-xs px-3")} 
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[11px] font-semibold text-on-surface mb-0.5">Postal Code</label>
                            <input 
                              value={formData.postalCode} 
                              onChange={(e) => handleInputChange('postalCode', e.target.value)} 
                              placeholder="e.g. 00100" 
                              className={cn(inputClass, "h-9 text-xs px-3")} 
                            />
                          </div>
                        </>
                      ) : (
                        <div className="md:col-span-2 bg-surface-container-lowest/80 border border-dashed border-outline-variant rounded-xl p-3 text-center space-y-1.5">
                          <div className="flex items-center justify-center gap-1.5">
                            <MapPin className="w-4 h-4 text-primary" />
                            <h4 className="font-semibold text-xs text-on-surface">Location & Address Details Hidden</h4>
                          </div>
                          <p className="text-[11px] text-on-surface-variant max-w-sm mx-auto">
                            County, KRA Station, City/Town, Building, and P.O. Box details are only visible to subscribers.
                          </p>
                          <div className="flex flex-wrap items-center justify-center gap-2 pt-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                setPaymentMethod('paystack')
                                if (!isAdmin) setSelectedTier('subscription')
                                checkAccess()
                              }}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-on-primary hover:bg-primary/90 transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                            >
                              <Sparkles className="w-3 h-3" /> Subscribe to Reveal All (KES 499)
                            </button>
                            <button
                              type="button"
                              onClick={handleDownload}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-outline-variant bg-surface hover:bg-surface-variant/40 text-on-surface transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Download className="w-3 h-3" /> Download Certificate (KES 20)
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-2xl mx-auto pt-2.5">
                    <button className={secondaryButtonClass} onClick={() => { setCurrentStep(1); setIdSearchStatus("idle"); setIsVerified(false); setFormData(prev => ({ ...prev, idNumber: "", pin: "" })); }}>
                      <RefreshCw className="w-4 h-4" /> New Search
                    </button>
                    {!hasFullAccess && (
                      <button 
                        type="button"
                        className={secondaryButtonClass} 
                        onClick={() => {
                          setPaymentMethod('paystack')
                          setSelectedTier('subscription')
                          checkAccess()
                        }}
                      >
                        <Sparkles className="w-4 h-4 text-amber-500" /> Unlock Full Record
                      </button>
                    )}
                    <button className={primaryButtonClass} onClick={handleDownload}>
                      <Download className="w-4 h-4" /> {isAdmin ? "Download Certificate (Admin)" : hasFullAccess ? "Download with Plan" : "Download PDF Certificate (KES 20)"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Official KRA Payment & Checkout Gate Modal ── */}
      {showPaymentModal && accessInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md px-4 py-6 overflow-y-auto">
          <div className="bg-surface border border-outline-variant/80 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative my-auto">
            {/* Top KRA Red decorative brand strip */}
            <div className="h-1.5 w-full bg-gradient-to-r from-primary-container via-primary to-primary-container" />

            <div className="p-6 sm:p-7 space-y-5">
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary shadow-sm">
                    {accessInfo.access === 'subscription' ? (
                      <Sparkles className="w-6 h-6 text-primary" />
                    ) : (
                      <ShieldCheck className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface text-lg sm:text-xl tracking-tight">
                      {paymentStep === 'done' 
                        ? 'Certificate Ready' 
                        : (accessInfo.access === 'subscription' ? 'Active Subscription' : 'KRA Certificate Checkout')}
                    </h3>
                    <p className="text-xs text-on-surface-variant flex items-center gap-1.5 mt-0.5">
                      Republic of Kenya • Official Tax Compliance Portal
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="p-1.5 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/40 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Taxpayer Identity Summary Badge */}
              <div className="bg-surface-container/70 border border-outline-variant/60 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant block">Taxpayer Record</span>
                  <p className="font-semibold text-on-surface truncate text-sm">{formData.fullName || "Registered Taxpayer"}</p>
                  <p className="text-[11px] font-mono text-primary font-bold mt-0.5">PIN: {formData.pin || "A01*****8Z"}</p>
                </div>
                <div className="shrink-0 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium px-2.5 py-1 rounded-full text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </div>
              </div>

              {/* Active Subscription: Instant Download */}
              {accessInfo.access === 'subscription' && paymentStep === 'confirm' && (
                <div className="space-y-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-sm text-on-surface space-y-1">
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" /> Active Monthly Subscription
                    </p>
                    <p className="text-on-surface-variant text-xs leading-relaxed">
                      Your monthly subscription is active until {accessInfo.subscription?.expiresAt ? new Date(accessInfo.subscription.expiresAt).toLocaleDateString('en-GB') : 'end of billing period'}. Enjoy unlimited certificate downloads at KES 0.
                    </p>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button className={secondaryButtonClass + " flex-1"} onClick={() => setShowPaymentModal(false)}>Close</button>
                    <button className={primaryButtonClass + " flex-1"} onClick={handleSubscriptionDownload}>
                      <Download className="w-4 h-4" /> Download Certificate (KES 0)
                    </button>
                  </div>
                </div>
              )}

              {/* Pay Per Download / Tier Selection */}
              {accessInfo.access === 'pay_per_download' && paymentStep === 'confirm' && (
                <div className="space-y-4">
                  {/* Segmented Gateway Toggle */}
                  <div className="grid grid-cols-2 gap-1.5 bg-surface-container p-1 rounded-2xl border border-outline-variant/60">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('paystack')}
                      className={cn(
                        "py-2.5 px-3 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2",
                        paymentMethod === 'paystack'
                          ? "bg-surface text-primary shadow-sm font-bold ring-1 ring-primary/20"
                          : "text-on-surface-variant hover:text-on-surface"
                      )}
                    >
                      <CreditCard className="w-4 h-4" /> Paystack (Cards / M-Pesa)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('mpesa')}
                      className={cn(
                        "py-2.5 px-3 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2",
                        paymentMethod === 'mpesa'
                          ? "bg-surface text-primary shadow-sm font-bold ring-1 ring-primary/20"
                          : "text-on-surface-variant hover:text-on-surface"
                      )}
                    >
                      <Smartphone className="w-4 h-4" /> Direct M-Pesa STK
                    </button>
                  </div>

                  {/* Paystack Plans */}
                  {paymentMethod === 'paystack' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Single Certificate */}
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedTier('download')}
                          onKeyDown={(e) => e.key === 'Enter' && setSelectedTier('download')}
                          className={cn(
                            "p-4 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer relative",
                            selectedTier === 'download'
                              ? "border-primary bg-primary/5 ring-2 ring-primary shadow-sm"
                              : "border-outline-variant/70 bg-surface-container/30 hover:bg-surface-container/70"
                          )}
                        >
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">Single Download</span>
                            <p className="text-xl font-extrabold text-primary mt-1">KES 20</p>
                            <p className="text-[11px] text-on-surface-variant mt-1.5 leading-relaxed">
                              One-time official certificate generation for this PIN.
                            </p>
                          </div>
                          <div className="mt-3.5 pt-2.5 border-t border-outline-variant/40 flex items-center gap-1.5 text-[11px] font-medium text-on-surface">
                            <Check className="w-3.5 h-3.5 text-primary" /> Instant PDF Download
                          </div>
                        </div>

                        {/* Monthly Unlimited Plan */}
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedTier('subscription')}
                          onKeyDown={(e) => e.key === 'Enter' && setSelectedTier('subscription')}
                          className={cn(
                            "p-4 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer relative overflow-hidden",
                            selectedTier === 'subscription'
                              ? "border-primary bg-primary/5 ring-2 ring-primary shadow-sm"
                              : "border-outline-variant/70 bg-surface-container/30 hover:bg-surface-container/70"
                          )}
                        >
                          <div className="absolute top-0 right-0 bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">
                            BEST VALUE
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">Monthly Pass</span>
                            <p className="text-xl font-extrabold text-primary mt-1">KES 499 <span className="text-[10px] font-normal text-on-surface-variant">/ mo</span></p>
                            <p className="text-[11px] text-on-surface-variant mt-1.5 leading-relaxed">
                              Unlimited downloads & unlocks all masked taxpayer numbers.
                            </p>
                          </div>
                          <div className="mt-3.5 pt-2.5 border-t border-outline-variant/40 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <Sparkles className="w-3.5 h-3.5" /> Full Profiles Unmasked
                          </div>
                        </div>
                      </div>

                      {/* Provider Trust Badges */}
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] text-on-surface-variant">
                        <span className="bg-surface-container px-2 py-0.5 rounded-md font-medium text-[10px]">Visa</span>
                        <span className="bg-surface-container px-2 py-0.5 rounded-md font-medium text-[10px]">Mastercard</span>
                        <span className="bg-surface-container px-2 py-0.5 rounded-md font-medium text-[10px]">Apple Pay</span>
                        <span className="bg-surface-container px-2 py-0.5 rounded-md font-medium text-[10px]">M-Pesa</span>
                        <span className="flex items-center gap-1 text-[10px] text-on-surface-variant/80 ml-1">
                          <Lock className="w-3 h-3" /> 256-Bit SSL Encrypted
                        </span>
                      </div>

                      {paymentError && (
                        <p className="text-xs text-red-500 text-center font-medium bg-red-500/10 py-1.5 px-3 rounded-lg">{paymentError}</p>
                      )}

                      <div className="flex gap-3 pt-2">
                        <button className={secondaryButtonClass + " flex-1"} onClick={() => setShowPaymentModal(false)}>Cancel</button>
                        <button
                          type="button"
                          className={cn(primaryButtonClass, "flex-1 font-bold shadow-md shadow-primary/20")}
                          onClick={() => handlePaystackPayment(selectedTier === 'subscription' ? 'subscription' : 'pay_per_download')}
                          disabled={isInitializingPaystack}
                        >
                          {isInitializingPaystack ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <CreditCard className="w-4 h-4" />
                              {selectedTier === 'subscription' ? 'Subscribe KES 499' : 'Pay KES 20 & Download'}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Direct M-Pesa STK Flow */}
                  {paymentMethod === 'mpesa' && (
                    <div className="space-y-4">
                      <div className="bg-surface-container/60 rounded-2xl p-4 text-xs space-y-1.5 border border-outline-variant/60">
                        <div className="flex justify-between items-center">
                          <span className="text-on-surface-variant">Selected Certificate PIN:</span>
                          <span className="font-mono font-bold text-primary">{formData.pin}</span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-outline-variant/40">
                          <span className="text-on-surface-variant">Single Download Fee:</span>
                          <span className="font-bold text-on-surface text-sm">KES {accessInfo.feeKes}</span>
                        </div>
                      </div>

                      <div>
                        <label className={labelClass}>M-Pesa Phone Number</label>
                        <div className="relative mt-1">
                          <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
                          <input
                            className={cn(inputClass, "pl-10 text-sm")}
                            placeholder="07XXXXXXXX or 01XXXXXXXX"
                            value={paymentPhone}
                            onChange={(e) => setPaymentPhone(e.target.value)}
                          />
                        </div>
                        <p className="text-[11px] text-on-surface-variant mt-1.5">
                          An STK push payment prompt will be sent directly to this phone number.
                        </p>
                      </div>

                      {paymentError && (
                        <p className="text-xs text-red-500 font-medium bg-red-500/10 py-1.5 px-3 rounded-lg">{paymentError}</p>
                      )}

                      <div className="flex gap-3 pt-2">
                        <button className={secondaryButtonClass + " flex-1"} onClick={() => setShowPaymentModal(false)}>Cancel</button>
                        <button className={cn(primaryButtonClass, "flex-1 font-bold shadow-md shadow-primary/20")} onClick={handleMpesaPayment}>
                          <Smartphone className="w-4 h-4" /> Send STK Prompt (KES {accessInfo.feeKes})
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Waiting for Payment Confirmation */}
              {paymentStep === 'waiting' && (
                <div className="flex flex-col items-center gap-4 py-6 text-center">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary animate-pulse">
                      <Loader2 className="w-7 h-7 animate-spin" />
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-on-surface text-base">
                      Awaiting payment confirmation...
                    </p>
                    <p className="text-xs text-on-surface-variant mt-1.5 max-w-sm leading-relaxed">
                      Please complete the transaction. This portal will automatically verify and download your certificate once confirmed.
                    </p>
                  </div>
                  {paystackAuthUrl && (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/20 mt-2"
                      onClick={openPaystackCheckout}
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open Paystack in new tab
                    </button>
                  )}
                  <button
                    type="button"
                    className="text-xs text-on-surface-variant hover:text-on-surface underline mt-2"
                    onClick={() => setPaymentStep('confirm')}
                  >
                    Change payment method / cancel
                  </button>
                </div>
              )}

              {/* Payment Successful & Certificate Ready State */}
              {paymentStep === 'done' && (
                <div className="space-y-5 text-center py-2">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto shadow-sm">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div>
                    <h4 className="font-bold text-on-surface text-lg">Payment Confirmed & Verified!</h4>
                    <p className="text-xs text-on-surface-variant mt-1 max-w-sm mx-auto">
                      Your official KRA compliance certificate has been compiled and is ready for download.
                    </p>
                  </div>

                  {/* Certificate Document Card */}
                  <div className="bg-surface-container/70 border border-outline-variant/70 rounded-2xl p-4 text-left flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-on-surface truncate">
                        KRA_Certificate_{formData.pin || 'OFFICIAL'}.pdf
                      </p>
                      <p className="text-[11px] text-on-surface-variant mt-0.5 truncate">
                        Taxpayer: {formData.fullName || 'Registered Taxpayer'}
                      </p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Official Digital Signature & QR Stamp Included
                      </p>
                    </div>
                  </div>

                  {/* Download Action Buttons */}
                  <div className="space-y-2.5 pt-2">
                    <button
                      type="button"
                      disabled={isDownloadingPdf}
                      onClick={() => executeDownload()}
                      className={cn(
                        primaryButtonClass,
                        "w-full py-4 text-sm font-bold shadow-lg shadow-primary/25 hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                      )}
                    >
                      {isDownloadingPdf ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Generating Official PDF...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>Download Certificate (PDF)</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowPaymentModal(false)}
                      className={cn(secondaryButtonClass, "w-full text-xs py-2.5")}
                    >
                      Done / Close
                    </button>
                  </div>
                </div>
              )}

              {/* Payment Error State */}
              {paymentStep === 'error' && (
                <div className="space-y-4">
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-sm">
                    <p className="font-bold text-red-600 dark:text-red-400 mb-1 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" /> Payment Incomplete
                    </p>
                    <p className="text-on-surface-variant text-xs leading-relaxed">{paymentError || "Transaction was declined or cancelled. Please try again."}</p>
                  </div>
                  <div className="flex gap-3">
                    <button className={secondaryButtonClass + " flex-1"} onClick={() => setShowPaymentModal(false)}>Cancel</button>
                    <button className={primaryButtonClass + " flex-1"} onClick={retryConfirmDownload}>
                      {paymentCheckoutId ? "Confirm & Download" : "Try Again"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
