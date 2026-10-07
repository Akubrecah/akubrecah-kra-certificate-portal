"use client";

import { useState, useEffect } from "react";
import { 
  BadgeCheck, 
  Search, 
  RefreshCw, 
  Download, 
  FileText, 
  ShieldCheck, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  UserCheck, 
  ExternalLink,
  Copy,
  Check,
  Eye,
  AlertCircle,
  Database,
  ArrowUpDown,
  FileSpreadsheet
} from "lucide-react";
import { toast } from "react-hot-toast";

interface TaxpayerRecord {
  id: string;
  pin: string;
  id_number: string | null;
  name: string;
  email: string | null;
  phone_number: string | null;
  station: string | null;
  county: string | null;
  city: string | null;
  district: string | null;
  tax_area: string | null;
  building: string | null;
  street: string | null;
  po_box: string | null;
  postal_code: string | null;
  registered_date: string | null;
  created_at: string;
  updated_at: string;
}

interface CertificateDownloadRecord {
  id: string;
  userId: string;
  clerkId: string;
  pin: string;
  downloadType: string;
  amountCharged: number;
  currency: string;
  mpesaReceipt: string | null;
  checkoutId: string | null;
  createdAt: string;
  users?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}

interface SystemLogEntry {
  id: string;
  timestamp: string;
  level: string;
  service: string;
  message: string;
  actor: string;
  ip: string;
  details: any;
}

