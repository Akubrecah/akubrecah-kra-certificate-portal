"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  Camera,
  CheckCircle2,
  ShieldCheck,
  User,
  Pencil,
  AtSign,
  Smartphone,
  Shield,
  Key,
  Lock,
  History,
  AlertTriangle,
  X,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";

interface ProfileClientProps {
  fullName: string;
  email: string | null;
  phone: string | null;
  imageUrl: string;
}

const NATIONALITIES = [
  "Kenyan","Ugandan","Tanzanian","Rwandan","Ethiopian","Somali",
  "South Sudanese","Burundian","Congolese","Afghan","Albanian","Algerian",
  "American","Angolan","Argentine","Australian","Austrian","Bangladeshi",
  "Belgian","Brazilian","British","Bulgarian","Cambodian","Cameroonian",
  "Canadian","Chilean","Chinese","Colombian","Croatian","Czech","Danish",
  "Dutch","Egyptian","Finnish","French","Ghanaian","Greek","Hungarian",
  "Indian","Indonesian","Iranian","Iraqi","Irish","Israeli","Italian",
  "Japanese","Jordanian","Korean","Lebanese","Libyan","Malaysian","Mexican",
  "Moroccan","Mozambican","Namibian","New Zealander","Nigerian","Norwegian",
  "Pakistani","Palestinian","Peruvian","Philippine","Polish","Portuguese",
  "Romanian","Russian","Saudi","Senegalese","Serbian","Singaporean",
  "South African","Spanish","Sri Lankan","Sudanese","Swedish","Swiss",
  "Syrian","Thai","Tunisian","Turkish","Ukrainian","Emirati","Venezuelan",
  "Vietnamese","Zambian","Zimbabwean","Other",
];

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface-container-low">
          <h2 className="font-bold text-on-surface text-lg">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-container transition-colors text-on-surface-variant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg px-5 py-3 animate-in slide-in-from-bottom-4">
      <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
      <span className="font-medium text-on-surface text-sm">{message}</span>
      <button onClick={onClose} className="ml-2 text-on-surface-variant hover:text-on-surface">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function ProfileClient({
  fullName: initialFullName,
  email: initialEmail,
  phone: initialPhone,
  imageUrl,
}: ProfileClientProps) {
  // State
  const [fullName, setFullName] = useState(initialFullName);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [dob, setDob] = useState("1985-05-12");
  const [gender, setGender] = useState("Male");
  const [nationality, setNationality] = useState("Kenyan");
  const [twoFAEnabled, setTwoFAEnabled] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // Modal state
  const [modal, setModal] = useState<
    "personal" | "contact" | "password" | "loginActivity" | null
  >(null);

  // Form temp values
  const [tempFirstName, setTempFirstName] = useState("");
  const [tempLastName, setTempLastName] = useState("");
  const [tempDob, setTempDob] = useState("");
  const [tempGender, setTempGender] = useState("");
  const [tempNationality, setTempNationality] = useState("");
  const [tempEmail, setTempEmail] = useState("");
  const [tempPhone, setTempPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const openPersonalModal = () => {
    const [first, ...rest] = fullName.split(" ");
    setTempFirstName(first || "");
    setTempLastName(rest.join(" ") || "");
    setTempDob(dob);
    setTempGender(gender);
    setTempNationality(nationality);
    setModal("personal");
  };

  const savePersonal = () => {
    setFullName(`${tempFirstName} ${tempLastName}`.trim());
    setDob(tempDob);
    setGender(tempGender);
    setNationality(tempNationality);
    setModal(null);
    showToast("Personal information updated successfully.");
  };

  const openContactModal = () => {
    setTempEmail(email || "");
    setTempPhone(phone || "");
    setModal("contact");
  };

  const saveContact = () => {
    setEmail(tempEmail || null);
    setPhone(tempPhone || null);
    setModal(null);
    showToast("Contact information updated successfully.");
  };

  const savePassword = () => {
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
    setModal(null);
    showToast("Password changed successfully.");
  };

  const missingPhone = !phone;
  const missingEmail = !email;

  const inputCls =
    "w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm";

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      {/* Profile Header */}
      <section className="bg-surface-container-lowest rounded-2xl p-8 mb-6 shadow-soft flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden border border-outline-variant">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-8 -mt-8" />
        <div className="relative">
          <Image
            className="w-32 h-32 rounded-2xl object-cover shadow-lg border-4 border-surface-container"
            alt={fullName}
            width={128}
            height={128}
            src={imageUrl}
          />
          <button
            title="Change photo"
            className="absolute -bottom-2 -right-2 bg-primary text-white p-2 rounded-xl shadow-lg hover:scale-110 transition-transform"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-3xl font-bold text-on-surface">{fullName}</h2>
          <p className="text-on-surface-variant text-sm mt-1">
            {email ?? "No email on file"}
          </p>
          <div className="mt-5 flex flex-wrap justify-center md:justify-start gap-3">
            <span className="px-4 py-1.5 bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300 rounded-full text-sm font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Active Status
            </span>
            <span className="px-4 py-1.5 bg-surface-container-high text-on-surface-variant rounded-full text-sm font-medium flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> KYC Verified
            </span>
          </div>
        </div>
      </section>

      {/* Missing Info Banners */}
      {(missingPhone || missingEmail) && (
        <div className="space-y-3 mb-6">
          {missingEmail && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-300 dark:border-amber-700 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-bold text-amber-900 dark:text-amber-200 text-sm">Email address missing</p>
                <p className="text-amber-700 dark:text-amber-300 text-sm mt-0.5">
                  Add an email to unlock full functionality and notifications.
                </p>
              </div>
              <button
                onClick={openContactModal}
                className="text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-400 rounded-lg px-3 py-1.5 hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors whitespace-nowrap"
              >
                Update Now
              </button>
            </div>
          )}
          {missingPhone && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-300 dark:border-amber-700 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-bold text-amber-900 dark:text-amber-200 text-sm">Phone number missing</p>
                <p className="text-amber-700 dark:text-amber-300 text-sm mt-0.5">
                  Required for certificate downloads and two-factor authentication.
                </p>
              </div>
              <button
                onClick={openContactModal}
                className="text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-400 rounded-lg px-3 py-1.5 hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors whitespace-nowrap"
              >
                Update Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-soft border border-outline-variant overflow-hidden hover:-translate-y-1 transition-transform duration-300">
          <div className="px-6 py-4 bg-surface-container-low border-b border-outline-variant flex justify-between items-center">
            <h3 className="font-bold text-on-surface flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> Personal Information
            </h3>
            <button
              onClick={openPersonalModal}
              className="text-primary text-sm font-bold flex items-center gap-1 hover:underline"
            >
              <Pencil className="w-4 h-4" /> Edit
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Full Name</span>
              <span className="text-on-surface font-medium">{fullName}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Date of Birth</span>
                <span className="text-on-surface font-medium">
                  {new Date(dob).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Gender</span>
                <span className="text-on-surface font-medium">{gender}</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Nationality</span>
              <span className="text-on-surface font-medium">{nationality}</span>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-soft border border-outline-variant overflow-hidden hover:-translate-y-1 transition-transform duration-300">
          <div className="px-6 py-4 bg-surface-container-low border-b border-outline-variant flex justify-between items-center">
            <h3 className="font-bold text-on-surface flex items-center gap-2">
              <AtSign className="w-5 h-5 text-primary" /> Contact Information
            </h3>
            <button
              onClick={openContactModal}
              className="text-primary text-sm font-bold flex items-center gap-1 hover:underline"
            >
              <Pencil className="w-4 h-4" /> Edit
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <AtSign className="w-5 h-5 text-primary mt-1" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Email Address</span>
                {email
                  ? <span className="text-on-surface font-medium">{email}</span>
                  : <span className="text-amber-600 dark:text-amber-400 font-medium text-sm flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Not provided</span>
                }
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Smartphone className="w-5 h-5 text-primary mt-1" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Phone Number</span>
                {phone
                  ? <span className="text-on-surface font-medium">{phone}</span>
                  : <span className="text-amber-600 dark:text-amber-400 font-medium text-sm flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Not provided</span>
                }
              </div>
            </div>
          </div>
        </div>

        {/* Account Security */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-soft border border-outline-variant overflow-hidden hover:-translate-y-1 transition-transform duration-300 sm:col-span-2">
          <div className="px-6 py-4 bg-surface-container-low border-b border-outline-variant">
            <h3 className="font-bold text-on-surface flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" /> Account Security
            </h3>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Password */}
            <div className="flex items-center justify-between p-4 bg-surface rounded-xl border border-outline-variant/50">
              <div className="flex items-center gap-3">
                <Key className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-bold text-on-surface text-sm">Password</p>
                  <p className="text-xs text-on-surface-variant">Last changed recently</p>
                </div>
              </div>
              <button
                onClick={() => { setPasswordError(""); setModal("password"); }}
                className="px-3 py-1.5 border border-outline-variant text-on-surface text-sm font-bold rounded-xl hover:bg-surface-container transition-colors"
              >
                Change
              </button>
            </div>
            {/* 2FA */}
            <div className="flex items-center justify-between p-4 bg-surface rounded-xl border border-outline-variant/50">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-bold text-on-surface text-sm">Two-Factor Auth</p>
                  <p className={`text-xs font-medium ${twoFAEnabled ? "text-green-600 dark:text-green-400" : "text-on-surface-variant"}`}>
                    {twoFAEnabled ? "Enabled via SMS" : "Disabled"}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={twoFAEnabled}
                  onChange={(e) => {
                    setTwoFAEnabled(e.target.checked);
                    showToast(e.target.checked ? "Two-factor authentication enabled." : "Two-factor authentication disabled.");
                  }}
                />
                <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
              </label>
            </div>
            {/* Login Activity */}
            <button
              onClick={() => setModal("loginActivity")}
              className="flex items-center justify-center gap-2 p-4 text-primary font-bold text-sm hover:bg-primary/5 rounded-xl transition-colors border border-dashed border-primary/40"
            >
              <History className="w-5 h-5" /> View Login Activity
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center text-on-surface-variant border-t border-outline-variant pt-8">
        <p className="text-sm">For updates requiring document verification, please visit any KRA Huduma Centre.</p>
        <div className="flex justify-center gap-6 mt-4">
          <Link href="/legal/privacy" className="text-xs font-bold hover:text-primary transition-colors uppercase">Privacy Policy</Link>
          <Link href="/legal/terms" className="text-xs font-bold hover:text-primary transition-colors uppercase">Terms of Service</Link>
          <Link href="#" className="text-xs font-bold hover:text-primary transition-colors uppercase">Support</Link>
        </div>
      </footer>

      {/* ─── MODALS ─── */}

      {/* Edit Personal Information */}
      {modal === "personal" && (
        <Modal title="Edit Personal Information" onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-primary uppercase tracking-wider">First Name</label>
                <input value={tempFirstName} onChange={e => setTempFirstName(e.target.value)} className={inputCls} placeholder="First name" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-primary uppercase tracking-wider">Last Name</label>
                <input value={tempLastName} onChange={e => setTempLastName(e.target.value)} className={inputCls} placeholder="Last name" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-primary uppercase tracking-wider">Date of Birth</label>
              <input type="date" value={tempDob} onChange={e => setTempDob(e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-primary uppercase tracking-wider">Gender</label>
              <select value={tempGender} onChange={e => setTempGender(e.target.value)} className={inputCls}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-primary uppercase tracking-wider">Nationality</label>
              <select value={tempNationality} onChange={e => setTempNationality(e.target.value)} className={inputCls}>
                {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 border border-outline-variant rounded-xl text-on-surface font-bold hover:bg-surface-container transition-colors text-sm">Cancel</button>
              <button onClick={savePersonal} className="flex-1 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 text-sm">
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Contact Information */}
      {modal === "contact" && (
        <Modal title="Edit Contact Information" onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-primary uppercase tracking-wider">Email Address</label>
              <input type="email" value={tempEmail} onChange={e => setTempEmail(e.target.value)} className={inputCls} placeholder="you@example.com" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-primary uppercase tracking-wider">Phone Number</label>
              <input type="tel" value={tempPhone} onChange={e => setTempPhone(e.target.value)} className={inputCls} placeholder="+254 700 000 000" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 border border-outline-variant rounded-xl text-on-surface font-bold hover:bg-surface-container transition-colors text-sm">Cancel</button>
              <button onClick={saveContact} className="flex-1 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 text-sm">
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Change Password */}
      {modal === "password" && (
        <Modal title="Change Password" onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-primary uppercase tracking-wider">Current Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className={inputCls + " pr-10"}
                  placeholder="Enter current password"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-primary uppercase tracking-wider">New Password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputCls} placeholder="Min. 8 characters" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-primary uppercase tracking-wider">Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputCls} placeholder="Repeat new password" />
            </div>
            {passwordError && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> {passwordError}
              </p>
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 border border-outline-variant rounded-xl text-on-surface font-bold hover:bg-surface-container transition-colors text-sm">Cancel</button>
              <button onClick={savePassword} className="flex-1 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 text-sm">
                <Key className="w-4 h-4" /> Update Password
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Login Activity */}
      {modal === "loginActivity" && (
        <Modal title="Login Activity" onClose={() => setModal(null)}>
          <div className="space-y-3">
            {[
              { device: "Chrome on macOS", location: "Nairobi, Kenya", time: "Today, 12:06 AM", current: true },
              { device: "Safari on iPhone", location: "Nairobi, Kenya", time: "Yesterday, 8:45 PM", current: false },
              { device: "Chrome on Windows", location: "Mombasa, Kenya", time: "Jun 22, 2026, 3:12 PM", current: false },
            ].map((session, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-outline-variant bg-surface">
                <div>
                  <p className="font-medium text-on-surface text-sm">{session.device}</p>
                  <p className="text-xs text-on-surface-variant">{session.location} · {session.time}</p>
                </div>
                {session.current
                  ? <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 px-2 py-1 rounded-full">Current</span>
                  : <button className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline">Revoke</button>
                }
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
