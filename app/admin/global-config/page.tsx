"use client";

import { useState, useEffect } from "react";

interface ConfigState {
  kraUrl: string;
  mpesaKey: string;
  mpesaShortcode: string;
  sandboxMode: boolean;
  nilFilingFee: number;
  retrievalFee: number;
  partnerCommission: number;
  maintenanceMode: boolean;
  sessionTimeout: number;
  backupInterval: string;
}

const DEFAULT_CONFIG: ConfigState = {
  kraUrl: "https://api.kra.go.ke/v2/itax",
  mpesaKey: "SDF90312LKSF091",
  mpesaShortcode: "4081920",
  sandboxMode: true,
  nilFilingFee: 100,
  retrievalFee: 150,
  partnerCommission: 20,
  maintenanceMode: false,
  sessionTimeout: 30,
  backupInterval: "Daily",
};

export default function GlobalConfigPage() {
  const [config, setConfig] = useState<ConfigState>(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState<"api" | "billing" | "system">("api");
  const [toast, setToast] = useState<string | null>(null);

  // Load config from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("admin_global_config");
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse config from localStorage", e);
      }
    }
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("admin_global_config", JSON.stringify(config));
    showToast("Global configuration settings updated successfully!");
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
    localStorage.setItem("admin_global_config", JSON.stringify(DEFAULT_CONFIG));
    showToast("Configuration reset to default settings.");
  };

  const inputCls = "w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all";
  const labelCls = "block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5";

  return (
    <div className="max-w-[1280px] mx-auto space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Global Config</h1>
          <p className="text-on-surface-variant text-sm mt-1">Configure core system variables, payment values, and API integrations.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 bg-surface-container border border-outline-variant hover:bg-surface-container-high text-sm font-bold text-on-surface rounded-xl transition-all"
          >
            Reset Defaults
          </button>
          <button
            type="submit"
            form="config-form"
            className="px-5 py-2 bg-primary text-white hover:bg-primary/90 text-sm font-bold rounded-xl shadow-soft transition-all"
          >
            Save Configuration
          </button>
        </div>
      </div>

      <form id="config-form" onSubmit={handleSave} className="flex flex-col xl:flex-row gap-6 items-start">
        {/* Navigation Sidebar Tabs */}
        <div className="w-full xl:w-64 shrink-0 bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 flex flex-col gap-1.5">
          <h3 className="font-bold text-on-surface px-2 mb-3 text-sm uppercase tracking-wider text-on-surface-variant/70">Configuration Tabs</h3>
          <button
            type="button"
            onClick={() => setActiveTab("api")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-bold ${activeTab === "api" ? "bg-primary/5 text-primary border border-primary/20" : "text-on-surface-variant hover:bg-surface-container-low border border-transparent"}`}
          >
            <span className="material-symbols-outlined text-[20px]">api</span>
            API Integrations
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("billing")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-bold ${activeTab === "billing" ? "bg-primary/5 text-primary border border-primary/20" : "text-on-surface-variant hover:bg-surface-container-low border border-transparent"}`}
          >
            <span className="material-symbols-outlined text-[20px]">payments</span>
            Billing & Service Fees
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("system")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-bold ${activeTab === "system" ? "bg-primary/5 text-primary border border-primary/20" : "text-on-surface-variant hover:bg-surface-container-low border border-transparent"}`}
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
            System Controls
          </button>
        </div>

        {/* Configurations Fields Wrapper */}
        <div className="flex-1 min-w-[300px] bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-soft">
          {/* TAB 1: API Integrations */}
          {activeTab === "api" && (
            <div className="space-y-5">
              <h3 className="font-bold text-on-surface text-lg border-b border-outline-variant/60 pb-3 mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">api</span>
                API Gateway Configurations
              </h3>
              
              <div className="space-y-1.5">
                <label className={labelCls}>KRA iTax Gateway Endpoint URL</label>
                <input
                  type="url"
                  required
                  value={config.kraUrl}
                  onChange={e => setConfig(prev => ({ ...prev, kraUrl: e.target.value }))}
                  className={inputCls}
                  placeholder="https://api.kra.go.ke/v2/itax"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelCls}>M-Pesa Consumer API Key</label>
                  <input
                    type="text"
                    required
                    value={config.mpesaKey}
                    onChange={e => setConfig(prev => ({ ...prev, mpesaKey: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>M-Pesa Express Shortcode</label>
                  <input
                    type="text"
                    required
                    value={config.mpesaShortcode}
                    onChange={e => setConfig(prev => ({ ...prev, mpesaShortcode: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-on-surface text-sm">Sandbox Mode Enabled</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">Toggle Safaricom Daraja sandbox endpoints vs live production.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, sandboxMode: !prev.sandboxMode }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${config.sandboxMode ? "bg-primary" : "bg-outline"}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${config.sandboxMode ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Billing & Fees */}
          {activeTab === "billing" && (
            <div className="space-y-5">
              <h3 className="font-bold text-on-surface text-lg border-b border-outline-variant/60 pb-3 mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">payments</span>
                Billing Pricing Rules
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelCls}>NIL Tax Filing Service Fee (KES)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={config.nilFilingFee}
                    onChange={e => setConfig(prev => ({ ...prev, nilFilingFee: Number(e.target.value) }))}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>KRA Certificate Retrieval Service Fee (KES)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={config.retrievalFee}
                    onChange={e => setConfig(prev => ({ ...prev, retrievalFee: Number(e.target.value) }))}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={labelCls}>Cybercafe Partner Commission (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={config.partnerCommission}
                    onChange={e => setConfig(prev => ({ ...prev, partnerCommission: Number(e.target.value) }))}
                    className={`${inputCls} pr-8`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold text-xs">%</span>
                </div>
                <p className="text-xs text-on-surface-variant mt-1">Percentage split automatically transferred to registering cybercafe business nodes.</p>
              </div>
            </div>
          )}

          {/* TAB 3: System Controls */}
          {activeTab === "system" && (
            <div className="space-y-5">
              <h3 className="font-bold text-on-surface text-lg border-b border-outline-variant/60 pb-3 mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">settings</span>
                Global Portal Settings
              </h3>

              <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-on-surface text-sm text-error">System Maintenance Mode</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">Locks taxpayer portals and displays maintenance page globally.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, maintenanceMode: !prev.maintenanceMode }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${config.maintenanceMode ? "bg-primary" : "bg-outline"}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${config.maintenanceMode ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className={labelCls}>Inactive Session Timeout</label>
                  <span className="text-xs font-bold text-primary">{config.sessionTimeout} minutes</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="120"
                  step="5"
                  value={config.sessionTimeout}
                  onChange={e => setConfig(prev => ({ ...prev, sessionTimeout: Number(e.target.value) }))}
                  className="w-full h-1.5 bg-surface-container rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className={labelCls}>Automated Database Backups</label>
                <div className="relative">
                  <select
                    value={config.backupInterval}
                    onChange={e => setConfig(prev => ({ ...prev, backupInterval: e.target.value }))}
                    className={`${inputCls} appearance-none pr-10 cursor-pointer`}
                  >
                    <option value="Hourly">Hourly Incremental Backup</option>
                    <option value="Daily">Daily Full Snapshot</option>
                    <option value="Weekly">Weekly Full Snapshot</option>
                    <option value="Monthly">Monthly Full Snapshot</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] pointer-events-none">expand_more</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Custom Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg px-5 py-3 animate-slide-up">
          <span className="material-symbols-outlined text-primary text-[20px]">info</span>
          <span className="text-sm font-medium text-on-surface">{toast}</span>
        </div>
      )}
    </div>
  );
}
