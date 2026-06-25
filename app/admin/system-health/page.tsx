"use client";

import { useState } from "react";

const LOG_ITEMS = [
  { type: "error", icon: "error", title: "Database Connection Timeout", desc: "Cluster-A node 3 failed to respond.", time: "2 mins ago", actor: "SysAdmin" },
  { type: "warning", icon: "warning", title: "High Memory Usage", desc: "Server memory above 85% threshold.", time: "14 mins ago", actor: "AutoScan" },
  { type: "info", icon: "task_alt", title: "Backup Completed", desc: "Daily DB backup finished successfully.", time: "1 hr ago", actor: "CronJob" },
  { type: "info", icon: "login", title: "Admin Login", desc: "sarah.jenkins authenticated via SSO.", time: "2 hrs ago", actor: "s.jenkins" },
  { type: "warning", icon: "shield", title: "Failed Auth Attempt", desc: "3 consecutive failed logins for USR-7714.", time: "3 hrs ago", actor: "Auth System" },
  { type: "info", icon: "dns", title: "Cache Cleared", desc: "Redis cache flushed for tax lookup module.", time: "5 hrs ago", actor: "d.kim" },
];

const iconColors: Record<string, string> = {
  error: "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400",
  warning: "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400",
  info: "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400",
};

const METRICS = [
  { label: "Server Uptime", value: "342", unit: "days", trend: "99.99%", trendUp: true, icon: "dns" },
  { label: "Active Sessions", value: "12,450", unit: "", trend: "Stable", trendUp: null, icon: "group" },
  { label: "Avg. API Latency", value: "45", unit: "ms", trend: "+12ms", trendUp: false, icon: "speed" },
  { label: "Error Rate (5xx)", value: "0.02", unit: "%", trend: "Normal", trendUp: true, icon: "warning" },
];

const SERVICE_STATUS = [
  { name: "Tax Filing API", status: "Operational", uptime: "99.9%" },
  { name: "Authentication Service", status: "Operational", uptime: "100%" },
  { name: "Certificate Generator", status: "Degraded", uptime: "94.2%" },
  { name: "Payment Gateway", status: "Operational", uptime: "99.7%" },
  { name: "Email Notifications", status: "Operational", uptime: "99.8%" },
];

const rangeData: Record<string, number[]> = {
  "1H": [15, 22, 18, 30, 25, 45, 38, 55, 48, 62, 50, 58],
  "24H": [40, 60, 45, 80, 55, 70, 90, 65, 50, 75, 60, 85],
  "7D": [50, 48, 52, 58, 62, 55, 49, 45, 47, 50, 54, 53],
};

const rangeLabels: Record<string, string[]> = {
  "1H": ["05m", "10m", "15m", "20m", "25m", "30m", "35m", "40m", "45m", "50m", "55m", "60m"],
  "24H": ["02h", "04h", "06h", "08h", "10h", "12h", "14h", "16h", "18h", "20h", "22h", "24h"],
  "7D": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"],
};

