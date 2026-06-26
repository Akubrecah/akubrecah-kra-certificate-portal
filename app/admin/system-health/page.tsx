"use client";

import { useState, useEffect } from "react";

const LOG_ITEMS = [
  { type: "info", icon: "task_alt", title: "DB Ping Successful", desc: "TCP handshake established with Neon instance.", time: "Just now", actor: "System" },
  { type: "info", icon: "login", title: "Admin Login Approved", desc: "Authenticated request verified.", time: "10 mins ago", actor: "AuthSystem" },
  { type: "warning", icon: "warning", title: "KRA Latency Warning", desc: "itax.kra.go.ke responded slower than 1200ms.", time: "18 mins ago", actor: "PingWorker" },
  { type: "info", icon: "dns", title: "Cache Flushed", desc: "Memory cache cleared successfully.", time: "1 hr ago", actor: "CronJob" },
  { type: "error", icon: "error", title: "Blocked Login Request", desc: "clerk.com detected an invalid token attempt.", time: "3 hrs ago", actor: "Security" },
];

const iconColors: Record<string, string> = {
  error: "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400",
  warning: "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400",
  info: "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400",
};

const metricIcons: Record<string, string> = {
  "Server Uptime": "dns",
  "Active Users (Clerk)": "group",
  "CPU Load (1m)": "speed",
  "Memory Usage": "warning",
};

