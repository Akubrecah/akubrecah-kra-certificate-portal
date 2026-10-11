"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { 
  Github, Star, GitFork, ExternalLink, Search, 
  Sparkles, Code2, ArrowUpRight, BookOpen, 
  Layers, CheckCircle2, ChevronRight, RefreshCw, AlertCircle,
  FolderGit2, Eye
} from 'lucide-react';
import { GithubRepo, GITHUB_LANGUAGE_COLORS } from '@/lib/github';

interface GithubReposShowcaseProps {
  initialRepos: GithubRepo[];
  stats: {
    totalRepos: number;
    totalStars: number;
    totalForks: number;
    languages: { name: string; count: number; percentage: number }[];
  };
}

export function GithubReposShowcase({ initialRepos, stats: initialStats }: GithubReposShowcaseProps) {
  const [repos, setRepos] = useState<GithubRepo[]>(initialRepos);
  const [stats, setStats] = useState(initialStats);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'stars' | 'forks' | 'name'>('updated');
  // Default to showing all repositories immediately as requested
  const [pageSizeChoice, setPageSizeChoice] = useState<'all' | '24' | '48'>('all');
  const [visibleCount, setVisibleCount] = useState<number>(initialRepos.length > 0 ? initialRepos.length : 120);

  // Client-side fallback sync: if initialRepos is empty, auto-sync live from /api/github/repos
  useEffect(() => {
    if (repos.length === 0) {
      handleSyncGithub(true);
    }
  }, []);

  const handleSyncGithub = async (silent = false) => {
    if (!silent) setIsSyncing(true);
    try {
      const res = await fetch('/api/github/repos');
      const data = await res.json();
      if (data.success && Array.isArray(data.repos) && data.repos.length > 0) {
        setRepos(data.repos);
        if (data.stats) {
          setStats(data.stats);
        }
        if (pageSizeChoice === 'all') {
          setVisibleCount(data.repos.length);
        }
        if (!silent) {
          setSyncMessage(`Synced ${data.repos.length} repositories from GitHub.`);
          setTimeout(() => setSyncMessage(null), 4000);
        }
      }
    } catch (err: any) {
      console.warn('[GitHub Client Sync]:', err);
      if (!silent) {
        setSyncMessage('Failed to refresh from GitHub. Showing cached repositories.');
        setTimeout(() => setSyncMessage(null), 4000);
      }
    } finally {
      if (!silent) setIsSyncing(false);
    }
  };

  // Keep visible count in sync with page size choice
  useEffect(() => {
    if (pageSizeChoice === 'all') {
      setVisibleCount(repos.length > 0 ? repos.length : 120);
    } else {
      setVisibleCount(parseInt(pageSizeChoice, 10));
    }
  }, [pageSizeChoice, repos.length]);

  // Filter & sort
  const filteredRepos = useMemo(() => {
    let result = [...repos];

    if (selectedLanguage !== 'all') {
      result = result.filter(
        (r) => r.language.toLowerCase() === selectedLanguage.toLowerCase()
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.topics.some((t) => t.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'stars') return b.stars - a.stars;
      if (sortBy === 'forks') return b.forks - a.forks;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return new Date(b.pushedAt).getTime() - new Date(a.pushedAt).getTime();
    });

    return result;
  }, [repos, selectedLanguage, search, sortBy]);

  const visibleRepos = filteredRepos.slice(0, visibleCount);
  const hasMore = visibleCount < filteredRepos.length;

  const formatRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return 'Updated today';
      if (diffDays === 1) return 'Updated yesterday';
      if (diffDays < 30) return `Updated ${diffDays}d ago`;
      if (diffDays < 365) return `Updated ${Math.floor(diffDays / 30)}mo ago`;
      return `Updated ${Math.floor(diffDays / 365)}y ago`;
    } catch {
      return 'Recently active';
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Header & Live GitHub Profile Ribbon */}
      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant p-6 sm:p-8 shadow-soft relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-black text-primary uppercase tracking-wider">
              <Github className="w-3.5 h-3.5" />
              Verified Open-Source Portfolio · @Akubrecah
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight">
              All Public Code Repositories & Implementations
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Real-time synchronization with GitHub API. Inspect {stats.totalRepos} production web platforms, API microservices, automation bots, and Python frameworks engineered by Akubrecah.
            </p>
            {syncMessage && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                {syncMessage}
              </div>
            )}
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            <button
              onClick={() => handleSyncGithub(false)}
              disabled={isSyncing}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant font-bold text-xs transition-all shadow-xs disabled:opacity-60 cursor-pointer"
              title="Force real-time refresh from GitHub API"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-primary' : 'text-on-surface-variant'}`} />
              {isSyncing ? 'Syncing...' : 'Sync Live'}
            </button>

            <a
              href="https://github.com/Akubrecah"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-primary text-white hover:bg-primary/90 font-bold text-xs transition-all shadow-xs"
            >
              <Github className="w-4 h-4" />
              github.com/Akubrecah
              <ArrowUpRight className="w-3.5 h-3.5 opacity-80" />
            </a>
          </div>
        </div>

        {/* Aggregate Metrics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-outline-variant/50">
          <div className="p-4 rounded-2xl bg-surface-container/50 border border-outline-variant/40">
            <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">
              Public Repositories
            </span>
            <div className="text-2xl sm:text-3xl font-black text-on-surface mt-1">
              {stats.totalRepos}
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 block flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              100% Live Synced
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-surface-container/50 border border-outline-variant/40">
            <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">
              GitHub Stargazers
            </span>
            <div className="text-2xl sm:text-3xl font-black text-on-surface mt-1 flex items-center gap-1.5">
              <span>{stats.totalStars}</span>
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            </div>
            <span className="text-[11px] text-on-surface-variant mt-0.5 block">
              Community Endorsements
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-surface-container/50 border border-outline-variant/40">
            <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">
              Repository Forks
            </span>
            <div className="text-2xl sm:text-3xl font-black text-on-surface mt-1 flex items-center gap-1.5">
              <span>{stats.totalForks}</span>
              <GitFork className="w-4 h-4 text-primary" />
            </div>
            <span className="text-[11px] text-on-surface-variant mt-0.5 block">
              Ecosystem Derivatives
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-surface-container/50 border border-outline-variant/40">
            <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">
              Primary Stacks
            </span>
            <div className="text-sm font-bold text-on-surface mt-2 flex flex-wrap gap-1.5">
              {stats.languages.slice(0, 3).map((l) => (
                <span
                  key={l.name}
                  className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-surface-container-highest border border-outline-variant/60"
                >
                  {l.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Search, Sort & View Size Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search all repositories, topics, or stacks..."
            className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-surface-container-lowest border border-outline-variant text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant hover:text-on-surface p-1"
            >
              Clear
            </button>
          )}
        </div>

        {/* View Size Choice + Sort */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Display Mode Selector */}
          <div className="inline-flex items-center p-1 rounded-xl bg-surface-container border border-outline-variant/80 text-xs">
            <button
              onClick={() => setPageSizeChoice('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                pageSizeChoice === 'all'
                  ? 'bg-surface text-primary shadow-xs ring-1 ring-primary/20'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              All ({repos.length})
            </button>
            <button
              onClick={() => setPageSizeChoice('48')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                pageSizeChoice === '48'
                  ? 'bg-surface text-primary shadow-xs ring-1 ring-primary/20'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              48
            </button>
            <button
              onClick={() => setPageSizeChoice('24')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                pageSizeChoice === '24'
                  ? 'bg-surface text-primary shadow-xs ring-1 ring-primary/20'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              24
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-on-surface-variant">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant text-xs font-semibold text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="updated">Recently Updated</option>
              <option value="stars">Most Stars</option>
              <option value="forks">Most Forks</option>
              <option value="name">Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Language Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedLanguage('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            selectedLanguage === 'all'
              ? 'bg-primary text-white shadow-xs'
              : 'bg-surface-container text-on-surface-variant hover:text-on-surface border border-outline-variant/50'
          }`}
        >
          All Languages ({stats.totalRepos})
        </button>
        {stats.languages.map((lang) => (
          <button
            key={lang.name}
            onClick={() => setSelectedLanguage(lang.name)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              selectedLanguage.toLowerCase() === lang.name.toLowerCase()
                ? 'bg-primary text-white shadow-xs'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface border border-outline-variant/50'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: GITHUB_LANGUAGE_COLORS[lang.name] || '#888888' }}
            />
            {lang.name}
            <span className="opacity-70 text-[10px]">({lang.count})</span>
          </button>
        ))}
      </div>

      {/* Active Results Summary Indicator */}
      <div className="flex items-center justify-between text-xs text-on-surface-variant px-1">
        <span>
          Showing <strong className="text-on-surface font-black">{visibleRepos.length}</strong> of{' '}
          <strong className="text-on-surface font-black">{filteredRepos.length}</strong> repositories
          {selectedLanguage !== 'all' && ` filtered by ${selectedLanguage}`}
          {search && ` matching "${search}"`}
        </span>
        {pageSizeChoice !== 'all' && hasMore && (
          <button
            onClick={() => setPageSizeChoice('all')}
            className="text-primary hover:underline font-bold text-xs"
          >
            Show all {filteredRepos.length}
          </button>
        )}
      </div>

      {/* 3. Repositories Grid */}
      {visibleRepos.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-surface-container-lowest border border-outline-variant space-y-3">
          <AlertCircle className="w-8 h-8 text-on-surface-variant mx-auto" />
          <h3 className="text-base font-bold text-on-surface">No matching repositories found</h3>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
            Try adjusting your search query or reset the language filter to view all {stats.totalRepos} repositories.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedLanguage('all');
            }}
            className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-all mt-2 cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleRepos.map((repo) => {
            const langColor = GITHUB_LANGUAGE_COLORS[repo.language] || '#71717a';

            return (
              <div
                key={repo.id}
                className="bg-surface-container-lowest rounded-3xl border border-outline-variant hover:border-primary/40 p-6 flex flex-col justify-between transition-all duration-200 shadow-soft group relative overflow-hidden"
              >
                <div className="space-y-4">
                  {/* Top Bar: Name & Fork indicator */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <Github className="w-4 h-4 text-on-surface-variant shrink-0" />
                        <h3 className="text-base font-black text-on-surface group-hover:text-primary transition-colors truncate tracking-tight">
                          <Link href={`/projects/${repo.name}`} title="View Project Case Study & Architecture">
                            {repo.name}
                          </Link>
                        </h3>
                      </div>
                      <span className="text-[10px] text-on-surface-variant/70 font-mono block mt-0.5">
                        {formatRelativeTime(repo.pushedAt)}
                      </span>
                    </div>

                    {repo.isFork && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-surface-container text-on-surface-variant shrink-0">
                        Fork
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3 min-h-[3rem]">
                    {repo.description}
                  </p>

                  {/* Topics Chips */}
                  {repo.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {repo.topics.slice(0, 3).map((topic) => (
                        <span
                          key={topic}
                          className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-surface-container text-on-surface-variant border border-outline-variant/40"
                        >
                          #{topic}
                        </span>
                      ))}
                      {repo.topics.length > 3 && (
                        <span className="text-[10px] text-on-surface-variant font-mono self-center">
                          +{repo.topics.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Bar: Language, Stars & Direct Links */}
                <div className="mt-5 pt-4 border-t border-outline-variant/40 flex items-center justify-between text-xs text-on-surface-variant">
                  <div className="flex items-center gap-3">
                    {/* Language Badge */}
                    <span className="inline-flex items-center gap-1.5 font-medium text-[11px] text-on-surface">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: langColor }}
                      />
                      {repo.language}
                    </span>

                    {/* Stars */}
                    {repo.stars > 0 && (
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-on-surface">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        {repo.stars}
                      </span>
                    )}

                    {/* Forks */}
                    {repo.forks > 0 && (
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-on-surface">
                        <GitFork className="w-3 h-3" />
                        {repo.forks}
                      </span>
                    )}
                  </div>

                  {/* Quick Actions: Architecture View + Source + Live Demo */}
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/projects/${repo.name}`}
                      className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-[11px] hover:bg-primary hover:text-white transition-all flex items-center gap-1"
                      title="Inspect System Architecture & Specs"
                    >
                      <Eye className="w-3 h-3" />
                      Spec
                    </Link>

                    {repo.homepage && (
                      <a
                        href={repo.homepage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-surface-container text-on-surface hover:text-primary transition-colors"
                        title="Open Live Deployment"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                    <a
                      href={repo.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-surface-container text-on-surface hover:text-primary transition-colors"
                      title="Inspect Source Code on GitHub"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Load More Button (Only active if user switched to paginated view) */}
      {hasMore && pageSizeChoice !== 'all' && (
        <div className="text-center pt-6 space-y-2">
          <button
            onClick={() => setVisibleCount((prev) => Math.min(prev + parseInt(pageSizeChoice, 10), filteredRepos.length))}
            className="px-6 py-3 rounded-2xl bg-surface-container text-on-surface font-bold text-xs hover:bg-surface-container-high border border-outline-variant hover:border-primary/40 transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer"
          >
            Load Next {pageSizeChoice} Repositories ({filteredRepos.length - visibleCount} remaining)
            <ChevronRight className="w-4 h-4" />
          </button>
          <div>
            <button
              onClick={() => setPageSizeChoice('all')}
              className="text-xs font-bold text-primary hover:underline"
            >
              Or load all {filteredRepos.length} repositories at once
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
