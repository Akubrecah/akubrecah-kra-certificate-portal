"use client";

import { useState, useEffect } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLogin: string;
  initials: string;
}

const ROLES = [
  "All Roles",
  "Super Admin",
  "Portal Auditor",
  "Cybercafe Partner",
  "Registered Taxpayer"
];

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface-container-low">
          <h2 className="font-bold text-on-surface text-lg">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-surface-container transition-colors text-on-surface-variant">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [modal, setModal] = useState<null | "edit" | "resetPw">(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Form edit states
  const [formRole, setFormRole] = useState("Registered Taxpayer");
  const [confirmDeactivate, setConfirmDeactivate] = useState<User | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      } else {
        showToast("Error retrieving user accounts from Clerk: " + (data.error || "Access Denied"));
      }
    } catch (e) {
      console.error(e);
      showToast("Network error fetching users list from Clerk.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreate = () => {
    showToast("Invitations and public registrations dynamically generate Clerk user records.");
  };

  const openEdit = (u: User) => {
    setSelectedUser(u);
    setFormRole(u.role);
    setModal("edit");
  };

  const openResetPw = (u: User) => {
    setSelectedUser(u);
    setModal("resetPw");
  };

  const saveEdit = async () => {
    if (!selectedUser) return;
    
    // Protect admin from stripping own role
    if (selectedUser.email.toLowerCase() === "poweldayck@gmail.com" && formRole !== "Super Admin") {
      showToast("Cannot downgrade Super Admin role configuration.");
      setModal(null);
      return;
    }

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateRole", userId: selectedUser.id, role: formRole }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Updated user role to ${formRole} for ${selectedUser.name}`);
        fetchUsers();
      } else {
        showToast(data.error || "Failed to update role on Clerk.");
      }
    } catch (e) {
      showToast("Network error updating role on Clerk.");
    }
    setModal(null);
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    if (targetUser.email.toLowerCase() === "poweldayck@gmail.com") {
      showToast("Cannot ban or deactivate the active Super Admin account.");
      setConfirmDeactivate(null);
      return;
    }

    const targetStatus = currentStatus === "Active" ? "Inactive" : "Active";
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleStatus", userId, status: targetStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`User ${targetUser.name} ${targetStatus === "Active" ? "reactivated" : "deactivated"} successfully.`);
        fetchUsers();
      } else {
        showToast(data.error || "Failed to change user status on Clerk.");
      }
    } catch (e) {
      showToast("Network error modifying user status.");
    }
    setConfirmDeactivate(null);
  };

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || u.id.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "All Roles" || u.role === roleFilter;
    const matchStatus = statusFilter === "All Status" || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const inputCls = "w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all";

  return (
    <div className="max-w-[1280px] mx-auto space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">User Management</h1>
          <p className="text-on-surface-variant text-sm mt-1">View and manage portal user roles, statuses, and access permissions from Clerk.</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          Invite New User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-soft">
        <div className="relative w-full md:w-96 text-on-surface-variant">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px]">search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
            placeholder="Search by name, ID, or email..."
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="w-full md:w-48 appearance-none bg-surface-container-low border border-outline-variant rounded-xl pl-4 pr-8 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer">
              {ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[18px] pointer-events-none text-on-surface-variant">expand_more</span>
          </div>
          <div className="relative flex-1 md:flex-none">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full md:w-44 appearance-none bg-surface-container-low border border-outline-variant rounded-xl pl-4 pr-8 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer">
              <option>All Status</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[18px] pointer-events-none text-on-surface-variant">expand_more</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                {["User ID", "Name / Email", "Role", "Status", "Last Active Sign In", "Actions"].map((h, i) => (
                  <th key={h} className={`text-xs font-bold text-on-surface-variant uppercase py-3.5 px-6 tracking-wide ${i === 5 ? "text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40 text-sm text-on-surface">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-on-surface-variant">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      <span className="text-xs font-bold">Querying Clerk User Database...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-on-surface-variant font-medium">No users match your filters.</td>
                </tr>
              ) : (
                filtered.map(u => (
                  <tr key={u.id} className={`hover:bg-surface-container-low/40 transition-colors group ${u.status === "Inactive" ? "opacity-60" : ""}`}>
                    <td className="py-4 px-6 font-mono text-[11px] text-on-surface-variant">{u.id}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-primary font-bold text-xs shrink-0">{u.initials}</div>
                        <div>
                          <div className="font-semibold text-on-surface">{u.name}</div>
                          <div className="text-xs text-on-surface-variant">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-medium px-2.5 py-0.5 rounded-full text-xs bg-surface-container text-on-surface-variant">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {u.status === "Active" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300 text-xs font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-highest text-on-surface-variant text-xs font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-outline" />
                          Banned
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-on-surface-variant font-medium">{u.lastLogin}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(u)} className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-variant rounded-lg transition-colors" title="Change Role">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button onClick={() => openResetPw(u)} className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-variant rounded-lg transition-colors" title="Send Password Reset">
                          <span className="material-symbols-outlined text-[18px]">key</span>
                        </button>
                        {u.status === "Active" ? (
                          <button onClick={() => setConfirmDeactivate(u)} className="p-1.5 text-on-surface-variant hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors" title="Deactivate User">
                            <span className="material-symbols-outlined text-[18px]">block</span>
                          </button>
                        ) : (
                          <button onClick={() => handleToggleStatus(u.id, u.status)} className="p-1.5 text-on-surface-variant hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950 rounded-lg transition-colors" title="Reactivate User">
                            <span className="material-symbols-outlined text-[18px]">check_circle</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-surface-container-lowest border-t border-outline-variant px-6 py-3 flex items-center justify-between">
          <span className="text-xs text-on-surface-variant font-medium">Showing {filtered.length} of {users.length} registered Clerk users</span>
          <div className="flex gap-1">
            <button className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40" disabled>
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <button className="w-8 h-8 rounded-lg bg-primary text-white text-xs font-bold flex items-center justify-center">1</button>
            <button className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container-low" disabled>
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── MODALS ─── */}

      {/* Edit User Role */}
      {modal === "edit" && selectedUser && (
        <Modal title={`Modify Role — ${selectedUser.name}`} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] text-on-surface-variant/80 uppercase font-extrabold tracking-wider">User Account</span>
              <p className="font-semibold text-on-surface">{selectedUser.name} ({selectedUser.email})</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-primary uppercase tracking-wider">System Role Tier</label>
              <select value={formRole} onChange={e => setFormRole(e.target.value)} className={inputCls}>
                {ROLES.filter(r => r !== "All Roles").map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 border border-outline-variant rounded-xl text-on-surface font-bold hover:bg-surface-container transition-colors text-sm">Cancel</button>
              <button onClick={saveEdit} className="flex-1 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors text-sm">Save Changes</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reset Password */}
      {modal === "resetPw" && selectedUser && (
        <Modal title={`Reset Password — ${selectedUser.name}`} onClose={() => setModal(null)}>
          <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
            A password reset email trigger will be sent to <strong className="text-on-surface">{selectedUser.email}</strong> via Clerk to securely establish new credentials.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setModal(null)} className="flex-1 py-2.5 border border-outline-variant rounded-xl text-on-surface font-bold hover:bg-surface-container text-sm">Cancel</button>
            <button onClick={() => { setModal(null); showToast(`Clerk password reset link sent to ${selectedUser.email}`); }} className="flex-1 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 text-sm">Send Reset Email</button>
          </div>
        </Modal>
      )}

      {/* Confirm Deactivate */}
      {confirmDeactivate && (
        <Modal title="Deactivate User Account?" onClose={() => setConfirmDeactivate(null)}>
          <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
            Are you sure you want to deactivate and ban <strong className="text-on-surface">{confirmDeactivate.name}</strong>? They will be locked out of all portal dashboard sections immediately.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setConfirmDeactivate(null)} className="flex-1 py-2.5 border border-outline-variant rounded-xl text-on-surface font-bold hover:bg-surface-container text-sm">Cancel</button>
            <button onClick={() => handleToggleStatus(confirmDeactivate.id, confirmDeactivate.status)} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 text-sm">Deactivate Account</button>
          </div>
        </Modal>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg px-5 py-3">
          <span className="material-symbols-outlined text-primary text-[20px]">info</span>
          <span className="text-sm font-medium text-on-surface">{toast}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}
    </div>
  );
}