export default function SystemHealthPage() {
  const [activeRange, setActiveRange] = useState("24H");
  const [services, setServices] = useState(SERVICE_STATUS);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const toggleServiceStatus = (name: string) => {
    setServices(prev => prev.map(s => {
      if (s.name !== name) return s;
      
      const nextStatus = s.status === "Operational" ? "Degraded" : 
                         s.status === "Degraded" ? "Outage" : "Operational";
                         
      showToast(`Service "${name}" status toggled to: ${nextStatus}`);
      return { ...s, status: nextStatus };
    }));
  };

  const currentLoad = (rangeData[activeRange] || rangeData["24H"]);
  const currentLabels = (rangeLabels[activeRange] || rangeLabels["24H"]);
  const avgLoad = Math.round(currentLoad.reduce((a, b) => a + b, 0) / currentLoad.length);

  return (
    <div className="max-w-[1280px] mx-auto space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">System Health</h1>
          <p className="text-on-surface-variant text-sm mt-1">Real-time monitoring and performance metrics.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`flex items-center px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            services.some(s => s.status === "Outage") ? "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300" :
            services.some(s => s.status === "Degraded") ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 animate-pulse" :
            "bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300"
          }`}>
            <span className={`w-2 h-2 rounded-full mr-2 ${
              services.some(s => s.status === "Outage") ? "bg-red-600 animate-ping" :
              services.some(s => s.status === "Degraded") ? "bg-amber-500" :
              "bg-green-600 animate-pulse"
            }`} />
            {services.some(s => s.status === "Outage") ? "Critical System Alert" :
             services.some(s => s.status === "Degraded") ? "Performance Degraded" :
             "All Systems Operational"}
          </span>
          <p className="text-xs text-on-surface-variant">Last updated: Just now</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {METRICS.map((m) => {
          let dynamicValue = m.value;
          if (m.label === "Avg. API Latency" && activeRange === "1H") dynamicValue = "32";
          if (m.label === "Avg. API Latency" && activeRange === "7D") dynamicValue = "58";
          if (m.label === "Active Sessions" && activeRange === "1H") dynamicValue = "9,820";
          if (m.label === "Active Sessions" && activeRange === "7D") dynamicValue = "14,900";
          
          return (
            <div key={m.label} className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant hover:-translate-y-1 transition-transform duration-300 shadow-soft">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>{m.icon}</span>
                </div>
                <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg ${
                  m.trendUp === true ? "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300" :
                  m.trendUp === false ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400" :
                  "bg-surface-container-highest text-on-surface-variant"
                }`}>
                  <span className="material-symbols-outlined text-[14px]">
                    {m.trendUp === true ? "trending_up" : m.trendUp === false ? "trending_down" : "trending_flat"}
                  </span>
                  {m.trend}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mb-1">{m.label}</p>
              <p className="text-2xl font-bold text-on-surface">
                {dynamicValue}<span className="text-base font-normal text-on-surface-variant ml-1">{m.unit}</span>
              </p>
            </div>
          );
        })}
      </div>

      {/* Chart + Live Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden shadow-soft">
          <div className="px-5 py-4 border-b border-outline-variant bg-surface flex justify-between items-center">
            <div>
              <h3 className="font-bold text-on-surface">System Load Trajectory</h3>
              <p className="text-[10px] text-on-surface-variant mt-0.5">Average load across this range: <strong>{avgLoad}%</strong></p>
            </div>
            <div className="flex gap-1">
              {["1H", "24H", "7D"].map(r => (
                <button
                  key={r}
                  onClick={() => setActiveRange(r)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${activeRange === r ? "bg-primary text-white" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="p-5 bg-surface-container-low min-h-[240px] relative flex items-end gap-2.5 pt-10">
            {currentLoad.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 h-36">
                <div
                  className={`w-full rounded-t-md hover:opacity-100 transition-all cursor-pointer ${
                    h > 75 ? "bg-red-500/80 hover:bg-red-500" :
                    h > 50 ? "bg-amber-500/80 hover:bg-amber-500" :
                    "bg-primary/70 hover:bg-primary"
                  }`}
                  style={{ height: `${h}%` }}
                  title={`Load: ${h}%`}
                />
                <span className="text-[9px] text-on-surface-variant/80 font-mono tracking-tight font-semibold mt-1 block select-none">
                  {currentLabels[i]}
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
          <h3 className="font-bold text-on-surface">Service Status (Click to Simulate status Cycle)</h3>
          <span className="text-[10px] uppercase font-extrabold text-on-surface-variant/60 tracking-wider">Simulation Controls Active</span>
        </div>
        <div className="divide-y divide-outline-variant/50">
          {services.map(s => (
            <div
              key={s.name}
              onClick={() => toggleServiceStatus(s.name)}
              className="flex items-center justify-between px-5 py-4 hover:bg-surface-container-low transition-colors cursor-pointer group"
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
                <span className="text-xs text-on-surface-variant">Uptime: <strong className="text-on-surface">{s.uptime}</strong></span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg select-none transition-all ${
                  s.status === "Operational" ? "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300" :
                  s.status === "Degraded" ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400" :
                  "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400"
                }`}>
                  {s.status}
                </span>
              </div>
            </div>
          ))}
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
