"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { 
  Building2, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  FileText, 
  Loader2, 
  Phone, 
  RefreshCw, 
  ShieldCheck, 
  Smartphone, 
  Sparkles, 
  Zap,
  ArrowRight,
  ExternalLink,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";

interface CyberCafeData {
  id: string;
  cafeName: string;
  ownerName: string;
  whatsappPhone: string;
  paymentPhone: string;
  status: string;
  expiresAt: string;
  totalDownloads: number;
  dailyDownloads: number;
}

interface CyberInvoiceData {
  id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  mpesaReceipt: string | null;
  status: string;
  createdAt: string;
  periodStart: string;
  periodEnd: string;
}

export function CyberSubscriptionCard({ compact = false }: { compact?: boolean }) {
  const { isSignedIn, isLoaded, user } = useUser();
  const [loading, setLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [cafe, setCafe] = useState<CyberCafeData | null>(null);
  const [invoices, setInvoices] = useState<CyberInvoiceData[]>([]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pollingCheckoutId, setPollingCheckoutId] = useState<string | null>(null);
  const [pollStatus, setPollStatus] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    cafeName: "",
    ownerName: "",
    whatsappPhone: "",
    paymentPhone: "",
    method: "mpesa" as "mpesa" | "paystack",
  });

  const fetchStatus = async () => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/cyber/user-status");
      const data = await res.json();
      if (data.success) {
        setHasSubscription(data.hasSubscription);
        setIsActive(data.isActive);
        setDaysRemaining(data.daysRemaining || 0);
        setCafe(data.cafe);
        setInvoices(data.invoices || []);
        if (data.cafe) {
          setFormData((prev) => ({
            ...prev,
            cafeName: data.cafe.cafeName || "",
            ownerName: data.cafe.ownerName || "",
            whatsappPhone: data.cafe.whatsappPhone || "",
            paymentPhone: data.cafe.paymentPhone || "",
          }));
        }
      }
    } catch (e) {
      console.warn("Failed to fetch cyber subscription status:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchStatus();
      // Pre-fill owner name and phone from Clerk profile if empty
      if (user) {
        setFormData((prev) => ({
          ...prev,
          ownerName: prev.ownerName || user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "",
          whatsappPhone: prev.whatsappPhone || user.phoneNumbers?.[0]?.phoneNumber || "",
          paymentPhone: prev.paymentPhone || user.phoneNumbers?.[0]?.phoneNumber || "",
        }));
      }
    } else if (isLoaded && !isSignedIn) {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, user]);

  // Handle M-Pesa polling when waiting for STK push
  useEffect(() => {
    if (!pollingCheckoutId) return;

    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      setPollStatus(`Awaiting M-Pesa PIN input on your phone... (${attempts * 2}s)`);
      try {
        const res = await fetch(`/api/mpesa/status/${pollingCheckoutId}`);
        const data = await res.json();
        if (data.status === "success" || data.resultCode === 0) {
          clearInterval(interval);
          setPollingCheckoutId(null);
          setPollStatus(null);
          setSubmitting(false);
          setShowModal(false);
          toast.success("🎉 Cyber Cafe Subscription Activated Successfully!");
          await fetchStatus();
        } else if (data.status === "failed" || (data.resultCode && data.resultCode !== 0)) {
          clearInterval(interval);
          setPollingCheckoutId(null);
          setPollStatus(null);
          setSubmitting(false);
          toast.error(data.resultDesc || "M-Pesa payment cancelled or timed out.");
        } else if (attempts >= 30) {
          clearInterval(interval);
          setPollingCheckoutId(null);
          setPollStatus(null);
          setSubmitting(false);
          toast.error("Payment timeout. If debited, your subscription will activate shortly.");
          await fetchStatus();
        }
      } catch {
        // Continue polling
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [pollingCheckoutId]);

  const handleSubscribeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cafeName.trim() || !formData.ownerName.trim() || !formData.whatsappPhone.trim() || !formData.paymentPhone.trim()) {
      toast.error("Please fill in all cyber cafe registration fields.");
      return;
    }

    setSubmitting(true);
    setPollStatus("Initiating subscription gateway...");

    try {
      const res = await fetch("/api/cyber/subscribe-web", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Subscription initialization failed");
      }

      if (data.gateway === "mpesa" && data.checkoutRequestId) {
        toast.success("M-Pesa STK Push sent! Enter your PIN on your phone.", { duration: 5000 });
        setPollingCheckoutId(data.checkoutRequestId);
      } else if (data.gateway === "paystack" && data.authorizationUrl) {
        toast.loading("Redirecting to Paystack checkout...");
        window.location.href = data.authorizationUrl;
      }
    } catch (err: any) {
      setSubmitting(false);
      setPollStatus(null);
      toast.error(err.message || "Failed to initiate subscription.");
    }
  };

  // Only render for signed-in users per requirement
  if (!isLoaded || !isSignedIn) {
    return null;
  }

  if (loading) {
    return (
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 animate-pulse flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="space-y-1 flex-1">
          <div className="h-4 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded" />
          <div className="h-3 w-1/2 bg-zinc-100 dark:bg-zinc-800/60 rounded" />
        </div>
      </div>
    );
  }

  // Compact variant for above-the-fold embedding
  if (compact) {
    if (isActive && cafe) {
      return (
        <div className="w-full bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500/40 rounded-2xl p-4 text-zinc-900 dark:text-zinc-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0 shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-zinc-900 dark:text-zinc-50">{cafe.cafeName}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white">
                  Active
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                  📅 {daysRemaining} {daysRemaining === 1 ? "Day" : "Days"} Remaining
                </span>
              </div>
              <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-0.5 font-medium">
                Unlimited Instant Lookups Active · Zero download fees applied
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowModal(true)}
              className="h-8.5 px-3 text-xs font-bold border-emerald-600 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-xl"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Renew (+30 Days)
            </Button>
            {invoices.length > 0 && (
              <a
                href={`/api/cyber/invoice/${invoices[0].id}`}
                target="_blank"
                rel="noreferrer"
                className="h-8.5 px-3 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                title="Download Fiscal Tax Invoice PDF"
              >
                <FileText className="w-3.5 h-3.5 mr-1 text-red-600" />
                Invoice
              </a>
            )}
          </div>
          {renderSubscribeModal()}
        </div>
      );
    }

    return (
      <div className="w-full bg-gradient-to-r from-red-50 to-amber-50 dark:from-red-950/20 dark:to-zinc-900 border border-red-200 dark:border-red-900/40 rounded-2xl p-3.5 text-zinc-900 dark:text-zinc-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-red-600 text-white shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">Cyber Cafe Unlimited Monthly Plan</span>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-black uppercase bg-red-600 text-white">
                KES 500/mo
              </span>
            </div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
              Unlimited downloads, instant ID lookups with 0 fees, and official Tax Invoices.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => setShowModal(true)}
          className="h-8 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shrink-0 shadow-xs flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Activate Plan
        </Button>
        {renderSubscribeModal()}
      </div>
    );
  }

  // Full Dashboard card variant
  return (
    <div className="w-full rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      {/* Top Banner Header */}
      <div className="p-5 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-red-600 text-white shrink-0 shadow-sm">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50">
                {cafe ? cafe.cafeName : "Cyber Cafe Monthly Subscription"}
              </h3>
              {isActive ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white">
                  Active
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  Not Subscribed
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
              KES 500 / Month · Unlimited Instant KRA PIN lookups, zero per-certificate fees & WhatsApp integration
            </p>
          </div>
        </div>

        <Button
          onClick={() => setShowModal(true)}
          className="h-10 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs shrink-0 flex items-center gap-2 self-start sm:self-auto"
        >
          {isActive ? (
            <>
              <RefreshCw className="w-4 h-4" />
              <span>Renew Subscription</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Subscribe for KES 500</span>
            </>
          )}
        </Button>
      </div>

      {/* Main Content Body */}
      <div className="p-5 sm:p-6 space-y-6">
        {isActive && cafe ? (
          <>
            {/* Days Remaining Highlight Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40">
                <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider">Days Remaining</span>
                  <Clock className="w-4 h-4" />
                </div>
                <div className="text-3xl font-black text-emerald-900 dark:text-emerald-100">
                  {daysRemaining} <span className="text-sm font-semibold">days</span>
                </div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">
                  Expires on: {new Date(cafe.expiresAt).toLocaleDateString()}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between text-zinc-700 dark:text-zinc-300 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider">WhatsApp Line</span>
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-xl font-black text-zinc-900 dark:text-zinc-100 font-mono">
                  {cafe.whatsappPhone}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                  Authorized for zero-click lookups
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between text-zinc-700 dark:text-zinc-300 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Certificates</span>
                  <ShieldCheck className="w-4 h-4 text-red-600" />
                </div>
                <div className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
                  {cafe.totalDownloads}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                  Today: {cafe.dailyDownloads} / 100 quota
                </p>
              </div>
            </div>

            {/* Invoices List */}
            {invoices.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Official Fiscal Tax Invoices (16% VAT)
                  </h4>
                  <span className="text-xs text-zinc-500">{invoices.length} Issued</span>
                </div>
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                  {invoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-3.5 sm:px-4 bg-white dark:bg-zinc-900 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-red-600 shrink-0" />
                        <div>
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono block">
                            {inv.invoiceNumber}
                          </span>
                          <span className="text-[11px] text-zinc-500">
                            {new Date(inv.createdAt).toLocaleDateString()} · Receipt: {inv.mpesaReceipt || "M-PESA"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">KES {inv.amount}</span>
                        <a
                          href={`/api/cyber/invoice/${inv.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-red-50 hover:text-red-600 transition-colors font-medium flex items-center gap-1"
                        >
                          <span>PDF</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Feature Callout when Not Subscribed */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                <div className="flex items-center gap-2 text-red-600 font-bold text-xs uppercase tracking-wider">
                  <Zap className="w-4 h-4" />
                  <span>Unlimited Lookups</span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Retrieve hundreds of KRA PIN certificates every month without paying KES 20 each time.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
                  <Smartphone className="w-4 h-4" />
                  <span>Dual Web + WhatsApp</span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Simply text client ID numbers on WhatsApp or use this website portal for instant PDFs.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
                  <FileText className="w-4 h-4" />
                  <span>Official Fiscal Invoices</span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Receive verifiable KRA-compliant 16% VAT Tax Invoices for business expense filing.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <Button
                onClick={() => setShowModal(true)}
                className="w-full sm:w-auto h-11 px-6 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2"
              >
                <span>Activate Cyber Cafe Plan (KES 500)</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
              <span className="text-xs text-zinc-500">
                ⚡ Instant activation · Safaricom M-Pesa or Card accepted
              </span>
            </div>
          </div>
        )}
      </div>

      {renderSubscribeModal()}
    </div>
  );

  function renderSubscribeModal() {
    if (!showModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
        <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 sm:p-7 space-y-5 text-zinc-900 dark:text-zinc-100">
          {/* Close button */}
          <button
            type="button"
            onClick={() => {
              if (!submitting) {
                setShowModal(false);
                setPollingCheckoutId(null);
                setPollStatus(null);
              }
            }}
            className="absolute top-5 right-5 p-1.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 text-[10px] font-black uppercase tracking-wider">
              <Building2 className="w-3 h-3" />
              Cyber Cafe Monthly Package
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {isActive ? "Renew Cyber Subscription" : "Register Cyber Cafe Subscription"}
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              KES 500 for 30 Days of Unlimited Certificate Downloads · VAT Tax Invoice included
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubscribeSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Cyber Cafe Business Name</Label>
              <Input
                value={formData.cafeName}
                onChange={(e) => setFormData({ ...formData, cafeName: e.target.value })}
                placeholder="e.g. SpeedNet Cyber Services"
                required
                className="h-10 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Owner / Manager Name</Label>
              <Input
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                placeholder="e.g. John Mwangi"
                required
                className="h-10 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  WhatsApp Number (Lookups)
                </Label>
                <Input
                  value={formData.whatsappPhone}
                  onChange={(e) => setFormData({ ...formData, whatsappPhone: e.target.value })}
                  placeholder="e.g. 0712345678"
                  required
                  className="h-10 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  M-Pesa Payment Number
                </Label>
                <Input
                  value={formData.paymentPhone}
                  onChange={(e) => setFormData({ ...formData, paymentPhone: e.target.value })}
                  placeholder="e.g. 0712345678"
                  required
                  className="h-10 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-red-600"
                />
              </div>
            </div>

            {/* Payment Method Switcher */}
            <div className="space-y-1.5 pt-1">
              <Label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Payment Gateway</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, method: "mpesa" })}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    formData.method === "mpesa"
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs"
                      : "bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>M-Pesa STK Push</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, method: "paystack" })}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    formData.method === "paystack"
                      ? "bg-red-50 dark:bg-red-950/40 border-red-500 text-red-700 dark:text-red-300 shadow-xs"
                      : "bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-red-600" />
                  <span>Card / Paystack</span>
                </button>
              </div>
            </div>

            {/* Polling / Submitting Indicator */}
            {pollStatus && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2.5">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600 shrink-0" />
                <span className="font-semibold">{pollStatus}</span>
              </div>
            )}

            {/* Submit Action */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <span>Pay KES 500 & Activate Subscription</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }
}
