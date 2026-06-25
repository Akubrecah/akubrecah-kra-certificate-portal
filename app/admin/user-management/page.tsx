"use client";

import { useState } from "react";

const INITIAL_USERS = [
  { id: "USR-8492-AX", name: "Sarah Jenkins", email: "s.jenkins@taxauthority.gov", role: "Administrator", status: "Active", lastLogin: "Today, 09:41 AM", initials: "SJ" },
  { id: "USR-3310-BT", name: "Marcus Rossi", email: "m.rossi@taxauthority.gov", role: "Senior Auditor", status: "Active", lastLogin: "Yesterday, 14:22 PM", initials: "MR" },
  { id: "USR-9122-CZ", name: "Elena Lopez", email: "e.lopez@taxauthority.gov", role: "Data Analyst", status: "Inactive", lastLogin: "Oct 12, 2023", initials: "EL" },
  { id: "USR-1094-DL", name: "David Kim", email: "d.kim@taxauthority.gov", role: "Compliance Officer", status: "Active", lastLogin: "Today, 08:15 AM", initials: "DK" },
  { id: "USR-5521-EM", name: "Amara Osei", email: "a.osei@taxauthority.gov", role: "Data Analyst", status: "Active", lastLogin: "Today, 10:02 AM", initials: "AO" },
  { id: "USR-6671-FN", name: "Liam Peters", email: "l.peters@taxauthority.gov", role: "Auditor", status: "Inactive", lastLogin: "Sep 30, 2023", initials: "LP" },
];

const ROLES = ["All Roles", "Administrator", "Senior Auditor", "Data Analyst", "Compliance Officer", "Auditor"];

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
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

type User = typeof INITIAL_USERS[0];

