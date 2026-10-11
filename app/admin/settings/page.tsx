"use client";

import { useState, useEffect } from "react";
import { 
  Settings, Save, Globe, Mail, Phone, MapPin, 
  CheckCircle2, AlertCircle, Shield, Sparkles 
} from "lucide-react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    siteName: "Akubrecah Technologies",
    tagline: "Software Engineering & Digital Products That Scale",
    contactEmail: "engineering@akubrecah.com",
    contactPhone: "+254 791 497 858",
    officeLocation: "Nairobi, Kenya — East Africa Tech Hub",
    heroHeadline: "Engineering Digital Products That Scale",
    heroSubtitle: "Full-cycle software engineering — from concept to production. Web platforms, native mobile apps, cloud infrastructure, and mission-critical automated systems.",
    whatsappBotNumber: "254791497858",
    githubUrl: "https://github.com/Akubrecah",
    linkedinUrl: "https://linkedin.com/company/akubrecah",
    kraRetrievalPrice: "20",
    engineeringAvailability: "Open for New Projects",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.settings) {
          setSettings((prev) => ({ ...prev, ...data.settings }));
        }
      })
      .catch((err) => console.error("Failed to load settings:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update settings.");
      }

      setStatusMessage({ type: "success", text: "Website settings saved and applied successfully!" });
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "An error occurred while saving." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-4xl space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight">
          Website Settings & Identity
        </h1>
        <p className="text-xs text-on-surface-variant mt-1">
          Configure site identity, hero messaging, contact endpoints, and social channels.
        </p>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 ${
            statusMessage.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              : "bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400"
          }`}
        >
          {statusMessage.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-on-surface-variant bg-surface-container rounded-3xl border border-outline-variant">
          Loading site configurations...
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Card: Brand & Identity */}
          <div className="p-6 sm:p-7 rounded-3xl bg-surface-container border border-outline-variant space-y-4 shadow-soft">
            <div className="flex items-center gap-2.5 text-primary border-b border-outline-variant/60 pb-3">
              <Globe className="w-4 h-4" />
              <h2 className="text-sm font-black uppercase tracking-wider text-on-surface">Brand & Portal Identity</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-on-surface">Site Title / Brand Name</label>
                <input
                  type="text"
                  name="siteName"
                  value={settings.siteName}
                  onChange={handleChange}
                  required
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-on-surface">Site Tagline</label>
                <input
                  type="text"
                  name="tagline"
                  value={settings.tagline}
                  onChange={handleChange}
                  required
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-on-surface">Official Contact Email</label>
                <input
                  type="email"
                  name="contactEmail"
                  value={settings.contactEmail}
                  onChange={handleChange}
                  required
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-on-surface">Official Phone / WhatsApp</label>
                <input
                  type="text"
                  name="contactPhone"
                  value={settings.contactPhone}
                  onChange={handleChange}
                  required
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="font-bold text-on-surface">Headquarters Location</label>
                <input
                  type="text"
                  name="officeLocation"
                  value={settings.officeLocation}
                  onChange={handleChange}
                  required
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Card: Hero Section */}
          <div className="p-6 sm:p-7 rounded-3xl bg-surface-container border border-outline-variant space-y-4 shadow-soft">
            <div className="flex items-center gap-2.5 text-primary border-b border-outline-variant/60 pb-3">
              <Sparkles className="w-4 h-4" />
              <h2 className="text-sm font-black uppercase tracking-wider text-on-surface">Homepage Hero Positioning</h2>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-on-surface">Hero Headline</label>
                <input
                  type="text"
                  name="heroHeadline"
                  value={settings.heroHeadline}
                  onChange={handleChange}
                  required
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-on-surface">Hero Subtitle</label>
                <textarea
                  rows={3}
                  name="heroSubtitle"
                  value={settings.heroSubtitle}
                  onChange={handleChange}
                  required
                  className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-on-surface">Engineering Availability Badge</label>
                <input
                  type="text"
                  name="engineeringAvailability"
                  value={settings.engineeringAvailability}
                  onChange={handleChange}
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Card: External Integrations & Bot */}
          <div className="p-6 sm:p-7 rounded-3xl bg-surface-container border border-outline-variant space-y-4 shadow-soft">
            <div className="flex items-center gap-2.5 text-primary border-b border-outline-variant/60 pb-3">
              <Shield className="w-4 h-4" />
              <h2 className="text-sm font-black uppercase tracking-wider text-on-surface">Automation & Social Integrations</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-on-surface">Super Admin WhatsApp Bot Recipient</label>
                <input
                  type="text"
                  name="whatsappBotNumber"
                  value={settings.whatsappBotNumber}
                  onChange={handleChange}
                  placeholder="254791497858"
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-on-surface">KRA Retrieval Price (KES)</label>
                <input
                  type="number"
                  name="kraRetrievalPrice"
                  value={settings.kraRetrievalPrice}
                  onChange={handleChange}
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-on-surface">GitHub URL</label>
                <input
                  type="url"
                  name="githubUrl"
                  value={settings.githubUrl}
                  onChange={handleChange}
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-on-surface">LinkedIn URL</label>
                <input
                  type="url"
                  name="linkedinUrl"
                  value={settings.linkedinUrl}
                  onChange={handleChange}
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Website Settings
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