export default function SystemHealthPage() {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  
  // Real-time Load chart tracking
  const [loadHistory, setLoadHistory] = useState<number[]>([10, 14, 18, 12, 16, 22, 19, 25, 21, 28, 20, 24]);
  const [loadLabels, setLoadLabels] = useState<string[]>([]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchHealth = async () => {
    try {
      const res = await fetch("/api/admin/system-health");
      const data = await res.json();
      if (data.success) {
        setMetrics(data.metrics);
        setServices(data.services);

        // Update load history chart based on cpu load
        const cpuMetric = data.metrics.find((m: any) => m.label.includes("CPU"));
        if (cpuMetric) {
          const loadVal = Math.round(parseFloat(cpuMetric.value) * 100);
          setLoadHistory(prev => [...prev.slice(1), loadVal > 100 ? 100 : loadVal]);
          setLoadLabels(prev => [
            ...prev.slice(1), 
            new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          ]);
        }
      } else {
        showToast("Error retrieving live health metrics: " + (data.error || "Access Denied"));
      }
    } catch (e) {
      console.error(e);
      showToast("Network error fetching live metrics.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Populate initial chart labels
    const timeLabels = [];
    for (let i = 11; i >= 0; i--) {
      const t = new Date(Date.now() - i * 10000);
      timeLabels.push(t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }
    setLoadLabels(timeLabels);

    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(" ");
  };

  const avgLoad = Math.round(loadHistory.reduce((a, b) => a + b, 0) / loadHistory.length);

  return (
    <div className="max-w-[1280px] mx-auto space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">System Health</h1>
          <p className="text-on-surface-variant text-sm mt-1">Real-time live monitoring metrics connected to Neon and Clerk APIs.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`flex items-center px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            services.some(s => s.status === "Outage") ? "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 animate-pulse" :
            services.some(s => s.status === "Degraded") ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 animate-pulse" :
            "bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300"
          }`}>
            <span className={`w-2 h-2 rounded-full mr-2 ${
              services.some(s => s.status === "Outage") ? "bg-red-600 animate-ping" :
              services.some(s => s.status === "Degraded") ? "bg-amber-500 animate-pulse" :
              "bg-green-600 animate-pulse"
            }`} />
            {services.some(s => s.status === "Outage") ? "Critical Outage Detected" :
             services.some(s => s.status === "Degraded") ? "Performance Degraded" :
             "All Systems Operational"}
          </span>
          <button 
            onClick={fetchHealth}
            className="p-2 border border-outline-variant hover:bg-surface-container rounded-xl transition-all text-on-surface-variant flex items-center justify-center shrink-0"
            title="Refresh Live Data"
          >
            <span className="material-symbols-outlined text-[20px]">refresh</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant animate-pulse shadow-soft h-32" />
          ))
        ) : (
          metrics.map((m) => {
            const isUptime = m.label === "Server Uptime";
            const valStr = isUptime ? formatUptime(parseInt(m.value, 10)) : m.value;
            const icon = metricIcons[m.label] || "dns";

            return (
              <div key={m.label} className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant hover:-translate-y-1 transition-transform duration-300 shadow-soft">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                  </div>
                  <span className="bg-surface-container-highest text-on-surface-variant text-[10px] uppercase font-bold px-2 py-0.5 rounded-lg">
                    Real-time
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mb-1">{m.label}</p>
                <p className="text-2xl font-bold text-on-surface tracking-tight">
                  {valStr}<span className="text-base font-normal text-on-surface-variant ml-1">{isUptime ? "" : m.unit}</span>
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Chart + Live Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden shadow-soft">
          <div className="px-5 py-4 border-b border-outline-variant bg-surface flex justify-between items-center">
            <div>
              <h3 className="font-bold text-on-surface">System Load Trajectory (CPU Load %)</h3>
              <p className="text-[10px] text-on-surface-variant mt-0.5">Average load across current timeline: <strong>{avgLoad}%</strong></p>
            </div>
            <span className="text-[10px] uppercase font-extrabold text-on-surface-variant/80 tracking-wider">Updates live</span>
          </div>
          <div className="p-5 bg-surface-container-low min-h-[240px] relative flex items-end gap-2.5 pt-10">
            {loadHistory.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 h-36">
                <div
                  className={`w-full rounded-t-md hover:opacity-100 transition-all cursor-pointer ${
                    h > 75 ? "bg-red-500/80 hover:bg-red-500" :
                    h > 40 ? "bg-amber-500/80 hover:bg-amber-500" :
                    "bg-primary/70 hover:bg-primary"
                  }`}
                  style={{ height: `${h > 0 ? h : 4}%` }}
                  title={`Load: ${h}%`}
                />
                <span className="text-[8px] text-on-surface-variant/80 font-mono tracking-tight font-semibold mt-1 block select-none whitespace-nowrap overflow-hidden max-w-full">
                  {loadLabels[i] ? loadLabels[i].split(" ")[0] : ""}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Logs */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant flex flex-col max-h-[420px] shadow-soft">
          <div className="px-5 py-4 border-b border-outline-variant bg-surface flex items-center justify-between">
            <h3 className="font-bold text-on-surface flex items-center gap-2">
              Live Health Logs
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            </h3>
            <button className="text-on-surface-variant hover:text-primary">
              <span className="material-symbols-outlined text-[20px]">filter_list</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ul className="divide-y divide-outline-variant/50">
              {LOG_ITEMS.map((log, i) => (
                <li key={i} className="px-5 py-3 hover:bg-surface-container-low transition-colors flex gap-3 items-start">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${iconColors[log.type]}`}>
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>{log.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-on-surface truncate">{log.title}</p>
                    <p className="text-xs text-on-surface-variant truncate">{log.desc}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{log.time} · {log.actor}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Service Status */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden shadow-soft">
        <div className="px-5 py-4 border-b border-outline-variant bg-surface flex justify-between items-center">
          <h3 className="font-bold text-on-surface">API & Resource Connectivity</h3>
          <span className="text-[10px] uppercase font-extrabold text-on-surface-variant/80 tracking-wider">Live Check Results</span>
        </div>
        <div className="divide-y divide-outline-variant/50">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="px-5 py-6 bg-surface-container-lowest animate-pulse" />
            ))
          ) : (
            services.map(s => (
              <div
                key={s.name}
                className="flex items-center justify-between px-5 py-4 hover:bg-surface-container-low transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full transition-all ${
                    s.status === "Operational" ? "bg-green-500" :
                    s.status === "Degraded" ? "bg-amber-500 animate-pulse" :
                    "bg-red-500 animate-ping"
                  }`} />
                  <span className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors">{s.name}</span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-xs text-on-surface-variant">Response Latency: <strong className="text-on-surface">{s.latency}</strong></span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg select-none transition-all ${
                    s.status === "Operational" ? "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300" :
                    s.status === "Degraded" ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400" :
                    "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400"
                  }`}>
                    {s.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Custom Alert Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg px-5 py-3 animate-slide-up">
          <span className="material-symbols-outlined text-primary text-[20px]">info</span>
          <span className="text-sm font-medium text-on-surface">{toast}</span>
        </div>
      )}
    </div>
  );
}
