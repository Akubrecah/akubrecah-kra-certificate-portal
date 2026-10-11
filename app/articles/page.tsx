import Link from 'next/link';
import { getPublishedArticles } from '@/lib/cms';
import { BookOpen, Clock, ArrowRight, Tag, Sparkles } from 'lucide-react';

export const revalidate = 60;

export const metadata = {
  title: 'Engineering Articles & Technical Tutorials | Akubrecah',
  description: 'Deep dives on software architecture, fintech payment engineering, and statutory compliance automation by Akubrecah.',
};

export default async function ArticlesPage() {
  const articles = await getPublishedArticles();

  return (
    <div className="min-h-screen bg-background text-on-background">
      {/* Header */}
      <div className="bg-surface-container-lowest border-b border-outline-variant relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full filter blur-[120px] pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 space-y-6 relative z-10">
          <nav className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <span className="text-on-surface font-semibold">Technical Writing</span>
          </nav>
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-xs font-black text-primary uppercase tracking-widest shadow-xs">
              <BookOpen className="w-3.5 h-3.5" />
              Engineering Field Notes
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-on-surface tracking-tight leading-tight">
              Architectural Insights & <span className="text-primary">Deep Dives.</span>
            </h1>
            <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl leading-relaxed">
              Pragmatic engineering tutorials, payment gateway integration patterns, and statutory automation write-ups from real production systems.
            </p>
          </div>
        </div>
      </div>

      {/* Articles Feed */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 space-y-8">
        <div className="space-y-6">
          {articles.map((article) => (
            <article
              key={article.id}
              className="p-6 sm:p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant hover:border-primary/40 transition-all shadow-soft group"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-xs text-on-surface-variant flex-wrap">
                  <span className="px-3 py-1 rounded-full font-bold bg-primary/10 text-primary border border-primary/20">
                    {article.category}
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    {article.readingTimeMinutes} min read
                  </span>
                  <span>•</span>
                  <span>{new Date(article.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-on-surface group-hover:text-primary transition-colors tracking-tight">
                  <Link href={`/articles/${article.slug}`}>
                    {article.title}
                  </Link>
                </h2>

                <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
                  {article.excerpt}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-outline-variant/60 flex-wrap gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    {article.tags.map((tag) => (
                      <span key={tag} className="text-xs font-mono text-on-surface-variant bg-surface-container px-2.5 py-0.5 rounded-lg border border-outline-variant/60">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <Link
                    href={`/articles/${article.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-black text-primary hover:text-primary/80 transition-colors uppercase tracking-wider"
                  >
                    Read Article <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
