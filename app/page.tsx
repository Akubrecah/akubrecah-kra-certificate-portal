"use client"

import { useUser } from "@clerk/nextjs"
import { 
  ArrowRight, 
  Laptop, 
  Smartphone, 
  Cloud, 
  Layers, 
  FileCheck2, 
  ShieldCheck, 
  Send, 
  CheckCircle2, 
  Sparkles,
  Code2,
  Zap,
  Globe,
  FolderGit2,
  ExternalLink,
  BookOpen,
  Clock,
  Github,
  Star,
  GitFork
} from 'lucide-react'
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { GITHUB_LANGUAGE_COLORS, GithubRepo } from "@/lib/github"

export default function Home() {
  const { isSignedIn, isLoaded } = useUser()
  const [projects, setProjects] = useState<any[]>([])
  const [articles, setArticles] = useState<any[]>([])
  const [githubData, setGithubData] = useState<{
    repos: GithubRepo[];
    stats: {
      totalRepos: number;
      totalStars: number;
      totalForks: number;
      languages: { name: string; count: number; percentage: number }[];
    } | null;
  }>({
    repos: [],
    stats: null
  })
  const [loadingContent, setLoadingContent] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/projects').then((r) => r.json()).catch(() => ({ success: false })),
      fetch('/api/articles').then((r) => r.json()).catch(() => ({ success: false })),
      fetch('/api/github/repos').then((r) => r.json()).catch(() => ({ success: false }))
    ]).then(([projData, artData, ghData]) => {
      if (projData?.success && Array.isArray(projData.projects)) {
        setProjects(projData.projects.slice(0, 3))
      }
      if (artData?.success && Array.isArray(artData.articles)) {
        setArticles(artData.articles.slice(0, 2))
      }
      if (ghData?.success && Array.isArray(ghData.repos)) {
        setGithubData({
          repos: ghData.repos,
          stats: ghData.stats || null,
        })
      }
      setLoadingContent(false)
    })
  }, [])

  // Top starred public repos from GitHub with fallbacks
  const topRepos: GithubRepo[] = (githubData.repos.length > 0
    ? [...githubData.repos].sort((a, b) => b.stars - a.stars || new Date(b.pushedAt).getTime() - new Date(a.pushedAt).getTime()).slice(0, 6)
    : [
        {
          id: 1,
          name: "BWM-XMD-QUANTUM",
          fullName: "Akubrecah/BWM-XMD-QUANTUM",
          description: "High-performance multi-device WhatsApp userbot framework engineered with automation pipelines, media handlers, and plugins.",
          htmlUrl: "https://github.com/Akubrecah/BWM-XMD-QUANTUM",
          homepage: null,
          language: "Python",
          stars: 48,
          forks: 18,
          openIssues: 0,
          topics: ["whatsapp-bot", "python", "automation"],
          createdAt: "",
          updatedAt: "",
          pushedAt: "",
          isFork: false,
          isArchived: false,
          size: 1024,
          defaultBranch: "main"
        },
        {
          id: 2,
          name: "Flet-Weather-App",
          fullName: "Akubrecah/Flet-Weather-App",
          description: "Sleek, cross-platform desktop and mobile weather dashboard built with Python and the Flet UI framework.",
          htmlUrl: "https://github.com/Akubrecah/Flet-Weather-App",
          homepage: null,
          language: "Python",
          stars: 12,
          forks: 4,
          openIssues: 0,
          topics: ["flet", "python", "weather-app"],
          createdAt: "",
          updatedAt: "",
          pushedAt: "",
          isFork: false,
          isArchived: false,
          size: 512,
          defaultBranch: "main"
        },
        {
          id: 3,
          name: "XeonBug-V8.1",
          fullName: "Akubrecah/XeonBug-V8.1",
          description: "Specialized diagnostics & messaging engine stress-testing sandbox with custom socket protocols and recovery handlers.",
          htmlUrl: "https://github.com/Akubrecah/XeonBug-V8.1",
          homepage: null,
          language: "Python",
          stars: 9,
          forks: 3,
          openIssues: 0,
          topics: ["automation", "diagnostics"],
          createdAt: "",
          updatedAt: "",
          pushedAt: "",
          isFork: false,
          isArchived: false,
          size: 256,
          defaultBranch: "main"
        },
        {
          id: 4,
          name: "Mpesa-Daraja-Api-Python",
          fullName: "Akubrecah/Mpesa-Daraja-Api-Python",
          description: "Python SDK wrapper for Safaricom Daraja 2.0 API supporting STK Push, C2B, B2C, transaction status, and webhook validation.",
          htmlUrl: "https://github.com/Akubrecah/Mpesa-Daraja-Api-Python",
          homepage: null,
          language: "Python",
          stars: 8,
          forks: 3,
          openIssues: 0,
          topics: ["mpesa", "daraja-api", "fintech", "kenya"],
          createdAt: "",
          updatedAt: "",
          pushedAt: "",
          isFork: false,
          isArchived: false,
          size: 128,
          defaultBranch: "main"
        },
        {
          id: 5,
          name: "portfolio",
          fullName: "Akubrecah/portfolio",
          description: "Full-stack software engineering portfolio, KRA compliance certificate portal, and administration dashboard.",
          htmlUrl: "https://github.com/Akubrecah/portfolio",
          homepage: "https://akubrecah.vercel.app",
          language: "TypeScript",
          stars: 6,
          forks: 2,
          openIssues: 0,
          topics: ["nextjs", "typescript", "tailwind", "react"],
          createdAt: "",
          updatedAt: "",
          pushedAt: "",
          isFork: false,
          isArchived: false,
          size: 2048,
          defaultBranch: "main"
        },
        {
          id: 6,
          name: "whatsapp-bot",
          fullName: "Akubrecah/whatsapp-bot",
          description: "Automated business messaging gateway with queue management, interactive menus, and PDF attachment dispatcher.",
          htmlUrl: "https://github.com/Akubrecah/whatsapp-bot",
          homepage: null,
          language: "JavaScript",
          stars: 5,
          forks: 2,
          openIssues: 0,
          topics: ["whatsapp", "bot", "nodejs"],
          createdAt: "",
          updatedAt: "",
          pushedAt: "",
          isFork: false,
          isArchived: false,
          size: 400,
          defaultBranch: "main"
        }
      ] as GithubRepo[])

  const inHouseTools = [
    {
      title: "KRA Certificate Retrieval Portal",
      badge: "KES 20 · Instant Download",
      description: "Instant official KRA compliance document retrieval by National ID or PIN. Automated PDF generation, verified in seconds for only KES 20.",
      href: "/retrieval-portal",
      icon: FileCheck2,
      ctaText: "Retrieve Certificate (KES 20)",
      color: "text-primary"
    },
    {
      title: "Live PIN & ID Validator",
      badge: "GovTech",
      description: "Real-time taxpayer status validation, station verification, and fraud prevention connecting to official tax registries.",
      href: "/pin-checker",
      icon: ShieldCheck,
      ctaText: "Run PIN Check",
      color: "text-red-600 dark:text-red-400"
    },
    {
      title: "Automated Tax Filing",
      badge: "Compliance",
      description: "Streamlined nil returns and statutory submission pipeline with automated validation and receipt generation.",
      href: "/dashboard/filing",
      icon: Send,
      ctaText: "File Returns",
      color: "text-emerald-600"
    }
  ]

  const capabilities = [
    { icon: Laptop, label: "Web Engineering", desc: "Next.js, React, TypeScript", href: "/services" },
    { icon: Smartphone, label: "Mobile Apps", desc: "iOS, Android, React Native", href: "/services" },
    { icon: Cloud, label: "Cloud & DevOps", desc: "AWS, GCP, Kubernetes", href: "/services" },
    { icon: Layers, label: "Enterprise Systems", desc: "APIs, ERPs, Automation", href: "/services" },
  ]

  return (
    <div className="relative w-full bg-background text-on-background font-sans overflow-x-hidden">
      
      {/* Background glow — deep red, no purple */}
      <div className="absolute top-0 inset-x-0 h-[700px] bg-[radial-gradient(ellipse_at_20%_0%,rgba(186,26,26,0.10)_0%,transparent_70%)] pointer-events-none z-0" />
      <div className="absolute top-20 right-[8%] w-96 h-96 bg-primary/4 rounded-full filter blur-[130px] pointer-events-none z-0" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col space-y-24 pb-24 pt-8 md:pt-14">

        {/* ============================= HERO ============================= */}
        <section id="hero" className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          
          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
            className="flex-1 space-y-7"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-high border border-outline-variant text-xs font-semibold shadow-xs">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-ping" />
              <span className="font-black text-primary">Akubrecah Technologies</span>
              <span className="text-outline-muted">·</span>
              <span className="text-on-surface-variant">Nairobi, Kenya</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-on-surface tracking-tight leading-[1.06]">
              Engineering<br />
              <span className="text-primary bg-gradient-to-br from-primary to-red-800 bg-clip-text text-transparent">
                Digital Products
              </span><br />
              That Scale.
            </h1>

            <p className="text-base sm:text-lg text-on-surface-variant max-w-lg leading-relaxed">
              Full-cycle software engineering — from concept to production. Web platforms, 
              native mobile apps, cloud infrastructure, and mission-critical automated systems 
              engineered for East Africa and beyond.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link href="/contact">
                <Button size="lg" className="h-13 px-7 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/92 shadow-lg shadow-primary/20 flex items-center gap-2 group">
                  <span>Start a Project</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/services">
                <Button variant="outline" size="lg" className="h-13 px-7 rounded-xl border-outline-variant font-bold text-sm hover:bg-surface-container flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-primary" />
                  <span>View Services</span>
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Right: Animated Capability Grid */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, delay: 0.15, ease: "easeOut" }}
            className="flex-1 grid grid-cols-2 gap-4 w-full max-w-md"
          >
            {capabilities.map((cap, i) => {
              const Icon = cap.icon
              return (
                <Link
                  key={cap.label}
                  href={cap.href}
                  className="group p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant hover:border-primary/50 hover:shadow-md transition-all duration-300 space-y-3"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary w-fit group-hover:bg-primary group-hover:text-white transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">{cap.label}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{cap.desc}</p>
                  </div>
                </Link>
              )
            })}
          </motion.div>
        </section>


        {/* ============================= IN-HOUSE TOOLS ============================= */}
        <section id="products" className="space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-black text-primary uppercase tracking-widest">
                <Sparkles className="h-3.5 w-3.5" />
                In-House Products
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-on-surface tracking-tight">
                Live Statutory Automation Suite
              </h2>
              <p className="text-sm text-on-surface-variant max-w-xl">
                Our flagship in-house systems power thousands of daily verified tax compliance 
                operations across Kenya — built on the same engineering standards we deliver to clients.
              </p>
            </div>
            <Link href="/products">
              <Button variant="outline" size="sm" className="h-10 px-5 rounded-xl font-bold text-xs gap-2 shrink-0">
                All Products <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {inHouseTools.map((tool) => {
              const Icon = tool.icon
              const isFlagship = tool.href === "/retrieval-portal"
              return (
                <div 
                  key={tool.title} 
                  className={`group p-7 rounded-3xl bg-surface-container-lowest border transition-all duration-300 flex flex-col ${
                    isFlagship 
                      ? 'border-primary/40 ring-1 ring-primary/25 shadow-lg shadow-primary/5 hover:border-primary hover:shadow-2xl hover:shadow-primary/10' 
                      : 'border-outline-variant hover:border-primary/40 shadow-soft hover:shadow-xl'
                  }`}
                >
                  <div className="flex items-center justify-between mb-5">
                    <div className={`p-3 rounded-xl transition-colors ${
                      isFlagship 
                        ? 'bg-primary text-white shadow-md shadow-primary/20' 
                        : `bg-surface-container ${tool.color} group-hover:bg-primary group-hover:text-white`
                    }`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
                      isFlagship 
                        ? 'bg-primary/10 text-primary border-primary/30 font-black' 
                        : 'bg-surface-container text-on-surface-variant border-outline-variant'
                    }`}>
                      {tool.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-on-surface mb-2 group-hover:text-primary transition-colors">{tool.title}</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed flex-1">{tool.description}</p>
                  <div className="pt-5 mt-4 border-t border-outline-variant/60">
                    <Link href={tool.href}>
                      <Button className={`w-full h-11 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                        isFlagship 
                          ? 'bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20' 
                          : 'bg-surface-container group-hover:bg-primary text-on-surface group-hover:text-white'
                      }`}>
                        {tool.ctaText} <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ============================= FEATURED PROJECTS & CASE STUDIES ============================= */}
        <section id="featured-projects" className="space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-black text-primary uppercase tracking-widest">
                <FolderGit2 className="h-3.5 w-3.5" />
                Engineering Case Studies
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-on-surface tracking-tight">
                Featured Production Systems
              </h2>
              <p className="text-sm text-on-surface-variant max-w-xl">
                Real-world platforms architected for high concurrency, zero-data-loss compliance, and seamless payment flows.
              </p>
            </div>
            <Link href="/projects">
              <Button variant="outline" size="sm" className="h-10 px-5 rounded-xl font-bold text-xs gap-2 shrink-0">
                Explore All Projects <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projects.length > 0 ? (
              projects.map((proj) => (
                <div
                  key={proj.id}
                  className="p-7 rounded-3xl bg-surface-container-lowest border border-outline-variant hover:border-primary/40 transition-all duration-300 shadow-soft hover:shadow-xl flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                        {proj.category}
                      </span>
                      {proj.liveUrl && (
                        <a
                          href={proj.liveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-on-surface-variant hover:text-primary transition-colors p-1"
                          title="Open Live System"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>

                    <div>
                      <h3 className="text-xl font-black text-on-surface group-hover:text-primary transition-colors tracking-tight">
                        <Link href={`/projects/${proj.slug}`}>
                          {proj.title}
                        </Link>
                      </h3>
                      <p className="text-xs text-on-surface-variant mt-2 line-clamp-3 leading-relaxed">
                        {proj.summary}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {proj.techStack?.slice(0, 4).map((tech: string) => (
                        <span key={tech} className="text-[10px] font-mono text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-md border border-outline-variant/60">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-outline-variant/60 flex items-center justify-between">
                    <Link
                      href={`/projects/${proj.slug}`}
                      className="text-xs font-bold text-primary group-hover:underline flex items-center gap-1.5"
                    >
                      Read Case Study <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant text-center text-xs text-on-surface-variant">
                Loading production portfolio...
              </div>
            )}
          </div>
        </section>

        {/* ============================= GITHUB & OPEN SOURCE ECOSYSTEM ============================= */}
        <section id="github-ecosystem" className="space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-black text-primary uppercase tracking-widest">
                <Github className="h-3.5 w-3.5" />
                Open Source & Engineering Labs
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-on-surface tracking-tight">
                Public Repositories Ecosystem
              </h2>
              <p className="text-sm text-on-surface-variant max-w-xl">
                Real-time synchronized from GitHub (<a href="https://github.com/Akubrecah" target="_blank" rel="noreferrer" className="font-mono text-primary font-bold hover:underline">@Akubrecah</a>). 
                Over 100+ public repositories spanning WhatsApp & Telegram automation, Safaricom Daraja M-Pesa fintech SDKs, cross-platform apps, and Python tools.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <a 
                href="https://github.com/Akubrecah" 
                target="_blank" 
                rel="noreferrer"
              >
                <Button variant="outline" size="sm" className="h-10 px-4 rounded-xl font-bold text-xs gap-2">
                  <Github className="h-3.5 w-3.5" /> Follow on GitHub
                </Button>
              </a>
              <Link href="/projects">
                <Button size="sm" className="h-10 px-5 rounded-xl bg-primary text-white font-bold text-xs gap-2 hover:bg-primary/90 shadow-md shadow-primary/20">
                  Explore All {githubData?.stats?.totalRepos ?? 102} Repos <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats strip with live language metrics */}
          <div className="p-6 sm:p-7 rounded-3xl bg-surface-container-lowest border border-outline-variant/80 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-soft">
            <div className="flex flex-wrap items-center gap-6 divide-y sm:divide-y-0 sm:divide-x divide-outline-variant/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Github className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-black text-on-surface">
                    {githubData?.stats?.totalRepos ?? 102}
                  </div>
                  <div className="text-[11px] text-on-surface-variant font-medium">Public Repositories</div>
                </div>
              </div>

              <div className="sm:pl-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                </div>
                <div>
                  <div className="text-2xl font-black text-on-surface">
                    {githubData?.stats?.totalStars ?? "90+"}
                  </div>
                  <div className="text-[11px] text-on-surface-variant font-medium">GitHub Stars</div>
                </div>
              </div>

              <div className="sm:pl-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                  <GitFork className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-black text-on-surface">
                    {githubData?.stats?.totalForks ?? "30+"}
                  </div>
                  <div className="text-[11px] text-on-surface-variant font-medium">Community Forks</div>
                </div>
              </div>
            </div>

            {/* Language breakdown pills */}
            <div className="flex flex-wrap items-center gap-2">
              {(githubData?.stats?.languages?.slice(0, 5) || [
                { name: 'Python', percentage: 24 },
                { name: 'HTML', percentage: 16 },
                { name: 'JavaScript', percentage: 15 },
                { name: 'TypeScript', percentage: 12 },
                { name: 'CSS', percentage: 10 }
              ]).map((lang) => (
                <Link
                  key={lang.name}
                  href={`/projects?language=${lang.name}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-surface-container border border-outline-variant/60 text-on-surface hover:border-primary/50 transition-colors"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: GITHUB_LANGUAGE_COLORS[lang.name] || '#888' }}
                  />
                  <span>{lang.name}</span>
                  <span className="text-[10px] text-on-surface-variant font-mono font-normal">
                    {lang.percentage}%
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Top Repositories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topRepos.map((repo) => {
              const langColor = GITHUB_LANGUAGE_COLORS[repo.language] || '#888'
              return (
                <div
                  key={repo.id}
                  className="p-6 rounded-3xl bg-surface-container-lowest border border-outline-variant hover:border-primary/40 transition-all duration-300 shadow-soft hover:shadow-xl flex flex-col justify-between group"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Github className="w-4 h-4 text-on-surface-variant group-hover:text-primary transition-colors shrink-0" />
                        <h3 className="font-bold text-sm text-on-surface truncate group-hover:text-primary transition-colors">
                          {repo.name}
                        </h3>
                      </div>
                      <a
                        href={repo.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-on-surface-variant hover:text-primary p-1 shrink-0"
                        title="View repository on GitHub"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <p className="text-xs text-on-surface-variant line-clamp-3 leading-relaxed">
                      {repo.description || "Open source repository authored and maintained by Akubrecah on GitHub."}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-on-surface-variant pt-1">
                      {repo.language && (
                        <span className="inline-flex items-center gap-1.5 font-medium">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: langColor }}
                          />
                          <span>{repo.language}</span>
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        {repo.stars}
                      </span>

                      <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                        <GitFork className="w-3 h-3 text-blue-500" />
                        {repo.forks}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-outline-variant/60 flex items-center justify-between gap-2">
                    <a
                      href={repo.htmlUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-primary group-hover:underline flex items-center gap-1"
                    >
                      <span>View Code</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </a>

                    {repo.homepage && (
                      <a
                        href={repo.homepage}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-on-surface-variant hover:text-primary flex items-center gap-1"
                      >
                        <span>Live Demo</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Directory banner */}
          <div className="p-7 sm:p-8 rounded-3xl bg-surface-container border border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-base font-black text-on-surface">Looking for a specific bot, microservice, or API SDK?</h3>
              <p className="text-xs text-on-surface-variant max-w-xl">
                Browse through all 102 repositories with instant full-text search, language filtering (Python, TypeScript, JavaScript, HTML), and sorting by stars or updates.
              </p>
            </div>
            <Link href="/projects" className="shrink-0">
              <Button className="h-11 px-6 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/90 flex items-center gap-2 shadow-md shadow-primary/20">
                <span>Browse All 102 Repositories</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* ============================= LATEST TECHNICAL NOTES ============================= */}
        {articles.length > 0 && (
          <section id="articles-teaser" className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-black text-primary uppercase tracking-widest">
                  <BookOpen className="h-3.5 w-3.5" />
                  Engineering Writing
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-on-surface tracking-tight">
                  Field Notes & Tutorials
                </h2>
                <p className="text-sm text-on-surface-variant max-w-xl">
                  Pragmatic architectural insights, payment engineering patterns, and lessons learned from production.
                </p>
              </div>
              <Link href="/articles">
                <Button variant="outline" size="sm" className="h-10 px-5 rounded-xl font-bold text-xs gap-2 shrink-0">
                  All Articles <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {articles.map((art) => (
                <div
                  key={art.id}
                  className="p-7 rounded-3xl bg-surface-container-lowest border border-outline-variant hover:border-primary/40 transition-all shadow-soft group flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                      <span className="font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                        {art.category}
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {art.readingTimeMinutes} min
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-on-surface group-hover:text-primary transition-colors tracking-tight">
                      <Link href={`/articles/${art.slug}`}>
                        {art.title}
                      </Link>
                    </h3>

                    <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                      {art.excerpt}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-outline-variant/60">
                    <Link
                      href={`/articles/${art.slug}`}
                      className="text-xs font-bold text-primary flex items-center gap-1.5 hover:underline"
                    >
                      Read Technical Article <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ============================= SERVICES TEASER ============================= */}
        <section className="p-10 sm:p-14 rounded-3xl bg-on-surface text-background dark:bg-surface-container-lowest dark:text-on-surface space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-primary">Engineering Capabilities</span>
              <h2 className="text-3xl sm:text-4xl font-black leading-tight">
                Built for Complexity.<br />Delivered with Precision.
              </h2>
              <p className="text-sm opacity-70 max-w-md leading-relaxed">
                From fintech payment gateways to government portals, from consumer mobile apps to enterprise ERPs — 
                we architect systems that handle real-world scale.
              </p>
            </div>
            <Link href="/services">
              <Button size="lg" className="h-13 px-7 rounded-xl bg-primary text-white font-bold text-sm flex items-center gap-2 group shrink-0">
                <span>Explore All Services</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Globe, title: "Web Platforms", sub: "Next.js · React · TypeScript" },
              { icon: Smartphone, title: "Mobile Apps", sub: "iOS · Android · RN" },
              { icon: Cloud, title: "Cloud & DevOps", sub: "AWS · K8s · CI/CD" },
              { icon: Zap, title: "GovTech APIs", sub: "M-Pesa · KRA · Custom" },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="p-4 rounded-2xl bg-white/5 dark:bg-surface-container border border-white/10 dark:border-outline-variant space-y-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <p className="font-bold text-sm">{item.title}</p>
                  <p className="text-xs opacity-60">{item.sub}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* ============================= PROCESS TEASER ============================= */}
        <section className="space-y-8 text-center max-w-3xl mx-auto">
          <div className="space-y-3">
            <span className="text-xs font-black text-primary uppercase tracking-widest">How We Work</span>
            <h2 className="text-3xl sm:text-4xl font-black text-on-surface">
              Disciplined Engineering Methodology
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Every project runs through our proven 4-phase lifecycle — no shortcuts, no surprises.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-0 items-center justify-center">
            {[
              { step: "01", label: "Architect" },
              { step: "02", label: "Build" },
              { step: "03", label: "Audit" },
              { step: "04", label: "Deploy" },
            ].map((phase, i) => (
              <div key={phase.step} className="flex items-center">
                <div className="px-5 py-3 rounded-2xl bg-surface-container-lowest border border-outline-variant text-center min-w-[110px]">
                  <span className="text-xs font-mono font-black text-primary">{phase.step}</span>
                  <p className="font-bold text-sm text-on-surface">{phase.label}</p>
                </div>
                {i < 3 && <div className="hidden sm:block w-8 h-0.5 bg-outline-variant" />}
              </div>
            ))}
          </div>
          <Link href="/about">
            <Button variant="outline" size="sm" className="h-10 px-6 rounded-xl font-bold text-xs gap-2">
              Learn Our Methodology <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </section>

        {/* ============================= CTA BAND ============================= */}
        <section className="relative overflow-hidden p-10 sm:p-14 rounded-3xl bg-primary text-white space-y-6 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.08)_0%,transparent_60%)] pointer-events-none" />
          <div className="relative z-10 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-black leading-tight">
              Ready to Build Your Next Digital System?
            </h2>
            <p className="text-white/85 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              Our engineering team is ready to scope, architect, and deliver your product — 
              from MVP to enterprise scale.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
              <Button asChild size="lg" className="h-12 px-8 rounded-xl bg-white text-primary font-bold text-sm hover:bg-white/90 shadow-md shadow-black/10 flex items-center gap-2 group">
                <Link href="/contact">
                  Start a Project <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild size="lg" className="h-12 px-8 rounded-xl border border-white/40 bg-transparent text-white font-bold text-sm hover:bg-white/15 hover:text-white backdrop-blur-sm transition-colors flex items-center gap-2">
                <Link href="/products">
                  View In-House Products
                </Link>
              </Button>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
