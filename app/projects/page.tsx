import Link from 'next/link';
import { getPublishedProjects } from '@/lib/cms';
import { ArrowRight, ExternalLink, Github, Layers, Sparkles, CheckCircle2, ShieldCheck, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const revalidate = 60;

export const metadata = {
  title: 'Engineering Projects & Case Studies | Akubrecah',
  description: 'Production software architectures, GovTech compliance portals, and fintech payment engines engineered by Akubrecah.',
};

export default async function ProjectsPage() {
  const projects = await getPublishedProjects();

  const categories = ['All', 'GovTech & Compliance', 'Full-Stack SaaS', 'Fintech / Payments'];

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
              Verified Production Architectures
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-on-surface tracking-tight leading-tight">
              Systems Built for <span className="text-primary">Scale & Rigor.</span>
            </h1>
            <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl leading-relaxed">
              Explore our mission-critical web applications, statutory compliance portals, and high-consequence payment integrations engineered for resilience.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {projects.map((project, idx) => (
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
                  {project.technologies.slice(0, 5).map((tech) => (
                    <span
                      key={tech}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-surface-container text-on-surface-variant border border-outline-variant/60"
                    >
                      {tech}
                    </span>
                  ))}
                  {project.technologies.length > 5 && (
                    <span className="px-2 py-1 rounded-lg text-xs font-mono text-on-surface-variant">
                      +{project.technologies.length - 5}
                    </span>
                  )}
                </div>

                {/* Measurable Outcomes */}
                {project.measurableOutcomes && project.measurableOutcomes.length > 0 && (
                  <div className="pt-2 space-y-1.5 border-t border-outline-variant/40">
                    {project.measurableOutcomes.slice(0, 2).map((outcome, oIdx) => (
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
