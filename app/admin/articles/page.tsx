"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  BookOpen, Plus, Edit3, Trash2, Clock, 
  Search, Eye, Save, X, Tag
} from "lucide-react";

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  readingTimeMinutes: number;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
}

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingArticle, setEditingArticle] = useState<Partial<Article> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/articles");
      const data = await res.json();
      if (data.success) {
        setArticles(data.articles);
      }
    } catch (err) {
      console.error("Failed to load articles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleOpenCreate = () => {
    setEditingArticle({
      title: "",
      slug: "",
      excerpt: "",
      content: "## Overview\n\nExplain the architectural problem and context here...\n\n```typescript\n// Code snippet\n```\n\n## Implementation Lessons\n\nKey takeaways from production...",
      category: "Software Architecture",
      tags: ["Next.js", "Engineering"],
      readingTimeMinutes: 5,
      isPublished: true,
    });
    setErrorMessage("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (a: Article) => {
    setEditingArticle({ ...a });
    setErrorMessage("");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle) return;

    if (!editingArticle.title || !editingArticle.slug || !editingArticle.excerpt || !editingArticle.content) {
      setErrorMessage("Title, slug, excerpt, and content are required.");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    try {
      const isUpdating = Boolean(editingArticle.id);
      const url = "/api/admin/articles";
      const method = isUpdating ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingArticle),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save article.");
      }

      setIsModalOpen(false);
      setEditingArticle(null);
      fetchArticles();
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/articles?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setArticles((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete article:", err);
    }
  };

  const handleTogglePublish = async (a: Article) => {
    try {
      const nextState = !a.isPublished;
      const res = await fetch("/api/admin/articles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: a.id, isPublished: nextState }),
      });
      const data = await res.json();
      if (data.success) {
        setArticles((prev) => prev.map((item) => (item.id === a.id ? { ...item, isPublished: nextState } : item)));
      }
    } catch (err) {
      console.error("Failed to toggle publish:", err);
    }
  };

  const filteredArticles = articles.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.category.toLowerCase().includes(search.toLowerCase()) ||
    a.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight">
            Articles & Field Notes
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Author and publish technical tutorials, architectural insights, and engineering notes.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all shadow-md self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Write New Article
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search articles by title, topic, or tag..."
          className="w-full h-10 pl-10 pr-4 rounded-xl bg-surface-container border border-outline-variant text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Articles Feed */}
      {loading ? (
        <div className="p-12 text-center text-xs text-on-surface-variant bg-surface-container rounded-3xl border border-outline-variant">
          Loading technical articles...
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="p-12 text-center text-xs text-on-surface-variant bg-surface-container rounded-3xl border border-outline-variant">
          No articles found. Click &quot;Write New Article&quot; to publish your first post.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredArticles.map((a) => (
            <div
              key={a.id}
              className="p-5 sm:p-6 rounded-3xl bg-surface-container border border-outline-variant hover:border-primary/40 transition-all shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {a.category}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-mono text-on-surface-variant">
                    <Clock className="w-3 h-3" />
                    {a.readingTimeMinutes} min read
                  </span>
                  <button
                    onClick={() => handleTogglePublish(a)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors ${
                      a.isPublished
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                        : "bg-neutral-500/10 border-neutral-500/30 text-neutral-500"
                    }`}
                  >
                    {a.isPublished ? "Published" : "Draft"}
                  </button>
                </div>

                <h3 className="text-lg font-black text-on-surface tracking-tight">
                  {a.title}
                </h3>

                <p className="text-xs text-on-surface-variant line-clamp-1 leading-relaxed">
                  {a.excerpt}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {a.tags.map((t) => (
                    <span key={t} className="text-[10px] font-mono text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-md border border-outline-variant/60">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center border-t sm:border-t-0 border-outline-variant/60 pt-3 sm:pt-0 w-full sm:w-auto justify-end">
                <Link
                  href={`/articles/${a.slug}`}
                  target="_blank"
                  className="px-3 py-1.5 rounded-xl border border-outline-variant hover:border-primary text-xs font-bold text-on-surface hover:text-primary transition-colors inline-flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" /> Read
                </Link>
                <button
                  onClick={() => handleOpenEdit(a)}
                  className="p-2 rounded-xl bg-surface-container-high hover:bg-primary hover:text-white transition-colors text-on-surface"
                  title="Edit Article"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(a.id, a.title)}
                  className="p-2 rounded-xl bg-surface-container-high hover:bg-red-600 hover:text-white transition-colors text-red-500"
                  title="Delete Article"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {isModalOpen && editingArticle && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface-container rounded-3xl border border-outline-variant p-6 sm:p-8 max-w-3xl w-full my-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant pb-4">
              <h2 className="text-xl font-black text-on-surface">
                {editingArticle.id ? "Edit Article" : "Write New Technical Article"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface font-bold p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold">
                ⚠️ {errorMessage}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-on-surface">Article Title *</label>
                  <input
                    type="text"
                    value={editingArticle.title || ""}
                    onChange={(e) => {
                      const title = e.target.value;
                      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                      setEditingArticle((prev) => ({
                        ...prev,
                        title,
                        slug: prev?.id ? prev.slug : slug,
                      }));
                    }}
                    required
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-on-surface">URL Slug *</label>
                  <input
                    type="text"
                    value={editingArticle.slug || ""}
                    onChange={(e) => setEditingArticle((prev) => ({ ...prev, slug: e.target.value }))}
                    required
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-on-surface">Category *</label>
                  <input
                    type="text"
                    value={editingArticle.category || ""}
                    onChange={(e) => setEditingArticle((prev) => ({ ...prev, category: e.target.value }))}
                    placeholder="e.g. Fintech Engineering, Cloud Architecture"
                    required
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-on-surface">Tags (Comma separated)</label>
                  <input
                    type="text"
                    value={editingArticle.tags ? editingArticle.tags.join(", ") : ""}
                    onChange={(e) => {
                      const arr = e.target.value.split(",").map((t) => t.trim()).filter(Boolean);
                      setEditingArticle((prev) => ({ ...prev, tags: arr }));
                    }}
                    placeholder="Next.js, Daraja, Payments"
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-on-surface">Excerpt / Abstract *</label>
                <textarea
                  rows={2}
                  value={editingArticle.excerpt || ""}
                  onChange={(e) => setEditingArticle((prev) => ({ ...prev, excerpt: e.target.value }))}
                  required
                  placeholder="Summary for search engines and article feed..."
                  className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-on-surface">Article Content (Markdown format) *</label>
                <textarea
                  rows={10}
                  value={editingArticle.content || ""}
                  onChange={(e) => setEditingArticle((prev) => ({ ...prev, content: e.target.value }))}
                  required
                  placeholder="Write in markdown format with # Headings, code blocks, etc..."
                  className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-on-surface">
                  <input
                    type="checkbox"
                    checked={editingArticle.isPublished ?? true}
                    onChange={(e) => setEditingArticle((prev) => ({ ...prev, isPublished: e.target.checked }))}
                    className="w-4 h-4 rounded-md accent-primary"
                  />
                  <span>Published on Live Site</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-outline-variant text-on-surface font-bold hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Article
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
