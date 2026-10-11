import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProjectBySlug, getPublishedProjects } from '@/lib/cms';
import { ArrowLeft, ExternalLink, Github, CheckCircle2, ShieldCheck, Code2, Layers, Cpu, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project || !project.isPublished) return { title: 'Project Not Found | Akubrecah' };

  return {
    title: project.seoTitle || `${project.title} | Akubrecah Case Study`,
    description: project.seoDescription || project.summary,
  };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project || !project.isPublished) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background text-on-background">
      {/* Header */}
      <div className="bg-surface-container-lowest border-b border-outline-variant relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full filter blur-[120px] pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 space-y-6 relative z-10">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to All Projects
          </Link>

          <div className="space-y-4">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/25">
                {project.category}
              </span>
              {project.client && (
                <span className="text-xs font-medium text-on-surface-variant">
                  Client: <strong className="text-on-surface font-semibold">{project.client}</strong>
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-on-surface tracking-tight leading-tight">
              {project.title}
            </h1>

            <p className="text-base sm:text-lg text-on-surface-variant max-w-3xl leading-relaxed">
              {project.summary}
            </p>

            <div className="flex items-center gap-3 pt-4 flex-wrap">
              {project.liveUrl && (
                <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" className="rounded-xl px-4 bg-primary text-white font-bold hover:bg-primary/90 flex items-center gap-1.5 shadow-xs">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Live Deployment
                  </Button>
                </a>
              )}
              {project.githubUrl && (
                <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="rounded-xl px-4 border-outline-variant text-on-surface font-semibold hover:bg-surface-container flex items-center gap-1.5">
                    <Github className="w-3.5 h-3.5" />
                    Source Repository
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Case Study Content Body */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 space-y-16">
        {/* Technologies Grid */}
        <div className="p-6 sm:p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-soft space-y-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary">
            <Cpu className="w-4 h-4" />
            <span>Architecture & Technology Stack</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {project.technologies.map((tech) => (
              <span
                key={tech}
                className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-surface-container text-on-surface border border-outline-variant/60"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Problem vs Solution 2-Column */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Problem */}
          <div className="p-6 sm:p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-soft space-y-3">
            <div className="text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
              The Engineering Challenge
            </div>
            <h3 className="text-xl font-bold text-on-surface">Problem Statement</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {project.problemStatement || 'Enterprise operational inefficiencies and unoptimized database access required modernization.'}
            </p>
          </div>

          {/* Solution */}
          <div className="p-6 sm:p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-soft space-y-3">
            <div className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              The Architecture Solution
            </div>
            <h3 className="text-xl font-bold text-on-surface">Technical Strategy</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {project.solutionArchitecture || 'Engineered a resilient decoupled microservice pattern with distributed caching and automated retries.'}
            </p>
          </div>
        </div>

        {/* Measurable Outcomes */}
        {project.measurableOutcomes && project.measurableOutcomes.length > 0 && (
          <div className="p-6 sm:p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-soft space-y-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified Production Outcomes</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {project.measurableOutcomes.map((outcome, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-3 rounded-2xl bg-surface-container">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm font-medium text-on-surface">{outcome}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full Architectural Description */}
        <div className="p-6 sm:p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-soft space-y-4">
          <h3 className="text-xl font-black text-on-surface tracking-tight">Full System Overview</h3>
          <div className="text-sm sm:text-base text-on-surface-variant leading-relaxed space-y-4 whitespace-pre-line">
            {project.description}
          </div>
        </div>

        {/* Next Steps CTA */}
        <div className="p-8 sm:p-12 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-on-surface tracking-tight">Need a similar architecture built?</h3>
            <p className="text-xs sm:text-sm text-on-surface-variant">We design and deliver robust digital systems tailored to your specific requirements.</p>
          </div>
          <Link href="/contact">
            <Button size="lg" className="rounded-2xl px-6 bg-primary text-white font-bold hover:bg-primary/90 shadow-sm flex items-center gap-2">
              Start Your Project <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
