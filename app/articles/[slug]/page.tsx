import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getArticleBySlug } from '@/lib/cms';
import { ArrowLeft, Clock, Calendar, BookOpen, Share2, Tag, CheckCircle2 } from 'lucide-react';
import { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article || !article.isPublished) {
    return {
      title: 'Article Not Found | Akubrecah',
    };
  }

  return {
    title: `${article.seoTitle || article.title} | Akubrecah Engineering`,
    description: article.seoDescription || article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: 'article',
      publishedTime: article.publishedAt.toISOString(),
      tags: article.tags,
    },
  };
}

export default async function ArticleDetailPage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article || !article.isPublished) {
    notFound();
  }

  // Parse lines to format basic markdown-style blocks gracefully
  const paragraphs = article.content.split('\n\n').filter(Boolean);

  return (
    <article className="min-h-screen bg-background text-on-background">
      {/* Header & Hero */}
      <div className="bg-surface-container-lowest border-b border-outline-variant relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full filter blur-[120px] pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 space-y-6 relative z-10">
          <nav className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <Link href="/articles" className="hover:text-primary transition-colors">Articles</Link>
            <span>/</span>
            <span className="text-on-surface font-semibold truncate max-w-[200px] sm:max-w-none">{article.title}</span>
          </nav>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                {article.category}
              </span>
              <span className="flex items-center gap-1 text-xs text-on-surface-variant font-mono">
                <Clock className="w-3.5 h-3.5" />
                {article.readingTimeMinutes} min read
              </span>
              <span className="text-xs text-on-surface-variant">•</span>
              <span className="flex items-center gap-1 text-xs text-on-surface-variant font-mono">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(article.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-on-surface tracking-tight leading-tight">
              {article.title}
            </h1>

            <p className="text-base sm:text-lg text-on-surface-variant leading-relaxed font-medium">
              {article.excerpt}
            </p>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="space-y-6 text-on-surface/90 text-base sm:text-lg leading-relaxed">
          {paragraphs.map((p, index) => {
            if (p.startsWith('# ')) {
              return (
                <h1 key={index} className="text-2xl sm:text-4xl font-black text-on-surface mt-10 mb-4 tracking-tight">
                  {p.replace('# ', '')}
                </h1>
              );
            }
            if (p.startsWith('## ')) {
              return (
                <h2 key={index} className="text-xl sm:text-2xl font-bold text-on-surface mt-8 mb-3 tracking-tight">
                  {p.replace('## ', '')}
                </h2>
              );
            }
            if (p.startsWith('### ')) {
              return (
                <h3 key={index} className="text-lg sm:text-xl font-bold text-on-surface mt-6 mb-2">
                  {p.replace('### ', '')}
                </h3>
              );
            }
            if (p.startsWith('```')) {
              const code = p.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '');
              return (
                <pre key={index} className="p-4 sm:p-5 rounded-2xl bg-surface-container font-mono text-xs sm:text-sm text-on-surface overflow-x-auto border border-outline-variant my-4">
                  <code>{code}</code>
                </pre>
              );
            }
            if (p.startsWith('> ')) {
              return (
                <blockquote key={index} className="border-l-4 border-primary pl-4 py-1 italic text-on-surface-variant my-4 bg-primary/5 rounded-r-xl">
                  {p.replace('> ', '')}
                </blockquote>
              );
            }
            return (
              <p key={index} className="my-4 whitespace-pre-line">
                {p}
              </p>
            );
          })}
        </div>

        {/* Tags */}
        <div className="mt-12 pt-8 border-t border-outline-variant flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Tag className="w-4 h-4 text-on-surface-variant" />
            {article.tags.map((tag) => (
              <span key={tag} className="text-xs font-mono text-on-surface-variant bg-surface-container px-3 py-1 rounded-lg border border-outline-variant">
                #{tag}
              </span>
            ))}
          </div>

          <Link
            href="/articles"
            className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to All Articles
          </Link>
        </div>

        {/* Author & CTA Card */}
        <div className="mt-12 p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-soft flex flex-col sm:flex-row items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-2xl shrink-0">
            A
          </div>
          <div className="space-y-1.5 text-center sm:text-left flex-1">
            <h4 className="text-base font-black text-on-surface">Akubrecah Engineering</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Full-stack software engineering & systems architecture studio specializing in high-load web applications, fintech payment gateways, and statutory compliance automation.
            </p>
          </div>
          <Link
            href="/contact"
            className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors shrink-0"
          >
            Work With Us
          </Link>
        </div>
      </div>
    </article>
  );
}
