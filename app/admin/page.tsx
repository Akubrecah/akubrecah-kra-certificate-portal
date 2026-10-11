"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  DollarSign,
  Monitor,
  Smartphone,
  MessageSquare,
  FileCheck2,
  RefreshCw,
  Search,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  ArrowUpRight,
  Layers,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  CreditCard,
  Building2,
  Send,
  Lock,
  FileText,
  AlertCircle
} from "lucide-react";
import { toast } from "react-hot-toast";

interface PaystackLiveTx {
  id: string | number;
  reference: string;
  amountKes: number;
  feesKes: number;
  netKes: number;
  status: string;
  channel: string;
  currency: string;
  customerEmail?: string;
  customerPhone?: string;
  pin?: string;
  paidAt?: string;
  createdAt: string;
}

interface PaystackPayout {
  id: string | number;
  transferCode: string;
  amountKes: number;
  currency: string;
  status: string;
  reason: string;
  recipientName: string;
  createdAt: string;
}

interface OverviewData {
  timestamp: string;
  revenue: {
    total: number;
    today: number;
    sevenDays: number;
    thirtyDays: number;
    byChannel: {
      web: number;
      whatsapp: number;
    };
    byGateway: {
      mpesa: number;
      paystack: number;
    };
    averageTransactionValue: number;
  };
  paystackLive?: {
    balanceKes: number;
    currency: string;
    liveTransactionsTotalKes: number;
    livePayoutsTotalKes: number;
    transactions: PaystackLiveTx[];
    payouts: PaystackPayout[];
    totalLiveTx: number;
    totalPayouts: number;
  };
  deviceUsage: {
    totalSessions: number;
    pcSessions: number;
    mobileSessions: number;
    tabletSessions: number;
    pcPercentage: number;
    mobilePercentage: number;
    tabletPercentage: number;
    osBreakdown: Record<string, number>;
    browserBreakdown: Record<string, number>;
  };
  funnel: {
    searches: number;
    maskedViews: number;
    checkoutClicks: number;
    completedDownloads: number;
    conversionRatePercent: string;
  };
  whatsappBot: {
    totalUsers: number;
    totalConversations: number;
    activeSessions: number;
    downloadsGenerated: number;
    revenueGenerated: number;
    conversionRatePercent: string;
    recentConversations: Array<{
      id: string;
      phone: string;
      status: string;
      step: string;
      pin: string | null;
      updatedAt: string;
    }>;
  };
  transactions: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    items: Array<{
      id: string;
      pin: string;
      amount: number;
      currency: string;
      downloadType: string;
      channel: string;
      gateway: string;
      receipt: string;
      customer: string;
      status: string;
      createdAt: string;
    }>;
  };
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "paystack" | "transactions" | "whatsapp">("overview");

  // Filters & Pagination for Unified Transactions Table
  const [searchQuery, setSearchQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [gatewayFilter, setGatewayFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingPin, setDownloadingPin] = useState<string | null>(null);
  const [showBotModal, setShowBotModal] = useState(false);

  // Live On-The-Fly KRA Pin Search & Instant Download (Ephemeral - No Server Storage)
  const [quickPinInput, setQuickPinInput] = useState("");
  const [quickLookupLoading, setQuickLookupLoading] = useState(false);
  const [quickResult, setQuickResult] = useState<any | null>(null);

  const fetchOverview = async (page = 1, search = searchQuery, channel = channelFilter, gateway = gatewayFilter) => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "25",
        q: search,
        channel,
        gateway,
      });

      const res = await fetch(`/api/admin/overview?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load dashboard overview data");
      }
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        throw new Error(json.error || "Failed to load overview");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch dashboard telemetry");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverview(1);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOverview(currentPage, searchQuery, channelFilter, gatewayFilter);
    toast.success("Live metrics & Paystack gateway synced");
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
    fetchOverview(1, val, channelFilter, gatewayFilter);
  };

  const handleChannelChange = (val: string) => {
    setChannelFilter(val);
    setCurrentPage(1);
    fetchOverview(1, searchQuery, val, gatewayFilter);
  };

  const handleGatewayChange = (val: string) => {
    setGatewayFilter(val);
    setCurrentPage(1);
    fetchOverview(1, searchQuery, channelFilter, val);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchOverview(newPage, searchQuery, channelFilter, gatewayFilter);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Instant Admin PDF Download (In-Memory Streaming - Zero PDF Files Stored on Server)
  const handleInstantDownload = async (pin: string, downloadId?: string) => {
    if (!pin) return;
    setDownloadingPin(pin);
    const toastId = toast.loading(`Generating official KRA certificate for ${pin}...`);

    try {
      const res = await fetch("/api/generate-certificate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin: pin.trim().toUpperCase(),
          downloadId: downloadId || undefined,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to generate certificate");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `KRA_Certificate_${pin.trim().toUpperCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        a.remove();
        window.URL.revokeObjectURL(url);
      }, 1500);

      toast.success(`Official Certificate downloaded for ${pin}`, { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Download failed", { id: toastId });
    } finally {
      setDownloadingPin(null);
    }
  };

  // On-The-Fly Quick Lookup
  const handleQuickLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPinInput.trim()) {
      toast.error("Please enter a KRA PIN or National ID");
      return;
    }

    setQuickLookupLoading(true);
    setQuickResult(null);

    try {
      const isPin = /^[A-Za-z]\d{9}[A-Za-z]$/.test(quickPinInput.trim());
      const endpoint = isPin ? "/api/kra/live-verify/pin" : "/api/kra/live-verify/id";
      const payload = isPin
        ? { pin: quickPinInput.trim().toUpperCase() }
        : { idNumber: quickPinInput.trim() };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Taxpayer record not found");
      }

      setQuickResult(json.data);
      toast.success(`Found record for ${json.data.name || quickPinInput}`);
    } catch (err: any) {
      toast.error(err.message || "Taxpayer lookup failed");
    } finally {
      setQuickLookupLoading(false);
    }
  };

  const handleClearQuickLookup = () => {
    setQuickPinInput("");
    setQuickResult(null);
  };

  const handleExportCsv = () => {
    if (!data?.transactions.items || data.transactions.items.length === 0) {
      toast.error("No transactions to export");
      return;
    }

    const headers = ["Transaction ID", "KRA PIN", "Amount (KES)", "Channel", "Gateway", "Receipt", "Customer", "Date"];
    const rows = data.transactions.items.map((t) => [
      t.id,
      t.pin,
      t.amount,
      t.channel,
      t.gateway,
      t.receipt,
      t.customer,
      new Date(t.createdAt).toISOString(),
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Akubrecah_Transactions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV export downloaded");
  };

  if (loading && !data) {
    return (
      <div className="p-6 md:p-8 space-y-8 animate-pulse">
        <div className="h-10 bg-surface-container rounded-2xl w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-surface-container rounded-3xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-surface-container rounded-3xl" />
          <div className="h-80 bg-surface-container rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!data && !loading) {
    return (
      <div className="p-8 max-w-xl mx-auto my-16 bg-surface-container-low border border-outline-variant rounded-3xl text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-on-surface">Telemetry Data Not Available</h2>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Unable to synchronize dashboard telemetry. Please ensure your admin session is active and click retry below.
        </p>
        <button
          onClick={handleRefresh}
          className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/90 transition-all shadow-md"
        >
          Retry Sync
        </button>
      </div>
    );
  }
  const rev = data?.revenue;
  const payLive = data?.paystackLive;
  const dev = data?.deviceUsage;
  const fnl = data?.funnel;
  const bot = data?.whatsappBot;
  const txs = data?.transactions;

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-[1600px] mx-auto space-y-6 md:space-y-8 text-on-surface relative">
      {/* Subtle ambient red spotlight blur matching the website hero */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full filter blur-[120px] pointer-events-none" />

      {/* 1. Header & Live Controls matching website design */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/60 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center flex-wrap gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-xs font-black text-primary uppercase tracking-widest shadow-xs">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Official Portal Administration
            </div>
            <span className="text-xs font-mono text-on-surface-variant flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Synced: {data?.timestamp ? new Date(data.timestamp).toLocaleTimeString("en-KE") : "Just now"}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-on-surface tracking-tight leading-tight">
            Executive Command & <span className="text-primary">Gateway Intelligence</span>
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-3xl leading-relaxed">
            Real-time financial reconciliation matching Paystack live balances & payouts, user click telemetry, 
            PC vs mobile device distribution, and WhatsApp bot commands.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* WhatsApp Bot Guide Button */}
          <button
            onClick={() => setShowBotModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs hover:bg-emerald-700 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Bot Admin Commands</span>
          </button>

          {/* Sync / Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container border border-outline-variant text-xs font-bold text-on-surface hover:bg-surface-container-high transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-primary" : ""}`} />
            <span>Sync Live Telemetry</span>
          </button>
        </div>
      </div>

      {/* Ephemeral PDF Policy Notice Banner */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-surface-container border border-outline-variant/60 flex items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start sm:items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
          <span className="text-on-surface-variant">
            <strong className="text-on-surface font-bold">Zero Server Storage Policy:</strong> Certificates are streamed directly on-the-fly via in-memory buffers. No loaded KRA PIN PDFs are stored on the server. You can search another PIN fresh anytime.
          </span>
        </div>
        <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shrink-0">
          RAM Stream Only
        </span>
      </div>

      {/* 2. Top Segmented Navigation Tabs matching website */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-surface-container border border-outline-variant/60 overflow-x-auto">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === "overview"
              ? "bg-primary text-white shadow-xs"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Executive Overview</span>
        </button>

        <button
          onClick={() => setActiveTab("paystack")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === "paystack"
              ? "bg-primary text-white shadow-xs"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Paystack Gateway & Payouts</span>
          {payLive?.balanceKes !== undefined && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-mono">
              KES {payLive.balanceKes.toLocaleString()}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("transactions")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === "transactions"
              ? "bg-primary text-white shadow-xs"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>All Transactions & Instant Downloads</span>
        </button>

        <button
          onClick={() => setActiveTab("whatsapp")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === "whatsapp"
              ? "bg-primary text-white shadow-xs"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>WhatsApp Bot Telemetry</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono">
            {bot?.totalUsers || 0} users
          </span>
        </button>
      </div>

      {/* 3. Top Financial & Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Gross Revenue & Paystack Match */}
        <div className="bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Gross Revenue</span>
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight">
              KES {(rev?.total || 0).toLocaleString()}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                <TrendingUp className="w-3 h-3" />
                +KES {(rev?.today || 0).toLocaleString()} today
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-outline-variant/40 flex items-center justify-between text-[11px] text-on-surface-variant">
            <span>Paystack: KES {(rev?.byGateway?.paystack || 0).toLocaleString()}</span>
            <span>M-Pesa (Legacy): KES {(rev?.byGateway?.mpesa || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Card 2: Paystack Real-Time Balance */}
        <div className="bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Paystack Available Balance</span>
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-600">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight">
              KES {(payLive?.balanceKes || 0).toLocaleString()}
            </div>
            <div className="text-xs text-on-surface-variant mt-2 flex items-center justify-between">
              <span>Settled Payouts:</span>
              <strong className="text-on-surface font-mono">KES {(payLive?.livePayoutsTotalKes || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</strong>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-outline-variant/40 flex items-center justify-between text-[11px] text-on-surface-variant">
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Live from Gateway
            </span>
            <a
              href="https://dashboard.paystack.com"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline font-bold flex items-center gap-0.5"
            >
              Dashboard <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Card 3: PC (Desktop) vs Mobile Usage */}
        <div className="bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Device Distribution</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Monitor className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight flex items-baseline gap-2">
              <span>{dev?.pcPercentage || 65}%</span>
              <span className="text-sm font-bold text-on-surface-variant">PC (Desktop)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-surface-container-highest mt-3 overflow-hidden flex">
              <div 
                className="bg-primary h-full transition-all duration-500" 
                style={{ width: `${dev?.pcPercentage || 65}%` }} 
                title="PC Desktop Sessions"
              />
              <div 
                className="bg-amber-500 h-full transition-all duration-500" 
                style={{ width: `${dev?.mobilePercentage || 30}%` }} 
                title="Mobile Sessions"
              />
              <div 
                className="bg-sky-500 h-full transition-all duration-500" 
                style={{ width: `${dev?.tabletPercentage || 5}%` }} 
                title="Tablet Sessions"
              />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-outline-variant/40 flex items-center justify-between text-[11px] text-on-surface-variant font-mono">
            <span>PC: {dev?.pcSessions || 0}</span>
            <span>Mobile: {dev?.mobileSessions || 0}</span>
            <span>Sessions: {dev?.totalSessions || 0}</span>
          </div>
        </div>

        {/* Card 4: WhatsApp Bot Operations */}
        <div className="bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">WhatsApp Bot Adoption</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/10 flex items-center justify-center text-emerald-600">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight">
              {(bot?.totalUsers || 0).toLocaleString()}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-on-surface-variant">
                <strong className="text-on-surface font-bold">{bot?.downloadsGenerated || 0}</strong> certificates ordered via bot
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-outline-variant/40 flex items-center justify-between text-[11px] text-on-surface-variant">
            <span>Conversion: {bot?.conversionRatePercent || "0"}%</span>
            <span>Bot Sales: KES {(bot?.revenueGenerated || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* 4. TAB CONTENT: EXECUTIVE OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Quick On-Demand Live KRA Certificate Generator Toolbar */}
          <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-3xl border border-outline-variant shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-outline-variant/60">
              <div>
                <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-primary" />
                  Live On-Demand Certificate Generator
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Instantly verify any KRA PIN or National ID and stream an authentic compliance PDF without server file retention.
                </p>
              </div>
              <span className="text-[11px] font-mono font-bold text-primary px-2.5 py-1 rounded-lg bg-primary/10">
                Admin Instant Tool
              </span>
            </div>

            <form onSubmit={handleQuickLookup} className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-grow w-full">
                <Search className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={quickPinInput}
                  onChange={(e) => setQuickPinInput(e.target.value)}
                  placeholder="Enter KRA PIN (e.g. A012345678Z) or National ID (e.g. 12345678)..."
                  className="w-full h-11 pl-10 pr-3 rounded-xl bg-surface-container text-xs sm:text-sm text-on-surface placeholder:text-on-surface-variant/60 border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary uppercase"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="submit"
                  disabled={quickLookupLoading}
                  className="flex-grow sm:flex-grow-0 h-11 px-5 rounded-xl bg-primary text-white text-xs sm:text-sm font-bold shadow-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap"
                >
                  {quickLookupLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>Lookup Record</span>
                </button>

                {quickResult && (
                  <button
                    type="button"
                    onClick={handleClearQuickLookup}
                    className="h-11 px-3.5 rounded-xl bg-surface-container border border-outline-variant text-xs font-bold text-on-surface-variant hover:text-on-surface"
                  >
                    Clear & Search Another
                  </button>
                )}
              </div>
            </form>

            {/* Quick Record Preview & Instant Download Card */}
            {quickResult && (
              <div className="mt-4 p-4 rounded-2xl bg-surface-container border border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-200">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-primary">{quickResult.pin}</span>
                    <span className="font-bold text-on-surface text-sm">{quickResult.name}</span>
                  </div>
                  <div className="text-on-surface-variant flex items-center flex-wrap gap-x-4 gap-y-1">
                    <span>Station: <strong>{quickResult.station || "N/A"}</strong></span>
                    <span>County: <strong>{quickResult.county || "N/A"}</strong></span>
                    <span>ID: <strong>{quickResult.id_number || quickResult.idNumber || "N/A"}</strong></span>
                  </div>
                </div>

                <button
                  onClick={() => handleInstantDownload(quickResult.pin)}
                  disabled={downloadingPin === quickResult.pin}
                  className="h-10 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-xs shrink-0 disabled:opacity-50"
                >
                  {downloadingPin === quickResult.pin ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>Download Certificate PDF</span>
                </button>
              </div>
            )}
          </div>

          {/* PC Usage Breakdown & User Clicks Funnel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-surface-container-lowest p-5 sm:p-6 rounded-3xl border border-outline-variant shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/60">
                <div>
                  <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-primary" />
                    PC (Desktop) vs Mobile Platform Distribution
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    Analysis of cyber cafe / workstation PCs compared to smartphones accessing the portal.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-primary px-2.5 py-1 rounded-lg bg-primary/10">
                  {dev?.pcPercentage || 65}% PC Traffic
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="flex items-center gap-1.5 text-on-surface">
                      <Monitor className="w-3.5 h-3.5 text-primary" />
                      <strong>Desktop / PC Workstations</strong>
                    </span>
                    <span className="font-mono text-on-surface-variant">
                      {dev?.pcSessions || 0} sessions ({dev?.pcPercentage || 65}%)
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-surface-container overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-700"
                      style={{ width: `${dev?.pcPercentage || 65}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="flex items-center gap-1.5 text-on-surface">
                      <Smartphone className="w-3.5 h-3.5 text-amber-500" />
                      <strong>Smartphones & Mobile Devices</strong>
                    </span>
                    <span className="font-mono text-on-surface-variant">
                      {dev?.mobileSessions || 0} sessions ({dev?.mobilePercentage || 35}%)
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-surface-container overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-700"
                      style={{ width: `${dev?.mobilePercentage || 35}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* OS and Browser Distribution */}
              <div className="pt-4 border-t border-outline-variant/50 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block mb-2">
                    Operating Systems
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(dev?.osBreakdown || {}).map(([os, count]) => (
                      <span
                        key={os}
                        className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-surface-container text-on-surface border border-outline-variant/50"
                      >
                        <span>{os}:</span>
                        <strong className="font-mono">{count}</strong>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block mb-2">
                    Client Browsers
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(dev?.browserBreakdown || {}).map(([browser, count]) => (
                      <span
                        key={browser}
                        className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-surface-container text-on-surface border border-outline-variant/50"
                      >
                        <span>{browser}:</span>
                        <strong className="font-mono">{count}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* User Clicks & Conversion Funnel */}
            <div className="lg:col-span-5 bg-surface-container-lowest p-5 sm:p-6 rounded-3xl border border-outline-variant shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/60">
                <div>
                  <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    User Click Funnel
                  </h2>
                  <p className="text-xs text-on-surface-variant">Interaction flow from search query to downloaded PDF.</p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  {fnl?.conversionRatePercent || "0"}% Conversion
                </span>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-2xl bg-surface-container border border-outline-variant/50 flex items-center justify-between text-xs">
                  <span className="font-medium text-on-surface">1. Searches Initiated</span>
                  <span className="font-mono font-black text-on-surface text-sm">{fnl?.searches || 0}</span>
                </div>

                <div className="p-3 rounded-2xl bg-surface-container border border-outline-variant/50 flex items-center justify-between text-xs">
                  <span className="font-medium text-on-surface">2. Masked Profiles Viewed</span>
                  <div className="text-right">
                    <span className="font-mono font-black text-on-surface text-sm block">{fnl?.maskedViews || 0}</span>
                    <span className="text-[10px] text-emerald-600 font-bold">
                      {fnl?.searches ? Math.round(((fnl.maskedViews || 0) / fnl.searches) * 100) : 0}% of search
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-surface-container border border-outline-variant/50 flex items-center justify-between text-xs">
                  <span className="font-medium text-on-surface">3. Checkout Clicks</span>
                  <div className="text-right">
                    <span className="font-mono font-black text-on-surface text-sm block">{fnl?.checkoutClicks || 0}</span>
                    <span className="text-[10px] text-amber-600 font-bold">
                      {fnl?.maskedViews ? Math.round(((fnl.checkoutClicks || 0) / fnl.maskedViews) * 100) : 0}% of previews
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-between text-xs">
                  <span className="font-bold text-primary">4. Final Certificates Issued</span>
                  <div className="text-right">
                    <span className="font-mono font-black text-primary text-sm block">{fnl?.completedDownloads || 0}</span>
                    <span className="text-[10px] text-primary font-bold">
                      {fnl?.conversionRatePercent || "0"}% total rate
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB CONTENT: PAYSTACK LIVE GATEWAY & PAYOUTS */}
      {activeTab === "paystack" && (
        <div className="space-y-6">
          {/* Paystack Financial Reconciled Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-xs">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                Available Paystack Balance
              </span>
              <div className="text-3xl font-black text-on-surface tracking-tight font-mono">
                KES {(payLive?.balanceKes || 0).toLocaleString()}
              </div>
              <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Reconciled live with Paystack API
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-xs">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                Total Payouts / Transfers
              </span>
              <div className="text-3xl font-black text-on-surface tracking-tight font-mono">
                KES {(payLive?.livePayoutsTotalKes || 0).toLocaleString()}
              </div>
              <p className="text-xs text-on-surface-variant mt-2">
                Settled to designated Bank / M-Pesa accounts
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-xs">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                Live Gateway Transactions
              </span>
              <div className="text-3xl font-black text-on-surface tracking-tight font-mono">
                KES {(payLive?.liveTransactionsTotalKes || 0).toLocaleString()}
              </div>
              <p className="text-xs text-on-surface-variant mt-2">
                Total volume processed through Paystack
              </p>
            </div>
          </div>

          {/* Paystack Transfers / Payouts History Table */}
          <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant overflow-hidden shadow-xs">
            <div className="p-5 border-b border-outline-variant/60 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-on-surface">Paystack Settlement & Payout History</h3>
                <p className="text-xs text-on-surface-variant">
                  Official bank and till transfers executed by Paystack for your account.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-lg">
                {payLive?.payouts.length || 0} Transfers
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container text-on-surface-variant font-bold uppercase text-[10px] tracking-wider border-b border-outline-variant">
                  <tr>
                    <th className="py-3 px-4">Transfer Code</th>
                    <th className="py-3 px-4">Recipient Account</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Reason / Notes</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/60">
                  {payLive?.payouts && payLive.payouts.length > 0 ? (
                    payLive.payouts.map((p) => (
                      <tr key={p.id} className="hover:bg-surface-container/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-primary">
                          {p.transferCode}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-on-surface">
                          {p.recipientName}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-on-surface">
                          KES {p.amountKes.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-on-surface-variant">
                          {p.reason}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === "success"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                          }`}>
                            <CheckCircle2 className="w-3 h-3" /> {p.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-on-surface-variant">
                          {new Date(p.createdAt).toLocaleDateString("en-KE")}{" "}
                          {new Date(p.createdAt).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-on-surface-variant">
                        No payout or transfer records found on Paystack yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paystack Real-Time Transactions Table */}
          <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant overflow-hidden shadow-xs">
            <div className="p-5 border-b border-outline-variant/60 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-on-surface">Paystack Gateway Live Transactions</h3>
                <p className="text-xs text-on-surface-variant">
                  Direct transaction feed from Paystack API showing customer payments, fees, and channels.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-lg">
                {payLive?.transactions.length || 0} Records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container text-on-surface-variant font-bold uppercase text-[10px] tracking-wider border-b border-outline-variant">
                  <tr>
                    <th className="py-3 px-4">Paystack Reference</th>
                    <th className="py-3 px-4">Customer Email / Phone</th>
                    <th className="py-3 px-4">Channel</th>
                    <th className="py-3 px-4">Gross Amount</th>
                    <th className="py-3 px-4">Gateway Fees</th>
                    <th className="py-3 px-4">Net Payout</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/60">
                  {payLive?.transactions && payLive.transactions.length > 0 ? (
                    payLive.transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-surface-container/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-primary">
                          {tx.reference}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-on-surface">
                          {tx.customerEmail || tx.customerPhone || "Guest"}
                        </td>
                        <td className="py-3.5 px-4 uppercase font-medium text-on-surface-variant">
                          {tx.channel}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-on-surface">
                          KES {tx.amountKes.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-on-surface-variant">
                          KES {tx.feesKes.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">
                          KES {tx.netKes.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.status === "success"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                          }`}>
                            <CheckCircle2 className="w-3 h-3" /> {tx.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-on-surface-variant">
                          {new Date(tx.paidAt || tx.createdAt).toLocaleDateString("en-KE")}{" "}
                          {new Date(tx.paidAt || tx.createdAt).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-on-surface-variant">
                        No transactions found directly on Paystack.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB CONTENT: ALL TRANSACTION LOGS & INSTANT PDF DOWNLOADS */}
      {activeTab === "transactions" && (
        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant overflow-hidden shadow-xs">
          <div className="p-4 sm:p-6 border-b border-outline-variant/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-on-surface">Unified Real-Time Transaction Logs</h2>
              <p className="text-xs text-on-surface-variant">
                Official audit history of all certificate downloads across Web & WhatsApp. Instant 1-click certificate download available for admin.
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-2.5">
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search PIN, receipt, customer..."
                  className="w-full h-9 pl-9 pr-3 rounded-xl bg-surface-container text-xs text-on-surface placeholder:text-on-surface-variant/60 border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <select
                value={channelFilter}
                onChange={(e) => handleChannelChange(e.target.value)}
                className="h-9 px-3 rounded-xl bg-surface-container text-xs text-on-surface border border-outline-variant focus:outline-none"
              >
                <option value="all">All Channels</option>
                <option value="web">Web Portal</option>
                <option value="whatsapp">WhatsApp Bot</option>
              </select>

              <select
                value={gatewayFilter}
                onChange={(e) => handleGatewayChange(e.target.value)}
                className="h-9 px-3 rounded-xl bg-surface-container text-xs text-on-surface border border-outline-variant focus:outline-none"
              >
                <option value="all">All Gateways</option>
                <option value="mpesa">M-Pesa STK</option>
                <option value="paystack">Paystack</option>
              </select>

              <button
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary/90 transition-all focus:outline-none"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container text-on-surface-variant font-bold uppercase text-[10px] tracking-wider border-b border-outline-variant">
                <tr>
                  <th className="py-3 px-4">KRA PIN</th>
                  <th className="py-3 px-4">Customer Identifier</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Gateway</th>
                  <th className="py-3 px-4">Receipt Ref</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60">
                {txs?.items && txs.items.length > 0 ? (
                  txs.items.map((tx) => (
                    <tr key={tx.id} className="hover:bg-surface-container/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-primary">
                        {tx.pin}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-on-surface">
                        {tx.customer}
                      </td>
                      <td className="py-3.5 px-4">
                        {tx.channel === "whatsapp" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            <MessageSquare className="w-3 h-3" /> Bot
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-surface-container-high text-on-surface border border-outline-variant">
                            <Monitor className="w-3 h-3" /> Web
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-on-surface">
                        {tx.gateway}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span>{tx.receipt}</span>
                          <button
                            onClick={() => handleCopy(tx.receipt, tx.id)}
                            className="p-1 hover:bg-surface-container-highest rounded text-on-surface-variant"
                            title="Copy Receipt"
                          >
                            {copiedId === tx.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-on-surface">
                        KES {tx.amount}.00
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" /> COMPLETED
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-on-surface-variant font-mono text-[11px]">
                        {new Date(tx.createdAt).toLocaleDateString("en-KE")}{" "}
                        {new Date(tx.createdAt).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleInstantDownload(tx.pin, tx.id)}
                          disabled={downloadingPin === tx.pin}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all text-xs font-bold border border-primary/20 disabled:opacity-50 whitespace-nowrap"
                          title="Generate and stream authentic KRA PDF"
                        >
                          {downloadingPin === tx.pin ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          <span>Download PDF</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-on-surface-variant">
                      No transaction records match the selected filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {txs && txs.totalPages > 1 && (
            <div className="p-4 border-t border-outline-variant/60 flex items-center justify-between text-xs text-on-surface-variant">
              <span>
                Showing page <strong>{txs.page}</strong> of <strong>{txs.totalPages}</strong> (
                <strong>{txs.total}</strong> total logs)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="p-2 rounded-xl border border-outline-variant bg-surface-container disabled:opacity-40 hover:bg-surface-container-high transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= txs.totalPages}
                  className="p-2 rounded-xl border border-outline-variant bg-surface-container disabled:opacity-40 hover:bg-surface-container-high transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7. TAB CONTENT: WHATSAPP BOT TELEMETRY */}
      {activeTab === "whatsapp" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-surface-container-lowest p-5 sm:p-6 rounded-3xl border border-outline-variant shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/60">
              <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                WhatsApp Bot Active Telemetry
              </h2>
              <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                Evolution API Connected
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/50">
                <span className="text-[11px] text-on-surface-variant font-bold block mb-1">Total Bot Users</span>
                <span className="text-2xl font-black text-on-surface font-mono">{bot?.totalUsers || 0}</span>
                <span className="text-[10px] text-on-surface-variant block mt-1">Unique Phone Numbers</span>
              </div>

              <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/50">
                <span className="text-[11px] text-on-surface-variant font-bold block mb-1">Total Conversations</span>
                <span className="text-2xl font-black text-on-surface font-mono">{bot?.totalConversations || 0}</span>
                <span className="text-[10px] text-on-surface-variant block mt-1">Interactive Sessions</span>
              </div>

              <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/50">
                <span className="text-[11px] text-on-surface-variant font-bold block mb-1">Bot Orders Fulfilled</span>
                <span className="text-2xl font-black text-emerald-600 font-mono">{bot?.downloadsGenerated || 0}</span>
                <span className="text-[10px] text-emerald-600 block mt-1 font-semibold">{bot?.conversionRatePercent || "0"}% Conversion</span>
              </div>

              <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/50">
                <span className="text-[11px] text-on-surface-variant font-bold block mb-1">Bot-Driven Revenue</span>
                <span className="text-2xl font-black text-on-surface font-mono">KES {(bot?.revenueGenerated || 0).toLocaleString()}</span>
                <span className="text-[10px] text-on-surface-variant block mt-1">M-Pesa STK Orders</span>
              </div>
            </div>

            {/* Admin Command Reference Card */}
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
              <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                <Zap className="w-4 h-4" /> Direct Mobile WhatsApp Management
              </span>
              <p className="text-xs text-on-surface-variant">
                Send <code className="font-bold text-primary">!admin 8426</code> to the bot from your phone to unlock live reports, revenue stats, and one-click magic login links on-demand.
              </p>
            </div>
          </div>

          {/* Recent WhatsApp Conversations Feed */}
          <div className="lg:col-span-6 bg-surface-container-lowest p-5 sm:p-6 rounded-3xl border border-outline-variant shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/60">
              <h2 className="text-base font-bold text-on-surface">Recent Bot Conversations Feed</h2>
              <span className="text-xs text-on-surface-variant">Real-time taxpayer activity</span>
            </div>

            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {bot?.recentConversations && bot.recentConversations.length > 0 ? (
                bot.recentConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-mono font-bold text-on-surface flex items-center gap-2">
                        <span>+{conv.phone}</span>
                        {conv.pin && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-primary/10 text-primary font-bold">
                            {conv.pin}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-on-surface-variant block mt-0.5">
                        Current Step: <strong className="text-on-surface">{conv.step}</strong>
                      </span>
                    </div>
                    <span className="text-[11px] text-on-surface-variant font-mono">
                      {new Date(conv.updatedAt).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-xs text-on-surface-variant">
                  No active WhatsApp bot conversations found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 8. WhatsApp Bot Modal */}
      {showBotModal && (
        <div className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest max-w-lg w-full rounded-3xl border border-outline-variant shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-on-surface">WhatsApp Bot Admin Commands</h3>
              </div>
              <button
                onClick={() => setShowBotModal(false)}
                className="text-on-surface-variant hover:text-on-surface p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-on-surface-variant">
              Manage this portal directly from WhatsApp! Text any of these commands to the official bot number:
            </p>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-surface-container border border-outline-variant/50">
                <strong className="text-primary">!admin 8426</strong>
                <p className="text-[11px] text-on-surface-variant font-sans mt-0.5">
                  Authenticates your phone as Super Admin (default PIN is 8426 or set in ADMIN_BOT_PIN).
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-surface-container border border-outline-variant/50">
                <strong className="text-emerald-600">!stats</strong>
                <p className="text-[11px] text-on-surface-variant font-sans mt-0.5">
                  Instant executive KPIs (Gross revenue, today revenue, total downloads, PC vs mobile ratio).
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-surface-container border border-outline-variant/50">
                <strong className="text-emerald-600">!revenue</strong>
                <p className="text-[11px] text-on-surface-variant font-sans mt-0.5">
                  Detailed revenue report (Today, 7 days, 30 days, M-Pesa STK vs Paystack splits).
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-surface-container border border-outline-variant/50">
                <strong className="text-emerald-600">!logs</strong>
                <p className="text-[11px] text-on-surface-variant font-sans mt-0.5">
                  Displays the latest 5 transaction receipts, PINs, and timestamps.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-surface-container border border-outline-variant/50">
                <strong className="text-emerald-600">!link</strong>
                <p className="text-[11px] text-on-surface-variant font-sans mt-0.5">
                  Generates a secure 1-click magic link to open this Web Admin Dashboard directly on your phone browser!
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowBotModal(false)}
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
