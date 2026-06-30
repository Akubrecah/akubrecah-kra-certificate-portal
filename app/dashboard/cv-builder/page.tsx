"use client"

import { useState, useEffect, useRef } from "react"
import { useUser } from "@clerk/nextjs"
import { motion, AnimatePresence } from "framer-motion"
import {
  FileText,
  Sparkles,
  Plus,
  Trash2,
  Eye,
  Printer,
  ArrowLeft,
  ArrowRight,
  Check,
  Briefcase,
  GraduationCap,
  Wrench,
  Globe,
  Award,
  Users,
  Smartphone,
  Mail,
  MapPin,
  User,
  PlusCircle,
  Calendar,
  Lock,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  FolderOpen,
  RefreshCw,
  Palette
} from "lucide-react"

// Types
interface Experience {
  id: string
  title: string
  company: string
  loc: string
  start: string
  end: string
  current: boolean
  bullets: string[]
}

interface Education {
  id: string
  degree: string
  field: string
  inst: string
  loc: string
  start: string
  end: string
  grade: string
  honors: string
}

interface Certification {
  id: string
  name: string
  issuer: string
  date: string
  expiry: string
}

interface Reference {
  id: string
  name: string
  title: string
  org: string
  phone: string
  email: string
}

interface Skill {
  id: string
  cat: string
  items: string
}

interface Language {
  id: string
  lang: string
  prof: string
}

interface CustomStyles {
  fontFamily: string
  primaryColor: string
  secondaryColor: string
  fontSize: string
  lineHeight: string
  margins: string
}

interface CVData {
  fullName: string
  jobTitle: string
  educationLevel?: string
  email: string
  phone: string
  addr: string
  county: string
  country: string
  linkedin: string
  website: string
  id_no: string
  dob: string
  nationality: string
  marital: string
  kra_pin: string
  opt: boolean
  summary: string
  exp: Experience[]
  edu: Education[]
  skills: Skill[]
  langs: Language[]
  certs: Certification[]
  refs: Reference[]
  showRefs: boolean
  customStyles?: CustomStyles
}

// Config constants
const G = "#1B4332"
const A = "#E9A23B"

const COUNTIES = [
  "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo-Marakwet", "Embu", "Garissa",
  "Homa Bay", "Isiolo", "Kajiado", "Kakamega", "Kericho", "Kiambu", "Kilifi",
  "Kirinyaga", "Kisii", "Kisumu", "Kitui", "Kwale", "Laikipia", "Lamu", "Machakos",
  "Makueni", "Mandera", "Marsabit", "Meru", "Migori", "Mombasa", "Murang'a",
  "Nairobi", "Nakuru", "Nandi", "Narok", "Nyamira", "Nyandarua", "Nyeri", "Samburu",
  "Siaya", "Taita-Taveta", "Tana River", "Tharaka-Nithi", "Trans Nzoia", "Turkana",
  "Uasin Gishu", "Vihiga", "Wajir", "West Pokot"
]

const PROFS = ["Basic", "Conversational", "Professional Working", "Fluent", "Native/Bilingual"]

const SECTS = [
  { id: "Personal", label: "Personal", icon: User },
  { id: "Summary", label: "Summary", icon: FileText },
  { id: "Experience", label: "Experience", icon: Briefcase },
  { id: "Education", label: "Education", icon: GraduationCap },
  { id: "Skills", label: "Skills", icon: Wrench },
  { id: "Languages", label: "Languages", icon: Globe },
  { id: "Certifications", label: "Certificates", icon: Award },
  { id: "References", label: "References", icon: Users },
  { id: "Design", label: "Design Settings", icon: Palette }
]

const uid = () => Math.random().toString(36).substring(2, 9)

const newExp = (): Experience => ({ id: uid(), title: "", company: "", loc: "Nairobi, Kenya", start: "", end: "", current: false, bullets: [""] })
const newEdu = (): Education => ({ id: uid(), degree: "", field: "", inst: "", loc: "", start: "", end: "", grade: "", honors: "" })
const newCert = (): Certification => ({ id: uid(), name: "", issuer: "", date: "", expiry: "" })
const newRef = (): Reference => ({ id: uid(), name: "", title: "", org: "", phone: "", email: "" })

const INIT: CVData = {
  fullName: "", jobTitle: "", educationLevel: "Undergraduate Degree", email: "", phone: "+254 ", addr: "", county: "Nairobi", country: "Kenya",
  linkedin: "", website: "", id_no: "", dob: "", nationality: "Kenyan", marital: "", kra_pin: "", opt: false,
  summary: "",
  exp: [newExp()], edu: [newEdu()],
  skills: [{ id: uid(), cat: "Technical Skills", items: "" }, { id: uid(), cat: "Soft Skills", items: "" }],
  langs: [{ id: uid(), lang: "English", prof: "Fluent" }, { id: uid(), lang: "Kiswahili", prof: "Native/Bilingual" }],
  certs: [], refs: [newRef(), newRef(), newRef()], showRefs: true,
  customStyles: {
    fontFamily: "sans-serif",
    primaryColor: "#1B4332",
    secondaryColor: "#E9A23B",
    fontSize: "9.5pt",
    lineHeight: "1.6",
    margins: "12mm"
  }
}

/* ── PRE-FILLED SAMPLES LIBRARY ── */
const SAMPLES: Record<string, CVData> = {
  empty: INIT,
  accountant: {
    fullName: "Veronicah Ndinda",
    jobTitle: "Assistant Accountant",
    educationLevel: "Undergraduate Degree",
    email: "veronicah.ndinda@example.co.ke",
    phone: "+254 712 345 678",
    addr: "P.O. Box 123 - 30600",
    county: "West Pokot",
    country: "Kenya",
    linkedin: "linkedin.com/in/veronicah-ndinda",
    website: "",
    id_no: "30123456",
    dob: "15/06/1995",
    nationality: "Kenyan",
    marital: "Single",
    kra_pin: "A012345678B",
    opt: true,
    summary: "Results-oriented public sector accounting professional with over five (5) years' experience at the Kenya Rural Roads Authority. Experienced in financial reporting, budget implementation, expenditure control, maintenance of books of accounts, statutory compliance, and application of the Public Finance Management (PFM) framework. Proficient in government accounting systems and committed to accountability, integrity, and service delivery.",
    exp: [
      {
        id: "exp1",
        title: "Assistant Accountant",
        company: "Kenya Rural Roads Authority (KeRRA)",
        loc: "Kapenguria, West Pokot County",
        start: "July 2020",
        end: "Present",
        current: true,
        bullets: [
          "Prepared payment vouchers in accordance with laid-down regulations, achieving 100% compliance with financial procedures.",
          "Maintained and reconciled cashbooks, ledger entries, and monthly bank statements, identifying and resolving KES 500k in audit deviations.",
          "Coordinated statutory deductions (PAYE, NHIF, NSSF, Housing Levy) and successfully filed monthly returns on the KRA iTax portal.",
          "Verified local purchase orders (LPOs) and local service orders (LSOs) to prevent expenditure budget overruns."
        ]
      },
      {
        id: "exp2",
        title: "Account Assistant Intern",
        company: "West Pokot County Treasury",
        loc: "Kapenguria, Kenya",
        start: "January 2019",
        end: "June 2020",
        current: false,
        bullets: [
          "Supported the validation of expenditure claims against budgetary allocations, streamlining internal audit procedures.",
          "Assisted in formatting annual financial reports for submission to the Office of the Auditor General."
        ]
      }
    ],
    edu: [
      {
        id: "edu1",
        degree: "Bachelor of Commerce",
        field: "Finance Option",
        inst: "Jomo Kenyatta University of Agriculture and Technology (JKUAT)",
        loc: "Juja, Kenya",
        start: "2023",
        end: "Ongoing",
        grade: "Ongoing",
        honors: ""
      },
      {
        id: "edu2",
        degree: "Bachelor of Arts",
        field: "Development Studies",
        inst: "Maseno University",
        loc: "Kisumu, Kenya",
        start: "2013",
        end: "2016",
        grade: "Second Class Upper Division",
        honors: ""
      }
    ],
    skills: [
      { id: "sk1", cat: "Financial Accounting", items: "KRA iTax Filing, Cashbook Reconciliation, PFM Act Compliance, Ledger Auditing, Payroll Deduction Processing" },
      { id: "sk2", cat: "Core Competencies", items: "Public Sector Budgeting, Voucher Audit Control, Accountability, Team Collaboration" }
    ],
    langs: [
      { id: "ln1", lang: "English", prof: "Fluent" },
      { id: "ln2", lang: "Kiswahili", prof: "Native/Bilingual" }
    ],
    certs: [
      { id: "ct1", name: "CPA Finalist", issuer: "KASNEB", date: "December 2019", expiry: "N/A" },
      { id: "ct2", name: "Full Member (No. 34220)", issuer: "ICPAK", date: "March 2021", expiry: "N/A" }
    ],
    refs: [
      { id: "rf1", name: "Mr. Charles A.", title: "Manager", org: "Kalya Radio", phone: "+254 722 000 111", email: "manager@example.co.ke" },
      { id: "rf2", name: "Mr. Job C.", title: "Head of Programs", org: "Kalya Radio", phone: "+254 722 000 222", email: "programs@example.co.ke" }
    ],
    showRefs: true
  },
  developer: {
    fullName: "Andrew Krop",
    jobTitle: "Education Planner & Administrator",
    educationLevel: "Postgraduate Degree",
    email: "andrew.krop@example.co.ke",
    phone: "+254 723 456 789",
    addr: "P.O. Box 45 - 30600",
    county: "West Pokot",
    country: "Kenya",
    linkedin: "",
    website: "",
    id_no: "23456789",
    dob: "18/08/1985",
    nationality: "Kenyan",
    marital: "Married",
    kra_pin: "A008923456C",
    opt: true,
    summary: "Dedicated, conscientious, and detail-oriented educational administrator with over six (6) years of experience in school supervision, planning, and educational program planning in the Ministry of Education. Articulate communicator and collaborative team player with strong leadership and listening skills, committed to driving national vision goals.",
    exp: [
      {
        id: "exp1",
        title: "Sub-County Education Officer",
        company: "Ministry of Education (West Pokot Sub-County)",
        loc: "Kapenguria, Kenya",
        start: "April 2021",
        end: "Present",
        current: true,
        bullets: [
          "Supervised primary and secondary schools in the sub-county to ensure compliance with Ministry guidelines and quality benchmarks.",
          "Monitored school fund allocations and audited utilization records, resulting in 98% reporting accuracy across 45 institutions.",
          "Coordinated teacher training programs on CBC curriculum implementation and education administration."
        ]
      },
      {
        id: "exp2",
        title: "Teacher (Geography & Business)",
        company: "Ortum High School",
        loc: "Kapenguria, Kenya",
        start: "May 2016",
        end: "March 2021",
        current: false,
        bullets: [
          "Taught geography and business studies at secondary levels, consistently achieving a mean grade score of B (Plain) in KCSE examinations.",
          "Skillfully organized school extra-curricular clubs and managed student welfare as head teacher mentor."
        ]
      }
    ],
    edu: [
      {
        id: "edu1",
        degree: "Master of Education",
        field: "Educational Planning & Administration",
        inst: "University of Nairobi",
        loc: "Nairobi, Kenya",
        start: "2014",
        end: "2018",
        grade: "M.Ed Graduate",
        honors: ""
      },
      {
        id: "edu2",
        degree: "Bachelor of Arts (Education)",
        field: "Geography and Business Studies",
        inst: "University of Nairobi",
        loc: "Nairobi, Kenya",
        start: "2010",
        end: "2013",
        grade: "Second Class Upper Division",
        honors: ""
      }
    ],
    skills: [
      { id: "sk1", cat: "Education Planning", items: "Curriculum Monitoring, School Auditing, CBC Program Management, Resource Allocations, Teacher Mentoring" },
      { id: "sk2", cat: "Leadership", items: "Communication, Multi-Stakeholder Coordination, Problem Solving, Analytical Reporting" }
    ],
    langs: [
      { id: "ln1", lang: "English", prof: "Fluent" },
      { id: "ln2", lang: "Kiswahili", prof: "Fluent" },
      { id: "ln3", lang: "Kalenjin", prof: "Native/Bilingual" }
    ],
    certs: [
      { id: "ct1", name: "Diploma in Education Management", issuer: "Kenya Education Management Institute (KEMI)", date: "October 2016", expiry: "N/A" },
      { id: "ct2", name: "Certificate in Senior Management", issuer: "Kenya School of Government Baringo", date: "August 2024", expiry: "N/A" }
    ],
    refs: [
      { id: "rf1", name: "Mr. John Mwangi", title: "Support Lead", org: "Jumia Group", phone: "+254 722 333 444", email: "j.mwangi@example.co.ke" },
      { id: "rf2", name: "Ms. Evelyn Nekesa", title: "Operations Manager", org: "Copia Global", phone: "+254 722 555 666", email: "e.nekesa@example.co.ke" }
    ],
    showRefs: true
  },
  support: {
    fullName: "Emmanuel Wakoli",
    jobTitle: "Radio Presenter & Loan Officer",
    educationLevel: "Diploma",
    email: "emmanuel.wakoli@example.co.ke",
    phone: "+254 734 567 890",
    addr: "Makutano",
    county: "West Pokot",
    country: "Kenya",
    linkedin: "",
    website: "",
    id_no: "38654123",
    dob: "24/12/1999",
    nationality: "Kenyan",
    marital: "Single",
    kra_pin: "A009123456F",
    opt: true,
    summary: "Dedicated, honest, and results-oriented professional with double-domain expertise in journalism and microfinance lending. Exceptional communicator with hands-on experience hosting radio programs and validating loan structures under minimal supervision in West Pokot County.",
    exp: [
      {
        id: "exp1",
        title: "Loan Officer",
        company: "Kape Credit",
        loc: "Kapenguria, West Pokot County",
        start: "February 2025",
        end: "March 2026",
        current: false,
        bullets: [
          "Conducted borrower credit risk assessment and financial profiling, processing KES 1.5M in micro-loans with zero default rating.",
          "Structured debt repayment schedules to match individual and SME income capabilities, reducing default occurrences by 12%.",
          "Maintained strict regulatory compliance in accordance with micro-lending laws."
        ]
      },
      {
        id: "exp2",
        title: "Radio Presenter / Media Personnel",
        company: "Kalya Radio",
        loc: "Makutano, West Pokot County",
        start: "January 2022",
        end: "January 2024",
        current: false,
        bullets: [
          "Hosted and presented local educational and news broadcasts, growing listener engagement metrics by 25%.",
          "Conducted high-profile community interviews and generated broadcast news logs under strict media compliance standards."
        ]
      }
    ],
    edu: [
      {
        id: "edu1",
        degree: "Diploma in Journalism & Mass Communication",
        field: "Media Production & Broadcasting",
        inst: "ICS College, Eldoret Branch",
        loc: "Eldoret, Kenya",
        start: "2020",
        end: "2021",
        grade: "Diploma Graduate",
        honors: ""
      },
      {
        id: "edu2",
        degree: "Secondary School Education",
        field: "KCSE",
        inst: "Milima High School",
        loc: "Kitale, Kenya",
        start: "2014",
        end: "2019",
        grade: "C (Plain)",
        honors: ""
      }
    ],
    skills: [
      { id: "sk1", cat: "Media & Comms", items: "Radio Broadcasting, Audio Editing, News Writing, Audience Engagement, Interview Facilitation" },
      { id: "sk2", cat: "Finance & Credit", items: "Credit Risk Profiling, Loan Restructuring, Client Assessment, Compliance Auditing" }
    ],
    langs: [
      { id: "ln1", lang: "English", prof: "Fluent" },
      { id: "ln2", lang: "Kiswahili", prof: "Native/Bilingual" }
    ],
    certs: [
      { id: "ct1", name: "Certificate of Appreciation", issuer: "Kalya Radio Media Board", date: "December 2023", expiry: "N/A" }
    ],
    refs: [
      { id: "rf1", name: "Mr. Charles A.", title: "Manager", org: "Kalya Radio", phone: "+254 722 000 111", email: "manager@example.co.ke" },
      { id: "rf2", name: "Mr. Job C.", title: "Head of Programs", org: "Kalya Radio", phone: "+254 722 000 222", email: "programs@example.co.ke" }
    ],
    showRefs: true
  }
}

