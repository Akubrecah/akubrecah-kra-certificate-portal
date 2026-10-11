import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getArticleBySlug } from '@/lib/cms';
import { ArrowLeft, Clock, Calendar, BookOpen, Share2, Tag, CheckCircle2, User } from 'lucide-react';
import { Metadata } from 'next';
import { MarkdownContent } from '@/components/markdown-content';

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
      images: article.featuredImage ? [article.featuredImage] : [],
    },
  };
}

export default async function ArticleDetailPage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article || !article.isPublished) {
    notFound();
  }

  return (
    <article className="min-h-screen bg-background text-on-background">
      {/* Header & Hero */}
      <div className="bg-surface-container-lowest border-b border-outline-variant relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full filter blur-[120px] pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 space-y-6 relative z-10">
          <nav className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <Link href="/articles" className="hover:text-primary transition-colors">Technical Writing</Link>
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
              <span className="text-xs text-on-surface-variant">•</span>
              <span className="flex items-center gap-1 text-xs text-on-surface-variant font-medium">
                <User className="w-3.5 h-3.5" />
                {article.authorName || 'Akubrecah'}
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10">
        {/* Featured Cover Image if Present */}
        {article.featuredImage && (
          <div className="rounded-3xl overflow-hidden border border-outline-variant shadow-soft bg-surface-container-lowest p-2">
            <img
              src={article.featuredImage}
              alt={article.title}
              className="w-full max-h-[460px] object-cover rounded-2xl"
            />
          </div>
        )}

        {/* Rich Markdown Reader Component */}
        <div className="p-6 sm:p-10 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-soft">
          <MarkdownContent content={article.content} />
        </div>

        {/* Tags */}
        <div className="pt-6 border-t border-outline-variant flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Tag className="w-4 h-4 text-on-surface-variant" />
            {article.tags.map((tag: string) => (
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
        <div className="p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-soft flex flex-col sm:flex-row items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-2xl shrink-0">
            A
          </div>
          <div className="space-y-1.5 text-center sm:text-left flex-1">
            <h4 className="text-base font-black text-on-surface">Akubrecah Software Architecture</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Full-stack software engineering & systems architecture studio specializing in high-load web platforms, real-time mobility dispatch, and statutory compliance automation across Kenya.
            </p>
          </div>
          <Link
            href="/contact"
            className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors shrink-0 shadow-xs"
          >
            Work With Us
          </Link>
        </div>
      </div>
    </article>
  );
}
