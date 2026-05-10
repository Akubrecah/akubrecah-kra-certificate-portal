'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  FileText, 
  Plus, 
  Search, 
  Loader2, 
  Edit2, 
  Trash2,
  Calendar,
  Image as ImageIcon
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'

interface BlogPost {
  id: string
  title: string
  date: string
  excerpt: string
  content: string
  image: string
}

export default function BlogAdminPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/blog')
      if (response.ok) {
        const data = await response.json()
        setPosts(data)
      }
    } catch (error) {
      toast.error('Failed to load blog posts')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!editingPost?.title || !editingPost?.content) {
      toast.error('Title and content are required')
      return
    }

    try {
      setIsSaving(true)
      const isNew = !editingPost.id
      const url = isNew ? '/api/admin/blog' : `/api/admin/blog/${editingPost.id}`
      const method = isNew ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPost)
      })

      if (response.ok) {
        toast.success(isNew ? 'Post created' : 'Post updated')
        setIsSheetOpen(false)
        fetchPosts()
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      toast.error('Error saving post')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return

    try {
      const response = await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' })
      if (response.ok) {
        toast.success('Post deleted')
        fetchPosts()
      }
    } catch (error) {
      toast.error('Failed to delete post')
    }
  }

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-6 lg:p-2 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-bold uppercase tracking-tight">Blog Manager</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-90">
            Publish and edit insights for 2026.
          </p>
        </div>
        <Button 
          onClick={() => {
            setEditingPost({ date: '2026.01.01' })
            setIsSheetOpen(true)
          }}
          className="rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest h-9"
        >
          <Plus className="w-3 h-3 mr-2" />
          New Article
        </Button>
      </div>

      <Card className="rounded-2xl border-white/5 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4">
          <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Articles Feed</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="SEARCH ARTICLES..."
              className="pl-9 h-9 rounded-full bg-black/5 border-white/5 text-[10px] uppercase tracking-widest w-[200px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p className="text-[10px] uppercase tracking-widest opacity-90">Synchronizing with database...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-[10px] uppercase tracking-widest pl-6">Article</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-widest">Date</TableHead>
                  <TableHead className="text-right text-[10px] uppercase tracking-widest pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPosts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2 opacity-70">
                        <FileText className="w-8 h-8" />
                        <p className="text-[10px] uppercase tracking-widest">No articles found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPosts.map((post) => (
                    <TableRow key={post.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-4">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-black/20 flex-shrink-0">
                            {post.image ? (
                              <img src={post.image} alt="" className="object-cover w-full h-full opacity-90" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                <ImageIcon className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-tight line-clamp-1">{post.title}</p>
                            <p className="text-[9px] text-muted-foreground uppercase opacity-90 line-clamp-1">{post.excerpt}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-primary">
                          <Calendar className="w-3 h-3" />
                          {post.date}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setEditingPost(post)
                              setIsSheetOpen(true)
                            }}
                            className="h-8 w-8 rounded-full hover:bg-primary/20 text-primary"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDelete(post.id)}
                            className="h-8 w-8 rounded-full hover:bg-red-500/20 text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl glass border-l border-white/10 p-0 overflow-y-auto">
          <SheetHeader className="p-8 pb-4">
            <SheetTitle className="text-lg font-bold uppercase tracking-tight">
              {editingPost?.id ? 'Edit Article' : 'Create New Article'}
            </SheetTitle>
            <SheetDescription className="text-[10px] uppercase tracking-widest opacity-90">
              Configure article details for the 2026 insights feed.
            </SheetDescription>
          </SheetHeader>

          <div className="p-8 pt-4 space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Title</label>
                  <Input 
                    value={editingPost?.title || ''}
                    onChange={e => setEditingPost(prev => ({ ...prev!, title: e.target.value }))}
                    placeholder="E.G., TAX COMPLIANCE 2026"
                    className="rounded-xl bg-black/20 border-white/10 text-[10px] uppercase h-10 px-4"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Publication Date</label>
                  <Input 
                    value={editingPost?.date || ''}
                    onChange={e => setEditingPost(prev => ({ ...prev!, date: e.target.value }))}
                    placeholder="YYYY.MM.DD"
                    className="rounded-xl bg-black/20 border-white/10 text-[10px] font-mono h-10 px-4"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Image URL</label>
                <Input 
                  value={editingPost?.image || ''}
                  onChange={e => setEditingPost(prev => ({ ...prev!, image: e.target.value }))}
                  placeholder="HTTPS://IMAGES.PEXELS.COM/..."
                  className="rounded-xl bg-black/20 border-white/10 text-[10px] h-10 px-4"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Short Excerpt</label>
                <Textarea 
                  value={editingPost?.excerpt || ''}
                  onChange={e => setEditingPost(prev => ({ ...prev!, excerpt: e.target.value }))}
                  placeholder="BRIEF SUMMARY FOR THE FEED CARD..."
                  className="rounded-xl bg-black/20 border-white/10 text-[10px] uppercase min-h-[80px] p-4 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Article Content</label>
                <Textarea 
                  value={editingPost?.content || ''}
                  onChange={e => setEditingPost(prev => ({ ...prev!, content: e.target.value }))}
                  placeholder="FULL ARTICLE BODY CONTENT..."
                  className="rounded-xl bg-black/20 border-white/10 text-[10px] uppercase min-h-[200px] p-4 resize-none leading-relaxed"
                />
              </div>
            </div>
          </div>

          <SheetFooter className="p-8 pt-4">
            <div className="flex gap-3 w-full">
              <Button 
                variant="outline" 
                onClick={() => setIsSheetOpen(false)}
                className="flex-1 rounded-full border-white/10 text-[9px] font-bold uppercase tracking-[0.2em] h-10"
              >
                Cancel
              </Button>
              <Button 
                disabled={isSaving}
                onClick={handleSave}
                className="flex-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold uppercase tracking-[0.2em] h-10"
              >
                {isSaving ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  'Save Article'
                )}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