/* ── UI Form Field Wrappers ── */
const FormField = ({ label, children, hint, action }: { label: string; children: React.ReactNode; hint?: string; action?: React.ReactNode }) => (
  <div className="flex flex-col space-y-1 mb-4 w-full">
    <div className="flex justify-between items-center w-full">
      <label className="text-[10px] font-bold text-on-surface-variant/80 uppercase tracking-widest">{label}</label>
      {action}
    </div>
    {children}
    {hint && <span className="text-[10px] text-on-surface-variant/60">{hint}</span>}
  </div>
)

const inputCls = "w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none"

const InputField = ({ ...props }: React.ComponentProps<"input">) => (
  <input {...props} className={`${inputCls} ${props.className || ""}`} />
)

const SelectField = ({ children, ...props }: React.ComponentProps<"select">) => (
  <select {...props} className={inputCls}>{children}</select>
)

const TextAreaField = ({ ...props }: React.ComponentProps<"textarea">) => (
  <textarea {...props} className={`${inputCls} resize-y min-h-[80px]`} />
)

/* ── Editor Sub-Sections ── */
function SecPersonal({ d, s }: { d: CVData; s: React.Dispatch<React.SetStateAction<CVData>> }) {
  const u = (k: keyof CVData, v: any) => s(p => ({ ...p, [k]: v }))
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label="Full Name *">
          <InputField value={d.fullName} onChange={e => u("fullName", e.target.value)} placeholder="Jane Wanjiku Kamau" required />
        </FormField>
        <FormField label="Professional Title">
          <InputField value={d.jobTitle} onChange={e => u("jobTitle", e.target.value)} placeholder="e.g. Finance Manager" />
        </FormField>
        <FormField label="Education Level" hint="For context & AI helper">
          <SelectField value={d.educationLevel || "Undergraduate Degree"} onChange={e => u("educationLevel", e.target.value)}>
            <option value="Undergraduate Degree">Undergraduate Degree</option>
            <option value="Postgraduate Degree">Postgraduate Degree</option>
            <option value="Diploma">Diploma / Associate</option>
            <option value="Certificate">Certificate / Vocational</option>
            <option value="Professional Qualification">Professional Cert (CPA-K)</option>
            <option value="High School">High School (KCSE)</option>
          </SelectField>
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Email *">
          <InputField type="email" value={d.email} onChange={e => u("email", e.target.value)} placeholder="jane@email.com" required />
        </FormField>
        <FormField label="Phone *">
          <InputField type="tel" value={d.phone} onChange={e => u("phone", e.target.value)} placeholder="+254 700 000 000" required />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Address">
          <InputField value={d.addr} onChange={e => u("addr", e.target.value)} placeholder="12 Ngong Road, Kilimani" />
        </FormField>
        <FormField label="County">
          <SelectField value={d.county} onChange={e => u("county", e.target.value)}>
            {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
          </SelectField>
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="LinkedIn">
          <InputField value={d.linkedin} onChange={e => u("linkedin", e.target.value)} placeholder="linkedin.com/in/username" />
        </FormField>
        <FormField label="Website / Portfolio">
          <InputField value={d.website} onChange={e => u("website", e.target.value)} placeholder="www.jane.co.ke" />
        </FormField>
      </div>

      <div className="mt-4 p-4 rounded-xl border border-outline-variant bg-surface-container-low">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-bold text-primary flex items-center gap-2">
            🇰🇪 Kenyan-Specific Fields
          </span>
          <button
            type="button"
            onClick={() => u("opt", !d.opt)}
            className="text-[11px] font-bold text-on-surface hover:text-primary transition-colors focus:outline-none"
          >
            {d.opt ? "Hide ▲" : "Show ▼"}
          </button>
        </div>
        
        {d.opt && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-hidden pt-2">
            <FormField label="National ID No.">
              <InputField value={d.id_no} onChange={e => u("id_no", e.target.value)} placeholder="12345678" />
            </FormField>
            <FormField label="KRA PIN No.">
              <InputField value={d.kra_pin} onChange={e => u("kra_pin", e.target.value)} placeholder="A012345678B" />
            </FormField>
            <FormField label="Date of Birth">
              <InputField value={d.dob} onChange={e => u("dob", e.target.value)} placeholder="DD/MM/YYYY" />
            </FormField>
            <FormField label="Nationality">
              <InputField value={d.nationality} onChange={e => u("nationality", e.target.value)} placeholder="Kenyan" />
            </FormField>
            <FormField label="Marital Status">
              <SelectField value={d.marital} onChange={e => u("marital", e.target.value)}>
                <option value="">— Select —</option>
                {["Single", "Married", "Divorced", "Widowed", "Separated", "N/A"].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </SelectField>
            </FormField>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

function SecSummary({ d, s, onGen, generating }: { d: CVData; s: React.Dispatch<React.SetStateAction<CVData>>; onGen?: (section: "summary" | "experience" | "skills", targetId?: string) => Promise<void>; generating?: string | null }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="text-xs text-on-surface-variant/80 leading-relaxed">
        Provide a concise 3–5 sentence summary of your career focus, top achievements, and primary skillset. Mirroring job description keywords optimizes ATS parsing.
      </div>
      <FormField
        label="Professional Summary / Objective"
        action={
          onGen && (
            <button
              type="button"
              disabled={!!generating}
              onClick={() => onGen("summary")}
              className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary hover:bg-primary/20 text-[11px] font-bold rounded-lg transition-colors active:scale-95 disabled:opacity-50"
            >
              {generating === "summary" ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>AI Generate</span>
            </button>
          )
        }
      >
        <TextAreaField
          value={d.summary}
          onChange={e => s(p => ({ ...p, summary: e.target.value }))}
          placeholder="Dedicated Finance Manager with 7+ years across Kenya's banking sector. Proven track record reducing operational costs by 25% at Equity Bank PLC. Skilled in IFRS, KRA compliance, and strategic budgeting..."
          rows={6}
        />
      </FormField>
      <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 leading-normal flex items-start gap-2">
        <span className="font-bold shrink-0">💡 ATS Compliance Tip:</span>
        <span>Use exact terms found in the target job spec like &quot;KRA&quot;, &quot;IFRS&quot;, &quot;Microsoft Excel&quot;, &quot;CPA(K)&quot;.</span>
      </div>
    </motion.div>
  )
}

function SecExp({ d, s, onGen, generating }: { d: CVData; s: React.Dispatch<React.SetStateAction<CVData>>; onGen?: (section: "summary" | "experience" | "skills", targetId?: string) => Promise<void>; generating?: string | null }) {
  const updE = (id: string, k: keyof Experience, v: any) => s(p => ({ ...p, exp: p.exp.map(e => e.id === id ? { ...e, [k]: v } : e) }))
  const updB = (id: string, i: number, v: string) => s(p => ({
    ...p,
    exp: p.exp.map(e => {
      if (e.id !== id) return e
      const b = [...e.bullets]
      b[i] = v
      return { ...e, bullets: b }
    })
  }))
  const addB = (id: string) => s(p => ({ ...p, exp: p.exp.map(e => e.id === id ? { ...e, bullets: [...e.bullets, ""] } : e) }))
  const remB = (id: string, i: number) => s(p => ({
    ...p,
    exp: p.exp.map(e => {
      if (e.id !== id) return e
      const b = e.bullets.filter((_, j) => j !== i)
      return { ...e, bullets: b.length ? b : [""] }
    })
  }))
  const addE = () => s(p => ({ ...p, exp: [...p.exp, newExp()] }))
  const remE = (id: string) => s(p => ({ ...p, exp: p.exp.filter(e => e.id !== id) }))

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {d.exp.map((e, index) => (
        <div key={e.id} className="p-4 rounded-xl border border-outline-variant bg-surface-container-low relative">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-primary">Position #{index + 1}</span>
            {d.exp.length > 1 && (
              <button
                type="button"
                onClick={() => remE(e.id)}
                className="text-red-500 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Job Title *">
              <InputField value={e.title} onChange={ev => updE(e.id, "title", ev.target.value)} placeholder="Senior Accountant" />
            </FormField>
            <FormField label="Company *">
              <InputField value={e.company} onChange={ev => updE(e.id, "company", ev.target.value)} placeholder="KCB Group PLC" />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Location">
              <InputField value={e.loc} onChange={ev => updE(e.id, "loc", ev.target.value)} placeholder="Nairobi, Kenya" />
            </FormField>
            <div className="flex items-center pt-5 h-full">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={e.current}
                  onChange={ev => updE(e.id, "current", ev.target.checked)}
                  className="rounded text-primary border-outline-variant focus:ring-primary/20 w-4.5 h-4.5"
                />
                <span className="text-sm font-medium text-on-surface">Currently work here</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Start Date">
              <InputField value={e.start} onChange={ev => updE(e.id, "start", ev.target.value)} placeholder="March 2020" />
            </FormField>
            {!e.current && (
              <FormField label="End Date">
                <InputField value={e.end} onChange={ev => updE(e.id, "end", ev.target.value)} placeholder="June 2023" />
              </FormField>
            )}
          </div>

          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-bold text-on-surface-variant/80 uppercase tracking-widest">Key Achievements</label>
              {onGen && (
                <button
                  type="button"
                  disabled={!!generating}
                  onClick={() => onGen("experience", e.id)}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-bold rounded-lg transition-colors active:scale-95 disabled:opacity-50"
                >
                  {generating === `experience-${e.id}` ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>AI Generate Bullets</span>
                </button>
              )}
            </div>
            <div className="space-y-3">
              {e.bullets.map((b, bi) => (
                <div key={bi} className="flex gap-2 items-center">
                  <span className="text-on-surface-variant/40 select-none text-sm">•</span>
                  <InputField
                    value={b}
                    onChange={ev => updB(e.id, bi, ev.target.value)}
                    placeholder="E.g., Led compliance audits reducing KRA assessment risk by 40%."
                    className="flex-1"
                  />
                  {e.bullets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remB(e.id, bi)}
                      className="text-red-500 hover:text-red-600 transition-colors p-1"
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => addB(e.id)}
              className="mt-3 text-xs font-bold text-primary hover:underline flex items-center gap-1 focus:outline-none"
            >
              <Plus className="w-3.5 h-3.5" /> Add Achievement Bullet
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addE}
        className="w-full py-3 rounded-xl border border-dashed border-outline-variant hover:border-primary text-sm font-bold text-on-surface hover:text-primary transition-colors flex items-center justify-center gap-2"
      >
        <PlusCircle className="w-4 h-4" /> Add Experience Position
      </button>
    </motion.div>
  )
}

function SecEdu({ d, s }: { d: CVData; s: React.Dispatch<React.SetStateAction<CVData>> }) {
  const upd = (id: string, k: keyof Education, v: string) => s(p => ({ ...p, edu: p.edu.map(e => e.id === id ? { ...e, [k]: v } : e) }))
  const add = () => s(p => ({ ...p, edu: [...p.edu, newEdu()] }))
  const rem = (id: string) => s(p => ({ ...p, edu: p.edu.filter(e => e.id !== id) }))

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {d.edu.map((e, index) => (
        <div key={e.id} className="p-4 rounded-xl border border-outline-variant bg-surface-container-low relative">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-primary">Education #{index + 1}</span>
            {d.edu.length > 1 && (
              <button
                type="button"
                onClick={() => rem(e.id)}
                className="text-red-500 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Degree / Qualification *">
              <InputField value={e.degree} onChange={ev => upd(e.id, "degree", ev.target.value)} placeholder="Bachelor of Commerce" />
            </FormField>
            <FormField label="Field of Study *">
              <InputField value={e.field} onChange={ev => upd(e.id, "field", ev.target.value)} placeholder="Finance & Accounting" />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Institution Name *">
              <InputField value={e.inst} onChange={ev => upd(e.id, "inst", ev.target.value)} placeholder="University of Nairobi" />
            </FormField>
            <FormField label="Location">
              <InputField value={e.loc} onChange={ev => upd(e.id, "loc", ev.target.value)} placeholder="Nairobi, Kenya" />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Start Year">
              <InputField value={e.start} onChange={ev => upd(e.id, "start", ev.target.value)} placeholder="2016" />
            </FormField>
            <FormField label="End Year (or Expected)">
              <InputField value={e.end} onChange={ev => upd(e.id, "end", ev.target.value)} placeholder="2020" />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Grade / Classification">
              <InputField value={e.grade} onChange={ev => upd(e.id, "grade", ev.target.value)} placeholder="Second Class Upper Division" />
            </FormField>
            <FormField label="Distinctions / Awards">
              <InputField value={e.honors} onChange={ev => upd(e.id, "honors", ev.target.value)} placeholder="Dean's List 2018–2020" />
            </FormField>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="w-full py-3 rounded-xl border border-dashed border-outline-variant hover:border-primary text-sm font-bold text-on-surface hover:text-primary transition-colors flex items-center justify-center gap-2"
      >
        <PlusCircle className="w-4 h-4" /> Add Qualification
      </button>
    </motion.div>
  )
}

function SecSkills({ d, s, onGen, generating }: { d: CVData; s: React.Dispatch<React.SetStateAction<CVData>>; onGen?: (section: "summary" | "experience" | "skills", targetId?: string) => Promise<void>; generating?: string | null }) {
  const upd = (id: string, k: keyof Skill, v: string) => s(p => ({ ...p, skills: p.skills.map(sk => sk.id === id ? { ...sk, [k]: v } : sk) }))
  const add = () => s(p => ({ ...p, skills: [...p.skills, { id: uid(), cat: "", items: "" }] }))
  const rem = (id: string) => s(p => ({ ...p, skills: p.skills.filter(sk => sk.id !== id) }))

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="text-xs text-on-surface-variant/80">
        Group your skills by category and separate items using commas. E.g., &quot;Microsoft Excel, QuickBooks, SAP&quot;.
      </div>
      {d.skills.map((sk) => (
        <div key={sk.id} className="flex gap-3 items-end p-4 rounded-xl border border-outline-variant bg-surface-container-low relative">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <FormField label="Category Name">
                <InputField value={sk.cat} onChange={e => upd(sk.id, "cat", e.target.value)} placeholder="E.g. Technical" />
              </FormField>
            </div>
            <div className="sm:col-span-2">
              <FormField
                label="Skills (comma separated)"
                action={
                  onGen && (
                    <button
                      type="button"
                      disabled={!!generating}
                      onClick={() => onGen("skills", sk.id)}
                      className="flex items-center gap-1.5 px-2.5 py-0.5 bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-bold rounded-lg transition-colors active:scale-95 disabled:opacity-50"
                    >
                      {generating === `skills-${sk.id}` ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      <span>AI Suggest</span>
                    </button>
                  )
                }
              >
                <InputField value={sk.items} onChange={e => upd(sk.id, "items", e.target.value)} placeholder="Python, SQL, Financial Analysis" />
              </FormField>
            </div>
          </div>
          {d.skills.length > 1 && (
            <button
              type="button"
              onClick={() => rem(sk.id)}
              className="text-red-500 hover:text-red-600 transition-colors p-2.5 rounded-lg hover:bg-red-500/10 mb-4"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="w-full py-3 rounded-xl border border-dashed border-outline-variant hover:border-primary text-sm font-bold text-on-surface hover:text-primary transition-colors flex items-center justify-center gap-2"
      >
        <PlusCircle className="w-4 h-4" /> Add Skills Category
      </button>
    </motion.div>
  )
}

function SecLangs({ d, s }: { d: CVData; s: React.Dispatch<React.SetStateAction<CVData>> }) {
  const upd = (id: string, k: keyof Language, v: string) => s(p => ({ ...p, langs: p.langs.map(l => l.id === id ? { ...l, [k]: v } : l) }))
  const add = () => s(p => ({ ...p, langs: [...p.langs, { id: uid(), lang: "", prof: "Conversational" }] }))
  const rem = (id: string) => s(p => ({ ...p, langs: p.langs.filter(l => l.id !== id) }))

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {d.langs.map((l) => (
        <div key={l.id} className="flex gap-4 items-end bg-surface-container-low p-4 rounded-xl border border-outline-variant">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Language">
              <InputField value={l.lang} onChange={e => upd(l.id, "lang", e.target.value)} placeholder="E.g., Kiswahili" />
            </FormField>
            <FormField label="Proficiency">
              <SelectField value={l.prof} onChange={e => upd(l.id, "prof", e.target.value)}>
                {PROFS.map(p => <option key={p} value={p}>{p}</option>)}
              </SelectField>
            </FormField>
          </div>
          {d.langs.length > 1 && (
            <button
              type="button"
              onClick={() => rem(l.id)}
              className="text-red-500 hover:text-red-600 transition-colors p-2.5 rounded-lg hover:bg-red-500/10 mb-4"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="w-full py-3 rounded-xl border border-dashed border-outline-variant hover:border-primary text-sm font-bold text-on-surface hover:text-primary transition-colors flex items-center justify-center gap-2"
      >
        <PlusCircle className="w-4 h-4" /> Add Language
      </button>
    </motion.div>
  )
}

function SecCerts({ d, s }: { d: CVData; s: React.Dispatch<React.SetStateAction<CVData>> }) {
  const upd = (id: string, k: keyof Certification, v: string) => s(p => ({ ...p, certs: p.certs.map(c => c.id === id ? { ...c, [k]: v } : c) }))
  const add = () => s(p => ({ ...p, certs: [...p.certs, newCert()] }))
  const rem = (id: string) => s(p => ({ ...p, certs: p.certs.filter(c => c.id !== id) }))

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {d.certs.length === 0 && (
        <div className="text-xs text-on-surface-variant/80">
          No certifications added. Add local and global professional certifications like CPA(K), ACCA, CFA, PMI-PMP, or tech awards.
        </div>
      )}
      {d.certs.map((c, index) => (
        <div key={c.id} className="p-4 rounded-xl border border-outline-variant bg-surface-container-low relative">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-primary">Certification #{index + 1}</span>
            <button
              type="button"
              onClick={() => rem(c.id)}
              className="text-red-500 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Certification Name *">
              <InputField value={c.name} onChange={e => upd(c.id, "name", e.target.value)} placeholder="CPA(K)" />
            </FormField>
            <FormField label="Issuing Body *">
              <InputField value={c.issuer} onChange={e => upd(c.id, "issuer", e.target.value)} placeholder="ICPAK" />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Date Obtained">
              <InputField value={c.date} onChange={e => upd(c.id, "date", e.target.value)} placeholder="June 2022" />
            </FormField>
            <FormField label="Expiry / Validity">
              <InputField value={c.expiry} onChange={e => upd(c.id, "expiry", e.target.value)} placeholder="N/A or June 2025" />
            </FormField>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="w-full py-3 rounded-xl border border-dashed border-outline-variant hover:border-primary text-sm font-bold text-on-surface hover:text-primary transition-colors flex items-center justify-center gap-2"
      >
        <PlusCircle className="w-4 h-4" /> Add Certification
      </button>
    </motion.div>
  )
}

function SecRefs({ d, s }: { d: CVData; s: React.Dispatch<React.SetStateAction<CVData>> }) {
  const upd = (id: string, k: keyof Reference, v: string) => s(p => ({ ...p, refs: p.refs.map(r => r.id === id ? { ...r, [k]: v } : r) }))
  const add = () => s(p => ({ ...p, refs: [...p.refs, newRef()] }))
  const rem = (id: string) => s(p => ({ ...p, refs: p.refs.filter(r => r.id !== id) }))

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 rounded-xl text-[11px] text-green-800 dark:text-green-300 flex items-start gap-2">
        <span className="font-bold shrink-0">🇰🇪 Kenyan Standard:</span>
        <span>Most Kenyan employers expect exactly 3 professional references with full organization & contact info.</span>
      </div>

      <div className="flex items-center gap-3 py-1">
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={d.showRefs}
            onChange={e => s(p => ({ ...p, showRefs: e.target.checked }))}
            className="rounded text-primary border-outline-variant focus:ring-primary/20 w-4.5 h-4.5"
          />
          <span className="text-sm font-medium text-on-surface">Show references list on CV</span>
        </label>
      </div>

      {d.refs.map((r, index) => (
        <div key={r.id} className="p-4 rounded-xl border border-outline-variant bg-surface-container-low relative">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-primary">Referee #{index + 1}</span>
            {d.refs.length > 1 && (
              <button
                type="button"
                onClick={() => rem(r.id)}
                className="text-red-500 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Referee Full Name *">
              <InputField value={r.name} onChange={e => upd(r.id, "name", e.target.value)} placeholder="Mr. James Oduya" />
            </FormField>
            <FormField label="Job Title / Position *">
              <InputField value={r.title} onChange={e => upd(r.id, "title", e.target.value)} placeholder="Head of Engineering" />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <FormField label="Organization *">
                <InputField value={r.org} onChange={e => upd(r.id, "org", e.target.value)} placeholder="Safaricom PLC" />
              </FormField>
            </div>
            <div className="sm:col-span-1">
              <FormField label="Phone Number *">
                <InputField type="tel" value={r.phone} onChange={e => upd(r.id, "phone", e.target.value)} placeholder="+254 722 111 222" />
              </FormField>
            </div>
            <div className="sm:col-span-1">
              <FormField label="Email *">
                <InputField type="email" value={r.email} onChange={e => upd(r.id, "email", e.target.value)} placeholder="referee@email.com" />
              </FormField>
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="w-full py-3 rounded-xl border border-dashed border-outline-variant hover:border-primary text-sm font-bold text-on-surface hover:text-primary transition-colors flex items-center justify-center gap-2"
      >
        <PlusCircle className="w-4 h-4" /> Add Referee
      </button>
    </motion.div>
  )
}

function SecDesign({ d, s }: { d: CVData; s: React.Dispatch<React.SetStateAction<CVData>> }) {
  const styles = d.customStyles || {
    fontFamily: "sans-serif",
    primaryColor: "#1B4332",
    secondaryColor: "#E9A23B",
    fontSize: "9.5pt",
    lineHeight: "1.6",
    margins: "12mm"
  }

  const u = (key: keyof CustomStyles, val: string) => {
    s(prev => ({
      ...prev,
      customStyles: {
        ...styles,
        [key]: val
      }
    }))
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-on-surface mb-1 font-headline">Typography & Spacing</h3>
        <p className="text-[10px] text-on-surface-variant">Customize the typography and layout spacing of your CV sheet.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Font Family">
          <SelectField value={styles.fontFamily} onChange={e => u("fontFamily", e.target.value)}>
            <option value="sans-serif">Clean Sans-Serif (Inter / Segoe UI)</option>
            <option value="serif">Formal Serif (Times New Roman / Georgia)</option>
            <option value="monospace">Technical Monospace (Consolas / Menlo)</option>
          </SelectField>
        </FormField>

        <FormField label="Font Size">
          <SelectField value={styles.fontSize} onChange={e => u("fontSize", e.target.value)}>
            <option value="8.5pt">Small (8.5pt)</option>
            <option value="9.5pt">Medium (9.5pt)</option>
            <option value="10.5pt">Large (10.5pt)</option>
          </SelectField>
        </FormField>

        <FormField label="Line Spacing">
          <SelectField value={styles.lineHeight} onChange={e => u("lineHeight", e.target.value)}>
            <option value="1.3">Compact (1.3)</option>
            <option value="1.6">Normal (1.6)</option>
            <option value="1.9">Loose (1.9)</option>
          </SelectField>
        </FormField>

        <FormField label="Page Margins">
          <SelectField value={styles.margins} onChange={e => u("margins", e.target.value)}>
            <option value="8mm">Compact (8mm)</option>
            <option value="12mm">Normal (12mm)</option>
            <option value="18mm">Spacious (18mm)</option>
          </SelectField>
        </FormField>
      </div>

      <hr className="border-outline-variant/60" />

      <div>
        <h3 className="text-sm font-bold text-on-surface mb-1 font-headline">Brand Colors</h3>
        <p className="text-[10px] text-on-surface-variant">Adjust your own accent colors using pickers or inputting hex codes.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <FormField label="Primary Highlight Color">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={styles.primaryColor}
              onChange={e => u("primaryColor", e.target.value)}
              className="w-10 h-10 border border-outline-variant rounded-xl cursor-pointer bg-transparent shrink-0"
            />
            <input
              type="text"
              value={styles.primaryColor}
              onChange={e => u("primaryColor", e.target.value)}
              className="flex-1 px-3 py-2.5 text-xs font-semibold bg-surface border border-outline rounded-xl text-on-surface focus:border-primary focus:outline-none"
              placeholder="#1B4332"
            />
          </div>
        </FormField>

        <FormField label="Secondary Accent Color">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={styles.secondaryColor}
              onChange={e => u("secondaryColor", e.target.value)}
              className="w-10 h-10 border border-outline-variant rounded-xl cursor-pointer bg-transparent shrink-0"
            />
            <input
              type="text"
              value={styles.secondaryColor}
              onChange={e => u("secondaryColor", e.target.value)}
              className="flex-1 px-3 py-2.5 text-xs font-semibold bg-surface border border-outline rounded-xl text-on-surface focus:border-primary focus:outline-none"
              placeholder="#E9A23B"
            />
          </div>
        </FormField>
      </div>
      
      <div className="bg-surface-container-low border border-outline-variant p-4 rounded-xl space-y-2">
        <span className="text-[10px] font-bold text-primary uppercase tracking-widest block">💡 Customization Tip</span>
        <p className="text-[11px] text-on-surface-variant leading-relaxed">
          These customizations apply instantly in real-time. Make sure to click **Focus Preview** to review the layout alignment before printing.
        </p>
      </div>
    </motion.div>
  )
}

/* ── CV Templates ── */
/* ── CV Templates ── */
function ATSTemplate({ d, design }: { d: CVData; design?: string }) {
  const has = (v: any) => v && String(v).trim().length > 0
  
  const fontMap: Record<string, string> = {
    "sans-serif": "'Segoe UI', Arial, sans-serif",
    "serif": "Georgia, 'Times New Roman', Times, serif",
    "monospace": "Menlo, Consolas, monospace"
  }

  const customFont = d.customStyles?.fontFamily
    ? fontMap[d.customStyles.fontFamily]
    : null;

  const fontFamily = customFont || ((design === "classic" || design === "executive")
    ? "Georgia, 'Times New Roman', Times, serif" 
    : design === "minimal" 
      ? "Inter, system-ui, sans-serif" 
      : "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif");

  const customColor = d.customStyles?.primaryColor && d.customStyles.primaryColor !== "#1B4332"
    ? d.customStyles.primaryColor
    : null;

  const linkColor = customColor || (design === "modern" ? "#1a365d" : "#000000");

  const customSize = d.customStyles?.fontSize
    ? d.customStyles.fontSize
    : null;

  const bodySize = customSize || ((design === "minimal" || design === "compact") ? "9pt" : "9.5pt");
  const titleSize = customSize || ((design === "minimal" || design === "compact") ? "9.5pt" : "10pt");

  const pageMargin = d.customStyles?.margins || ((design === "minimal" || design === "compact") ? "8mm" : "10mm");

  const SH = ({ t }: { t: string }) => {
    if (design === "executive") {
      return (
        <div style={{
          fontSize: "10.5pt",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: ".1em",
          color: "#000",
          borderTop: "1px solid #333",
          borderBottom: "1px solid #333",
          padding: "1.2mm 0",
          marginTop: "4.5mm",
          marginBottom: "2.5mm",
          fontFamily: "Georgia, serif",
          textAlign: "center"
        }}>
          {t}
        </div>
      )
    }

    return (
      <div style={{
        fontSize: design === "minimal" || design === "compact" ? "9pt" : "11pt",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: ".08em",
        color: linkColor,
        borderBottom: design === "minimal" ? "none" : `1.5px solid ${linkColor}`,
        borderLeft: design === "minimal" ? "3px solid #4a5568" : "none",
        paddingLeft: design === "minimal" ? "2.2mm" : "0",
        paddingBottom: design === "minimal" ? "0" : "1.2mm",
        marginTop: design === "compact" ? "3.5mm" : "4.5mm",
        marginBottom: design === "compact" ? "2mm" : "2.5mm",
        fontFamily: (design === "classic" || design === "executive") ? "Georgia, serif" : "Arial, sans-serif"
      }}>
        {t}
      </div>
    )
  }

  const contact = [
    d.email,
    d.phone,
    [d.addr, d.county, d.country].filter(has).join(", "),
    d.linkedin,
    d.website
  ].filter(has).join("  |  ")

  const optLine = d.opt ? [
    d.dob && `DOB: ${d.dob}`,
    d.nationality && `Nationality: ${d.nationality}`,
    d.marital && `Status: ${d.marital}`,
    d.id_no && `ID No: ${d.id_no}`,
    d.kra_pin && `KRA PIN: ${d.kra_pin}`
  ].filter(Boolean).join("  |  ") : ""

  const renderHeader = () => {
    if (design === "modern") {
      return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: `2.5px solid ${linkColor}`, paddingBottom: "4mm", marginBottom: "4mm" }}>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: "20pt", fontWeight: 800, color: "#1a202c", letterSpacing: "-0.02em" }}>
              {d.fullName.toUpperCase() || "YOUR FULL NAME"}
            </div>
            {has(d.jobTitle) && (
              <div style={{ fontSize: "11pt", fontWeight: 700, color: "#4a5568", marginTop: "1.5mm", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {d.jobTitle}
              </div>
            )}
          </div>
          <div style={{ textAlign: "right", fontSize: "8.5pt", color: "#4a5568", lineHeight: 1.45 }}>
            <div>{d.phone}  •  {d.email}</div>
            <div>{[d.addr, d.county, d.country].filter(has).join(", ")}</div>
            {(has(d.linkedin) || has(d.website)) && (
              <div>{[d.linkedin, d.website].filter(has).join("  •  ")}</div>
            )}
            {has(optLine) && <div style={{ fontSize: "8pt", fontStyle: "italic", color: "#718096" }}>{optLine}</div>}
          </div>
        </div>
      )
    }

    return (
      <div style={{ textAlign: "center", borderBottom: design === "executive" ? "none" : "2px solid #000", paddingBottom: "4mm", marginBottom: "4mm" }}>
        <div style={{ fontSize: design === "executive" ? "20pt" : "18pt", fontWeight: 700, letterSpacing: ".01em" }}>
          {d.fullName.toUpperCase() || "YOUR FULL NAME"}
        </div>
        {has(d.jobTitle) && (
          <div style={{ fontSize: "11pt", fontWeight: 600, color: "#222", marginTop: "1mm" }}>
            {d.jobTitle.toUpperCase()}
          </div>
        )}
        {has(contact) && (
          <div style={{ fontSize: "9pt", color: "#333", marginTop: "2mm" }}>
            {contact}
          </div>
        )}
        {has(optLine) && (
          <div style={{ fontSize: "9pt", color: "#333", marginTop: "1mm" }}>
            {optLine}
          </div>
        )}
      </div>
    )
  }

  const pSize = design === "minimal" || design === "compact" ? "12mm 12mm" : "16mm 16mm";

  return (
    <div style={{
      fontFamily: fontFamily,
      fontSize: titleSize,
      lineHeight: design === "minimal" || design === "compact" ? 1.35 : 1.5,
      color: "#000",
      background: "#fff",
      padding: pSize,
      maxWidth: "210mm",
      minHeight: "297mm",
      margin: "0 auto",
      boxSizing: "border-box"
    }}>
      {renderHeader()}

      {/* Summary */}
      {has(d.summary) && (
        <>
          <SH t="Professional Summary" />
          <p style={{ textAlign: "justify", margin: 0, fontSize: bodySize }}>{d.summary}</p>
        </>
      )}

      {/* Experience */}
      {d.exp.some(e => has(e.title) || has(e.company)) && (
        <>
          <SH t="Work Experience" />
          {d.exp.filter(e => has(e.title) || has(e.company)).map(e => (
            <div key={e.id} style={{ marginBottom: "3.5mm" }}>
              <div style={{ display: "flex", fontWeight: 700, fontSize: bodySize, justifyContent: "space-between" }}>
                <span>{[e.title, e.company].filter(has).join("  —  ")}</span>
                <span style={{ fontWeight: 400, fontSize: "9pt" }}>
                  {[e.start, e.current ? "Present" : e.end].filter(has).join(" – ")}
                </span>
              </div>
              {has(e.loc) && <div style={{ fontSize: "9pt", color: "#444", marginBottom: "1mm", fontStyle: "italic" }}>{e.loc}</div>}
              {e.bullets.filter(b => has(b)).map((b, i) => (
                <div key={i} style={{ display: "flex", gap: "2mm", marginBottom: "0.8mm", fontSize: bodySize, paddingLeft: "2mm" }}>
                  <span style={{ flexShrink: 0 }}>•</span>
                  <span>{b}</span>
                </div>
              ))}
            </div>
          ))}
        </>
      )}

      {/* Education */}
      {d.edu.some(e => has(e.degree) || has(e.inst)) && (
        <>
          <SH t="Education" />
          {d.edu.filter(e => has(e.degree) || has(e.inst)).map(e => (
            <div key={e.id} style={{ marginBottom: "3mm" }}>
              <div style={{ display: "flex", fontWeight: 700, fontSize: bodySize, justifyContent: "space-between" }}>
                <span>{[e.degree, e.field].filter(has).join(" in ")}</span>
                <span style={{ fontWeight: 400, fontSize: "9pt" }}>
                  {[e.start, e.end].filter(has).join(" – ")}
                </span>
              </div>
              <div style={{ fontSize: "9pt" }}>{[e.inst, e.loc].filter(has).join(", ")}</div>
              {(has(e.grade) || has(e.honors)) && (
                <div style={{ fontSize: "9pt", color: "#444", marginTop: "0.5mm" }}>
                  {[e.grade && `Grade: ${e.grade}`, e.honors].filter(Boolean).join("  |  ")}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {/* Skills */}
      {d.skills.some(sk => has(sk.items)) && (
        <>
          <SH t="Skills" />
          {d.skills.filter(sk => has(sk.items)).map(sk => (
            <div key={sk.id} style={{ marginBottom: "1.5mm", fontSize: bodySize }}>
              <strong>{sk.cat}:</strong> {sk.items}
            </div>
          ))}
        </>
      )}

      {/* Certifications */}
      {d.certs.some(c => has(c.name)) && (
        <>
          <SH t="Certifications" />
          {d.certs.filter(c => has(c.name)).map(c => (
            <div key={c.id} style={{ display: "flex", marginBottom: "1.5mm", fontSize: bodySize, justifyContent: "space-between" }}>
              <span>
                <strong>{c.name}</strong>
                {has(c.issuer) ? `  —  ${c.issuer}` : ""}
              </span>
              <span style={{ fontSize: "9pt" }}>
                {[c.date, has(c.expiry) && `Expiry: ${c.expiry}`].filter(Boolean).join("  |  ")}
              </span>
            </div>
          ))}
        </>
      )}

      {/* Languages */}
      {d.langs.some(l => has(l.lang)) && (
        <>
          <SH t="Languages" />
          <div style={{ fontSize: bodySize }}>
            {d.langs.filter(l => has(l.lang)).map(l => `${l.lang} (${l.prof})`).join("     |     ")}
          </div>
        </>
      )}

      {/* References */}
      {d.showRefs && (
        <>
          <SH t="Professional References" />
          {d.refs.some(r => has(r.name)) ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "4mm", fontSize: "9pt" }}>
              {d.refs.filter(r => has(r.name)).map(r => (
                <div key={r.id}>
                  <div style={{ fontWeight: 700 }}>{r.name}</div>
                  {has(r.title) && <div style={{ fontSize: "8.5pt" }}>{r.title}</div>}
                  {has(r.org) && <div style={{ fontSize: "8.5pt" }}>{r.org}</div>}
                  {has(r.phone) && <div style={{ fontSize: "8pt", color: "#333" }}>{r.phone}</div>}
                  {has(r.email) && <div style={{ fontSize: "8pt", color: "#333" }}>{r.email}</div>}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontStyle: "italic", fontSize: "9.5pt" }}>Available upon request</div>
          )}
        </>
      )}
    </div>
  )
}

function VisualTemplate({ d, design }: { d: CVData; design?: string }) {
  const has = (v: any) => v && String(v).trim().length > 0

  const fontMap: Record<string, string> = {
    "sans-serif": "'Segoe UI', Arial, sans-serif",
    "serif": "Georgia, 'Times New Roman', Times, serif",
    "monospace": "Menlo, Consolas, monospace"
  }

  const customFont = d.customStyles?.fontFamily
    ? fontMap[d.customStyles.fontFamily]
    : null;
  const fontFamily = customFont || "'Segoe UI', Arial, sans-serif";

  const customColor = d.customStyles?.primaryColor && d.customStyles.primaryColor !== "#1B4332"
    ? d.customStyles.primaryColor
    : null;
  const themeG = customColor || (design === "navy" ? "#1e3a8a" : design === "crimson" ? "#4c0519" : design === "charcoal" ? "#1e293b" : design === "slate" ? "#0f172a" : "#1B4332");

  const customAccent = d.customStyles?.secondaryColor && d.customStyles.secondaryColor !== "#E9A23B"
    ? d.customStyles.secondaryColor
    : null;
  const themeA = customAccent || (design === "navy" ? "#3b82f6" : design === "crimson" ? "#9f1239" : design === "charcoal" ? "#64748b" : design === "slate" ? "#0d9488" : "#E9A23B");

  const fSize = d.customStyles?.fontSize || "9.5pt";
  const lHeight = Number(d.customStyles?.lineHeight || "1.5");
  const pageMargin = d.customStyles?.margins || "12mm";

  // Themes
  let themeContactBg = design === "navy" ? "#1e40af" : design === "crimson" ? "#881337" : design === "charcoal" ? "#334155" : design === "slate" ? "#1e293b" : "#234735";
  let themeContactText = design === "navy" ? "#eff6ff" : design === "crimson" ? "#fff1f2" : design === "charcoal" ? "#f8fafc" : design === "slate" ? "#ccfbf1" : "#c2e6d1";
  let themeColBg = design === "navy" ? "#f8fafc" : design === "crimson" ? "#fffafb" : design === "charcoal" ? "#f8fafc" : design === "slate" ? "#f0fdfa" : "#f4f8f5";
  let themeColBorder = design === "navy" ? "#e2e8f0" : design === "crimson" ? "#ffe4e6" : design === "charcoal" ? "#e2e8f0" : design === "slate" ? "#ccfbf1" : "#e2ece6";
  let themeTagBg = design === "navy" ? "#dbeafe" : design === "crimson" ? "#ffe4e6" : design === "charcoal" ? "#f1f5f9" : design === "slate" ? "#ccfbf1" : "#e8f4ec";
  let themeLangsBg = design === "navy" ? "#eff6ff" : design === "crimson" ? "#fff1f2" : design === "charcoal" ? "#f8fafc" : design === "slate" ? "#f0fdfa" : "#d4edda";
  let themeLangsColor = design === "navy" ? "#1e40af" : design === "crimson" ? "#881337" : design === "charcoal" ? "#334155" : design === "slate" ? "#0f766e" : "#155724";

  if (customColor) {
    themeContactBg = themeG;
    themeColBg = "#fafafa";
    themeColBorder = "#edf2f7";
    themeTagBg = "#edf2f7";
  }

  if (!customColor && !customAccent) {
    if (design === "navy") {
      themeColBg = "#f8fafc";
      themeColBorder = "#e2e8f0";
      themeTagBg = "#dbeafe";
    } else if (design === "crimson") {
      themeColBg = "#fffafb";
      themeColBorder = "#ffe4e6";
      themeTagBg = "#ffe4e6";
    } else if (design === "charcoal") {
      themeColBg = "#f8fafc";
      themeColBorder = "#e2e8f0";
      themeTagBg = "#f1f5f9";
    } else if (design === "slate") {
      themeColBg = "#f0fdfa";
      themeColBorder = "#ccfbf1";
      themeTagBg = "#ccfbf1";
    }
  }

  const SH = ({ t }: { t: string }) => (
    <div style={{
      fontSize: "9.5pt",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: ".08em",
      color: themeG,
      borderBottom: `1.5px solid ${themeA}`,
      paddingBottom: "1.2mm",
      marginTop: "4mm",
      marginBottom: "2.5mm",
      fontFamily
    }}>
      {t}
    </div>
  )

  const Tag = ({ t }: { t: string }) => (
    <span style={{
      display: "inline-block",
      background: themeTagBg,
      color: themeG,
      borderRadius: "4px",
      padding: "2px 8px",
      fontSize: "8pt",
      marginRight: "4px",
      marginBottom: "4px",
      fontWeight: 600
    }}>
      {t}
    </span>
  )

  return (
    <div style={{
      fontFamily,
      fontSize: fSize,
      lineHeight: lHeight,
      color: "#1a202c",
      background: "#fff",
      maxWidth: "210mm",
      minHeight: "297mm",
      margin: "0 auto",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* Top Banner */}
      <div style={{ background: themeG, color: "#fff", padding: "8mm 10mm" }}>
        <div style={{ fontSize: "20pt", fontWeight: 700, letterSpacing: ".01em" }}>
          {d.fullName || "YOUR FULL NAME"}
        </div>
        {has(d.jobTitle) && (
          <div style={{ fontSize: "11pt", color: themeA, fontWeight: 600, marginTop: "1mm", letterSpacing: ".04em" }}>
            {d.jobTitle.toUpperCase()}
          </div>
        )}
      </div>

      {/* Contact Bar */}
      <div style={{
        background: themeContactBg,
        color: themeContactText,
        padding: "2mm 10mm",
        fontSize: "8.5pt",
        display: "flex",
        gap: "6mm",
        flexWrap: "wrap",
        alignItems: "center"
      }}>
        {has(d.email) && <span>✉ {d.email}</span>}
        {has(d.phone) && <span>📱 {d.phone}</span>}
        {(has(d.addr) || has(d.county)) && (
          <span>📍 {[d.addr, d.county, d.country].filter(has).join(", ")}</span>
        )}
        {has(d.linkedin) && <span>in {d.linkedin}</span>}
        {has(d.website) && <span>🌐 {d.website}</span>}
      </div>

      {/* Main split content */}
      <div style={{ display: "flex", flex: 1, alignItems: "stretch" }}>
        {/* Left Column (37% width) */}
        <div style={{
          width: "37%",
          background: themeColBg,
          padding: "5mm 7mm",
          borderRight: `1.5px solid ${themeColBorder}`,
          boxSizing: "border-box"
        }}>
          {d.opt && (has(d.dob) || has(d.nationality) || has(d.marital) || has(d.id_no) || has(d.kra_pin)) && (
            <>
              <SH t="Personal Details" />
              <div style={{ fontSize: "8.5pt" }}>
                {has(d.dob) && (
                  <div style={{ marginBottom: "2.5mm" }}>
                    <div style={{ fontSize: "7.5pt", color: "#718096", textTransform: "uppercase" }}>DOB</div>
                    <div style={{ fontWeight: 600 }}>{d.dob}</div>
                  </div>
                )}
                {has(d.nationality) && (
                  <div style={{ marginBottom: "2.5mm" }}>
                    <div style={{ fontSize: "7.5pt", color: "#718096", textTransform: "uppercase" }}>Nationality</div>
                    <div style={{ fontWeight: 600 }}>{d.nationality}</div>
                  </div>
                )}
                {has(d.marital) && (
                  <div style={{ marginBottom: "2.5mm" }}>
                    <div style={{ fontSize: "7.5pt", color: "#718096", textTransform: "uppercase" }}>Marital Status</div>
                    <div style={{ fontWeight: 600 }}>{d.marital}</div>
                  </div>
                )}
                {has(d.id_no) && (
                  <div style={{ marginBottom: "2.5mm" }}>
                    <div style={{ fontSize: "7.5pt", color: "#718096", textTransform: "uppercase" }}>ID Card No.</div>
                    <div style={{ fontWeight: 600 }}>{d.id_no}</div>
                  </div>
                )}
                {has(d.kra_pin) && (
                  <div style={{ marginBottom: "2.5mm" }}>
                    <div style={{ fontSize: "7.5pt", color: "#718096", textTransform: "uppercase" }}>KRA PIN</div>
                    <div style={{ fontWeight: 600 }}>{d.kra_pin}</div>
                  </div>
                )}
              </div>
            </>
          )}

          {d.skills.some(sk => has(sk.items)) && (
            <>
              <SH t="Skills" />
              {d.skills.filter(sk => has(sk.items)).map(sk => (
                <div key={sk.id} style={{ marginBottom: "3.5mm" }}>
                  <div style={{ fontSize: "8pt", fontWeight: 700, color: "#4a5568", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: "1.5mm" }}>
                    {sk.cat}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap" }}>
                    {sk.items.split(",").map(i => i.trim()).filter(Boolean).map((i, x) => (
                      <Tag key={x} t={i} />
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}

          {d.langs.some(l => has(l.lang)) && (
            <>
              <SH t="Languages" />
              {d.langs.filter(l => has(l.lang)).map(l => (
                <div key={l.id} style={{ display: "flex", alignItems: "center", marginBottom: "2.5mm", fontSize: "8.5pt", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 600 }}>{l.lang}</span>
                  <span style={{ fontSize: "7.5pt", background: themeLangsBg, color: themeLangsColor, borderRadius: "3px", padding: "1px 5px", fontWeight: 600 }}>
                    {l.prof}
                  </span>
                </div>
              ))}
            </>
          )}

          {d.certs.some(c => has(c.name)) && (
            <>
              <SH t="Certifications" />
              {d.certs.filter(c => has(c.name)).map(c => (
                <div key={c.id} style={{ marginBottom: "2.5mm", fontSize: "8.5pt" }}>
                  <div style={{ fontWeight: 700, color: themeG }}>{c.name}</div>
                  {has(c.issuer) && <div style={{ color: "#718096", fontSize: "8pt" }}>{c.issuer}</div>}
                  {has(c.date) && <div style={{ color: "#a0aec0", fontSize: "7.5pt" }}>{c.date}</div>}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Right Column */}
        <div style={{ flex: 1, padding: "5mm 8mm", boxSizing: "border-box" }}>
          {has(d.summary) && (
            <>
              <SH t="Professional Summary" />
              <p style={{ fontSize: "9pt", textAlign: "justify", margin: 0 }}>{d.summary}</p>
            </>
          )}

          {d.exp.some(e => has(e.title) || has(e.company)) && (
            <>
              <SH t="Work Experience" />
              {d.exp.filter(e => has(e.title) || has(e.company)).map(e => (
                <div key={e.id} style={{ marginBottom: "4mm", paddingLeft: "3mm", borderLeft: `2.5px solid ${themeG}` }}>
                  <div style={{ fontWeight: 700, fontSize: "9.5pt", color: "#2d3748" }}>{e.title}</div>
                  <div style={{ display: "flex", fontSize: "8.5pt", margin: "0.5mm 0", justifyContent: "space-between" }}>
                    <span style={{ color: themeG, fontWeight: 700 }}>{e.company}</span>
                    <span style={{ color: "#718096" }}>
                      {[e.start, e.current ? "Present" : e.end].filter(has).join(" – ")}
                    </span>
                  </div>
                  {has(e.loc) && <div style={{ fontSize: "8pt", color: "#a0aec0", marginBottom: "1mm" }}>📍 {e.loc}</div>}
                  {e.bullets.filter(b => has(b)).map((b, i) => (
                    <div key={i} style={{ display: "flex", gap: "2mm", fontSize: "8.5pt", marginBottom: "0.5mm" }}>
                      <span style={{ color: themeA, fontWeight: 900 }}>▪</span>
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}

          {d.edu.some(e => has(e.degree) || has(e.inst)) && (
            <>
              <SH t="Education" />
              {d.edu.filter(e => has(e.degree) || has(e.inst)).map(e => (
                <div key={e.id} style={{ marginBottom: "3mm", paddingLeft: "3mm", borderLeft: `2.5px solid ${themeA}` }}>
                  <div style={{ fontWeight: 700, fontSize: "9.5pt", color: "#2d3748" }}>
                    {[e.degree, e.field].filter(has).join(" in ")}
                  </div>
                  <div style={{ display: "flex", fontSize: "8.5pt", margin: "0.5mm 0", justifyContent: "space-between" }}>
                    <span style={{ color: themeG, fontWeight: 700 }}>{e.inst}</span>
                    <span style={{ color: "#718096" }}>
                      {[e.start, e.end].filter(has).join(" – ")}
                    </span>
                  </div>
                  {has(e.loc) && <div style={{ fontSize: "8pt", color: "#a0aec0" }}>{e.loc}</div>}
                  {(has(e.grade) || has(e.honors)) && (
                    <div style={{ fontSize: "8pt", color: "#718096", marginTop: "0.5mm" }}>
                      {[e.grade && `Grade: ${e.grade}`, e.honors].filter(Boolean).join("  |  ")}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {d.showRefs && (
            <>
              <SH t="References" />
              {d.refs.some(r => has(r.name)) ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3mm" }}>
                  {d.refs.filter(r => has(r.name)).map(r => (
                    <div key={r.id} style={{ padding: "2.5mm", background: themeColBg, borderRadius: "8px", border: `1px solid ${themeColBorder}`, fontSize: "8pt" }}>
                      <div style={{ fontWeight: 700, color: themeG }}>{r.name}</div>
                      {has(r.title) && <div style={{ color: "#4a5568" }}>{r.title}</div>}
                      {has(r.org) && <div style={{ color: "#718096" }}>{r.org}</div>}
                      {has(r.phone) && <div style={{ color: "#2d3748", marginTop: "0.5mm" }}>{r.phone}</div>}
                      {has(r.email) && <div style={{ color: "#2d3748" }}>{r.email}</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: "9.5pt", fontStyle: "italic", margin: 0 }}>Available upon request</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function RegularTemplate({ d, design }: { d: CVData; design?: string }) {
  const has = (v: any) => v && String(v).trim().length > 0

  const fontMap: Record<string, string> = {
    "sans-serif": "'Segoe UI', Arial, sans-serif",
    "serif": "Georgia, 'Times New Roman', Times, serif",
    "monospace": "Menlo, Consolas, monospace"
  }

  const customFont = d.customStyles?.fontFamily
    ? fontMap[d.customStyles.fontFamily]
    : null;
  const fontFamily = customFont || "'Segoe UI', Arial, sans-serif";

  const customColor = d.customStyles?.primaryColor && d.customStyles.primaryColor !== "#1B4332"
    ? d.customStyles.primaryColor
    : null;
  const themeG = customColor || (design === "navy" ? "#1e3a8a" : design === "crimson" ? "#4c0519" : design === "charcoal" ? "#1e293b" : design === "slate" ? "#0f172a" : "#1B4332");

  const customAccent = d.customStyles?.secondaryColor && d.customStyles.secondaryColor !== "#E9A23B"
    ? d.customStyles.secondaryColor
    : null;
  const themeA = customAccent || (design === "navy" ? "#3b82f6" : design === "crimson" ? "#9f1239" : design === "charcoal" ? "#64748b" : design === "slate" ? "#0d9488" : "#E9A23B");

  const fSize = d.customStyles?.fontSize || "9.5pt";
  const lHeight = Number(d.customStyles?.lineHeight || "1.6");
  const pageMargin = d.customStyles?.margins || "12mm";

  // Themes
  let themeColBg = design === "navy" ? "#f8fafc" : design === "crimson" ? "#fffafb" : design === "charcoal" ? "#f8fafc" : design === "slate" ? "#f0fdfa" : "#f4f8f5";
  let themeColBorder = design === "navy" ? "#e2e8f0" : design === "crimson" ? "#ffe4e6" : design === "charcoal" ? "#e2e8f0" : design === "slate" ? "#ccfbf1" : "#e2ece6";
  let themeTagBg = design === "navy" ? "#dbeafe" : design === "crimson" ? "#ffe4e6" : design === "charcoal" ? "#f1f5f9" : design === "slate" ? "#ccfbf1" : "#e8f4ec";

  const SH = ({ t }: { t: string }) => {
    if (design === "block") {
      return (
        <div style={{
          fontSize: "10pt",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: ".08em",
          color: themeG,
          background: themeColBg,
          borderLeft: `4px solid ${themeG}`,
          padding: "1.5mm 3mm",
          marginTop: "5mm",
          marginBottom: "3.5mm",
          fontFamily
        }}>
          {t}
        </div>
      )
    }

    if (design === "elegant") {
      return (
        <div style={{
          fontSize: "10pt",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: ".08em",
          color: themeG,
          borderBottom: `1.5px solid ${themeG}`,
          paddingBottom: "0.8mm",
          marginTop: "5mm",
          marginBottom: "3.5mm",
          fontFamily,
          position: "relative"
        }}>
          {t}
          <div style={{ position: "absolute", bottom: "-3.5px", left: 0, right: 0, height: "1px", background: themeG }} />
        </div>
      )
    }

    return (
      <div style={{
        fontSize: "10pt",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: ".08em",
        color: themeG,
        borderBottom: `2px solid ${themeA}`,
        paddingBottom: "1.2mm",
        marginTop: "5mm",
        marginBottom: "3.5mm",
        fontFamily
      }}>
        {t}
      </div>
    )
  }

  return (
    <div style={{
      fontFamily,
      fontSize: fSize,
      lineHeight: d.customStyles?.lineHeight ? Number(d.customStyles.lineHeight) : 1.5,
      color: "#000",
      background: "#fff",
      maxWidth: "210mm",
      minHeight: "297mm",
      margin: "0 auto",
      padding: `${pageMargin} ${pageMargin}`,
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* Document Header */}
      {design === "block" ? (
        <div style={{ borderBottom: `2px solid ${themeColBorder}`, paddingBottom: "3mm", marginBottom: "5mm" }}>
          <h1 style={{ fontSize: "16pt", fontWeight: 800, color: themeG, textTransform: "uppercase", margin: 0 }}>
            CURRICULUM VITAE
          </h1>
          <div style={{ fontSize: "10pt", color: "#4a5568", marginTop: "1mm", fontWeight: 600 }}>
            PERSONAL & PROFESSIONAL RECORD
          </div>
        </div>
      ) : design === "elegant" ? (
        <div style={{ display: "flex", alignItems: "center", gap: "4mm", marginBottom: "5mm" }}>
          <div style={{ width: "6px", height: "40px", background: themeG }} />
          <h1 style={{ fontSize: "16pt", fontWeight: 800, color: themeG, textTransform: "uppercase", margin: 0, letterSpacing: "0.05em" }}>
            CURRICULUM VITAE
          </h1>
        </div>
      ) : (
        <div style={{ textAlign: "center", marginBottom: "5mm" }}>
          <h1 style={{ fontSize: "16pt", fontWeight: 800, color: themeG, letterSpacing: "0.06em", textTransform: "uppercase", margin: 0 }}>
            CURRICULUM VITAE
          </h1>
          <div style={{ height: "3px", background: themeA, width: "70px", margin: "1.5mm auto 0 auto" }} />
        </div>
      )}

      {/* Personal / Contact Details Grid */}
      <div style={{
        background: themeColBg,
        border: `1px solid ${themeColBorder}`,
        borderRadius: "8px",
        padding: "4mm 6mm",
        marginBottom: "4mm",
        fontSize: "8.5pt",
        display: "grid",
        gridTemplateColumns: "1.1fr 0.9fr",
        gap: "3mm 6mm"
      }}>
        {/* Left side details */}
        <div>
          <div style={{ marginBottom: "1.5mm" }}>
            <span style={{ fontWeight: 700, color: "#4a5568", textTransform: "uppercase", fontSize: "7.5pt" }}>Full Name: </span>
            <span style={{ fontWeight: 700, fontSize: "9.5pt", color: themeG }}>{d.fullName || "Your Full Name"}</span>
          </div>
          {d.opt && (
            <>
              {has(d.dob) && (
                <div style={{ marginBottom: "1.5mm" }}>
                  <span style={{ fontWeight: 700, color: "#4a5568", textTransform: "uppercase", fontSize: "7.5pt" }}>Date of Birth: </span>
                  <span style={{ fontWeight: 600 }}>{d.dob}</span>
                </div>
              )}
              {has(d.nationality) && (
                <div style={{ marginBottom: "1.5mm" }}>
                  <span style={{ fontWeight: 700, color: "#4a5568", textTransform: "uppercase", fontSize: "7.5pt" }}>Nationality: </span>
                  <span style={{ fontWeight: 600 }}>{d.nationality}</span>
                </div>
              )}
              {has(d.marital) && (
                <div style={{ marginBottom: "1.5mm" }}>
                  <span style={{ fontWeight: 700, color: "#4a5568", textTransform: "uppercase", fontSize: "7.5pt" }}>Marital Status: </span>
                  <span style={{ fontWeight: 600 }}>{d.marital}</span>
                </div>
              )}
              {has(d.id_no) && (
                <div style={{ marginBottom: "1.5mm" }}>
                  <span style={{ fontWeight: 700, color: "#4a5568", textTransform: "uppercase", fontSize: "7.5pt" }}>National ID No: </span>
                  <span style={{ fontWeight: 600 }}>{d.id_no}</span>
                </div>
              )}
              {has(d.kra_pin) && (
                <div>
                  <span style={{ fontWeight: 700, color: "#4a5568", textTransform: "uppercase", fontSize: "7.5pt" }}>KRA PIN No: </span>
                  <span style={{ fontWeight: 600 }}>{d.kra_pin}</span>
                </div>
              )}
            </>
          )}
        </div>
        {/* Right side details */}
        <div>
          {has(d.phone) && (
            <div style={{ marginBottom: "1.5mm" }}>
              <span style={{ fontWeight: 700, color: "#4a5568", textTransform: "uppercase", fontSize: "7.5pt" }}>Phone Number: </span>
              <span style={{ fontWeight: 600 }}>{d.phone}</span>
            </div>
          )}
          {has(d.email) && (
            <div style={{ marginBottom: "1.5mm" }}>
              <span style={{ fontWeight: 700, color: "#4a5568", textTransform: "uppercase", fontSize: "7.5pt" }}>Email Address: </span>
              <span style={{ fontWeight: 600, color: themeG }}>{d.email}</span>
            </div>
          )}
          {(has(d.addr) || has(d.county)) && (
            <div style={{ marginBottom: "1.5mm" }}>
              <span style={{ fontWeight: 700, color: "#4a5568", textTransform: "uppercase", fontSize: "7.5pt" }}>Postal Address: </span>
              <span style={{ fontWeight: 600 }}>{[d.addr, d.county, d.country].filter(has).join(", ")}</span>
            </div>
          )}
          {has(d.linkedin) && (
            <div style={{ marginBottom: "1.5mm" }}>
              <span style={{ fontWeight: 700, color: "#4a5568", textTransform: "uppercase", fontSize: "7.5pt" }}>LinkedIn: </span>
              <span style={{ fontWeight: 600 }}>{d.linkedin}</span>
            </div>
          )}
          {has(d.website) && (
            <div>
              <span style={{ fontWeight: 700, color: "#4a5568", textTransform: "uppercase", fontSize: "7.5pt" }}>Website: </span>
              <span style={{ fontWeight: 600 }}>{d.website}</span>
            </div>
          )}
        </div>
      </div>

      {/* Career Profile / Objectives */}
      {has(d.summary) && (
        <div>
          <SH t="Career Profile" />
          <p style={{ margin: 0, fontSize: "9pt", textAlign: "justify", color: "#2d3748" }}>
            {d.summary}
          </p>
        </div>
      )}

      {/* Work Experience */}
      {d.exp.some(e => has(e.title) || has(e.company)) && (
        <div>
          <SH t="Professional Work Experience" />
          {d.exp.filter(e => has(e.title) || has(e.company)).map((e, index) => (
            <div key={e.id} style={{ marginBottom: index === d.exp.length - 1 ? 0 : "4mm" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5mm" }}>
                <span style={{ fontWeight: 700, fontSize: "9.5pt", color: themeG }}>
                  {e.company} — <span style={{ color: "#2d3748" }}>{e.title}</span>
                </span>
                <span style={{ fontSize: "8.5pt", color: "#4a5568", fontWeight: 700 }}>
                  {[e.start, e.current ? "Present" : e.end].filter(has).join(" – ")}
                </span>
              </div>
              {has(e.loc) && (
                <div style={{ fontSize: "8.5pt", fontStyle: "italic", color: "#718096", marginBottom: "1.5mm" }}>
                  Location: {e.loc}
                </div>
              )}
              {e.bullets && e.bullets.length > 0 && e.bullets[0] !== "" && (
                <ul style={{ paddingLeft: "5mm", margin: 0, fontSize: "8.5pt", color: "#2d3748", listStyleType: "square" }}>
                  {e.bullets.filter(b => has(b)).map((b, bi) => (
                    <li key={bi} style={{ marginBottom: "1mm", lineHeight: 1.5 }}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Academic Qualifications */}
      {d.edu.some(ed => has(ed.degree) || has(ed.inst)) && (
        <div>
          <SH t="Academic Qualifications" />
          {d.edu.filter(ed => has(ed.degree) || has(ed.inst)).map((ed, index) => (
            <div key={ed.id} style={{ marginBottom: index === d.edu.length - 1 ? 0 : "3mm" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5mm" }}>
                <span style={{ fontWeight: 700, fontSize: "9.5pt", color: "#2d3748" }}>
                  {ed.inst} — <span style={{ fontWeight: 600 }}>{ed.degree} {has(ed.field) && `(${ed.field})`}</span>
                </span>
                <span style={{ fontSize: "8.5pt", color: "#4a5568", fontWeight: 700 }}>
                  {[ed.start, ed.end].filter(has).join(" – ")}
                </span>
              </div>
              <div style={{ display: "flex", gap: "4mm", fontSize: "8pt", color: "#718096" }}>
                {has(ed.loc) && <span>Location: {ed.loc}</span>}
                {has(ed.grade) && <span>Grade: {ed.grade}</span>}
                {has(ed.honors) && <span style={{ fontWeight: 600, color: themeG }}>{ed.honors}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Professional Certificates */}
      {d.certs.some(c => has(c.name)) && (
        <div>
          <SH t="Professional Qualifications & Memberships" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3mm" }}>
            {d.certs.filter(c => has(c.name)).map(c => (
              <div key={c.id} style={{ fontSize: "8.5pt" }}>
                <div style={{ fontWeight: 700, color: themeG }}>{c.name}</div>
                <div style={{ display: "flex", gap: "2mm", fontSize: "8pt", color: "#718096" }}>
                  {has(c.issuer) && <span>Issuer: {c.issuer}</span>}
                  {has(c.date) && <span>Date: {c.date}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {d.skills.some(sk => has(sk.items)) && (
        <div>
          <SH t="Key Skills & Competencies" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4mm" }}>
            {d.skills.filter(sk => has(sk.items)).map(sk => (
              <div key={sk.id}>
                <div style={{ fontSize: "8pt", fontWeight: 700, color: themeG, textTransform: "uppercase", letterSpacing: ".02em", marginBottom: "1.5mm" }}>
                  {sk.cat}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5mm" }}>
                  {sk.items.split(",").map(i => i.trim()).filter(Boolean).map((i, x) => (
                    <span key={x} style={{
                      background: themeColBg,
                      color: themeG,
                      borderRadius: "4px",
                      padding: "1.5px 6px",
                      fontSize: "8pt",
                      fontWeight: 600
                    }}>
                      {i}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Languages */}
      {d.langs.some(l => has(l.lang)) && (
        <div>
          <SH t="Languages" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5mm" }}>
            {d.langs.filter(l => has(l.lang)).map(l => (
              <div key={l.id} style={{ fontSize: "8.5pt" }}>
                <span style={{ fontWeight: 700 }}>{l.lang}: </span>
                <span style={{ color: "#4a5568" }}>{l.prof}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Referees */}
      {d.showRefs && (
        <div>
          <SH t="Referees" />
          {d.refs.some(r => has(r.name)) ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "4mm" }}>
              {d.refs.filter(r => has(r.name)).map(r => (
                <div key={r.id} style={{
                  fontSize: "8pt",
                  background: "#fafafa",
                  border: "1px solid #edf2f7",
                  borderRadius: "6px",
                  padding: "3mm 4mm",
                  boxSizing: "border-box"
                }}>
                  <div style={{ fontWeight: 700, color: themeG, textTransform: "uppercase", fontSize: "8.5pt", marginBottom: "1mm" }}>{r.name}</div>
                  {has(r.title) && <div style={{ fontWeight: 600, color: "#4a5568" }}>{r.title}</div>}
                  {has(r.org) && <div style={{ color: "#718096", marginBottom: "1mm" }}>{r.org}</div>}
                  {has(r.phone) && <div style={{ color: "#2d3748" }}>📞 {r.phone}</div>}
                  {has(r.email) && <div style={{ color: "#2d3748", wordBreak: "break-all" }}>✉ {r.email}</div>}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: "9pt", fontStyle: "italic", margin: 0, color: "#718096" }}>Available upon request</p>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Selection Screen ── */
interface SelectScreenProps {
  onSelect: (type: "ats" | "regular" | "visual", sampleKey: keyof typeof SAMPLES) => void
}

function SelectScreen({ onSelect }: SelectScreenProps) {
  const cards = [
    {
      type: "ats" as const,
      icon: "📄",
      title: "ATS-Optimised CV",
      btnC: "bg-primary text-white hover:bg-primary/95",
      btnL: "Create Blank ATS CV →",
      desc: "Clean, machine-readable single column formatting designed to pass Applicant Tracking Systems used by Safaricom, KCB, NCBA, KenGen, and international employers.",
      feats: [
        "Single-column, clear layout structure",
        "ATS-safe typography & layout parameters",
        "Keyword-optimised structured divisions",
        "High-contrast black & white print-ready format"
      ]
    },
    {
      type: "regular" as const,
      icon: "📝",
      title: "Standard / Regular CV",
      btnC: "bg-[#E9A23B] text-white hover:bg-[#E9A23B]/95 shadow-md shadow-[#E9A23B]/10",
      btnL: "Create Blank Regular CV →",
      desc: "Standard full-width single-column formatting designed to match typical professional Kenyan public and private sector CV structures. Ideal for KeRRA, ministries, banks, and corporate entities.",
      feats: [
        "Structured single-column formal block layout",
        "Curated premium color highlighting themes",
        "Referees & certificates styled at the bottom",
        "Formal personal details table/grid"
      ]
    },
    {
      type: "visual" as const,
      icon: "🎨",
      title: "Visual / Creative CV",
      btnC: "bg-teal-600 text-white hover:bg-teal-700 shadow-md shadow-teal-600/10",
      btnL: "Create Blank Visual CV →",
      desc: "Visually striking two-column design using curated Kenya-inspired primary colors. Highly recommended for creative roles, marketing, SMEs, and direct hiring Managers.",
      feats: [
        "Two-column clean aesthetic grid",
        "Traditional Kenya green & gold accent color palette",
        "Highlight tags & visual data priority layout",
        "Integrated professional reference cards grid"
      ]
    }
  ]

  const sampleButtons = [
    { key: "accountant" as const, label: "💼 Finance Accountant (CPA-K)", color: "hover:border-primary/50 text-on-surface" },
    { key: "developer" as const, label: "💻 Software Engineer", color: "hover:border-primary/50 text-on-surface" },
    { key: "support" as const, label: "📞 Customer Support Representative", color: "hover:border-primary/50 text-on-surface" }
  ]

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-surface-container-lowest border border-outline-variant rounded-2xl relative overflow-hidden shadow-soft">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />
      
      <div className="text-center mb-10 max-w-lg space-y-3 z-10">
        <div className="text-4xl">🇰🇪</div>
        <h1 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight">Professional CV Builder</h1>
        <p className="text-on-surface-variant text-base leading-relaxed">
          Select a template style optimized for Kenyan standards. Choose to start fresh or load a pre-filled professional sample.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full z-10">
        {cards.map(c => (
          <div
            key={c.type}
            className="flex flex-col justify-between p-6 rounded-2xl bg-surface-container border border-outline-variant transition-all duration-300 shadow-soft hover:shadow-md hover:border-primary/30"
          >
            <div>
              <div className="text-4xl mb-4">{c.icon}</div>
              <h2 className="text-xl font-headline font-bold text-on-surface mb-2">{c.title}</h2>
              <p className="text-on-surface-variant text-sm leading-relaxed mb-5">{c.desc}</p>
              
              <ul className="space-y-2 mb-6">
                {c.feats.map(f => (
                  <li key={f} className="text-xs text-on-surface-variant flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => onSelect(c.type, "empty")}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 active:scale-[0.98] ${c.btnC}`}
              >
                {c.btnL}
              </button>

              <div className="pt-2 border-t border-outline-variant/60">
                <span className="text-[10px] font-bold text-on-surface-variant/80 uppercase tracking-widest block mb-2">Or load a professional sample:</span>
                <div className="flex flex-col gap-1.5">
                  {sampleButtons.map(s => (
                    <button
                      key={s.key}
                      onClick={() => onSelect(c.type, s.key)}
                      className={`w-full py-2 px-3 border border-outline-variant rounded-xl text-left text-xs font-semibold hover:bg-surface-container-low transition-all active:scale-[0.99] flex items-center justify-between ${s.color}`}
                    >
                      <span>{s.label}</span>
                      <ArrowRight className="w-3 h-3 text-on-surface-variant" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 text-xs text-on-surface-variant/60 z-10 text-center">
        Full support for all 47 counties · Real-time flat/3D rendering viewport
      </div>
    </div>
  )
}

/* ── Main App ── */
const SECTION_MAP = {
  Personal: SecPersonal,
  Summary: SecSummary,
  Experience: SecExp,
  Education: SecEdu,
  Skills: SecSkills,
  Languages: SecLangs,
  Certifications: SecCerts,
  References: SecRefs,
  Design: SecDesign
}

type TabType = keyof typeof SECTION_MAP

export default function CVBuilder() {
  const { user, isLoaded, isSignedIn } = useUser()
  const [step, setStep] = useState<"select" | "build">("select")
  const [cvType, setCvType] = useState<"ats" | "regular" | "visual">("ats")
  const [d, setD] = useState<CVData>(() => JSON.parse(JSON.stringify(INIT)))
  const [tab, setTab] = useState<TabType>("Personal")
  const [preview, setPreview] = useState(false)
  const [generating, setGenerating] = useState<string | null>(null)
  const [variant, setVariant] = useState<string>("classic")

  const triggerAIGen = async (section: "summary" | "experience" | "skills", targetId?: string) => {
    if (!d.jobTitle) {
      alert("Please enter a Professional Title in the Personal section first so the AI knows your target role.")
      setTab("Personal")
      return
    }

    const loadingKey = targetId ? `${section}-${targetId}` : section
    setGenerating(loadingKey)
    try {
      let context = ""
      if (section === "experience" && targetId) {
        const expItem = d.exp.find(e => e.id === targetId)
        context = expItem ? `${expItem.title} at ${expItem.company}` : ""
      } else if (section === "skills" && targetId) {
        const skillItem = d.skills.find(s => s.id === targetId)
        context = skillItem?.cat || ""
      }

      const res = await fetch("/api/ai/generate-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profession: d.jobTitle,
          educationLevel: d.educationLevel || "Undergraduate Degree",
          section,
          context
        })
      })
      const data = await res.json()
      if (data.success && data.text) {
        if (section === "summary") {
          setD(prev => ({ ...prev, summary: data.text }))
        } else if (section === "experience" && targetId) {
          const newBullets = data.text.split("\n").map((b: string) => b.replace(/^[•\-\*\s]+/, "").trim()).filter(Boolean)
          setD(prev => ({
            ...prev,
            exp: prev.exp.map(e => e.id === targetId ? { ...e, bullets: newBullets.length ? newBullets : [""] } : e)
          }))
        } else if (section === "skills" && targetId) {
          setD(prev => ({
            ...prev,
            skills: prev.skills.map(s => s.id === targetId ? { ...s, items: data.text } : s)
          }))
        }
      } else {
        alert(data.error || "AI generation failed. Please try again.")
      }
    } catch (err) {
      console.error(err)
      alert("An error occurred during AI generation. Please check your network connection.")
    } finally {
      setGenerating(null)
    }
  }

  // Synchronize Clerk user information when loaded (only on blank start)
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      setD(prev => {
        // Only override if fields are empty to prevent overwriting selected samples
        const updated = { ...prev }
        if (!updated.fullName && user.fullName) {
          updated.fullName = user.fullName
        }
        if (updated.email === "" && user.primaryEmailAddress?.emailAddress) {
          updated.email = user.primaryEmailAddress.emailAddress
        }
        if (updated.phone === "+254 " && user.primaryPhoneNumber?.phoneNumber) {
          updated.phone = user.primaryPhoneNumber.phoneNumber
        }
        return updated
      })
    }
  }, [isLoaded, isSignedIn, user])

  const SectionComp = SECTION_MAP[tab]
  const tabIdx = SECTS.findIndex(s => s.id === tab)

  const handleSelectStyle = (type: "ats" | "regular" | "visual", sampleKey: keyof typeof SAMPLES) => {
    setCvType(type)
    if (type === "visual") {
      setVariant("emerald")
    } else {
      setVariant("classic")
    }
    setD(JSON.parse(JSON.stringify(SAMPLES[sampleKey])))
    setStep("build")
  }

  const handleLoadSample = (sampleKey: string) => {
    if (!SAMPLES[sampleKey]) return
    const professionNames: Record<string, string> = {
      empty: "Blank CV",
      accountant: "Finance Accountant",
      developer: "Software Developer",
      support: "Customer Support"
    }
    const targetName = professionNames[sampleKey] || "selected"
    if (window.confirm(`Are you sure you want to load the ${targetName} template? This will overwrite your current progress.`)) {
      setD(JSON.parse(JSON.stringify(SAMPLES[sampleKey])))
      setTab("Personal")
    }
  }

  if (step === "select") {
    return <SelectScreen onSelect={handleSelectStyle} />
  }

  return (
    <div className="flex flex-col min-h-[85vh] bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden relative shadow-soft">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide sidebar, site header, form panels, and toolbar actions */
          header, aside, nav, footer, .sidebar, .navbar, .np, button, select, input, textarea, label {
            display: none !important;
          }
          
          /* Reset parent layout containers to block to prevent pagination/scale distortion */
          html, body, #__next, main {
            display: block !important;
            position: static !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            overflow: visible !important;
          }

          /* Targets parent wrappers, but excludes the CV sheet, its contents, and non-printable elements */
          div:not(#cvout):not(#cvout *):not(.np), 
          section:not(#cvout):not(#cvout *):not(.np) {
            display: block !important;
            position: static !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            overflow: visible !important;
          }

          #cvout {
            box-shadow: none !important;
            border: none !important;
            width: 210mm !important; /* Force exact A4 width */
            min-height: 297mm !important;
            height: auto !important;
            margin: 0 auto !important;
            transform: none !important;
            display: block !important;
            background: white !important;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            margin: 0 !important;
            size: A4 portrait;
          }
        }
      `}} />

      {/* Top Action Bar */}
      <div className="np flex flex-col xl:flex-row items-center justify-between border-b border-outline-variant bg-surface-container-low px-6 py-4 gap-4">
        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto justify-between xl:justify-start">
          <button
            onClick={() => setStep("select")}
            className="flex items-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors focus:outline-none"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Select Style</span>
          </button>

          {/* Sample Loader Dropdown */}
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-on-surface-variant shrink-0" />
            <select
              value=""
              onChange={(e) => {
                const val = e.target.value
                if (val) handleLoadSample(val)
              }}
              className="px-3 py-1.5 rounded-xl border border-outline-variant bg-surface text-xs font-bold text-on-surface-variant hover:text-on-surface cursor-pointer focus:outline-none"
            >
              <option value="">📁 Load Professional Sample...</option>
              <option value="empty">⚠️ Reset to Blank</option>
              <option value="accountant">💼 Finance Accountant (CPA-K)</option>
              <option value="developer">💻 Software Developer</option>
              <option value="support">📞 Customer Support Representative</option>
            </select>
          </div>
          
          <div className="flex items-center bg-surface border border-outline-variant p-1 rounded-xl">
            {cvType === "ats" ? (
              <>
                <button
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-white transition-all"
                  onClick={() => {
                    setCvType("ats")
                    setVariant("classic")
                  }}
                >
                  📄 ATS CV
                </button>
                <button
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-on-surface-variant hover:text-on-surface transition-all"
                  onClick={() => {
                    setCvType("regular")
                    setVariant("classic")
                  }}
                >
                  📝 Regular CV
                </button>
                <button
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-on-surface-variant hover:text-on-surface transition-all"
                  onClick={() => {
                    setCvType("visual")
                    setVariant("emerald")
                  }}
                >
                  🎨 Visual CV
                </button>
              </>
            ) : (
              <>
                <button
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    cvType === "regular" ? "bg-[#E9A23B] text-white" : "text-on-surface-variant hover:text-on-surface"
                  }`}
                  onClick={() => {
                    setCvType("regular")
                    setVariant("classic")
                  }}
                >
                  📝 Regular CV
                </button>
                <button
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    cvType === "visual" ? "bg-primary text-white" : "text-on-surface-variant hover:text-on-surface"
                  }`}
                  onClick={() => {
                    setCvType("visual")
                    setVariant("emerald")
                  }}
                >
                  🎨 Visual CV
                </button>
              </>
            )}
          </div>

          {cvType !== "ats" && (
            <button
              onClick={() => {
                setCvType("ats")
                setVariant("classic")
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary text-primary hover:bg-primary/5 text-xs font-bold transition-all"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>To ATS CV</span>
            </button>
          )}

          {/* Design Variant Dropdown Selector */}
          <div className="np flex items-center gap-1.5 bg-surface border border-outline-variant p-1 rounded-xl">
            <span className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant/80 pl-1.5 shrink-0">Design:</span>
            <select
              value={variant}
              onChange={(e) => setVariant(e.target.value)}
              className="px-2.5 py-1 rounded-lg border-0 bg-transparent text-xs font-bold text-on-surface focus:outline-none cursor-pointer"
            >
              {cvType === "ats" ? (
                <>
                  <option value="classic">Times Classic</option>
                  <option value="modern">Modern Sans</option>
                  <option value="minimal">Minimalist Slim</option>
                  <option value="executive">Executive Serif</option>
                  <option value="compact">Helvetica Compact</option>
                </>
              ) : cvType === "regular" ? (
                <>
                  <option value="classic">Classic Kenyan</option>
                  <option value="block">Block Accent</option>
                  <option value="elegant">Elegant Accent</option>
                </>
              ) : (
                <>
                  <option value="emerald">Emerald & Gold</option>
                  <option value="navy">Royal Corporate</option>
                  <option value="crimson">Elegant Crimson</option>
                  <option value="charcoal">Modern Charcoal</option>
                  <option value="slate">Slate & Teal</option>
                </>
              )}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full xl:w-auto">
          <button
            onClick={() => setPreview(!preview)}
            className={`flex-1 xl:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-outline-variant text-xs font-bold transition-all bg-surface hover:bg-surface-container-low ${
              preview ? "border-primary text-primary" : "text-on-surface"
            }`}
          >
            {preview ? <Sparkles className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{preview ? "Edit Form" : "Focus Preview"}</span>
          </button>
          
          <button
            onClick={() => window.print()}
            className="flex-1 xl:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/95 text-xs font-bold transition-all shadow-md shadow-primary/10"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Main Work Area */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 relative">
        
        {/* Left Side: Editor Form */}
        {!preview && (
          <div className="np w-full lg:w-[460px] border-r border-outline-variant flex flex-col bg-surface overflow-hidden shrink-0">
            {/* Scrollable tab selectors */}
            <div className="flex items-center gap-1 overflow-x-auto px-4 py-3 bg-surface-container-low border-b border-outline-variant scrollbar-none shrink-0">
              {SECTS.map(s => {
                const Icon = s.icon
                const isActive = tab === s.id
                return (
                  <button
                    key={s.id}
                    onClick={() => setTab(s.id as TabType)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all focus:outline-none ${
                      isActive ? "bg-primary text-white" : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{s.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-6 max-h-[calc(100vh-18rem)] lg:max-h-[60vh] xl:max-h-[65vh]">
              <AnimatePresence mode="wait">
                <SectionComp key={tab} d={d} s={setD} onGen={triggerAIGen} generating={generating} />
              </AnimatePresence>
            </div>

            {/* Sticky bottom editor controls */}
            <div className="flex items-center justify-between border-t border-outline-variant px-6 py-4 bg-surface-container-low shrink-0">
              <button
                disabled={tabIdx === 0}
                onClick={() => setTab(SECTS[Math.max(0, tabIdx - 1)].id as TabType)}
                className="flex items-center gap-1 text-xs font-bold text-on-surface-variant hover:text-primary disabled:opacity-40 disabled:hover:text-on-surface-variant focus:outline-none"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
              
              <button
                onClick={() => {
                  if (tabIdx < SECTS.length - 1) {
                    setTab(SECTS[tabIdx + 1].id as TabType)
                  } else {
                    window.print()
                  }
                }}
                className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/85 focus:outline-none"
              >
                <span>{tabIdx < SECTS.length - 1 ? "Next Section" : "Finish & Print"}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Right Side: Tactile Preview canvas */}
        <div className="pvwrap flex-1 bg-surface-container-low p-6 md:p-8 flex justify-center items-start overflow-y-auto select-none min-h-[500px]">
          {/* Animated 3D Floating container */}
          <motion.div
            id="cvout"
            className="w-full bg-white text-black shadow-2xl origin-top-center border border-zinc-200/60 rounded-sm"
            style={{ maxWidth: "210mm" }}
            initial="flat"
            animate={!preview ? "tilted" : "flat"}
            variants={{
              tilted: {
                rotateY: 6,
                rotateX: 2,
                skewY: -0.5,
                scale: 0.98,
                transition: { type: "spring", stiffness: 200, damping: 22 }
              },
              flat: {
                rotateY: 0,
                rotateX: 0,
                skewY: 0,
                scale: 1,
                transition: { type: "spring", stiffness: 200, damping: 22 }
              }
            }}
            whileHover={!preview ? {
              rotateY: 0,
              rotateX: 0,
              skewY: 0,
              scale: 1,
              transition: { type: "spring", stiffness: 300, damping: 18 }
            } : undefined}
          >
            {cvType === "ats" ? (
              <ATSTemplate d={d} design={variant} />
            ) : cvType === "regular" ? (
              <RegularTemplate d={d} design={variant} />
            ) : (
              <VisualTemplate d={d} design={variant} />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
