"use client";

import { useState, useEffect } from "react";
import { 
  Mail, Phone, Building, Calendar, MessageSquare, 
  Search, Filter, Download, CheckCircle2, Clock, 
  AlertCircle, ChevronRight, Send, ArrowUpDown
} from "lucide-react";

interface Note {
  id: string;
  content: string;
  authorName: string;
  createdAt: string;
}

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  projectType: string;
  budget: string;
  message: string;
  status: string;
  source: string;
  createdAt: string;
  notes: Note[];
}

const statusOptions = [
  { value: "all", label: "All Inquiries" },
  { value: "new", label: "New", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  { value: "contacted", label: "Contacted", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  { value: "qualified", label: "Qualified", color: "bg-teal-500/10 text-teal-600 border-teal-500/20" },
  { value: "proposal_sent", label: "Proposal Sent", color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" },
  { value: "won", label: "Won / Active", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  { value: "lost", label: "Lost", color: "bg-neutral-500/10 text-neutral-600 border-neutral-500/20" },
  { value: "archived", label: "Archived", color: "bg-red-500/10 text-red-600 border-red-500/20" },
];

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [stats, setStats] = useState({ total: 0, new: 0, contacted: 0, qualified: 0, won: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [newNote, setNewNote] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const url = `/api/admin/inquiries?status=${selectedStatus}&q=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setInquiries(data.inquiries);
        setStats(data.stats);
        if (selectedInquiry) {
          const updated = data.inquiries.find((i: Inquiry) => i.id === selectedInquiry.id);
          if (updated) setSelectedInquiry(updated);
        }
      }
    } catch (err) {
      console.error("Failed to load inquiries:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInquiries();
  };

  const handleStatusChange = async (inquiryId: string, nextStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch("/api/admin/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: inquiryId, status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setInquiries((prev) =>
          prev.map((item) => (item.id === inquiryId ? { ...item, status: nextStatus } : item))
        );
        if (selectedInquiry?.id === inquiryId) {
          setSelectedInquiry((prev) => (prev ? { ...prev, status: nextStatus } : null));
        }
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInquiry || !newNote.trim()) return;

    setSubmittingNote(true);
    try {
      const res = await fetch("/api/admin/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inquiryId: selectedInquiry.id,
          content: newNote.trim(),
          authorName: "Super Admin",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewNote("");
        fetchInquiries();
      }
    } catch (err) {
      console.error("Failed to add note:", err);
    } finally {
      setSubmittingNote(false);
    }
  };

  const exportCSV = () => {
    if (inquiries.length === 0) return;
    const headers = ["ID", "Name", "Email", "Phone", "Company", "Project Type", "Budget", "Status", "Date"];
    const rows = inquiries.map((i) => [
      i.id,
      `"${i.name.replace(/"/g, '""')}"`,
      i.email,
      i.phone || "",
      `"${(i.company || "").replace(/"/g, '""')}"`,
      `"${i.projectType.replace(/"/g, '""')}"`,
      `"${i.budget.replace(/"/g, '""')}"`,
      i.status,
      new Date(i.createdAt).toISOString(),
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `akubrecah_inquiries_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight">
            Client Inquiries & CRM
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Manage incoming project briefs, track sales pipeline status, and maintain client history.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container border border-outline-variant hover:border-primary/40 text-xs font-bold text-on-surface transition-all shadow-xs self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-primary" />
          Export CSV ({inquiries.length})
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total Received", val: stats.total, color: "text-on-surface" },
          { label: "New (Action Required)", val: stats.new, color: "text-blue-600 dark:text-blue-400" },
          { label: "In Contact", val: stats.contacted, color: "text-amber-600 dark:text-amber-400" },
          { label: "Qualified Leads", val: stats.qualified, color: "text-teal-600 dark:text-teal-400" },
          { label: "Won Deals", val: stats.won, color: "text-emerald-600 dark:text-emerald-400" },
        ].map((kpi) => (
          <div key={kpi.label} className="p-4 rounded-2xl bg-surface-container border border-outline-variant">
            <span className="text-[11px] font-bold text-on-surface-variant block uppercase tracking-wider">{kpi.label}</span>
            <span className={`text-2xl font-black mt-1 block ${kpi.color}`}>{kpi.val}</span>
          </div>
        ))}
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, company, or keyword..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-surface-container border border-outline-variant text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </form>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {statusOptions.slice(0, 5).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelectedStatus(opt.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedStatus === opt.value
                  ? "bg-primary text-white shadow-xs"
                  : "bg-surface-container border border-outline-variant text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table & Detail Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Table List (7 cols if detail open, 12 cols if closed) */}
        <div className={`space-y-3 ${selectedInquiry ? "lg:col-span-7" : "lg:col-span-12"}`}>
          {loading ? (
            <div className="p-12 text-center text-xs text-on-surface-variant bg-surface-container rounded-3xl border border-outline-variant">
              Loading inquiries...
            </div>
          ) : inquiries.length === 0 ? (
            <div className="p-12 text-center text-xs text-on-surface-variant bg-surface-container rounded-3xl border border-outline-variant">
              No inquiries found matching current filters.
            </div>
          ) : (
            <div className="bg-surface-container rounded-3xl border border-outline-variant overflow-hidden shadow-soft">
              <div className="divide-y divide-outline-variant">
                {inquiries.map((inq) => {
                  const isSelected = selectedInquiry?.id === inq.id;
                  const statusObj = statusOptions.find((s) => s.value === inq.status);

                  return (
                    <div
                      key={inq.id}
                      onClick={() => setSelectedInquiry(inq)}
                      className={`p-4 sm:p-5 cursor-pointer transition-all flex items-start justify-between gap-4 hover:bg-surface-container-high ${
                        isSelected ? "bg-primary/5 border-l-4 border-l-primary" : ""
                      }`}
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-sm text-on-surface truncate">
                            {inq.name}
                          </h3>
                          {inq.company && (
                            <span className="text-[11px] text-on-surface-variant font-medium">
                              · {inq.company}
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                              statusObj?.color || "bg-surface text-on-surface-variant"
                            }`}
                          >
                            {statusObj?.label || inq.status}
                          </span>
                        </div>

                        <div className="text-xs text-on-surface-variant flex items-center gap-3 flex-wrap font-mono">
                          <span>{inq.email}</span>
                          {inq.phone && <span>{inq.phone}</span>}
                          <span>Budget: {inq.budget}</span>
                        </div>

                        <p className="text-xs text-on-surface-variant/80 line-clamp-1 italic">
                          &quot;{inq.message}&quot;
                        </p>
                      </div>

                      <div className="text-right shrink-0 space-y-1">
                        <span className="text-[10px] font-mono text-on-surface-variant block">
                          {new Date(inq.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                        <ChevronRight className="w-4 h-4 text-on-surface-variant ml-auto" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Selected Inquiry Detail Drawer (5 cols) */}
        {selectedInquiry && (
          <div className="lg:col-span-5 bg-surface-container rounded-3xl border border-outline-variant p-6 space-y-6 shadow-soft sticky top-6">
            <div className="flex items-start justify-between gap-3 border-b border-outline-variant pb-4">
              <div>
                <span className="text-[10px] font-mono text-primary uppercase font-bold tracking-widest block">
                  Inquiry #{selectedInquiry.id.slice(-6).toUpperCase()}
                </span>
                <h2 className="text-xl font-black text-on-surface mt-0.5">
                  {selectedInquiry.name}
                </h2>
                {selectedInquiry.company && (
                  <p className="text-xs text-on-surface-variant font-medium">
                    {selectedInquiry.company}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="text-xs text-on-surface-variant hover:text-on-surface font-bold p-1"
              >
                Close ✕
              </button>
            </div>

            {/* Quick Contact & Info */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant">
                <span className="text-[10px] text-on-surface-variant uppercase font-bold block">Email</span>
                <a href={`mailto:${selectedInquiry.email}`} className="text-primary font-bold hover:underline truncate block mt-0.5">
                  {selectedInquiry.email}
                </a>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant">
                <span className="text-[10px] text-on-surface-variant uppercase font-bold block">Phone</span>
                {selectedInquiry.phone ? (
                  <a href={`tel:${selectedInquiry.phone}`} className="text-primary font-bold hover:underline truncate block mt-0.5">
                    {selectedInquiry.phone}
                  </a>
                ) : (
                  <span className="text-on-surface-variant mt-0.5 block">Not provided</span>
                )}
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant">
                <span className="text-[10px] text-on-surface-variant uppercase font-bold block">Category</span>
                <span className="text-on-surface font-semibold truncate block mt-0.5">{selectedInquiry.projectType}</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant">
                <span className="text-[10px] text-on-surface-variant uppercase font-bold block">Budget</span>
                <span className="text-on-surface font-semibold truncate block mt-0.5">{selectedInquiry.budget}</span>
              </div>
            </div>

            {/* Status Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface block">
                Pipeline Status
              </label>
              <select
                value={selectedInquiry.status}
                onChange={(e) => handleStatusChange(selectedInquiry.id, e.target.value)}
                disabled={updatingStatus}
                className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-xs font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {statusOptions.filter((s) => s.value !== "all").map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Full Brief Message */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-on-surface block">Full Client Brief</span>
              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant text-xs text-on-surface leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                {selectedInquiry.message}
              </div>
            </div>

            {/* Internal Notes History */}
            <div className="space-y-3 pt-2 border-t border-outline-variant">
              <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-primary" />
                Internal Follow-Up Notes ({selectedInquiry.notes?.length || 0})
              </span>

              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {selectedInquiry.notes && selectedInquiry.notes.length > 0 ? (
                  selectedInquiry.notes.map((note) => (
                    <div key={note.id} className="p-3 rounded-xl bg-surface-container-low border border-outline-variant text-xs space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-on-surface-variant font-medium">
                        <span className="font-bold text-primary">{note.authorName}</span>
                        <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-on-surface">{note.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-on-surface-variant italic">No internal notes logged yet.</p>
                )}
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add private note / meeting log..."
                  className="flex-1 h-9 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-xs text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={submittingNote || !newNote.trim()}
                  className="h-9 px-3 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
