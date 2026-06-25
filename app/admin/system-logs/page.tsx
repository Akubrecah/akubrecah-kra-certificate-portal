"use client";

import { useState, useEffect, useRef } from "react";

interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warning" | "error";
  service: string;
  message: string;
  actor: string;
  ip: string;
  details: Record<string, any>;
}

const STATIC_LOGS: LogEntry[] = [
  { id: "LOG-01", timestamp: "2026-06-25T13:40:12Z", level: "info", service: "AuthService", message: "User clerk_9921 authenticated successfully via standard password flow.", actor: "poweldayck@gmail.com", ip: "102.135.40.89", details: { method: "ClerkSSO", status: "Success", sessionLifetime: "24h" } },
  { id: "LOG-02", timestamp: "2026-06-25T13:41:05Z", level: "info", service: "PaymentAPI", message: "M-Pesa STK Push callback received for checkout ID stk_884129A.", actor: "SafaricomWebhook", ip: "196.201.214.200", details: { status: "Paid", amount: 150, phoneNumber: "254712***456", transactionId: "TGF8192KSL" } },
  { id: "LOG-03", timestamp: "2026-06-25T13:41:18Z", level: "error", service: "KRAPortal", message: "Filing failure: KRA portal returned connection timeout response during NIL return post.", actor: "SystemQueue", ip: "41.89.20.10", details: { attempt: 3, errorCode: "ETIMEDOUT", targetUrl: "https://itax.kra.go.ke/iTax/NilReturnSubmit.do" } },
  { id: "LOG-04", timestamp: "2026-06-25T13:42:01Z", level: "warning", service: "UserSession", message: "Multiple sessions detected: User logged in from new IP address within 5 minutes.", actor: "cybercafe_east@net.ke", ip: "197.248.88.99", details: { previousIp: "197.248.12.10", activeSessions: 2 } },
  { id: "LOG-05", timestamp: "2026-06-25T13:43:55Z", level: "info", service: "Retrieval", message: "KRA Certificate successfully compiled to PDF format and delivered.", actor: "registered_user", ip: "102.135.2.14", details: { durationMs: 1420, fileSizeKb: 412, pinCode: "A0012***9Z" } },
  { id: "LOG-06", timestamp: "2026-06-25T13:44:10Z", level: "error", service: "MpesaService", message: "STK Push request rejected: Safaricom API returned invalid credentials signature.", actor: "SystemConfig", ip: "localhost", details: { error: "Authentication Failure", rawResponse: "UNAUTHORIZED_ACCESS" } },
];

