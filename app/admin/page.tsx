"use client";

import { useState, useEffect, useTransition } from "react";
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
  Zap
} from "lucide-react";
import { toast } from "react-hot-toast";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [gatewayFilter, setGatewayFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showBotModal, setShowBotModal] = useState(false);

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
    toast.success("Telemetry updated");
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

  const rev = data?.revenue;
  const dev = data?.deviceUsage;
  const fnl = data?.funnel;
  const bot = data?.whatsappBot;
  const txs = data?.transactions;

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-[1600px] mx-auto space-y-6 md:space-y-8 text-on-surface">
      {/* 1. Header & Live Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-outline-variant/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Telemetry & Sync Active
            </span>
            <span className="text-xs text-on-surface-variant font-mono">
              {data?.timestamp ? new Date(data.timestamp).toLocaleTimeString("en-KE") : ""}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight">
            Executive Command & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant">
            Full-spectrum financial logs, desktop vs mobile engagement, and WhatsApp bot operations.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* WhatsApp Bot Quick Access Button */}
          <button
            onClick={() => setShowBotModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-sm hover:bg-emerald-700 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Bot Admin Commands</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container border border-outline-variant text-xs font-bold text-on-surface hover:bg-surface-container-high transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-primary" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Top Executive KPI Cards (4 Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total & Today's Revenue */}
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
            <span>M-Pesa: KES {(rev?.byGateway.mpesa || 0).toLocaleString()}</span>
            <span>Paystack: KES {(rev?.byGateway.paystack || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Card 2: Certificate Transactions */}
        <div className="bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Downloads Fulfilled</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight">
              {(fnl?.completedDownloads || 0).toLocaleString()}
            </div>
            <div className="text-xs text-on-surface-variant mt-2 flex items-center gap-1.5">
              <span className="font-bold text-on-surface">Avg Value:</span>
              <span>KES {rev?.averageTransactionValue || 30}.00</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-outline-variant/40 flex items-center justify-between text-[11px] text-on-surface-variant">
            <span>Web: {rev ? Math.round(((rev.byChannel.web) / (rev.total || 1)) * 100) : 0}%</span>
            <span>WhatsApp Bot: {rev ? Math.round(((rev.byChannel.whatsapp) / (rev.total || 1)) * 100) : 0}%</span>
          </div>
        </div>

        {/* Card 3: PC vs Mobile Usage */}
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
            {/* Visual ratio bar */}
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
            <span>Total: {dev?.totalSessions || 0}</span>
          </div>
        </div>

        {/* Card 4: WhatsApp Bot Intelligence */}
        <div className="bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">WhatsApp Bot Users</span>
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
                <strong className="text-on-surface">{bot?.downloadsGenerated || 0}</strong> downloads generated
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-outline-variant/40 flex items-center justify-between text-[11px] text-on-surface-variant">
            <span>Conversion: {bot?.conversionRatePercent || "0"}%</span>
            <span>Bot Sales: KES {(bot?.revenueGenerated || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* 3. Middle Section: PC Usage & User Click Funnel Insights + WhatsApp Bot Center */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): PC/Device Telemetry & Click Conversion Funnel */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card: PC (Desktop) vs Mobile Insights */}
          <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-3xl border border-outline-variant shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-outline-variant/60">
              <div>
                <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-primary" />
                  PC Usage & Platform Breakdown
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Telemetry on users operating on Desktop PCs, laptops vs mobile phones.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-primary px-2.5 py-1 rounded-lg bg-primary/10">
                {dev?.pcPercentage || 65}% PC Dominance
              </span>
            </div>

            {/* Platform Comparison Bars */}
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
                    <strong>Smartphones & Tablets</strong>
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

            {/* Operating Systems & Browsers Pills */}
            <div className="mt-5 pt-4 border-t border-outline-variant/50 grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {/* Card: User Clicks & Conversion Funnel */}
          <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-3xl border border-outline-variant shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-outline-variant/60">
              <div>
                <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  User Clicks & Conversion Funnel
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Step-by-step clickdrop analysis from search initiation to downloaded certificates.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                {fnl?.conversionRatePercent || "0"}% Conversion
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/60 flex flex-col justify-between">
                <span className="text-[11px] text-on-surface-variant font-medium">1. Searches</span>
                <span className="text-xl font-black text-on-surface mt-1">{fnl?.searches || 0}</span>
                <span className="text-[10px] text-on-surface-variant mt-1">100% Top of Funnel</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/60 flex flex-col justify-between">
                <span className="text-[11px] text-on-surface-variant font-medium">2. Masked Previews</span>
                <span className="text-xl font-black text-on-surface mt-1">{fnl?.maskedViews || 0}</span>
                <span className="text-[10px] text-emerald-600 font-bold mt-1">
                  {fnl?.searches ? Math.round(((fnl.maskedViews || 0) / fnl.searches) * 100) : 0}% of searches
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/60 flex flex-col justify-between">
                <span className="text-[11px] text-on-surface-variant font-medium">3. Checkout Starts</span>
                <span className="text-xl font-black text-on-surface mt-1">{fnl?.checkoutClicks || 0}</span>
                <span className="text-[10px] text-amber-600 font-bold mt-1">
                  {fnl?.maskedViews ? Math.round(((fnl.checkoutClicks || 0) / fnl.maskedViews) * 100) : 0}% of previews
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col justify-between">
                <span className="text-[11px] text-primary font-bold">4. Downloads</span>
                <span className="text-xl font-black text-primary mt-1">{fnl?.completedDownloads || 0}</span>
                <span className="text-[10px] text-primary font-bold mt-1">
                  {fnl?.conversionRatePercent || "0"}% Final Conversion
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): WhatsApp Bot Operations & Revenue Split */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card: Web vs WhatsApp Channel Share */}
          <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-3xl border border-outline-variant shadow-xs">
            <h2 className="text-base font-bold text-on-surface mb-1 flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Channel Revenue Distribution
            </h2>
            <p className="text-xs text-on-surface-variant mb-4">
              Real-time balance between Web Portal conversions and WhatsApp Bot orders.
            </p>

            <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/60 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-bold text-on-surface">
                  <Monitor className="w-3.5 h-3.5 text-primary" /> Web Portal
                </span>
                <span className="font-mono font-bold text-on-surface">
                  KES {(rev?.byChannel.web || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                  <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Bot
                </span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  KES {(rev?.byChannel.whatsapp || 0).toLocaleString()}
                </span>
              </div>

              <div className="w-full h-2.5 rounded-full bg-surface-container-highest overflow-hidden flex">
                <div
                  className="bg-primary h-full"
                  style={{
                    width: `${rev?.total ? Math.round(((rev.byChannel.web) / rev.total) * 100) : 75}%`,
                  }}
                />
                <div
                  className="bg-emerald-600 h-full"
                  style={{
                    width: `${rev?.total ? Math.round(((rev.byChannel.whatsapp) / rev.total) * 100) : 25}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Card: Recent WhatsApp Bot Conversations */}
          <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-3xl border border-outline-variant shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-outline-variant/60">
              <div>
                <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  Recent WhatsApp Bot Users
                </h2>
                <p className="text-xs text-on-surface-variant">Live feed of taxpayers consulting the WhatsApp agent.</p>
              </div>
              <button
                onClick={() => setShowBotModal(true)}
                className="text-xs text-primary hover:underline font-bold"
              >
                Admin Guide
              </button>
            </div>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {bot?.recentConversations && bot.recentConversations.length > 0 ? (
                bot.recentConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="p-3 rounded-2xl bg-surface-container border border-outline-variant/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-mono font-bold text-on-surface flex items-center gap-1.5">
                        <span>+{conv.phone}</span>
                        {conv.pin && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary font-bold">
                            {conv.pin}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-on-surface-variant">
                        Step: <span className="font-semibold">{conv.step}</span>
                      </span>
                    </div>
                    <span className="text-[10px] text-on-surface-variant font-mono">
                      {new Date(conv.updatedAt).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-on-surface-variant">
                  No WhatsApp bot conversations recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Unified Live Transaction Logs Table */}
      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant overflow-hidden shadow-xs">
        {/* Table Header & Search/Filters */}
        <div className="p-4 sm:p-6 border-b border-outline-variant/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-on-surface">Unified Real-Time Transaction Logs</h2>
            <p className="text-xs text-on-surface-variant">
              Comprehensive financial records across M-Pesa STK push and Paystack for all downloaded certificates.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {/* Search Input */}
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

            {/* Channel Filter */}
            <select
              value={channelFilter}
              onChange={(e) => handleChannelChange(e.target.value)}
              className="h-9 px-3 rounded-xl bg-surface-container text-xs text-on-surface border border-outline-variant focus:outline-none"
            >
              <option value="all">All Channels</option>
              <option value="web">Web Portal</option>
              <option value="whatsapp">WhatsApp Bot</option>
            </select>

            {/* Gateway Filter */}
            <select
              value={gatewayFilter}
              onChange={(e) => handleGatewayChange(e.target.value)}
              className="h-9 px-3 rounded-xl bg-surface-container text-xs text-on-surface border border-outline-variant focus:outline-none"
            >
              <option value="all">All Gateways</option>
              <option value="mpesa">M-Pesa STK</option>
              <option value="paystack">Paystack</option>
            </select>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary/90 transition-all focus:outline-none"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container text-on-surface-variant font-bold uppercase text-[10px] tracking-wider border-b border-outline-variant">
              <tr>
                <th className="py-3 px-4">KRA PIN</th>
                <th className="py-3 px-4">Customer Identifier</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Payment Gateway</th>
                <th className="py-3 px-4">M-Pesa / Receipt Ref</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Date & Time</th>
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
                    <td className="py-3.5 px-4 text-right text-on-surface-variant font-mono">
                      {new Date(tx.createdAt).toLocaleDateString("en-KE")}{" "}
                      {new Date(tx.createdAt).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-on-surface-variant">
                    No transactions match the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
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

      {/* 5. Modal: WhatsApp Bot Admin Command Guide */}
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
              You can query and manage this entire dashboard directly from your WhatsApp phone! Send any of the following commands to the official bot number:
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