export default function UserManagementPage() {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [modal, setModal] = useState<null | "create" | "edit" | "resetPw">(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // New / edit form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState("Data Analyst");
  const [confirmDeactivate, setConfirmDeactivate] = useState<User | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const openCreate = () => {
    setFormName(""); setFormEmail(""); setFormRole("Data Analyst");
    setModal("create");
  };

  const openEdit = (u: User) => {
    setSelectedUser(u);
    setFormName(u.name); setFormEmail(u.email); setFormRole(u.role);
    setModal("edit");
  };

  const openResetPw = (u: User) => { setSelectedUser(u); setModal("resetPw"); };

  const saveCreate = () => {
    if (!formName || !formEmail) return;
    const newUser: User = {
      id: `USR-${Math.floor(1000 + Math.random() * 9000)}-XX`,
      name: formName, email: formEmail, role: formRole,
      status: "Active", lastLogin: "Just now",
      initials: formName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2),
    };
    setUsers(prev => [newUser, ...prev]);
    setModal(null);
    showToast(`User ${formName} created successfully.`);
  };

  const saveEdit = () => {
    if (!selectedUser) return;
    setUsers(prev => prev.map(u => u.id === selectedUser.id
      ? { ...u, name: formName, email: formEmail, role: formRole, initials: formName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) }
      : u
    ));
    setModal(null);
    showToast(`User ${formName} updated successfully.`);
  };

  const toggleStatus = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      const newStatus = u.status === "Active" ? "Inactive" : "Active";
      showToast(`User ${u.name} ${newStatus === "Active" ? "reactivated" : "deactivated"}.`);
      return { ...u, status: newStatus };
    }));
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
    <div className="max-w-[1280px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">User Management</h1>
          <p className="text-on-surface-variant text-sm mt-1">View and manage portal user access, roles, and status.</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          Create New User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
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
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="w-full md:w-44 appearance-none bg-surface-container-low border border-outline-variant rounded-xl pl-4 pr-8 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer">
              {ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[18px] pointer-events-none text-on-surface-variant">expand_more</span>
          </div>
          <div className="relative flex-1 md:flex-none">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full md:w-44 appearance-none bg-surface-container-low border border-outline-variant rounded-xl pl-4 pr-8 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer">
              <option>All Status</option><option>Active</option><option>Inactive</option>
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[18px] pointer-events-none text-on-surface-variant">expand_more</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                {["User ID", "Name / Email", "Role", "Status", "Last Login", "Actions"].map((h, i) => (
                  <th key={h} className={`text-xs font-bold text-on-surface-variant uppercase py-3 px-6 tracking-wide ${i === 5 ? "text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50 text-sm text-on-surface">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-on-surface-variant">No users match your filters.</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id} className={`hover:bg-surface-container-low transition-colors group ${u.status === "Inactive" ? "opacity-60" : ""}`}>
                  <td className="py-4 px-6 font-mono text-xs text-on-surface-variant">{u.id}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-primary font-bold text-xs shrink-0">{u.initials}</div>
                      <div>
                        <div className="font-medium">{u.name}</div>
                        <div className="text-xs text-on-surface-variant">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">{u.role}</td>
                  <td className="py-4 px-6">
                    {u.status === "Active"
                      ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300 text-xs font-bold"><span className="w-1.5 h-1.5 rounded-full bg-green-600" />Active</span>
                      : <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-highest text-on-surface-variant text-xs font-bold"><span className="w-1.5 h-1.5 rounded-full bg-outline" />Inactive</span>
                    }
                  </td>
                  <td className="py-4 px-6 text-on-surface-variant">{u.lastLogin}</td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(u)} className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-variant rounded-lg transition-colors" title="Edit User">
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button onClick={() => openResetPw(u)} className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-variant rounded-lg transition-colors" title="Reset Password">
                        <span className="material-symbols-outlined text-[18px]">key</span>
                      </button>
                      {u.status === "Active"
                        ? <button onClick={() => setConfirmDeactivate(u)} className="p-1.5 text-on-surface-variant hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors" title="Deactivate">
                            <span className="material-symbols-outlined text-[18px]">block</span>
                          </button>
                        : <button onClick={() => toggleStatus(u.id)} className="p-1.5 text-on-surface-variant hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950 rounded-lg transition-colors" title="Reactivate">
                            <span className="material-symbols-outlined text-[18px]">check_circle</span>
                          </button>
                      }
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="bg-surface-container-lowest border-t border-outline-variant px-6 py-3 flex items-center justify-between">
          <span className="text-sm text-on-surface-variant">Showing {filtered.length} of {users.length} users</span>
          <div className="flex gap-1">
            <button className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40" disabled>
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <button className="w-8 h-8 rounded-lg bg-primary text-white text-sm font-bold flex items-center justify-center">1</button>
            <button className="w-8 h-8 rounded-lg text-on-surface hover:bg-surface-container-low text-sm flex items-center justify-center">2</button>
            <button className="w-8 h-8 rounded-lg text-on-surface hover:bg-surface-container-low text-sm flex items-center justify-center">3</button>
            <span className="w-8 h-8 flex items-center justify-center text-on-surface-variant">…</span>
            <button className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container-low">
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── MODALS ─── */}

      {/* Create User */}
      {modal === "create" && (
        <Modal title="Create New User" onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-primary uppercase tracking-wider">Full Name</label>
              <input value={formName} onChange={e => setFormName(e.target.value)} className={inputCls} placeholder="e.g. Jane Smith" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-primary uppercase tracking-wider">Email</label>
              <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} className={inputCls} placeholder="j.smith@taxauthority.gov" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-primary uppercase tracking-wider">Role</label>
              <select value={formRole} onChange={e => setFormRole(e.target.value)} className={inputCls}>
                {ROLES.filter(r => r !== "All Roles").map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 border border-outline-variant rounded-xl text-on-surface font-bold hover:bg-surface-container transition-colors text-sm">Cancel</button>
              <button onClick={saveCreate} className="flex-1 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors text-sm">Create User</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit User */}
      {modal === "edit" && selectedUser && (
        <Modal title={`Edit — ${selectedUser.name}`} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-primary uppercase tracking-wider">Full Name</label>
              <input value={formName} onChange={e => setFormName(e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-primary uppercase tracking-wider">Email</label>
              <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-primary uppercase tracking-wider">Role</label>
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
          <p className="text-sm text-on-surface-variant mb-4">A password reset link will be sent to <strong className="text-on-surface">{selectedUser.email}</strong>.</p>
          <div className="flex gap-3">
            <button onClick={() => setModal(null)} className="flex-1 py-2.5 border border-outline-variant rounded-xl text-on-surface font-bold hover:bg-surface-container text-sm">Cancel</button>
            <button onClick={() => { setModal(null); showToast(`Password reset link sent to ${selectedUser.email}`); }} className="flex-1 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 text-sm">Send Reset Link</button>
          </div>
        </Modal>
      )}

      {/* Confirm Deactivate */}
      {confirmDeactivate && (
        <Modal title="Deactivate User?" onClose={() => setConfirmDeactivate(null)}>
          <p className="text-sm text-on-surface-variant mb-4">Are you sure you want to deactivate <strong className="text-on-surface">{confirmDeactivate.name}</strong>? They will lose access immediately.</p>
          <div className="flex gap-3">
            <button onClick={() => setConfirmDeactivate(null)} className="flex-1 py-2.5 border border-outline-variant rounded-xl text-on-surface font-bold hover:bg-surface-container text-sm">Cancel</button>
            <button onClick={() => toggleStatus(confirmDeactivate.id)} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 text-sm">Deactivate</button>
          </div>
        </Modal>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg px-5 py-3">
          <span className="material-symbols-outlined text-green-600 text-[20px]">check_circle</span>
          <span className="text-sm font-medium text-on-surface">{toast}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}
    </div>
  );
}