export default function KraRetrievalsAdminPage() {
  const [data, setData] = useState<{
    stats: {
      totalTaxpayers: number;
      totalDownloads: number;
      totalRevenueKes: number;
      recentDownloadsCount: number;
      recentTaxpayersCount: number;
    };
    taxpayers: TaxpayerRecord[];
    downloads: CertificateDownloadRecord[];
    logs: SystemLogEntry[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"taxpayers" | "downloads" | "logs" | "live-test">("taxpayers");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<TaxpayerRecord | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<string | null>(null);

  // Live Gateway Query Test State
  const [testIdentifier, setTestIdentifier] = useState("");
  const [testMode, setTestMode] = useState<"id" | "pin">("id");
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const fetchData = async (query = searchQuery) => {
    setLoading(true);
    try {
      const url = `/api/admin/kra-retrievals${query ? `?q=${encodeURIComponent(query)}` : ""}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        toast.error(json.error || "Failed to load KRA retrieval data");
      }
    } catch (e: any) {
      toast.error("Network error fetching admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`Copied ${label}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleAdminDownloadPdf = async (record: TaxpayerRecord) => {
    setIsGeneratingPdf(record.pin);
    const toastId = toast.loading(`Generating official certificate for ${record.pin}...`);
    try {
      const payload = {
        pin: record.pin,
        name: record.name,
        idNumber: record.id_number || "",
        email: record.email || "",
        building: record.building || "",
        street: record.street || "",
        city: record.city || "",
        county: record.county || "",
        district: record.district || "",
        taxArea: record.tax_area || "",
        station: record.station || "",
        poBox: record.po_box || "",
        postalCode: record.postal_code || "",
        mobileNumber: record.phone_number || "",
        registeredDate: record.registered_date || "",
      };

      const res = await fetch("/api/generate-certificate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to generate certificate");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `KRA_Official_Certificate_${record.pin}.pdf`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        a.remove();
        window.URL.revokeObjectURL(url);
      }, 1500);

      toast.success(`Certificate downloaded for ${record.pin}`, { id: toastId });
      fetchData(); // Refresh list to reflect download
    } catch (e: any) {
      toast.error(e.message || "Download failed", { id: toastId });
    } finally {
      setIsGeneratingPdf(null);
    }
  };

  const handleLiveQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testIdentifier.trim()) {
      toast.error("Please enter an ID Number or KRA PIN");
      return;
    }
    setTestLoading(true);
    setTestResult(null);

    try {
      const endpoint = testMode === "pin" ? "/api/kra/live-verify/pin" : "/api/kra/live-verify/id";
      const body = testMode === "pin" ? { pin: testIdentifier.trim().toUpperCase() } : { idNumber: testIdentifier.trim() };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      setTestResult(json);
      if (json.success) {
        toast.success("Live taxpayer record resolved!");
        fetchData(); // refresh cache
      } else {
        toast.error(json.error || "Taxpayer not found on live registry");
      }
    } catch (e: any) {
      toast.error("Gateway test failed: " + e.message);
    } finally {
      setTestLoading(false);
    }
  };

  const exportCsv = () => {
    if (!data?.taxpayers || data.taxpayers.length === 0) {
      toast.error("No records to export");
      return;
    }

    const headers = [
      "KRA PIN",
      "National ID",
      "Legal Name",
      "Tax Station",
      "Phone Number",
      "Email Address",
      "County",
      "Town",
      "Registration Date",
      "Building",
      "Street",
      "P.O. Box",
      "Updated At"
    ];

    const rows = data.taxpayers.map((t) => [
      `"${t.pin}"`,
      `"${t.id_number || ''}"`,
      `"${t.name.replace(/"/g, '""')}"`,
      `"${t.station || ''}"`,
      `"${t.phone_number || ''}"`,
      `"${t.email || ''}"`,
      `"${t.county || ''}"`,
      `"${t.city || ''}"`,
      `"${t.registered_date || ''}"`,
      `"${t.building || ''}"`,
      `"${t.street || ''}"`,
      `"${t.po_box || ''}"`,
      `"${new Date(t.updated_at).toLocaleString()}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `KRA_Taxpayers_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success("CSV export downloaded successfully!");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6">

      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-on-surface tracking-tight">KRA Retrieval Intelligence</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/25 px-2.5 py-0.5 rounded-full">
                  Admin Command Center
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                Full unmasked taxpayer registry data, live official certificate issuance, and M-Pesa revenue auditing.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => fetchData()}
            disabled={loading}
            className="h-10 px-4 rounded-xl bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-variant/40 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={exportCsv}
            className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-xs">
          <div className="flex items-center justify-between text-on-surface-variant text-[11px] font-bold uppercase tracking-wider mb-2">
            <span>Total Retrieved</span>
            <Database className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-on-surface">
            {data?.stats?.totalTaxpayers ?? "..."}
          </div>
          <p className="text-[10px] text-on-surface-variant mt-1">Unique taxpayers in database cache</p>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-xs">
          <div className="flex items-center justify-between text-on-surface-variant text-[11px] font-bold uppercase tracking-wider mb-2">
            <span>Official Certificates</span>
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {data?.stats?.totalDownloads ?? "..."}
          </div>
          <p className="text-[10px] text-on-surface-variant mt-1">PDF certificates generated & delivered</p>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-xs">
          <div className="flex items-center justify-between text-on-surface-variant text-[11px] font-bold uppercase tracking-wider mb-2">
            <span>Total Revenue</span>
            <CreditCard className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-primary">
            KES {data?.stats?.totalRevenueKes?.toLocaleString() ?? "0"}
          </div>
          <p className="text-[10px] text-on-surface-variant mt-1">KES 20 per cert via M-Pesa / Card</p>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-xs">
          <div className="flex items-center justify-between text-on-surface-variant text-[11px] font-bold uppercase tracking-wider mb-2">
            <span>Audit Events</span>
            <BadgeCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-on-surface">
            {data?.logs?.length ?? "0"}
          </div>
          <p className="text-[10px] text-on-surface-variant mt-1">Recent gateway verification logs</p>
        </div>
      </div>

      {/* Search & Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-container-lowest p-3 rounded-2xl border border-outline-variant shadow-xs">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-surface-container rounded-xl">
          <button
            onClick={() => setActiveTab("taxpayers")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "taxpayers"
                ? "bg-surface text-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            All Taxpayers (Unmasked) ({data?.taxpayers?.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab("downloads")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "downloads"
                ? "bg-surface text-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Downloads & Payments ({data?.downloads?.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "logs"
                ? "bg-surface text-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Gateway Logs ({data?.logs?.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab("live-test")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "live-test"
                ? "bg-primary text-white shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Live Gateway Tester
          </button>
        </div>

        {/* Global Live Filter */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              fetchData(e.target.value);
            }}
            placeholder="Search PIN, ID, Name, Station, Phone..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-surface-container text-xs text-on-surface placeholder:text-on-surface-variant/60 border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Tab 1: Full Unmasked Taxpayer Records */}
      {activeTab === "taxpayers" && (
        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 border-b border-outline-variant flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-on-surface">Official Taxpayer Registrations (Unmasked)</h2>
              <p className="text-xs text-on-surface-variant">
                Full unmasked taxpayer profiles with authentic phone numbers, emails, addresses, and instant certificate downloads.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container text-on-surface-variant font-bold uppercase text-[10px] tracking-wider border-b border-outline-variant">
                <tr>
                  <th className="py-3 px-4">KRA PIN</th>
                  <th className="py-3 px-4">Taxpayer Legal Name</th>
                  <th className="py-3 px-4">National ID</th>
                  <th className="py-3 px-4">Tax Station</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-on-surface-variant">
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                        <span>Loading unmasked records...</span>
                      </div>
                    </td>
                  </tr>
                ) : !data?.taxpayers || data.taxpayers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-on-surface-variant">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="w-6 h-6 text-amber-500" />
                        <span>No taxpayer records matched your query.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  data.taxpayers.map((t) => (
                    <tr key={t.id || t.pin} className="hover:bg-surface-variant/20 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-primary whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{t.pin}</span>
                          <button
                            onClick={() => handleCopy(t.pin, "PIN")}
                            className="p-1 hover:text-on-surface text-on-surface-variant cursor-pointer"
                            title="Copy PIN"
                          >
                            {copiedField === "PIN" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-on-surface whitespace-nowrap">
                        {t.name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-on-surface whitespace-nowrap">
                        {t.id_number || <span className="text-on-surface-variant italic">N/A</span>}
                      </td>
                      <td className="py-3.5 px-4 text-on-surface whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>{t.station || "Station Confirmed"}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-on-surface whitespace-nowrap">
                        {t.phone_number ? (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="font-bold">{t.phone_number}</span>
                          </div>
                        ) : (
                          <span className="text-on-surface-variant italic">None</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-on-surface whitespace-nowrap">
                        {t.email ? (
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span>{t.email}</span>
                          </div>
                        ) : (
                          <span className="text-on-surface-variant italic">None</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-on-surface-variant whitespace-nowrap">
                        {t.county ? `${t.county}${t.city ? ` · ${t.city}` : ""}` : "Not recorded"}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedRecord(t)}
                            className="h-8 px-2.5 rounded-lg bg-surface-container border border-outline-variant hover:bg-surface-variant/40 text-on-surface font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                            title="Inspect complete taxpayer record"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>
                          <button
                            onClick={() => handleAdminDownloadPdf(t)}
                            disabled={isGeneratingPdf === t.pin}
                            className="h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 transition-colors"
                            title="Generate official KRA certificate PDF (Admin Free)"
                          >
                            <Download className={`w-3.5 h-3.5 ${isGeneratingPdf === t.pin ? "animate-bounce" : ""}`} />
                            <span>Download PDF</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Certificate Orders & Payments Audit */}
      {activeTab === "downloads" && (
        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 border-b border-outline-variant">
            <h2 className="text-base font-bold text-on-surface">Certificate Download Orders & M-Pesa Audit</h2>
            <p className="text-xs text-on-surface-variant">
              Every certificate download recorded along with payment receipts (KES 20) and associated user profiles.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container text-on-surface-variant font-bold uppercase text-[10px] tracking-wider border-b border-outline-variant">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">KRA PIN</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment Receipt / Reference</th>
                  <th className="py-3 px-4">Checkout Type</th>
                  <th className="py-3 px-4">Customer Email</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {!data?.downloads || data.downloads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-on-surface-variant">
                      No certificate downloads recorded yet.
                    </td>
                  </tr>
                ) : (
                  data.downloads.map((d) => (
                    <tr key={d.id} className="hover:bg-surface-variant/20 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-on-surface-variant text-[11px]">
                        {d.id.slice(0, 12)}...
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-primary">
                        {d.pin}
                      </td>
                      <td className="py-3 px-4 font-black text-emerald-600 dark:text-emerald-400">
                        KES {d.amountCharged || 20}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-on-surface">
                        {d.mpesaReceipt || d.checkoutId || <span className="text-on-surface-variant italic">Direct/Admin</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          d.downloadType === "admin"
                            ? "bg-purple-500/10 text-purple-600"
                            : "bg-emerald-500/10 text-emerald-600"
                        }`}>
                          {d.downloadType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-on-surface">
                        {d.users?.email || d.clerkId || "Guest"}
                      </td>
                      <td className="py-3 px-4 text-on-surface-variant whitespace-nowrap">
                        {new Date(d.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Gateway Audit Logs */}
      {activeTab === "logs" && (
        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 border-b border-outline-variant">
            <h2 className="text-base font-bold text-on-surface">KRA Service Security & Access Logs</h2>
            <p className="text-xs text-on-surface-variant">
              Immutable system audit trail tracking incoming queries, IPs, actors, and response signatures.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-surface-container text-on-surface-variant font-bold uppercase text-[10px] tracking-wider border-b border-outline-variant">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Level</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Message</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Client IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {!data?.logs || data.logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-on-surface-variant">
                      No system logs found.
                    </td>
                  </tr>
                ) : (
                  data.logs.map((l) => (
                    <tr key={l.id} className="hover:bg-surface-variant/20 transition-colors">
                      <td className="py-2.5 px-4 text-on-surface-variant whitespace-nowrap text-[11px]">
                        {new Date(l.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          l.level === "error" ? "bg-red-500/10 text-red-600" :
                          l.level === "warning" ? "bg-amber-500/10 text-amber-600" :
                          "bg-emerald-500/10 text-emerald-600"
                        }`}>
                          {l.level}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-bold text-primary">{l.service}</td>
                      <td className="py-2.5 px-4 text-on-surface">{l.message}</td>
                      <td className="py-2.5 px-4 text-on-surface-variant">{l.actor}</td>
                      <td className="py-2.5 px-4 text-on-surface-variant">{l.ip}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Live Gateway Tester */}
      {activeTab === "live-test" && (
        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant p-6 space-y-6 shadow-sm">
          <div>
            <h2 className="text-lg font-black text-on-surface">Live Government Gateway Diagnostic Tool</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Query the official Kenya Revenue Authority statutory verification node in real-time as a Super Admin.
            </p>
          </div>

          <form onSubmit={handleLiveQuery} className="max-w-xl space-y-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-on-surface flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="testMode"
                  checked={testMode === "id"}
                  onChange={() => setTestMode("id")}
                  className="accent-primary"
                />
                <span>National ID Number</span>
              </label>
              <label className="text-xs font-bold text-on-surface flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="testMode"
                  checked={testMode === "pin"}
                  onChange={() => setTestMode("pin")}
                  className="accent-primary"
                />
                <span>KRA PIN</span>
              </label>
            </div>

            <div className="flex gap-2.5">
              <input
                type="text"
                value={testIdentifier}
                onChange={(e) => setTestIdentifier(e.target.value)}
                placeholder={testMode === "pin" ? "e.g. A012345678Z" : "e.g. 28475912"}
                className="flex-1 h-12 px-4 rounded-xl bg-surface-container text-sm text-on-surface font-mono font-bold border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={testLoading}
                className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {testLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Execute Query</span>
              </button>
            </div>
          </form>

          {testResult && (
            <div className="mt-6 rounded-2xl bg-neutral-950 p-5 border border-neutral-800 font-mono text-xs text-emerald-400 overflow-x-auto">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800 text-neutral-400 text-[11px]">
                <span>Gateway Raw Response Status: {testResult.success ? "200 OK" : "404 Not Found"}</span>
                <span>Time: {new Date().toLocaleTimeString()}</span>
              </div>
              <pre className="pt-3">{JSON.stringify(testResult, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {/* Record Inspection Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative my-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Taxpayer Intelligence Dossier</span>
                <h3 className="text-xl font-black text-on-surface">{selectedRecord.name}</h3>
                <p className="font-mono text-xs text-primary font-bold mt-0.5">PIN: {selectedRecord.pin}</p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/40 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-surface-container p-4 rounded-2xl border border-outline-variant/60">
              <div>
                <span className="text-[10px] uppercase font-bold text-on-surface-variant block">National ID</span>
                <span className="font-mono font-bold text-on-surface">{selectedRecord.id_number || "None"}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Tax Station</span>
                <span className="font-bold text-on-surface">{selectedRecord.station || "None"}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Mobile Phone</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{selectedRecord.phone_number || "None"}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Email Address</span>
                <span className="font-mono text-on-surface">{selectedRecord.email || "None"}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-on-surface-variant block">County / City</span>
                <span className="text-on-surface">{selectedRecord.county} · {selectedRecord.city || selectedRecord.county}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Registration Date</span>
                <span className="text-on-surface">{selectedRecord.registered_date || "On Record"}</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-outline-variant/60">
                <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Physical Location</span>
                <span className="text-on-surface">
                  Building: {selectedRecord.building || "N/A"} · Street: {selectedRecord.street || "N/A"} · Box: {selectedRecord.po_box || "N/A"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setSelectedRecord(null)}
                className="h-10 px-4 rounded-xl bg-surface-container border border-outline-variant text-on-surface font-bold text-xs cursor-pointer hover:bg-surface-variant/40"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleAdminDownloadPdf(selectedRecord);
                  setSelectedRecord(null);
                }}
                className="h-10 px-5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Download Official Certificate</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
