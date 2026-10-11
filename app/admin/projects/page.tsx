"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  FolderGit2, Plus, Edit3, Trash2, Globe, Github, 
  ExternalLink, CheckCircle2, XCircle, Star, Search, 
  Save, X, Eye
} from "lucide-react";
import { AdminGithubReposManager } from "@/components/admin-github-repos-manager";

interface Project {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  category: string;
  client: string | null;
  featuredImage: string;
  liveUrl: string | null;
  githubUrl: string | null;
  technologies: string[];
  problemStatement: string | null;
  solutionArchitecture: string | null;
  measurableOutcomes: string[];
  isFeatured: boolean;
  isPublished: boolean;
  displayOrder: number;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string;
}

function AdminProjectsContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "github" ? "github" : "projects";
  const [activeTab, setActiveTab] = useState<"projects" | "github">(initialTab);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/projects");
      const data = await res.json();
      if (data.success) {
        setProjects(data.projects);
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleOpenCreate = () => {
    setEditingProject({
      title: "",
      slug: "",
      summary: "",
      description: "",
      category: "Full-Stack SaaS",
      client: "",
      featuredImage: "/akubrecah-logo.webp",
      liveUrl: "",
      githubUrl: "",
      technologies: ["Next.js", "TypeScript", "Tailwind CSS"],
      problemStatement: "",
      solutionArchitecture: "",
      measurableOutcomes: [],
      isFeatured: false,
      isPublished: true,
      displayOrder: 0,
    });
    setErrorMessage("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Project) => {
    setEditingProject({ ...p });
    setErrorMessage("");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    if (!editingProject.title || !editingProject.slug || !editingProject.summary || !editingProject.description) {
      setErrorMessage("Title, slug, summary, and description are required.");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    try {
      const isUpdating = Boolean(editingProject.id);
      const url = "/api/admin/projects";
      const method = isUpdating ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingProject),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save project.");
      }

      setIsModalOpen(false);
      setEditingProject(null);
      fetchProjects();
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/projects?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete project:", err);
    }
  };

  const handleTogglePublish = async (p: Project) => {
    try {
      const nextState = !p.isPublished;
      const res = await fetch("/api/admin/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id, isPublished: nextState }),
      });
      const data = await res.json();
      if (data.success) {
        setProjects((prev) => prev.map((item) => (item.id === p.id ? { ...item, isPublished: nextState } : item)));
      }
    } catch (err) {
      console.error("Failed to toggle publish:", err);
    }
  };

  const handleToggleFeatured = async (p: Project) => {
    try {
      const nextState = !p.isFeatured;
      const res = await fetch("/api/admin/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id, isFeatured: nextState }),
      });
      const data = await res.json();
      if (data.success) {
        setProjects((prev) => prev.map((item) => (item.id === p.id ? { ...item, isFeatured: nextState } : item)));
      }
    } catch (err) {
      console.error("Failed to toggle featured:", err);
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase()) ||
    p.technologies.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Primary Tab Navigation */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-surface-container border border-outline-variant w-fit flex-wrap">
        <button
          onClick={() => setActiveTab("projects")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "projects"
              ? "bg-surface text-primary shadow-xs ring-1 ring-primary/20"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <FolderGit2 className="w-4 h-4" />
          Curated Case Studies
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary font-mono font-bold">
            {projects.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("github")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "github"
              ? "bg-surface text-primary shadow-xs ring-1 ring-primary/20"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <Github className="w-4 h-4" />
          GitHub Repositories Visibility
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-600 font-mono font-bold">
            102 Repos
          </span>
        </button>
      </div>

      {activeTab === "github" ? (
        <AdminGithubReposManager />
      ) : (
        <>
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight">
                Projects & Case Studies
              </h1>
              <p className="text-xs text-on-surface-variant mt-1">
                Manage your engineering case studies, live demo links, architecture deep-dives, and tech stacks.
              </p>
            </div>

            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all shadow-md self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Add New Project
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects by title, category, or technology..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-surface-container border border-outline-variant text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

      {/* Projects List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-on-surface-variant bg-surface-container rounded-3xl border border-outline-variant">
          Loading portfolio projects...
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-12 text-center text-xs text-on-surface-variant bg-surface-container rounded-3xl border border-outline-variant">
          No projects found. Click &quot;Add New Project&quot; to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((p) => (
            <div
              key={p.id}
              className="p-5 sm:p-6 rounded-3xl bg-surface-container border border-outline-variant hover:border-primary/40 transition-all shadow-soft flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {p.category}
                    </span>
                    {p.isFeatured && (
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> Featured
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleFeatured(p)}
                      title={p.isFeatured ? "Unset featured" : "Set featured"}
                      className={`p-1.5 rounded-lg border text-xs transition-colors ${
                        p.isFeatured ? "border-amber-500/40 text-amber-500 bg-amber-500/10" : "border-outline-variant text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleTogglePublish(p)}
                      title={p.isPublished ? "Unpublish" : "Publish"}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                        p.isPublished
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                          : "bg-neutral-500/10 border-neutral-500/30 text-neutral-500"
                      }`}
                    >
                      {p.isPublished ? "Published" : "Draft"}
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-black text-on-surface tracking-tight">
                    {p.title}
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-1 line-clamp-2 leading-relaxed">
                    {p.summary}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {p.technologies.map((t) => (
                    <span key={t} className="text-[10px] font-mono text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-md border border-outline-variant/60">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-outline-variant/60 flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/projects/${p.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-primary font-bold hover:underline"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Live
                  </Link>
                  {p.liveUrl && (
                    <a
                      href={p.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-on-surface-variant hover:text-primary transition-colors inline-flex items-center gap-1 font-mono text-[11px]"
                    >
                      <ExternalLink className="w-3 h-3" /> System
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="p-1.5 rounded-lg bg-surface-container-high hover:bg-primary hover:text-white transition-colors text-on-surface"
                    title="Edit Case Study"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id, p.title)}
                    className="p-1.5 rounded-lg bg-surface-container-high hover:bg-red-600 hover:text-white transition-colors text-red-500"
                    title="Delete Project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
        </>
      )}

      {/* Editor Modal */}
      {isModalOpen && editingProject && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface-container rounded-3xl border border-outline-variant p-6 sm:p-8 max-w-3xl w-full my-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant pb-4">
              <h2 className="text-xl font-black text-on-surface">
                {editingProject.id ? "Edit Case Study" : "Create New Case Study"}
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
                  <label className="font-bold text-on-surface">Project Title *</label>
                  <input
                    type="text"
                    value={editingProject.title || ""}
                    onChange={(e) => {
                      const title = e.target.value;
                      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                      setEditingProject((prev) => ({
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
                    value={editingProject.slug || ""}
                    onChange={(e) => setEditingProject((prev) => ({ ...prev, slug: e.target.value }))}
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
                    value={editingProject.category || ""}
                    onChange={(e) => setEditingProject((prev) => ({ ...prev, category: e.target.value }))}
                    placeholder="e.g. GovTech Automation, Fintech Payment Engine"
                    required
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-on-surface">Client / Organization</label>
                  <input
                    type="text"
                    value={editingProject.client || ""}
                    onChange={(e) => setEditingProject((prev) => ({ ...prev, client: e.target.value }))}
                    placeholder="e.g. In-House Product, Vybe Africa Ltd"
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-on-surface">Brief Summary * (Card teaser)</label>
                <input
                  type="text"
                  value={editingProject.summary || ""}
                  onChange={(e) => setEditingProject((prev) => ({ ...prev, summary: e.target.value }))}
                  required
                  placeholder="One sentence punchy summary..."
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-on-surface">Full Description *</label>
                <textarea
                  rows={4}
                  value={editingProject.description || ""}
                  onChange={(e) => setEditingProject((prev) => ({ ...prev, description: e.target.value }))}
                  required
                  placeholder="Detailed project context and overview..."
                  className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-on-surface">Problem Statement</label>
                  <textarea
                    rows={3}
                    value={editingProject.problemStatement || ""}
                    onChange={(e) => setEditingProject((prev) => ({ ...prev, problemStatement: e.target.value }))}
                    placeholder="What challenge was being solved?"
                    className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-on-surface">Solution Architecture</label>
                  <textarea
                    rows={3}
                    value={editingProject.solutionArchitecture || ""}
                    onChange={(e) => setEditingProject((prev) => ({ ...prev, solutionArchitecture: e.target.value }))}
                    placeholder="Technical approach, data flows, protocols..."
                    className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-on-surface">Technologies (Comma separated)</label>
                <input
                  type="text"
                  value={editingProject.technologies ? editingProject.technologies.join(", ") : ""}
                  onChange={(e) => {
                    const arr = e.target.value.split(",").map((t) => t.trim()).filter(Boolean);
                    setEditingProject((prev) => ({ ...prev, technologies: arr }));
                  }}
                  placeholder="Next.js 15, PostgreSQL, Redis, Daraja M-Pesa"
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-on-surface">Live URL</label>
                  <input
                    type="url"
                    value={editingProject.liveUrl || ""}
                    onChange={(e) => setEditingProject((prev) => ({ ...prev, liveUrl: e.target.value }))}
                    placeholder="https://..."
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-on-surface">GitHub URL</label>
                  <input
                    type="url"
                    value={editingProject.githubUrl || ""}
                    onChange={(e) => setEditingProject((prev) => ({ ...prev, githubUrl: e.target.value }))}
                    placeholder="https://github.com/..."
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-on-surface">
                  <input
                    type="checkbox"
                    checked={editingProject.isPublished ?? true}
                    onChange={(e) => setEditingProject((prev) => ({ ...prev, isPublished: e.target.checked }))}
                    className="w-4 h-4 rounded-md accent-primary"
                  />
                  <span>Published on Website</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-on-surface">
                  <input
                    type="checkbox"
                    checked={editingProject.isFeatured ?? false}
                    onChange={(e) => setEditingProject((prev) => ({ ...prev, isFeatured: e.target.checked }))}
                    className="w-4 h-4 rounded-md accent-primary"
                  />
                  <span>Featured Case Study</span>
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
                      Save Case Study
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

export default function AdminProjectsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-on-surface-variant">Loading projects & repositories...</div>}>
      <AdminProjectsContent />
    </Suspense>
  );
}
