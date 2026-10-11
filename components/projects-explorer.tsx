"use client";

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, ExternalLink, Github, Layers, Sparkles, 
  CheckCircle2, ShieldCheck, Code2, FolderGit2
} from 'lucide-react';
import { GithubReposShowcase } from './github-repos-showcase';
import { GithubRepo } from '@/lib/github';

interface ProjectsExplorerProps {
  curatedProjects: any[];
  githubRepos: GithubRepo[];
  githubStats: {
    totalRepos: number;
    totalStars: number;
    totalForks: number;
    languages: { name: string; count: number; percentage: number }[];
  };
}

export function ProjectsExplorer({
  curatedProjects,
  githubRepos,
  githubStats,
}: ProjectsExplorerProps) {
  const [activeTab, setActiveTab] = useState<'all_repos' | 'flagship'>('all_repos');

  return (
    <div className="space-y-10">
      {/* Tab Switcher Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-outline-variant/60 pb-5">
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-surface-container border border-outline-variant/80 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('all_repos')}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'all_repos'
                ? 'bg-surface text-primary shadow-xs ring-1 ring-primary/20'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Github className="w-4 h-4" />
            All Repositories
          </button>

          <button
            onClick={() => setActiveTab('flagship')}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'flagship'
                ? 'bg-surface text-primary shadow-xs ring-1 ring-primary/20'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Flagship Case Studies
          </button>
        </div>
      </div>

      {/* View 1: All GitHub Repositories (The requested feature!) */}
      {activeTab === 'all_repos' && (
        <GithubReposShowcase initialRepos={githubRepos} stats={githubStats} />
      )}

      {/* View 2: Flagship Case Studies */}
      {activeTab === 'flagship' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {curatedProjects.map((project) => (
              <div
                key={project.id}
                className="bg-surface-container-lowest rounded-3xl border border-outline-variant hover:border-primary/40 p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 shadow-soft group relative overflow-hidden"
              >
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                      {project.category}
                    </span>
                    {project.isFeatured && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Featured Architecture
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-on-surface group-hover:text-primary transition-colors tracking-tight">
                      <Link href={`/projects/${project.slug}`}>
                        {project.title}
                      </Link>
                    </h3>
                    <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-3">
                      {project.summary}
                    </p>
                  </div>

                  {/* Technologies */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {(project.technologies || []).slice(0, 5).map((tech: string) => (
                      <span
                        key={tech}
                        className="px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-surface-container text-on-surface-variant border border-outline-variant/60"
                      >
                        {tech}
                      </span>
                    ))}
                    {(project.technologies || []).length > 5 && (
                      <span className="px-2 py-1 rounded-lg text-xs font-mono text-on-surface-variant">
                        +{(project.technologies || []).length - 5}
                      </span>
                    )}
                  </div>

                  {/* Measurable Outcomes */}
                  {project.measurableOutcomes && project.measurableOutcomes.length > 0 && (
                    <div className="pt-2 space-y-1.5 border-t border-outline-variant/40">
                      {project.measurableOutcomes.slice(0, 2).map((outcome: string, oIdx: number) => (
                        <div key={oIdx} className="flex items-center gap-2 text-xs text-on-surface font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{outcome}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="mt-8 pt-5 border-t border-outline-variant flex items-center justify-between gap-3">
                  <Link
                    href={`/projects/${project.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-black text-primary hover:text-primary/80 transition-colors uppercase tracking-wider"
                  >
                    Deep Case Study <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <div className="flex items-center gap-2">
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-surface-container text-on-surface hover:text-primary border border-outline-variant transition-colors"
                        title="View GitHub Repository"
                      >
                        <Github className="w-4 h-4" />
                      </a>
                    )}
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-surface-container text-on-surface hover:text-primary border border-outline-variant transition-colors"
                        title="Open Live Demonstration"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
