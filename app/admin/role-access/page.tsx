"use client";

import { useState } from "react";

const INITIAL_ROLES = [
  { id: "admin", name: "Super Admin", desc: "Full administrative controls and security configurations." },
  { id: "auditor", name: "Portal Auditor", desc: "Read-only access to audit logs and system performance." },
  { id: "operator", name: "Cybercafe Partner", desc: "Bulk returns filing, certificate printing, and client management." },
  { id: "taxpayer", name: "Registered Taxpayer", desc: "Self-service returns filing, payments, and personal PIN lookups." },
];

const PERMISSIONS = [
  { key: "dashboard", label: "View Dashboard", category: "General Access" },
  { key: "file_returns", label: "File Tax Return", category: "Core Features" },
  { key: "cert_retrieval", label: "Download Certificates", category: "Core Features" },
  { key: "manage_users", label: "Manage Portal Users", category: "Administration" },
  { key: "system_settings", label: "System Config Settings", category: "Administration" },
  { key: "security_logs", label: "View Security Logs", category: "Security" },
];

const DEFAULT_MATRIX: Record<string, Record<string, boolean>> = {
  admin: { dashboard: true, file_returns: true, cert_retrieval: true, manage_users: true, system_settings: true, security_logs: true },
  auditor: { dashboard: true, file_returns: false, cert_retrieval: false, manage_users: false, system_settings: false, security_logs: true },
  operator: { dashboard: true, file_returns: true, cert_retrieval: true, manage_users: false, system_settings: false, security_logs: false },
  taxpayer: { dashboard: true, file_returns: true, cert_retrieval: true, manage_users: false, system_settings: false, security_logs: false },
};

export default function RoleAccessPage() {
  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>(DEFAULT_MATRIX);
  const [selectedRole, setSelectedRole] = useState("admin");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggle = (roleId: string, permKey: string) => {
    // Protect admin from stripping own settings
    if (roleId === "admin" && permKey === "system_settings") {
      showToast("Cannot revoke core System Settings permission from Super Admin.");
      return;
    }
    
    setMatrix(prev => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        [permKey]: !prev[roleId][permKey]
      }
    }));
    
    const roleName = INITIAL_ROLES.find(r => r.id === roleId)?.name || roleId;
    const permLabel = PERMISSIONS.find(p => p.key === permKey)?.label || permKey;
    const isGranted = !matrix[roleId][permKey];
    showToast(`${isGranted ? "Granted" : "Revoked"} "${permLabel}" for ${roleName}`);
  };

  const saveMatrix = () => {
    showToast("Role access control matrix saved successfully!");
  };

  const resetMatrix = () => {
    setMatrix(DEFAULT_MATRIX);
    showToast("Permissions matrix reset to factory defaults.");
  };

  return (
    <div className="max-w-[1280px] mx-auto space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Role & Permissions</h1>
          <p className="text-on-surface-variant text-sm mt-1">Configure feature visibility and access levels for portal roles.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetMatrix}
            className="px-4 py-2 bg-surface-container border border-outline-variant hover:bg-surface-container-high text-sm font-bold text-on-surface rounded-xl transition-all"
          >
            Reset Matrix
          </button>
          <button
            onClick={saveMatrix}
            className="px-5 py-2 bg-primary text-white hover:bg-primary/90 text-sm font-bold rounded-xl shadow-soft transition-all"
          >
            Save Access Matrix
          </button>
        </div>
      </div>

      {/* Access Matrix Dashboard */}
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        {/* Permission Grid Matrix Table */}
        <div className="flex-1 min-w-[300px] md:min-w-[600px] bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-outline-variant bg-surface">
            <h3 className="font-bold text-on-surface">System Permissions Matrix</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="text-xs font-bold text-on-surface-variant uppercase py-3.5 px-5">Permission Module</th>
                  {INITIAL_ROLES.map(role => (
                    <th key={role.id} className="text-xs font-bold text-on-surface-variant uppercase py-3.5 px-5 text-center">{role.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40 text-sm">
                {PERMISSIONS.map(perm => (
                  <tr key={perm.key} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-medium text-on-surface">{perm.label}</div>
                      <span className="text-[10px] text-on-surface-variant/80 uppercase font-bold tracking-wider">{perm.category}</span>
                    </td>
                    {INITIAL_ROLES.map(role => {
                      const isChecked = matrix[role.id]?.[perm.key] || false;
                      return (
                        <td key={role.id} className="py-4 px-5 text-center">
                          <button
                            onClick={() => handleToggle(role.id, perm.key)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/20 ${isChecked ? "bg-primary" : "bg-surface-container-high"}`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isChecked ? "translate-x-5" : "translate-x-0"}`}
                            />
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Role Inspector Panel */}
        <div className="w-full xl:w-80 shrink-0 space-y-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5">
            <h3 className="font-bold text-on-surface mb-4">Role Descriptions</h3>
            <div className="space-y-4">
              {INITIAL_ROLES.map(role => (
                <div
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${selectedRole === role.id ? "bg-primary/5 border-primary" : "bg-surface-container-low border-transparent hover:border-outline-variant"}`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`material-symbols-outlined text-[18px] ${selectedRole === role.id ? "text-primary" : "text-on-surface-variant"}`}>
                      {role.id === "admin" ? "shield" : role.id === "auditor" ? "visibility" : role.id === "operator" ? "storefront" : "person"}
                    </span>
                    <h4 className="font-bold text-on-surface text-sm">{role.name}</h4>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{role.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5">
            <h4 className="text-xs font-extrabold text-primary tracking-wider uppercase mb-3">Security Notice</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Any changes made to the Access Matrix instantly alter the session authorization tokens. Revoking a feature will lock users out of their respective screens upon the next API call or page reload.
            </p>
          </div>
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
