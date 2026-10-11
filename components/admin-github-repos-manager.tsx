"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Github, Star, Eye, EyeOff, Search, RefreshCw, 
  ExternalLink, CheckCircle2, AlertCircle, Sparkles,
  Filter, Layers, ArrowUpRight
} from "lucide-react";
import { toast } from "react-hot-toast";
import { GITHUB_LANGUAGE_COLORS } from "@/lib/github";

interface AdminRepo {
  id: number;
  name: string;
  fullName: string;
  description: string;
  htmlUrl: string;
  language: string;
  stars: number;
  forks: number;
  pushedAt: string;
  isVisible: boolean;
  isFeatured: boolean;
}

interface VisibilityStats {
  total: number;
  visible: number;
  hidden: number;
  featured: number;
}

export function AdminGithubReposManager() {
  const [repos, setRepos] = useState<AdminRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "visible" | "hidden" | "featured">("all");
  const [pendingActionRepo, setPendingActionRepo] = useState<string | null>(null);

  const fetchRepos = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch("/api/admin/github-repos");
      const data = await res.json();
      if (data.success && Array.isArray(data.repos)) {
        setRepos(data.repos);
        if (isManualRefresh) {
          toast.success("GitHub repository visibility refreshed from system");
        }
      } else {
        toast.error(data.error || "Failed to load GitHub repositories");
      }
    } catch (err: any) {
      console.error("Failed to load GitHub repos:", err);
      toast.error("Network error retrieving GitHub repositories");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  // Compute live statistics based on current state
  const stats: VisibilityStats = useMemo(() => {
    return {
      total: repos.length,
      visible: repos.filter((r) => r.isVisible).length,
      hidden: repos.filter((r) => !r.isVisible).length,
      featured: repos.filter((r) => r.isFeatured).length,
    };
  }, [repos]);

  // Unique languages
  const availableLanguages = useMemo(() => {
    const langs = new Set<string>();
    repos.forEach((r) => {
      if (r.language && r.language !== "Codebase") langs.add(r.language);
    });
    return Array.from(langs).sort();
  }, [repos]);

  // Filtered repositories
  const filteredRepos = useMemo(() => {
    return repos.filter((repo) => {
      // Search filter
      const matchesSearch =
        !search.trim() ||
        repo.name.toLowerCase().includes(search.toLowerCase().trim()) ||
        (repo.description && repo.description.toLowerCase().includes(search.toLowerCase().trim())) ||
        (repo.language && repo.language.toLowerCase().includes(search.toLowerCase().trim()));

      if (!matchesSearch) return false;

      // Language filter
      if (selectedLanguage !== "all" && repo.language !== selectedLanguage) {
        return false;
      }

      // Visibility filter
      if (visibilityFilter === "visible" && !repo.isVisible) return false;
      if (visibilityFilter === "hidden" && repo.isVisible) return false;
      if (visibilityFilter === "featured" && !repo.isFeatured) return false;

      return true;
    });
  }, [repos, search, selectedLanguage, visibilityFilter]);

  // Handle single visibility toggle
  const handleToggleVisibility = async (repo: AdminRepo) => {
    const nextVisible = !repo.isVisible;
    setPendingActionRepo(repo.name);

    // Optimistic UI update
    setRepos((prev) =>
      prev.map((r) => (r.name === repo.name ? { ...r, isVisible: nextVisible } : r))
    );

    try {
      const res = await fetch("/api/admin/github-repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoName: repo.name,
          isVisible: nextVisible,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        // Revert on error
        setRepos((prev) =>
          prev.map((r) => (r.name === repo.name ? { ...r, isVisible: !nextVisible } : r))
        );
        toast.error(data.error || "Failed to update repository visibility");
      } else {
        toast.success(
          nextVisible
            ? `Enabled: "${repo.name}" is now visible on the public website.`
            : `Disabled: "${repo.name}" is now hidden from the public website.`
        );
      }
    } catch (err) {
      setRepos((prev) =>
        prev.map((r) => (r.name === repo.name ? { ...r, isVisible: !nextVisible } : r))
      );
      toast.error("Network error updating visibility");
    } finally {
      setPendingActionRepo(null);
    }
  };

  // Handle homepage featured toggle
  const handleToggleFeatured = async (repo: AdminRepo) => {
    const nextFeatured = !repo.isFeatured;
    setPendingActionRepo(repo.name);

    // Optimistic UI update
    setRepos((prev) =>
      prev.map((r) => (r.name === repo.name ? { ...r, isFeatured: nextFeatured } : r))
    );

    try {
      const res = await fetch("/api/admin/github-repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoName: repo.name,
          isFeatured: nextFeatured,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setRepos((prev) =>
          prev.map((r) => (r.name === repo.name ? { ...r, isFeatured: !nextFeatured } : r))
        );
        toast.error(data.error || "Failed to update featured status");
      } else {
        toast.success(
          nextFeatured
            ? `Starred: "${repo.name}" is now prioritized on the homepage.`
            : `Unstarred: "${repo.name}" removed from homepage featured list.`
        );
      }
    } catch (err) {
      setRepos((prev) =>
        prev.map((r) => (r.name === repo.name ? { ...r, isFeatured: !nextFeatured } : r))
      );
      toast.error("Network error updating featured status");
    } finally {
      setPendingActionRepo(null);
    }
  };

  // Bulk action handlers
  const handleBulkAction = async (action: "show_all" | "hide_all" | "reset_defaults") => {
    const actionLabel = 
      action === "show_all" 
        ? "make all 102+ repositories visible on the website" 
        : action === "hide_all" 
        ? "hide all repositories from the public website" 
        : "reset repository visibility to system defaults";

    if (!confirm(`Are you sure you want to ${actionLabel}?`)) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/github-repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Bulk visibility updated.");
        await fetchRepos();
      } else {
        toast.error(data.error || "Failed to apply bulk visibility update");
      }
    } catch (err) {
      toast.error("Network error applying bulk update");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats Overview */}
      <div className="p-6 sm:p-7 rounded-3xl bg-surface-container border border-outline-variant shadow-soft space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-black text-primary uppercase tracking-wider">
              <Github className="w-3.5 h-3.5" />
              Public GitHub Ecosystem CMS
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-on-surface tracking-tight">
              Control Repositories Displayed on Public Website
            </h2>
            <p className="text-xs text-on-surface-variant max-w-2xl leading-relaxed">
              Enable or disable which public GitHub repositories appear on{" "}
              <a href="/projects" target="_blank" className="font-mono text-primary font-bold hover:underline">/projects</a>{" "}
              and star which ones appear in the top grid on the{" "}
              <a href="/" target="_blank" className="font-mono text-primary font-bold hover:underline">homepage</a>.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
            <button
              onClick={() => fetchRepos(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-high border border-outline-variant hover:border-primary/50 text-xs font-bold text-on-surface transition-all disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-primary" : ""}`} />
              Refresh
            </button>
            <button
              onClick={() => handleBulkAction("show_all")}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-emerald-600/15 border border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600/25 text-xs font-bold transition-all"
            >
              Enable All
            </button>
            <button
              onClick={() => handleBulkAction("hide_all")}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-surface-container-highest border border-outline-variant hover:bg-red-500/10 hover:text-red-600 text-xs font-bold text-on-surface-variant transition-all"
            >
              Hide All
            </button>
            <button
              onClick={() => handleBulkAction("reset_defaults")}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-surface-container-highest border border-outline-variant hover:bg-surface-container text-xs font-bold text-on-surface-variant transition-all"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Real-Time Metrics Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-2 border-t border-outline-variant/60">
          <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Total Repos</span>
            <div className="text-2xl font-black text-on-surface mt-0.5">{stats.total}</div>
            <span className="text-[10px] text-on-surface-variant">Synced from GitHub API</span>
          </div>

          <div className="p-4 rounded-2xl bg-surface-container-lowest border border-emerald-500/30">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Visible on Web
            </span>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5">{stats.visible}</div>
            <span className="text-[10px] text-on-surface-variant">Shown on /projects</span>
          </div>

          <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
              <EyeOff className="w-3.5 h-3.5" /> Hidden from Web
            </span>
            <div className="text-2xl font-black text-on-surface-variant mt-0.5">{stats.hidden}</div>
            <span className="text-[10px] text-on-surface-variant">Excluded from public views</span>
          </div>

          <div className="p-4 rounded-2xl bg-surface-container-lowest border border-amber-500/30">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> Featured on Home
            </span>
            <div className="text-2xl font-black text-amber-600 mt-0.5">{stats.featured}</div>
            <span className="text-[10px] text-on-surface-variant">Top homepage showcase</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search repositories by name, description, or stack..."
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-surface-container border border-outline-variant text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center p-1 rounded-xl bg-surface-container border border-outline-variant text-xs font-semibold">
            <button
              onClick={() => setVisibilityFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                visibilityFilter === "all" ? "bg-surface text-primary shadow-xs font-bold" : "text-on-surface-variant"
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setVisibilityFilter("visible")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                visibilityFilter === "visible" ? "bg-surface text-emerald-600 shadow-xs font-bold" : "text-on-surface-variant"
              }`}
            >
              Visible ({stats.visible})
            </button>
            <button
              onClick={() => setVisibilityFilter("hidden")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                visibilityFilter === "hidden" ? "bg-surface text-red-600 shadow-xs font-bold" : "text-on-surface-variant"
              }`}
            >
              Hidden ({stats.hidden})
            </button>
            <button
              onClick={() => setVisibilityFilter("featured")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                visibilityFilter === "featured" ? "bg-surface text-amber-600 shadow-xs font-bold" : "text-on-surface-variant"
              }`}
            >
              Featured ({stats.featured})
            </button>
          </div>

          {/* Language selector */}
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="h-11 px-3 rounded-xl bg-surface-container border border-outline-variant text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Languages ({availableLanguages.length})</option>
            {availableLanguages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Repositories Cards Grid */}
      {loading ? (
        <div className="p-16 text-center text-xs text-on-surface-variant bg-surface-container rounded-3xl border border-outline-variant space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin text-primary mx-auto" />
          <p className="font-bold">Loading public repositories from GitHub & visibility settings...</p>
        </div>
      ) : filteredRepos.length === 0 ? (
        <div className="p-16 text-center text-xs text-on-surface-variant bg-surface-container rounded-3xl border border-outline-variant space-y-2">
          <AlertCircle className="w-8 h-8 text-on-surface-variant/40 mx-auto" />
          <p className="font-bold text-sm text-on-surface">No repositories matched your filters.</p>
          <p>Try clearing your search query or selecting a different language or visibility filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRepos.map((repo) => {
            const langColor = GITHUB_LANGUAGE_COLORS[repo.language] || "#888";
            const isProcessing = pendingActionRepo === repo.name;

            return (
              <div
                key={repo.id}
                className={`p-5 rounded-3xl border transition-all shadow-soft flex flex-col justify-between gap-4 ${
                  repo.isVisible
                    ? "bg-surface-container border-outline-variant hover:border-primary/40"
                    : "bg-surface-container/50 border-outline-variant/50 opacity-70"
                }`}
              >
                {/* Card Top Header */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Visibility badge */}
                      {repo.isVisible ? (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 flex items-center gap-1">
                          <Eye className="w-2.5 h-2.5" /> Visible on Web
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-neutral-500/10 text-neutral-500 border border-neutral-500/20 flex items-center gap-1">
                          <EyeOff className="w-2.5 h-2.5" /> Hidden from Web
                        </span>
                      )}

                      {/* Featured badge */}
                      {repo.isFeatured && (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/25 flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> Home Featured
                        </span>
                      )}
                    </div>

                    <a
                      href={repo.htmlUrl}
                      target="_blank"
                      rel="noreferrer"
                      title="View repository on GitHub"
                      className="text-on-surface-variant hover:text-primary p-1 shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Repo Title and Description */}
                  <div>
                    <h3 className="font-bold text-sm text-on-surface truncate group-hover:text-primary transition-colors">
                      {repo.name}
                    </h3>
                    <p className="text-xs text-on-surface-variant line-clamp-2 mt-1 leading-relaxed">
                      {repo.description || "No description provided on GitHub."}
                    </p>
                  </div>

                  {/* Metadata pills */}
                  <div className="flex items-center gap-3 text-xs text-on-surface-variant pt-1 flex-wrap">
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

                    <span className="text-[10px] text-on-surface-variant font-mono">
                      {new Date(repo.pushedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Card Action Controls */}
                <div className="pt-3 border-t border-outline-variant/60 flex items-center justify-between gap-2">
                  {/* Public Visibility Toggle Button */}
                  <button
                    onClick={() => handleToggleVisibility(repo)}
                    disabled={isProcessing}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      repo.isVisible
                        ? "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 border border-emerald-600/25 hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/25"
                        : "bg-primary text-white hover:bg-primary/90 shadow-xs"
                    }`}
                  >
                    {repo.isVisible ? (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Visible (Click to Hide)</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Hidden (Click to Show)</span>
                      </>
                    )}
                  </button>

                  {/* Home Featured Star Button */}
                  <button
                    onClick={() => handleToggleFeatured(repo)}
                    disabled={isProcessing}
                    title={repo.isFeatured ? "Remove from Homepage Featured" : "Star to Feature on Homepage"}
                    className={`p-2 rounded-xl border transition-all ${
                      repo.isFeatured
                        ? "bg-amber-500/15 border-amber-500/40 text-amber-600"
                        : "bg-surface-container-high border-outline-variant text-on-surface-variant hover:text-amber-500"
                    }`}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        repo.isFeatured ? "fill-amber-500 text-amber-500" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
