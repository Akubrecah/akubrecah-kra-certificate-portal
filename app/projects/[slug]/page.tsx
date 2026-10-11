import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getProjectBySlug } from '@/lib/cms';
import { getAllGithubRepos, getRepoReadme } from '@/lib/github';
import { 
  ArrowLeft, ExternalLink, Github, CheckCircle2, ShieldCheck, 
  Code2, Layers, Cpu, ArrowRight, GitFork, Star, BookOpen, 
  Terminal, Sparkles, FolderGit2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarkdownContent } from '@/components/markdown-content';

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  let project = await getProjectBySlug(slug);
  if (!project) {
    const { repos } = await getAllGithubRepos('Akubrecah');
    const gh = repos.find((r) => r.name.toLowerCase() === slug.toLowerCase());
    if (gh) {
      return {
        title: `${gh.name} | Akubrecah Deep Case Study & Engineering Spec`,
        description: gh.description,
      };
    }
    return { title: 'Project Not Found | Akubrecah' };
  }

  return {
    title: (project as any).seoTitle || `${project.title} | Akubrecah Deep Case Study`,
    description: (project as any).seoDescription || project.summary,
  };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  let project = await getProjectBySlug(slug);
  let githubRepo: any = null;

  // Retrieve GitHub metadata
  const { repos } = await getAllGithubRepos('Akubrecah');
  githubRepo = repos.find(
    (r) => r.name.toLowerCase() === slug.toLowerCase() || (project && project.slug.toLowerCase() === r.name.toLowerCase())
  );

  // If not in database CMS, dynamically construct from GitHub repo
  if (!project) {
    if (githubRepo) {
      project = {
        id: String(githubRepo.id),
        title: githubRepo.name.replace(/[-_]/g, ' '),
        slug: githubRepo.name,
        summary: githubRepo.description || `Engineering architecture and implementation for ${githubRepo.name}.`,
        description: githubRepo.description || 'Open source software codebase and implementation.',
        category: githubRepo.language || 'Software System',
        client: 'Akubrecah Engineering',
        featuredImage: null,
        liveUrl: githubRepo.homepage,
        githubUrl: githubRepo.htmlUrl,
        technologies: [githubRepo.language, ...(githubRepo.topics.length > 0 ? githubRepo.topics : ['Git', 'TypeScript', 'API'])],
        problemStatement: `Designing and deploying reliable open-source architecture for ${githubRepo.name.replace(/[-_]/g, ' ')}.`,
        solutionArchitecture: `Engineered with modular code structure, automated workflows, and standardized ${githubRepo.language} engineering patterns.`,
        measurableOutcomes: [
          `${githubRepo.stars} GitHub Community Stars`,
          `${githubRepo.forks} Open Source Forks`,
          `Branch: ${githubRepo.defaultBranch} (Verified)`,
        ],
        isFeatured: githubRepo.stars > 5,
        isPublished: true,
        displayOrder: 0,
        seoTitle: `${githubRepo.name} | Akubrecah Deep Architecture Spec`,
        seoDescription: githubRepo.description,
        createdAt: githubRepo.createdAt,
      } as any;
    }
  }

  if (!project || !project.isPublished) {
    notFound();
  }

  // Fetch the real, detailed README from GitHub (with relative images rewritten to raw.githubusercontent.com)
  const repoNameToFetch = githubRepo?.name || project.slug;
  const defaultBranch = githubRepo?.defaultBranch || 'main';
  const readmeData = await getRepoReadme(repoNameToFetch, defaultBranch);

  return (
    <div className="min-h-screen bg-background text-on-background">
      {/* Header & Hero */}
      <div className="bg-surface-container-lowest border-b border-outline-variant relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full filter blur-[120px] pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 space-y-6 relative z-10">
          <nav className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <Link href="/projects" className="hover:text-primary transition-colors">Engineered Systems</Link>
            <span>/</span>
            <span className="text-on-surface font-semibold truncate max-w-[200px] sm:max-w-none">{project.title}</span>
          </nav>

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
              {githubRepo && (
                <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Open-Source Codebase
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-on-surface tracking-tight leading-tight">
              {project.title}
            </h1>

            <p className="text-base sm:text-lg text-on-surface-variant max-w-3xl leading-relaxed">
              {project.summary}
            </p>

            {/* Live Action Buttons */}
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
                    Inspect on GitHub
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 space-y-12">
        {/* Metric Ribbons & Fast Facts */}
        {githubRepo && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant shadow-soft">
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">
                Primary Language
              </span>
              <div className="text-xl sm:text-2xl font-black text-on-surface mt-1 flex items-center gap-2">
                <Code2 className="w-5 h-5 text-primary" />
                <span>{githubRepo.language}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant shadow-soft">
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">
                GitHub Stars
              </span>
              <div className="text-xl sm:text-2xl font-black text-on-surface mt-1 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <span>{githubRepo.stars}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant shadow-soft">
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">
                Repository Forks
              </span>
              <div className="text-xl sm:text-2xl font-black text-on-surface mt-1 flex items-center gap-2">
                <GitFork className="w-5 h-5 text-primary" />
                <span>{githubRepo.forks}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant shadow-soft">
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">
                Default Branch
              </span>
              <div className="text-xl sm:text-2xl font-black text-on-surface mt-1 font-mono text-emerald-600 dark:text-emerald-400">
                {githubRepo.defaultBranch}
              </div>
            </div>
          </div>
        )}

        {/* Technologies Grid */}
        {project.technologies && project.technologies.length > 0 && (
          <div className="p-6 sm:p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-soft space-y-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary">
              <Cpu className="w-4 h-4" />
              <span>Architecture & Stack Components</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {project.technologies.map((tech: string) => (
                <span
                  key={tech}
                  className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-surface-container text-on-surface border border-outline-variant/60"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Featured Image if Present */}
        {project.featuredImage && (
          <div className="rounded-3xl overflow-hidden border border-outline-variant shadow-soft bg-surface-container-lowest p-2">
            <img
              src={project.featuredImage}
              alt={project.title}
              className="w-full max-h-[480px] object-cover rounded-2xl"
            />
          </div>
        )}

        {/* In-Depth Real Engineering Documentation (README from GitHub) */}
        {readmeData.hasReadme ? (
          <div className="p-6 sm:p-10 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-soft space-y-6">
            <div className="flex items-center justify-between border-b border-outline-variant/60 pb-4 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <h2 className="text-xl sm:text-2xl font-black text-on-surface tracking-tight">
                  Detailed Engineering Specification & Product README
                </h2>
              </div>
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                >
                  View on GitHub <ArrowRight className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* Rich Markdown Reader */}
            <MarkdownContent content={readmeData.content} />
          </div>
        ) : (
          /* Fallback structured case study sections */
          <div className="space-y-12">
            {/* Problem vs Solution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-6 sm:p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-soft space-y-3">
                <div className="text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                  The Engineering Challenge
                </div>
                <h3 className="text-xl font-bold text-on-surface">Problem Statement</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {project.problemStatement || 'Enterprise operational inefficiencies and unoptimized database access required modernization.'}
                </p>
              </div>

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
                  {project.measurableOutcomes.map((outcome: string, idx: number) => (
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
          </div>
        )}

        {/* Bottom CTA Card */}
        <div className="p-8 sm:p-12 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-on-surface tracking-tight">Need a similar architecture engineered?</h3>
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