const ACTORS = ["system_daemon", "tax_auditor_02", "poweldayck@gmail.com", "mpesa_callback_worker", "kra_retrieval_agent"];
const SERVICES = ["AuthService", "PaymentAPI", "KRAPortal", "Retrieval", "MpesaService", "DatabasePool"];
const MESSAGES = [
  "Database connection pool size reached 80% capacity.",
  "M-Pesa STK push initiated for amount KES 150.",
  "User session timed out after 30 minutes of inactivity.",
  "Invalid KRA PIN pattern entered during lookup validation.",
  "Admin configuration setting 'Maintenance Mode' changed from FALSE to TRUE.",
  "Successfully generated PDF tax clearance certificate.",
  "Failed to connect to KRA iTax node. Initiating automatic retry.",
];

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>(STATIC_LOGS);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<"all" | "info" | "warning" | "error">("all");
  const [isPaused, setIsPaused] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll terminal to bottom when new logs arrive (if terminal is active)
  useEffect(() => {
    if (!isPaused && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, isPaused]);

  // Simulate real-time log generation
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const level = Math.random() > 0.7 ? (Math.random() > 0.6 ? "error" : "warning") : "info";
      const service = SERVICES[Math.floor(Math.random() * SERVICES.length)];
      const actor = ACTORS[Math.floor(Math.random() * ACTORS.length)];
      const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
      
      const newLog: LogEntry = {
        id: `LOG-${Math.floor(10 + Math.random() * 90)}`,
        timestamp: new Date().toISOString(),
        level,
        service,
        message: msg,
        actor,
        ip: `${Math.floor(40 + Math.random() * 160)}.${Math.floor(10 + Math.random() * 200)}.${Math.floor(1 + Math.random() * 250)}.${Math.floor(1 + Math.random() * 254)}`,
        details: {
          runtimeMs: Math.floor(50 + Math.random() * 950),
          nodeId: `node-useast-${Math.floor(1 + Math.random() * 4)}`,
          trigger: "IntervalTick",
        }
      };

      setLogs(prev => [...prev.slice(-49), newLog]); // Keep max 50 logs in memory
    }, 4500);

    return () => clearInterval(interval);
  }, [isPaused]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const clearLogs = () => {
    setLogs([]);
    showToast("Terminal logs cleared.");
  };

  const exportLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `kra_portal_logs_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("Exported logs database successfully.");
  };

  const filteredLogs = logs.filter(log => {
    const matchSearch = log.message.toLowerCase().includes(search.toLowerCase()) || 
                        log.service.toLowerCase().includes(search.toLowerCase()) ||
                        log.actor.toLowerCase().includes(search.toLowerCase());
    const matchLevel = levelFilter === "all" || log.level === levelFilter;
    return matchSearch && matchLevel;
  });

  return (
    <div className="max-w-[1280px] mx-auto space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">System Logs</h1>
          <p className="text-on-surface-variant text-sm mt-1">Real-time terminal audit trail and debugging console.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border transition-all ${isPaused ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400 border-amber-300" : "bg-surface-container border-outline-variant hover:bg-surface-container-high text-on-surface"}`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isPaused ? "play_arrow" : "pause"}
            </span>
            {isPaused ? "Resume Live" : "Pause Live"}
          </button>
          <button
            onClick={clearLogs}
            className="flex items-center gap-1.5 px-4 py-2 bg-surface-container border border-outline-variant hover:bg-surface-container-high text-xs font-bold text-on-surface rounded-xl transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
            Clear Logs
          </button>
          <button
            onClick={exportLogs}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white hover:bg-primary/90 text-xs font-bold rounded-xl shadow-soft transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export DB
          </button>
        </div>
      </div>

      {/* Logger Console Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Main Terminal Window */}
        <div className="lg:col-span-3 flex flex-col bg-slate-950 dark:bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
          {/* Terminal Title Bar */}
          <div className="bg-slate-900 dark:bg-zinc-900 border-b border-zinc-800 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <span className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="text-zinc-400 text-xs font-mono ml-2 tracking-wide">root@kra-portal:~ (logs-worker)</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-500 text-xs font-mono">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              ACTIVE
            </div>
          </div>

          {/* Filtering Controls */}
          <div className="bg-slate-900/60 dark:bg-zinc-900/60 border-b border-zinc-800 p-3 flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-zinc-500">search</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-zinc-800 focus:border-zinc-700 rounded-xl pl-9 pr-4 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none"
                placeholder="Search logs by keyword..."
              />
            </div>
            
            {/* Level Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-950 border border-zinc-800 rounded-xl p-1 shrink-0 w-full sm:w-auto">
              {(["all", "info", "warning", "error"] as const).map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setLevelFilter(lvl)}
                  className={`flex-1 sm:flex-none px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                    levelFilter === lvl
                      ? (lvl === "error" ? "bg-red-950 text-red-400 border border-red-800" :
                         lvl === "warning" ? "bg-amber-950 text-amber-400 border border-amber-800" :
                         lvl === "info" ? "bg-blue-950 text-blue-400 border border-blue-800" :
                         "bg-zinc-800 text-zinc-200 border border-zinc-700")
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Console Output Screen */}
          <div className="p-4 md:p-6 h-[460px] overflow-y-auto font-mono text-[11px] leading-relaxed space-y-2.5">
            {filteredLogs.length === 0 ? (
              <div className="text-zinc-600 h-full flex flex-col items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[36px]">error</span>
                <span>NO LOG MESSAGES MATCH FILTER CRITERIA</span>
              </div>
            ) : (
              filteredLogs.map(log => {
                const lvlColor = log.level === "error" ? "text-red-500 font-bold" :
                                 log.level === "warning" ? "text-yellow-500 font-bold" :
                                 "text-blue-400";
                
                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="flex flex-col md:flex-row md:items-start gap-1 py-1 px-2.5 rounded hover:bg-zinc-900 border border-transparent hover:border-zinc-800/80 cursor-pointer group transition-all"
                  >
                    {/* Timestamp */}
                    <span className="text-zinc-500 shrink-0 select-none">
                      [{new Date(log.timestamp).toLocaleTimeString()}]
                    </span>
                    {/* Level */}
                    <span className={`shrink-0 uppercase tracking-widest text-[9px] w-14 font-black ${lvlColor}`}>
                      {log.level}
                    </span>
                    {/* Service */}
                    <span className="text-zinc-400 shrink-0 font-bold select-none group-hover:text-zinc-200">
                      [{log.service}]
                    </span>
                    {/* Message */}
                    <span className="text-zinc-300 flex-1 truncate group-hover:text-white">
                      {log.message}
                    </span>
                    {/* Actor */}
                    <span className="text-zinc-500 font-semibold text-[10px] shrink-0 select-none">
                      @{log.actor.split("@")[0]}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={terminalEndRef} />
          </div>
        </div>

        {/* Sidebar Status Info */}
        <div className="space-y-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5">
            <h3 className="font-bold text-on-surface mb-3.5">Log Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"/>Info logs</span>
                <span className="font-bold text-on-surface">{logs.filter(l => l.level === "info").length}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"/>Warnings</span>
                <span className="font-bold text-on-surface">{logs.filter(l => l.level === "warning").length}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/>Errors</span>
                <span className="font-bold text-red-600 dark:text-red-400">{logs.filter(l => l.level === "error").length}</span>
              </div>
              <div className="border-t border-outline-variant pt-2.5 mt-1 flex justify-between items-center text-xs font-bold text-on-surface">
                <span>Total Buffer size</span>
                <span>{logs.length} / 50</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 text-xs text-on-surface-variant leading-relaxed">
            <h4 className="font-bold text-on-surface mb-2 uppercase tracking-wider text-[10px]">Debugging Instructions</h4>
            <p className="mb-2">
              Select any event entry in the console box to view the detailed JSON payload configuration containing active connection parameters, process tokens, and gateway diagnostics.
            </p>
            <p>
              Use the **Export DB** button to backup configuration logs to your local hard drive for audit archiving.
            </p>
          </div>
        </div>
      </div>

      {/* Log Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl animate-fade-in font-mono">
            {/* Modal Title bar */}
            <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${selectedLog.level === "error" ? "bg-red-500" : selectedLog.level === "warning" ? "bg-yellow-500" : "bg-blue-500"}`} />
                Log Event Details: {selectedLog.id}
              </h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-zinc-200"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-4 text-zinc-400">
                <div>
                  <span className="text-[10px] text-zinc-600 block uppercase font-bold tracking-wider">Timestamp</span>
                  <span className="text-zinc-200">{new Date(selectedLog.timestamp).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-600 block uppercase font-bold tracking-wider">Service Source</span>
                  <span className="text-zinc-200">{selectedLog.service}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-600 block uppercase font-bold tracking-wider">Actor / Caller</span>
                  <span className="text-zinc-200">{selectedLog.actor}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-600 block uppercase font-bold tracking-wider">IP Address</span>
                  <span className="text-zinc-200">{selectedLog.ip}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-zinc-600 block uppercase font-bold tracking-wider mb-1">Message</span>
                <p className="text-zinc-100 bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs leading-relaxed">
                  {selectedLog.message}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-zinc-600 block uppercase font-bold tracking-wider mb-1">Payload JSON</span>
                <pre className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-[10px] text-green-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>
            
            <div className="bg-zinc-900/60 border-t border-zinc-800 px-6 py-3.5 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 rounded-xl transition-all"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg px-5 py-3 animate-slide-up">
          <span className="material-symbols-outlined text-primary text-[20px]">info</span>
          <span className="text-sm font-medium text-on-surface">{toast}</span>
        </div>
      )}
    </div>
  );
}
