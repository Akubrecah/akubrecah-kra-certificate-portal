import Link from 'next/link';
import { getPublishedProjects } from '@/lib/cms';
import { getAllGithubRepos } from '@/lib/github';
import { ProjectsExplorer } from '@/components/projects-explorer';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const revalidate = 60;

export const metadata = {
  title: 'Engineering Projects & GitHub Repositories | Akubrecah',
  description: 'Explore all 100+ public GitHub repositories, open-source codebases, GovTech compliance portals, and fintech architectures engineered by Akubrecah.',
};

export default async function ProjectsPage() {
  const [curatedProjects, githubData] = await Promise.all([
    getPublishedProjects(),
    getAllGithubRepos('Akubrecah'),
  ]);

  return (
    <div className="min-h-screen bg-background text-on-background">
      {/* Hero Header */}
      <div className="bg-surface-container-lowest border-b border-outline-variant relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full filter blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 space-y-6 relative z-10">
          <nav className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <span className="text-on-surface font-semibold">Engineered Systems</span>
          </nav>
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-xs font-black text-primary uppercase tracking-widest shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              Verified Production Architectures & Open-Source
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-on-surface tracking-tight leading-tight">
              Systems Built for <span className="text-primary">Scale & Rigor.</span>
            </h1>
            <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl leading-relaxed">
              Explore our mission-critical web applications, statutory compliance portals, and {githubData.stats.totalRepos}+ open-source GitHub repositories engineered for resilience.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid & GitHub Repositories Explorer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 space-y-16">
        <ProjectsExplorer
          curatedProjects={curatedProjects}
          githubRepos={githubData.repos}
          githubStats={githubData.stats}
        />

        {/* Bottom CTA Banner */}
        <div className="p-8 sm:p-12 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <h3 className="text-2xl font-black text-on-surface tracking-tight">
              Have an upcoming product or integration brief?
            </h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              We engineer custom SaaS, GovTech portals, and M-Pesa fintech pipelines with guaranteed deliverables and sub-second performance.
            </p>
          </div>
          <Link href="/contact" className="shrink-0">
            <Button size="lg" className="rounded-2xl px-6 bg-primary text-white font-bold hover:bg-primary/90 shadow-sm flex items-center gap-2">
              Book Architecture Review <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
